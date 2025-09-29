import test from 'node:test';
import assert from 'node:assert/strict';

const MIN_CONTRAST = 4.5;

const srgbChannel = (value) => {
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
};

const toLinear = (component) => srgbChannel(component / 255);

const fromLinear = (value) => {
  if (value <= 0.0031308) {
    return Math.round(value * 12.92 * 255);
  }
  return Math.round((1.055 * Math.pow(value, 1 / 2.4) - 0.055) * 255);
};

const hexToRgb = (hex) => {
  const clean = hex.replace('#', '');
  return [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16));
};

const rgbToHex = (rgb) =>
  `#${rgb
    .map((component) => component.toString(16).padStart(2, '0'))
    .join('')}`;

const mix = (colorA, colorB, percentA) => {
  const ratioA = percentA / 100;
  const ratioB = 1 - ratioA;
  const linearA = hexToRgb(colorA).map(toLinear);
  const linearB = hexToRgb(colorB).map(toLinear);
  const mixed = linearA.map((value, index) => value * ratioA + linearB[index] * ratioB);
  return rgbToHex(mixed.map(fromLinear));
};

const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((component) => component / 255);
  const [lr, lg, lb] = [r, g, b].map(srgbChannel);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};

const contrast = (fg, bg) => {
  const [L1, L2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (L1 + 0.05) / (L2 + 0.05);
};

const themes = {
  light: {
    background: '#ecfeff',
    text: '#1f2937',
    accent: '#0f4c81',
    accentSoft: '#1d6fb8',
    onAccent: '#f8f9ff',
    link: '#1d6fb8',
    linkHover: '#0f4c81',
    muted: mix('#1f2937', '#ecfeff', 85),
    mutedStrong: mix('#1f2937', '#ecfeff', 92),
    accentSurfaceStart: mix('#0f4c81', '#ecfeff', 92),
    accentSurfaceHighlight: mix('#0f4c81', '#ecfeff', 96),
    accentSurfaceEnd: '#0f4c81',
    accentSurfaceMid: mix('#0f4c81', '#ecfeff', 90),
  },
  dark: {
    background: '#050b19',
    text: '#e2e8f0',
    accent: '#0f6abf',
    accentSoft: '#4cc4ff',
    onAccent: '#f8fafc',
    link: '#4cc4ff',
    linkHover: '#78d0ff',
    muted: mix('#94a3b8', '#ffffff', 78),
    mutedStrong: mix('#bae6fd', '#ffffff', 68),
    accentSurfaceStart: mix('#0f6abf', '#050b19', 92),
    accentSurfaceHighlight: mix('#0f6abf', '#050b19', 96),
    accentSurfaceEnd: '#0f6abf',
    accentSurfaceMid: mix('#0f6abf', '#050b19', 90),
  },
};

const ensureContrast = (description, fg, bg, minimum = MIN_CONTRAST) => {
  const ratio = contrast(fg, bg);
  assert.ok(
    ratio >= minimum,
    `${description} contrast ${ratio.toFixed(2)} fell below ${minimum}`,
  );
};

test('light theme tokens maintain readable contrast', () => {
  const theme = themes.light;
  ensureContrast('body text', theme.text, theme.background);
  ensureContrast('muted text', theme.muted, theme.background);
  ensureContrast('strong muted text', theme.mutedStrong, theme.background);
  ensureContrast('link text', theme.link, theme.background);
  ensureContrast('link hover', theme.linkHover, theme.background);
  ensureContrast('accent surface start', theme.onAccent, theme.accentSurfaceStart);
  ensureContrast('accent surface highlight', theme.onAccent, theme.accentSurfaceHighlight);
  ensureContrast('accent surface end', theme.onAccent, theme.accentSurfaceEnd);
  ensureContrast('accent surface mid', theme.onAccent, theme.accentSurfaceMid);
});

test('dark theme tokens maintain readable contrast', () => {
  const theme = themes.dark;
  ensureContrast('body text', theme.text, theme.background);
  ensureContrast('muted text', theme.muted, theme.background);
  ensureContrast('strong muted text', theme.mutedStrong, theme.background);
  ensureContrast('link text', theme.link, theme.background);
  ensureContrast('link hover', theme.linkHover, theme.background);
  ensureContrast('accent surface start', theme.onAccent, theme.accentSurfaceStart);
  ensureContrast('accent surface highlight', theme.onAccent, theme.accentSurfaceHighlight);
  ensureContrast('accent surface end', theme.onAccent, theme.accentSurfaceEnd);
  ensureContrast('accent surface mid', theme.onAccent, theme.accentSurfaceMid);
});
