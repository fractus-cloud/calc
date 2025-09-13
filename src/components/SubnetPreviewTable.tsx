import { JSX } from 'solid-js';

// Static realistic snapshot of subnet explorer rows.
export function SubnetPreviewTable(): JSX.Element {
  const rows = [
    { cidr: '10.0.0.0/16', hosts: 65534, depth: 0, lock: false },
    { cidr: '10.0.0.0/17', hosts: 32766, depth: 1, lock: false },
    { cidr: '10.0.0.0/18', hosts: 16382, depth: 2, lock: false },
    { cidr: '10.0.0.0/19', hosts: 8190, depth: 3, lock: true, name: 'My Subnet' },
  ];
  const INDENTS = ['pl-0','pl-2','pl-4','pl-6','pl-8','pl-10'];
  const indent = (d:number) => INDENTS[Math.min(d, INDENTS.length-1)];
  return (
    <div class="overflow-hidden rounded-md border border-slate-700/60 bg-slate-900/40">
      <table class="w-full text-[11px]">
        <thead class="bg-slate-800/70 text-slate-400 uppercase tracking-wide">
          <tr>
            <th class="text-left py-1.5 pl-2 font-medium">Actions</th>
            <th class="text-left py-1.5 font-medium">CIDR / Name</th>
            <th class="text-right py-1.5 pr-3 font-medium">Usable Hosts</th>
          </tr>
        </thead>
        <tbody class="bg-slate-900/20">
          {rows.map(r => (
            <tr class="border-t border-slate-700/40" aria-hidden>
              <td class={`pr-2 py-1 ${indent(r.depth)}`}>
                <div class="flex gap-1">
                  <button disabled class="text-[10px] rounded-md px-2 h-6 flex items-center border border-slate-600/60 bg-slate-800 text-slate-500 cursor-default">{r.depth < 3 ? 'Collapse' : 'Expand'}</button>
                  <button disabled class="text-[10px] rounded-md px-2 h-6 flex items-center border border-slate-600/60 bg-slate-800 text-slate-500 cursor-default">{r.depth < 3 ? 'Join' : 'Split'}</button>
                </div>
              </td>
              <td class="py-1 font-mono">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-sky-400">{r.cidr}</span>
                  {r.name && <span class="text-xs text-amber-500 font-medium">{r.name}</span>}
                  {r.lock && <span class="text-[9px] uppercase tracking-wide text-amber-500">LOCKED</span>}
                </div>
              </td>
              <td class="py-1 font-mono text-right text-slate-400 pr-3">{r.hosts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div class="px-3 py-2 text-[10px] text-slate-500 flex items-center justify-between bg-slate-800/40 border-t border-slate-700/60">
        <span>Preview snapshot – interactions disabled</span>
        <span class="inline-flex items-center gap-1 text-slate-400"><svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7l2 3h9v13H3z"/></svg> Static</span>
      </div>
    </div>
  );
}

export default SubnetPreviewTable;
