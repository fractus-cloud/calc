import { useTheme } from './ThemeProvider';

const ICONS: Record<string,string> = {
  light: '☀️',
  dark: '🌙',
  system: '💻'
};

export default function ThemeToggle() {
  const { theme, cycle, resolved } = useTheme();
  return (
    <button
      type="button"
      onClick={cycle}
  class="rounded-md p-1 bg-slate-700/40 hover:bg-slate-600/50 border border-slate-500/40 flex items-center justify-center"
  aria-label={`Current theme ${theme()} (resolved ${resolved()}). Click to change.`}
  title={theme()}
    >
  <span>{ICONS[theme()]}</span>
    </button>
  );
}
