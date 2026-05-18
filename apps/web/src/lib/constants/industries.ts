/**
 * Step 1 行业洞察常量
 * TD-79 fix: STEP1_CTA_LABEL 从 mock '确认并进入下一步' 更新为真 Agent 语义 '生成行业洞察'
 * TD-80 fix: STEP1_RESULT_H2 / STEP1_RESULT_H3_3 替换 Step1Result 硬编码 heading
 */

// TD-79: 真 Agent 语义 label (按决策 B 保留新 label)
export const STEP1_CTA_LABEL = '生成行业洞察' as const;
export const STEP1_NEXT_LABEL = '进入 IP 定位 →' as const;

// TD-80: Step1Result 结果区 heading 常量
export const STEP1_RESULT_H2 = '行业洞察报告' as const;
export const STEP1_RESULT_H3_3 = ['市场分析', '竞争程度', '定位建议'] as const;
