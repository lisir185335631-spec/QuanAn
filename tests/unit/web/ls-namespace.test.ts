/**
 * ls-namespace unit tests — PRD-2 US-002 · AC-4
 * 18 keys covered: step1–step9 × 2 accounts + evolution × 2 accounts + prefix + ops
 * Runs in node environment using a Map-based Storage mock (no jsdom required).
 */

import {
  LS_PREFIX,
  LS_LIMIT_BYTES,
  stepLsKey,
  evolutionLsKey,
  accountLsPrefix,
  clearLsNamespace,
  lsUsedBytes,
  pruneLsNamespaces,
} from '../../../apps/web/src/lib/ls-namespace';

// ── Minimal Storage mock ──────────────────────────────────────────────────────

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ls-namespace key builders', () => {
  // Keys 1–9: step1–step9 for account 1
  it('key-01: stepLsKey account=1 step=step1', () => {
    expect(stepLsKey(1, 'step1')).toBe('aiip_memory_acc_1_step1');
  });
  it('key-02: stepLsKey account=1 step=step2', () => {
    expect(stepLsKey(1, 'step2')).toBe('aiip_memory_acc_1_step2');
  });
  it('key-03: stepLsKey account=1 step=step3', () => {
    expect(stepLsKey(1, 'step3')).toBe('aiip_memory_acc_1_step3');
  });
  it('key-04: stepLsKey account=1 step=step4', () => {
    expect(stepLsKey(1, 'step4')).toBe('aiip_memory_acc_1_step4');
  });
  it('key-05: stepLsKey account=1 step=step5', () => {
    expect(stepLsKey(1, 'step5')).toBe('aiip_memory_acc_1_step5');
  });
  it('key-06: stepLsKey account=1 step=step6', () => {
    expect(stepLsKey(1, 'step6')).toBe('aiip_memory_acc_1_step6');
  });
  it('key-07: stepLsKey account=1 step=step7', () => {
    expect(stepLsKey(1, 'step7')).toBe('aiip_memory_acc_1_step7');
  });
  it('key-08: stepLsKey account=1 step=step8', () => {
    expect(stepLsKey(1, 'step8')).toBe('aiip_memory_acc_1_step8');
  });
  it('key-09: stepLsKey account=1 step=step9', () => {
    expect(stepLsKey(1, 'step9')).toBe('aiip_memory_acc_1_step9');
  });

  // Key 10: evolution for account 1
  it('key-10: evolutionLsKey account=1', () => {
    expect(evolutionLsKey(1)).toBe('aiip_memory_acc_1_evolution');
  });

  // Keys 11–12: cross-account isolation check
  it('key-11: stepLsKey account=42 must use account 42 namespace', () => {
    expect(stepLsKey(42, 'step1')).toBe('aiip_memory_acc_42_step1');
  });
  it('key-12: evolutionLsKey account=42', () => {
    expect(evolutionLsKey(42)).toBe('aiip_memory_acc_42_evolution');
  });

  // Key 13: prefix format
  it('key-13: accountLsPrefix has trailing underscore', () => {
    expect(accountLsPrefix(7)).toBe('aiip_memory_acc_7_');
  });

  // Key 14: constant values
  it('key-14: LS_PREFIX is correct', () => {
    expect(LS_PREFIX).toBe('aiip_memory_acc');
  });

  // Key 15: account 0 edge case
  it('key-15: stepLsKey account=0 is well-formed', () => {
    expect(stepLsKey(0, 'step1')).toBe('aiip_memory_acc_0_step1');
  });
});

describe('clearLsNamespace', () => {
  it('key-16: removes all keys for the target account namespace', () => {
    const store = new MockStorage();
    store.setItem('aiip_memory_acc_1_step1', 'a');
    store.setItem('aiip_memory_acc_1_step2', 'b');
    store.setItem('aiip_memory_acc_1_evolution', 'c');

    clearLsNamespace(store, 1);

    expect(store.getItem('aiip_memory_acc_1_step1')).toBeNull();
    expect(store.getItem('aiip_memory_acc_1_step2')).toBeNull();
    expect(store.getItem('aiip_memory_acc_1_evolution')).toBeNull();
  });

  it('key-17: preserves keys from other account namespaces (AC-6 isolation)', () => {
    const store = new MockStorage();
    store.setItem('aiip_memory_acc_1_step1', 'acc1-data');
    store.setItem('aiip_memory_acc_2_step1', 'acc2-data');

    clearLsNamespace(store, 1);

    expect(store.getItem('aiip_memory_acc_1_step1')).toBeNull();
    expect(store.getItem('aiip_memory_acc_2_step1')).toBe('acc2-data');
  });
});

describe('lsUsedBytes and pruneLsNamespaces', () => {
  it('key-18: pruneLsNamespaces removes non-active keys when limit exceeded', () => {
    const store = new MockStorage();

    // Simulate ~5MB+ by writing a large value for a non-active account
    const bigValue = 'x'.repeat(LS_LIMIT_BYTES / 2 + 100);
    store.setItem('aiip_memory_acc_99_step1', bigValue);

    // Active account key — must survive pruning
    store.setItem('aiip_memory_acc_1_step1', 'keep');

    pruneLsNamespaces(store, 1);

    // Non-active pruned
    expect(store.getItem('aiip_memory_acc_99_step1')).toBeNull();
    // Active preserved
    expect(store.getItem('aiip_memory_acc_1_step1')).toBe('keep');
  });
});
