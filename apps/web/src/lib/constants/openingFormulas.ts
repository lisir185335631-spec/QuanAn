/**
 * openingFormulas.ts — Tab 3 · 23 开头公式完整字面源
 * SPEC §5
 */

export interface OpeningFormula {
  num: number;
  name: string;
  formula: string;
  example: string;
}

export const OPENING_FORMULAS: ReadonlyArray<OpeningFormula> = [
  { num: 1,  name: '设置疑问',   formula: '你是不是也...？／你知道...吗？',          example: '"你每天都洗头，但是你洗头皮了吗？"' },
  { num: 2,  name: '引发共鸣',   formula: '痛点描述 + 情感共鸣',                    example: '"你是不是每天都在为短视频的选题发愁？"' },
  { num: 3,  name: '制造急迫感', formula: '号外/紧急通知 + 重要信息',                example: '"紧急通知！这个政策马上就要变了"' },
  { num: 4,  name: '告知好处',   formula: '学会这X招 + 具体好处',                    example: '"学会这3步，你也可以轻松上热门"' },
  { num: 5,  name: '盘点清单',   formula: 'X岁之前/之后 + 必须知道的X件事',           example: '"30岁之前，一定要知道的8件事"' },
  { num: 6,  name: '开宗明义',   formula: '直接点明主题',                            example: '"今天教你一个方法，让你的视频播放量翻倍"' },
  { num: 7,  name: '冲突前置',   formula: '挑战/对比 + 悬念',                        example: '"挑战10天成交100单，做到了吗？"' },
  { num: 8,  name: '威胁警告',   formula: '千万不要.../再不...就...',                 example: '"千万不要在晚上发这种视频"' },
  { num: 9,  name: '数字冲击',   formula: '具体数字 + 惊人结果',                      example: '"我花了30天，测试了100个账号，终于找到了规律"' },
  { num: 10, name: '反常识开场', formula: '打破常规认知 + 真相揭示',                  example: '"你以为早起就能成功？大错特错"' },
  { num: 11, name: '身份标签',   formula: '如果你是...+ 就一定要看',                  example: '"如果你是做美业的，这条视频一定要看完"' },
  { num: 12, name: '故事开场',   formula: '时间/地点/人物 + 悬念设置',                example: '"去年这个时候，我还是个月薪3000的打工人"' },
  { num: 13, name: '对比反差',   formula: '别人怎样 vs 我怎样',                       example: '"同行一年赚100万，而我一个月就做到了"' },
  { num: 14, name: '权威背书',   formula: '专家/机构/数据 + 重要结论',                example: '"哈佛研究发现：90%的人都在犯这个错误"' },
  { num: 15, name: '利益前置',   formula: '直接说明能获得什么',                       example: '"看完这条视频，你能省下至少5000元"' },
  { num: 16, name: '情景代入',   formula: '描绘具体场景 + 引发代入感',                example: '"每天晚上躲在被窝里刷手机的你，有没有想过..."' },
  { num: 17, name: '否定式开场', formula: '不要.../别再.../停下来',                   example: '"不要再傻傻地发视频了，先看完这个"' },
  { num: 18, name: '悬念前置',   formula: '结果前置 + 过程悬念',                      example: '"最后的结果让所有人都没想到"' },
  { num: 19, name: '爆料式开场', formula: '独家信息/内幕消息',                        example: '"这个行业的内幕，99%的人都不知道"' },
  { num: 20, name: '自嘲式开场', formula: '自嘲/自贬 + 转折反差',                     example: '"我就是那个曾经被所有人嘲笑的人"' },
  { num: 21, name: '金句开场',   formula: '金句/名言 + 延伸解读',                     example: '"人生没有白走的路，每一步都算数"' },
  { num: 22, name: '反问式开场', formula: '连续反问 + 引发思考',                      example: '"为什么你很努力却赚不到钱？为什么你很勤奋却没结果？"' },
  { num: 23, name: '时间限制',   formula: '限时/倒计时 + 紧迫感',                     example: '"这个方法可能很快就会被封，赶紧收藏"' },
];
