#!/usr/bin/env python3
"""
重新生成 Material Symbols 自托管子集字体 → public/fonts/material-symbols-subset.woff2

【为什么自托管】Google Fonts 在国内加载不稳,图标会退化成连字原文(如 edit_document
显示成文字、check_box 显示成文字并压到标题上)。本脚本把代码里实际用到的图标打成一个
本地小字体(~22KB),彻底去掉对 fonts.gstatic.com 的依赖。

【何时重跑】新增/修改了 material-symbols 图标(JSX 里 <span className="material-symbols-outlined">
名字</span>,或数据里 icon: '名字')之后必须重跑,否则新图标会显示成文字。

【用法】 cd apps/web && python3 scripts/build-icon-font.py
【依赖】 pip3 install fonttools brotli  ;  需能访问 fonts.gstatic.com(仅下载完整字体一次)

【流程】下载完整变体字体 → 扫描 src 收集用到的图标名 → 实例化(固定 opsz/wght/GRAD、
        保留 FILL 轴以支持 .icon-fill)→ 裁剪 GSUB 连字表只留用到的图标(关键:连字图标
        字体按字母子集会因字母共享而保留全部,必须先按"名字"裁连字)→ 子集化 → woff2。
"""
import re
import sys
import tempfile
import urllib.request
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.subset import Options, Subsetter
from fontTools.varLib.instancer import instantiateVariableFont

WEB_ROOT = Path(__file__).resolve().parent.parent
SRC = WEB_ROOT / "src"
OUT = WEB_ROOT / "public" / "fonts" / "material-symbols-subset.woff2"
CSS2 = (
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
    ":opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
)
# 现代 Chrome UA → 拿 woff2(老 UA 会给 ttf)
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

# 候选图标名 = 静态 span 文本 + 所有形如 'snake_case' 的字符串字面量。
# 故意放宽到"所有字符串字面量":动态图标名散落在各种映射表(ELEMENT_ICONS /
# SCRIPT_TYPE_ICONS / DIMENSION_ICONS 等)的值里(key: 'iconname' 形式),只盯 icon: 会漏。
# 多扫进来的非图标字符串,会在"裁剪连字 / 子集化"阶段按"字体里有没有这个连字"自动过滤掉,无副作用。
ICON_PATTERNS = [
    re.compile(r"material-symbols-outlined[^>]*>\s*([a-z][a-z0-9_]+)\s*<"),
    re.compile(r"""['"]([a-z][a-z0-9_]+)['"]"""),  # 2+ 字符,含 tv 等短名
]


def scan_icon_names() -> set[str]:
    names: set[str] = set()
    for path in [*SRC.rglob("*.tsx"), *SRC.rglob("*.ts")]:
        text = path.read_text(encoding="utf-8")
        for pat in ICON_PATTERNS:
            names.update(pat.findall(text))
    return names


def download_full_font() -> Path:
    req = urllib.request.Request(CSS2, headers={"User-Agent": UA})
    css = urllib.request.urlopen(req, timeout=30).read().decode()
    match = re.search(r"url\((https://[^)]+\.woff2)\)", css)
    if not match:
        sys.exit("✗ 未从 css2 拿到 woff2 URL(可能返回了 ttf)。检查网络/UA。")
    data = urllib.request.urlopen(match.group(1), timeout=120).read()
    tmp = Path(tempfile.mkdtemp()) / "ms-full.woff2"
    tmp.write_bytes(data)
    return tmp


def prune_ligatures(font: TTFont, keep: set[str]) -> int:
    """只保留 keep 集合里图标名的连字规则。返回保留条数。"""
    cmap = font.getBestCmap()
    glyph_to_char = {g: chr(cp) for cp, g in cmap.items()}
    kept = 0
    for lookup in font["GSUB"].table.LookupList.Lookup:
        for subtable in lookup.SubTable:
            real = subtable.ExtSubTable if lookup.LookupType == 7 else subtable
            if not hasattr(real, "ligatures"):
                continue
            for first in list(real.ligatures.keys()):
                first_char = glyph_to_char.get(first)
                survivors = []
                for lig in real.ligatures[first]:
                    name = (first_char or "") + "".join(
                        glyph_to_char.get(c, chr(0)) for c in lig.Component
                    )
                    if first_char and name in keep:
                        survivors.append(lig)
                if survivors:
                    real.ligatures[first] = survivors
                    kept += len(survivors)
                else:
                    del real.ligatures[first]
    return kept


def main() -> None:
    names = scan_icon_names()
    print(f"· 扫描到 {len(names)} 个候选图标名")

    full_path = download_full_font()
    font = TTFont(full_path)
    print(f"· 完整字体 {full_path.stat().st_size} bytes / {len(font.getGlyphOrder())} 字形")

    # 固定 opsz/wght/GRAD,保留 FILL 轴(.icon-fill 用 FILL=1)
    instantiateVariableFont(font, {"opsz": 24, "wght": 400, "GRAD": 0}, inplace=True)

    kept = prune_ligatures(font, names)
    print(f"· 裁剪后保留连字 {kept} 条")
    pruned_path = full_path.parent / "ms-pruned.ttf"
    font.save(pruned_path)

    options = Options()
    options.flavor = "woff2"
    options.layout_features += ["liga", "clig", "dlig", "calt"]
    subsetter = Subsetter(options=options)
    pruned = TTFont(pruned_path)
    subsetter.populate(text=" ".join(sorted(names)))
    subsetter.subset(pruned)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pruned.flavor = "woff2"
    pruned.save(OUT)
    print(f"✓ 生成 {OUT.relative_to(WEB_ROOT)} ({OUT.stat().st_size} bytes / "
          f"{len(pruned.getGlyphOrder())} 字形)")


if __name__ == "__main__":
    main()
