import { JSX } from 'solid-js';

// Static snapshot mimicking the live Subnet Explorer layout (non-interactive)
export function SubnetPreviewTable(): JSX.Element {
  // Rows chosen to resemble marketing screenshot (depth + names + locks)
  const rows = [
    { cidr: '10.10.0.0/20', hosts: 4094, depth: 0, lock: false, name: 'Corp /20', range: '10.10.0.0 – 10.10.15.255' },
    { cidr: '10.10.0.0/21', hosts: 2046, depth: 1, lock: true, name: 'Primary Segment', range: '10.10.0.0 – 10.10.7.255' },
    { cidr: '10.10.0.0/22', hosts: 1022, depth: 2, lock: true, name: 'Core & DMZ', range: '10.10.0.0 – 10.10.3.255' },
    { cidr: '10.10.0.0/23', hosts: 510, depth: 3, lock: true, name: 'Core', range: '10.10.0.0 – 10.10.1.255' },
    { cidr: '10.10.0.0/24', hosts: 254, depth: 4, lock: true, name: 'App A', range: '10.10.0.0 – 10.10.0.255' },
    { cidr: '10.10.1.0/24', hosts: 254, depth: 4, lock: true, name: 'App B', range: '10.10.1.0 – 10.10.1.255' },
    { cidr: '10.10.2.0/23', hosts: 510, depth: 3, lock: true, name: 'DMZ', range: '10.10.2.0 – 10.10.3.255' },
    { cidr: '10.10.2.0/24', hosts: 254, depth: 4, lock: true, name: 'DB', range: '10.10.2.0 – 10.10.2.255' },
  ];

  return (
    <div class="overflow-hidden rounded-md table-container">
      <table class="w-full text-[11px]">
        <thead class="table-gradient-header table-header-text uppercase tracking-wide">
          <tr>
            <th class="text-left pl-2 py-1.5 font-medium w-[1%]">Actions</th>
            <th class="text-left py-1.5 font-medium">CIDR / Name / Lock</th>
            <th class="text-left py-1.5 font-medium">Range (Network – Broadcast)</th>
            <th class="text-right py-1.5 pr-3 font-medium">Usable Hosts</th>
          </tr>
        </thead>
        <tbody class="table-body-bg">
          {rows.map(r => (
            <tr class="table-row-border opacity-90" aria-hidden>
              <td class="align-middle pr-2 py-1">
                <div class="relative depth-wrapper" data-depth={r.depth}>
                  <div class="depth-lines" aria-hidden="true">
                    {[...Array(r.depth).keys()].map(i => <span class={`depth-line dl-${i}`} />)}
                  </div>
                  <div class={`relative z-10 depth-pad-${r.depth <= 32 ? r.depth : 32}`}>
                    <div class="flex gap-1 items-center">
                      <button disabled class="text-[10px] rounded-md px-2 h-6 flex items-center border whitespace-nowrap opacity-40 cursor-default btn-secondary">{r.depth < 3 ? 'Collapse' : 'Expand'}</button>
                      <button disabled class="text-[10px] rounded-md px-2 h-6 flex items-center border whitespace-nowrap opacity-40 cursor-default btn-secondary">{r.depth < 3 ? 'Join' : 'Split'}</button>
                    </div>
                  </div>
                </div>
              </td>
              <td class="py-1 font-mono">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-sky-500 dark:text-sky-400">{r.cidr}</span>
                  {r.name && <span class="text-xs text-amber-500 font-medium whitespace-nowrap">{r.name}</span>}
                  <button disabled class={`group w-6 h-6 flex items-center justify-center rounded-md border transition-colors ${r.lock ? 'border-amber-500 bg-amber-500/20' : 'border-transparent'}`}> 
                    {r.lock ? (
                      <svg aria-hidden viewBox="0 0 24 24" class="w-3.5 h-3.5 stroke-[1.8] text-amber-500" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="9" rx="2" /><path d="M8 11V9a4 4 0 0 1 8 0v2" /><path d="M12 15v-2" /></svg>
                    ) : (
                      <svg aria-hidden viewBox="0 0 24 24" class="w-3.5 h-3.5 stroke-[1.8] text-slate-400" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><path d="M12 15v-1" /></svg>
                    )}
                  </button>
                </div>
              </td>
              <td class="font-mono text-[10px] text-slate-600 dark:text-slate-400">{r.range}</td>
              <td class="font-mono text-right pr-3 table-header-text">{r.hosts}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div class="px-3 py-2 text-[10px] flex items-center justify-between table-gradient-header table-row-border table-header-text">
        <span>Preview snapshot – interactions disabled</span>
        <span class="inline-flex items-center gap-1"><svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7l2 3h9v13H3z"/></svg> Static</span>
      </div>
    </div>
  );
}

export default SubnetPreviewTable;
