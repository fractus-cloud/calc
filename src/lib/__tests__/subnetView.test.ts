import { describe, it, expect } from 'vitest';
import { parseCIDR } from '../subnet';
import { computeVisibleRows, ViewState } from '../subnetView';

function makeState(): ViewState {
  return { expanded: new Set<string>(), locked: new Set<string>(), names: new Map(), maxDepth: 28 };
}

describe('computeVisibleRows', () => {
  it('shows root only when not expanded', () => {
    const root = parseCIDR('10.0.0.0/24');
    const state = makeState();
    const rows = computeVisibleRows({ root, state, targetMask: state.maxDepth });
    expect(rows.length).toBe(1);
    expect(rows[0].subnet.cidr).toBe('10.0.0.0/24');
  });
  it('shows children when expanded', () => {
    const root = parseCIDR('10.0.0.0/24');
    const state = makeState();
    state.expanded.add(root.cidr);
    const rows = computeVisibleRows({ root, state, targetMask: state.maxDepth });
    expect(rows.some(r => r.subnet.cidr === '10.0.0.0/25')).toBe(true);
  });
  it('keeps locked grandchild visible even if ancestor not expanded', () => {
    const root = parseCIDR('10.0.0.0/24');
    const state = makeState();
    // Lock a /26 which is two levels deeper
    state.locked.add('10.0.0.0/26');
    const rows = computeVisibleRows({ root, state, targetMask: state.maxDepth });
    const locked = rows.find(r => r.subnet.cidr === '10.0.0.0/26');
    expect(locked).toBeTruthy();
    expect(locked?.depth).toBeGreaterThan(0);
  });

  it('depth increases with deeper locks and expansion independent', () => {
    const root = parseCIDR('10.0.0.0/24');
    const state = makeState();
    state.expanded.add(root.cidr); // expand root -> shows /25
    state.expanded.add('10.0.0.0/25'); // expand first /25 -> shows /26
    state.locked.add('10.0.0.0/26');
    const rows = computeVisibleRows({ root, state, targetMask: state.maxDepth });
    const r26 = rows.find(r => r.subnet.cidr === '10.0.0.0/26');
    expect(r26?.depth).toBe(2);
  });
});
