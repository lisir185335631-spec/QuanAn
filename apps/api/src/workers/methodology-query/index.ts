/**
 * MethodologyQueryWorker — in-memory 常量查询(§6.6)
 * 行业 / 爆款元素 / 脚本类型 · ContextAssembler 拼 prompt 时调用
 * PRD-2 目录已建 · PRD-4 US-002 实现
 */

import { INDUSTRIES, HOT_ELEMENTS, SCRIPT_TYPES } from '@/lib/constants';
import type { HotElement } from '@/lib/constants/hotElements';
import type { Industry } from '@/lib/constants/industries';
import type { ScriptType } from '@/lib/constants/scriptTypes';

export type ConstantName = 'industries' | 'hotElements' | 'scriptTypes';

export interface MethodologyConstants {
  industries: readonly Industry[];
  hotElements: readonly HotElement[];
  scriptTypes: readonly ScriptType[];
}

class MethodologyQueryWorker {
  get(name: 'industries'): readonly Industry[];
  get(name: 'hotElements'): readonly HotElement[];
  get(name: 'scriptTypes'): readonly ScriptType[];
  get(name: ConstantName): readonly Industry[] | readonly HotElement[] | readonly ScriptType[] {
    switch (name) {
      case 'industries':  return INDUSTRIES;
      case 'hotElements': return HOT_ELEMENTS;
      case 'scriptTypes': return SCRIPT_TYPES;
    }
  }

  getAll(): MethodologyConstants {
    return {
      industries:  INDUSTRIES,
      hotElements: HOT_ELEMENTS,
      scriptTypes: SCRIPT_TYPES,
    };
  }
}

export const methodologyQueryWorker = new MethodologyQueryWorker();
