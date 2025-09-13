import { A } from "@solidjs/router";

import SubnetPreviewTable from '~/components/SubnetPreviewTable';

export default function Home() {
  return (
  <main class="mx-auto max-w-7xl p-5 sm:p-6 space-y-14">
      <section class="flex flex-col gap-12 pt-6">
  <div class="grid lg:grid-cols-2 gap-10 lg:gap-12 items-start">
          <div class="space-y-6">
            <h1 class="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Practical calculators & network visualizers
            </h1>
            <p class="text-slate-400 text-lg leading-relaxed max-w-prose">
              Small, dependable tools for network planning and rapid calculations. Start with the interactive IPv4 Subnet Explorer: split networks, name important ranges, and lock plan decisions.
            </p>
            <div class="flex flex-wrap gap-3">
              <A href="/subnets" class="px-5 py-2.5 rounded-md bg-sky-600 hover:bg-sky-500 text-sm font-medium text-white shadow inline-flex items-center gap-2">
                Open Subnet Explorer →
              </A>
              <A href="/subnets?cidr=10.0.0.0/16&mask=24" class="px-4 py-2.5 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 inline-flex items-center">
                Try sample /16
              </A>
            </div>
          </div>
          <div class="relative">
            <div class="rounded-2xl border border-slate-300/60 dark:border-slate-700/70 bg-slate-900/40 p-5 md:p-6 shadow-xl">
              <header class="mb-4 flex items-center justify-between gap-4">
                <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Subnet Explorer Snapshot</h2>
                <A href="/subnets" class="text-[11px] font-medium text-sky-400 hover:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded px-2 py-1">Open</A>
              </header>
              <SubnetPreviewTable />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
