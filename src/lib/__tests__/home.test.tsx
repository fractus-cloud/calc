import { describe, it, expect } from 'vitest';
import Home from '~/routes/index';

// Shallow structural test without DOM renderer.
describe('Home page', () => {
  it('contains subnet preview snapshot label', () => {
    const vnode: any = Home();
    const str = JSON.stringify(vnode);
    expect(str.includes('Subnet Explorer Snapshot')).toBe(true);
  });
});
