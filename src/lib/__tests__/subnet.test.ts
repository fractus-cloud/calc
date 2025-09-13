import { describe, it, expect } from 'vitest';
import { parseCIDR, subdivide, buildSubdivisionTree, formatSubnet } from '../subnet';

describe('parseCIDR', () => {
  it('parses basic /24', () => {
    const s = parseCIDR('10.0.1.0/24');
    expect(s.cidr).toBe('10.0.1.0/24');
    expect(s.hosts).toBe(254);
  });
  it('handles /32', () => {
    const s = parseCIDR('192.168.0.5/32');
    expect(s.hosts).toBe(0);
    expect(s.firstHost).toBeNull();
  });
  it('rejects invalid', () => {
    expect(() => parseCIDR('10.0.0/24')).toThrow();
  });
});

describe('subdivide', () => {
  it('splits /24 into /25s', () => {
    const base = parseCIDR('10.0.0.0/24');
    const parts = subdivide(base, { targetMask: 25 });
    expect(parts.length).toBe(2);
    expect(parts[0].cidr).toBe('10.0.0.0/25');
    expect(parts[1].cidr).toBe('10.0.0.128/25');
  });
});

describe('buildSubdivisionTree', () => {
  it('builds depth', () => {
    const tree = buildSubdivisionTree('10.0.0.0/30', 31);
    expect(tree.children?.length).toBe(2);
  });
});

describe('formatSubnet', () => {
  it('formats output', () => {
    const f = formatSubnet(parseCIDR('10.0.0.0/30'));
    expect(f.cidr).toBe('10.0.0.0/30');
    expect(f.hosts).toBe(2);
  });
});
