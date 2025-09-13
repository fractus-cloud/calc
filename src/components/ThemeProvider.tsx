import { createContext, useContext, JSX, createSignal, onMount } from 'solid-js';

export type Theme = 'light' | 'dark' | 'system';
interface ThemeContextValue {
  theme: () => Theme;
  resolved: () => 'light' | 'dark';
  setTheme: (t: Theme) => void;
  cycle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>();

function getSystem(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider(props: { children: JSX.Element }) {
  const stored = typeof localStorage !== 'undefined' ? (localStorage.getItem('theme') as Theme | null) : null;
  const [theme, setThemeSignal] = createSignal<Theme>(stored || 'system');
  const [resolved, setResolved] = createSignal<'light' | 'dark'>('light');

  const apply = (t: Theme) => {
    const actual = t === 'system' ? getSystem() : t;
    setResolved(actual);
    const root = document.documentElement;
    root.dataset.theme = actual;
  };

  onMount(() => {
    apply(theme());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => theme() === 'system' && apply('system');
    mq.addEventListener('change', listener);
  });

  const setTheme = (t: Theme) => {
    setThemeSignal(t);
    if (t === 'system') localStorage.removeItem('theme'); else localStorage.setItem('theme', t);
    apply(t);
  };

  const cycle = () => {
    const order: Theme[] = ['light', 'dark', 'system'];
    const idx = order.indexOf(theme());
    setTheme(order[(idx + 1) % order.length]);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, cycle }}>{props.children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('Missing ThemeProvider');
  return ctx;
}
