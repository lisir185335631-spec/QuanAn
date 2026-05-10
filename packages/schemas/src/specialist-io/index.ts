// specialist-io barrel — PRD-2 US-004 + US-005 + PRD-4 US-011 + PRD-5 US-001 + PRD-6 US-001
// 14 Specialist I/O schemas + constants
// US-004: 5 创作类 (copywriting/videoAnalysis/videoProduction/boomGenerate/monetization)
// US-005: 4 流程类 (privateDomain/diagnosis/evolution/deepLearning)
// US-011: 9 step input schemas (step1/3/3b/4/4b/5/6/7/8)
// PRD-5 US-001: analysis schemas + constants (HOT_ELEMENT_KEYS_22 / SCRIPT_TYPE_KEYS_20)
// PRD-6 US-001: 5 video schemas (videoProduction/acquisitionVideo/aiVideo/acquisitionCopywriting/imageGen)

export * from './constants';
export * from './analysis.schema';
export * from './copywriting.schema';
export * from './videoAnalysis.schema';
export * from './videoProduction.schema';
export * from './acquisitionVideo.schema';
export * from './aiVideo.schema';
export * from './acquisitionCopywriting.schema';
export * from './imageGen.schema';
export * from './boomGenerate.schema';
export * from './monetization.schema';
export * from './privateDomain.schema';
export * from './diagnosis.schema';
export * from './evolution.schema';
export * from './deepLearning.schema';
export * from './step-inputs.schema';
