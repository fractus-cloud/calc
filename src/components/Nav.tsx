import { useLocation } from "@solidjs/router";
import ThemeToggle from "~/components/ThemeToggle";

export default function Nav() {
  const location = useLocation();
  const active = (path: string) =>
    path == location.pathname ? "border-sky-600" : "border-transparent hover:border-sky-600";
  return (
    <nav class="backdrop-blur supports-[backdrop-filter]:bg-slate-900/70 bg-slate-800/90 border-b border-slate-700 sticky top-0 z-50">
      <div class="max-w-6xl mx-auto flex items-center gap-6 px-4 h-14">
        <a href="/" class="text-sm font-bold tracking-tight text-sky-400">calc.fracc.io</a>
        <ul class="flex items-center gap-2 text-sm">
          <li>
            <a class={`nav-link ${active("/subnets")}`} href="/subnets">Subnets</a>
          </li>
        </ul>
        <div class="ml-auto flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
