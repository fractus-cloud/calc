import { describe, it, expect } from 'vitest';

// Basic relative luminance util (WCAG)
function relLum([r,g,b]: number[]): number {
  const toLin = (c: number) => {
    c/=255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  };
  const [R,G,B] = [toLin(r), toLin(g), toLin(b)];
  return 0.2126*R + 0.7152*G + 0.0722*B;
}
function contrast(a: number[], b: number[]) {
  const L1 = relLum(a), L2 = relLum(b);
  const light = Math.max(L1,L2), dark = Math.min(L1,L2);
  return (light + 0.05) / (dark + 0.05);
}

// Keep in sync with CSS variables in app.css for light theme
const light = {
  bg: [246,248,250],
  fg: [17,24,39],
  fgMuted: [87,102,120],
  accent: [3,105,161]
};

describe('light theme contrast', () => {
  it('primary text vs background >= 7 (AAA for normal text)', () => {
    expect(contrast(light.fg, light.bg)).toBeGreaterThanOrEqual(7);
  });
  it('muted text vs background >= 4.5 (AA normal text)', () => {
    expect(contrast(light.fgMuted, light.bg)).toBeGreaterThanOrEqual(4.5);
  });
  it('accent vs background >= 4.5', () => {
    expect(contrast(light.accent, light.bg)).toBeGreaterThanOrEqual(4.5);
  });
  it('accent vs accent text >= 4.5', () => {
    expect(contrast(light.accent, [255,255,255])).toBeGreaterThanOrEqual(4.5);
  });
});
