/**
 * shadow router codegen —— 从真 router 自动生成扁平、自包含的 shadow(取代手写 _shadowRouter）。
 *
 * 机制(纯 TS Compiler API,无运行时副作用):
 *   读 typeof appRouter / adminRouter → 走 `_def.record` 拿结构 + 每 procedure 的 `_def.type`(query/mutation/subscription)
 *   + `_def.$types.input/output` 拿类型 → 用【深度受限递归打印器】打成自包含类型(@/ 消失、JSON 递归收敛 unknown)
 *   → emit 扁平 `_t.router({...})` + `export type XxxRouter = typeof _gen`。
 *
 * 生成物:packages/clients/src/{router-types.generated.ts, admin-router-types.generated.ts}
 * 运行:pnpm codegen:shadow   (= node scripts/codegen-shadow.cjs)
 */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const MAX_DEPTH = 8;
const MAX_PROPS = 80;
// 内置/全局命名类型按名打印(不展开方法)。展开会把 Date 变成 { getTime?: unknown; ... } 破坏赋值。
const BUILTIN = new Set(['Date', 'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Error', 'URL', 'ArrayBuffer']);

const PRIM =
  ts.TypeFlags.String | ts.TypeFlags.Number | ts.TypeFlags.Boolean | ts.TypeFlags.Null |
  ts.TypeFlags.Undefined | ts.TypeFlags.Void | ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral |
  ts.TypeFlags.BooleanLiteral | ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never |
  ts.TypeFlags.Enum | ts.TypeFlags.EnumLiteral;

const cfgPath = path.resolve('apps/api/tsconfig.json');
const cfg = ts.readConfigFile(cfgPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, path.dirname(cfgPath));

function generate({ typeName, importPath, exportName, outFile }) {
  const probe = path.resolve('apps/api/src/__cg_probe.ts');
  fs.writeFileSync(probe, `import type { ${typeName} } from '${importPath}';\nexport type _R = ${typeName};\n`);
  const program = ts.createProgram([...parsed.fileNames, probe], parsed.options);
  const ck = program.getTypeChecker();
  const sf = program.getSourceFile(probe);
  const al = sf.statements.find((s) => ts.isTypeAliasDeclaration(s) && s.name.text === '_R');
  const loc = al;
  const prop = (ty, n) => {
    const s = ty && ty.getProperty(n);
    return s ? ck.getTypeOfSymbolAtLocation(s, loc) : undefined;
  };

  let capped = 0;
  let procCount = 0;

  function printType(type, depth) {
    if (type.flags & PRIM) return ck.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
    if (depth >= MAX_DEPTH) { capped++; return 'unknown'; }
    if (ck.isArrayType(type)) return `Array<${printType(ck.getTypeArguments(type)[0], depth + 1)}>`;
    if (ck.isTupleType(type)) return `[${ck.getTypeArguments(type).map((t) => printType(t, depth + 1)).join(', ')}]`;
    const symName = type.getSymbol() && type.getSymbol().getName();
    if (symName && BUILTIN.has(symName)) return ck.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation);
    if (type.isUnion()) return type.types.map((t) => printType(t, depth)).join(' | ');
    if (type.isIntersection()) return type.types.map((t) => printType(t, depth)).join(' & ');
    const strIndex = ck.getIndexTypeOfType(type, ts.IndexKind.String);
    const props = ck.getPropertiesOfType(type).filter((p) => /^[A-Za-z_$][\w$]*$/.test(p.name));
    if (props.length === 0) {
      if (strIndex) return `Record<string, ${printType(strIndex, depth + 1)}>`;
      capped++; return 'unknown';
    }
    if (props.length > MAX_PROPS) { capped++; return 'unknown'; }
    const parts = props.map((p) => {
      const pt = ck.getTypeOfSymbolAtLocation(p, loc);
      const opt = p.flags & ts.SymbolFlags.Optional ? '?' : '';
      return `${p.name}${opt}: ${printType(pt, depth + 1)}`;
    });
    const idx = strIndex ? `; [key: string]: ${printType(strIndex, depth + 1)}` : '';
    return `{ ${parts.join('; ')}${idx} }`;
  }

  const VOIDISH = ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Unknown | ts.TypeFlags.Never | ts.TypeFlags.Any;

  function emitProc(def) {
    const typeLit = prop(def, 'type');
    const kind = typeLit && typeLit.isStringLiteral() ? typeLit.value : 'query'; // query/mutation/subscription
    const $types = prop(def, '$types');
    const outT = $types && prop($types, 'output');
    const inT = $types && prop($types, 'input');
    const outStr = outT ? printType(outT, 1) : 'unknown';
    let inputPart = '';
    if (inT && !(inT.flags & VOIDISH)) inputPart = `.input((x: unknown) => x as ${printType(inT, 1)})`;
    procCount++;
    if (kind === 'subscription') {
      // 订阅:resolver 返回 Asyncgenerator;shadow 仅供类型,用 __stub
      return `_t.procedure${inputPart}.subscription((): AsyncGenerator<${outStr}> => __stub)`;
    }
    return `_t.procedure${inputPart}.${kind}((): ${outStr} => __stub)`;
  }

  function walkRecord(recordType, depth) {
    if (depth > 6) return '';
    // 排除前导下划线的 tRPC 内部键(_def/_config 等);proc/router 名不会以 _ 开头
    const entries = ck.getPropertiesOfType(recordType).filter((p) => /^[a-zA-Z$][\w$]*$/.test(p.name));
    const parts = entries.map((p) => {
      const child = ck.getTypeOfSymbolAtLocation(p, loc);
      const def = prop(child, '_def');
      const typeLit = def && prop(def, 'type');
      if (typeLit && typeLit.isStringLiteral && typeLit.isStringLiteral()) {
        return `  ${p.name}: ${emitProc(def)},`;
      }
      // 嵌套 record(子路由)→ 递归 child 自身(其属性即子 procedure/子路由)
      const inner = walkRecord(child, depth + 1);
      if (!inner.trim()) return null;
      return `  ${p.name}: _t.router({\n${inner}\n  }),`;
    });
    return parts.filter(Boolean).join('\n');
  }

  const T = ck.getDeclaredTypeOfSymbol(ck.getSymbolAtLocation(al.name));
  const record = prop(prop(T, '_def'), 'record');
  const body = walkRecord(record, 0);
  const out = `/* eslint-disable */
// GENERATED by scripts/codegen-shadow.cjs — DO NOT EDIT BY HAND. Run \`pnpm codegen:shadow\`.
// 从真 ${typeName} 自动生成的扁平自包含 shadow(取代手写镜像)。永远与后端同步、零漂移。
import { initTRPC } from '@trpc/server';
const _t = initTRPC.create();
declare const __stub: never;

const _gen = _t.router({
${body}
});

export type ${exportName} = typeof _gen;
`;
  fs.writeFileSync(outFile, out);
  fs.unlinkSync(probe);
  console.log(`  ${exportName}: ${procCount} procedure · 收敛 unknown ${capped} 处 · ${out.length} 字符 → ${path.relative('.', outFile)}`);
}

console.log('codegen shadow:');
generate({
  typeName: 'AppRouter',
  importPath: '@/trpc/routers/_app',
  exportName: 'AppRouter',
  outFile: path.resolve('packages/clients/src/router-types.generated.ts'),
});
generate({
  typeName: 'AdminRouter',
  importPath: '@/trpc/routers/admin',
  exportName: 'AdminRouter',
  outFile: path.resolve('packages/clients/src/admin-router-types.generated.ts'),
});
console.log('✅ done');
