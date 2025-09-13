import { describe, it, expect } from 'vitest';
import { parseCIDR } from '../subnet';
import { shouldDeferSubnetCompute } from '../subnetHeuristic';

// We can't easily mount Solid component without renderer setup, so test heuristic function directly.

describe('spinner heuristic', () => {
  it('does not defer small expansions', () => {
    const root = parseCIDR('10.0.0.0/16');
  expect(shouldDeferSubnetCompute(root.mask, 20)).toBe(false);
  });
  it('defers very large potential row counts', () => {
    const root = parseCIDR('10.0.0.0/8');
    // /8 to /24 potential = 2^(24-8)=65536 > threshold
  expect(shouldDeferSubnetCompute(root.mask, 24)).toBe(true);
  });
});
