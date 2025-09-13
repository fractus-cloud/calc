import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Nav from "~/components/Nav";
import { ThemeProvider } from "~/components/ThemeProvider";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <ThemeProvider>
          <div class="min-h-dvh flex flex-col font-sans">
            <Nav />
            <div class="flex-1">
              <Suspense>{props.children}</Suspense>
            </div>
            <footer class="text-center text-xs text-slate-500 py-6">calc.fracc.io • Stay tuned for more calculators</footer>
          </div>
        </ThemeProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
