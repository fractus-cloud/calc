import { createSignal, For, Show, createMemo, onMount, createEffect } from 'solid-js';
import { shouldDeferSubnetCompute, estimatePotentialRowCount } from '~/lib/subnetHeuristic';

// (heuristic helpers moved to lib/subnetHeuristic for testability)
import { useLocation } from '@solidjs/router';
import { safeParseCIDR, formatSubnet, IPv4Subnet, parseCIDR } from '~/lib/subnet';
import { computeVisibleRows, ViewState } from '~/lib/subnetView';

interface RowActionProps { rowSubnet: IPv4Subnet; depth: number; canSplit: boolean; canJoin: boolean; expanded: boolean; isSplit: boolean; onSplit: () => void; onExpand: () => void; onCollapse: () => void; onJoin: () => void; }

export function logicalButtonLabel(isSplit: boolean) {
  return isSplit ? 'Join' : 'Split';
}

export function RowActions(p: RowActionProps) {
  const isExpanded = () => p.expanded;
  const logicalIsSplitForLabel = () => p.isSplit;
  return (
    <div class="flex gap-1 items-center">
      <button
        onClick={() => { isExpanded() ? p.onCollapse() : p.onExpand(); }}
        disabled={!p.isSplit}
        class={`text-[10px] rounded-md px-2 h-7 flex items-center border whitespace-nowrap ${p.isSplit ? (isExpanded() ? 'btn-secondary hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700' : 'bg-sky-600 text-white border-sky-600 hover:bg-sky-500') : 'opacity-30 cursor-not-allowed border-slate-300 dark:border-slate-600'}`}
        title={p.isSplit ? (isExpanded() ? 'Collapse (hide child subnets)' : 'Expand (show child subnets)') : 'Split first to enable expansion'}
      >{isExpanded() ? 'Collapse' : 'Expand'}</button>
      <button
        onClick={() => { p.isSplit ? p.onJoin() : p.onSplit(); }}
        disabled={p.isSplit ? !p.canJoin : !p.canSplit}
        class={`text-[10px] rounded-md px-2 h-7 flex items-center border whitespace-nowrap ${(p.isSplit ? p.canJoin : p.canSplit) ? 'bg-sky-600 text-white border-sky-600 hover:bg-sky-500' : 'opacity-30 cursor-not-allowed border-slate-300 dark:border-slate-600'}`}
        title={p.isSplit ? (p.canJoin ? 'Join (merge descendants back into single row)' : 'Cannot join: a locked descendant exists') : (p.canSplit ? 'Split (logically create child subnets)' : 'Cannot split further')}
      >{logicalIsSplitForLabel() ? 'Join' : 'Split'}</button>
    </div>
  );
}

export default function SubnetsPage() {
  const DEFAULT_CIDR = '10.0.0.0/16';
  const [input, setInput] = createSignal(DEFAULT_CIDR);
  const [maxMask, setMaxMask] = createSignal(24);
  let maxMaskRef: HTMLInputElement | undefined;
  const parsed = createMemo(() => safeParseCIDR(input()));
  const rootSubnet = createMemo<IPv4Subnet | null>(() => (parsed().ok ? (parsed() as { ok: true; value: IPv4Subnet }).value : null));
  const errorMsg = createMemo(() => (parsed().ok ? null : (parsed() as { ok: false; error: string }).error));

  // Reactive view state
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set());
  const [locked, setLocked] = createSignal<Set<string>>(new Set());
  // Track which subnets have been logically split (child subnets materialized). Root considered split implicitly.
  const [splitSet, setSplitSet] = createSignal<Set<string>>(new Set());
  const [names, setNames] = createSignal<Map<string,string>>(new Map());

  // Local storage persistence keys
  const LS_PREFIX = 'subnets:';
  const K_INPUT = LS_PREFIX + 'input';
  const K_MAXMASK = LS_PREFIX + 'maxMask';
  const K_EXPANDED = LS_PREFIX + 'expanded';
  const K_LOCKED = LS_PREFIX + 'locked';
  const K_SPLIT = LS_PREFIX + 'split';
  const K_NAMES = LS_PREFIX + 'names';

  const location = useLocation();
  const [shareApplied, setShareApplied] = createSignal<string | null>(null);

  function resetAll() {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('This will clear all subnet state (input, names, locks, expansions). Continue?');
      if (!confirmed) return;
    }
    setInput(DEFAULT_CIDR);
    setMaxMask(24);
    if (maxMaskRef) maxMaskRef.value = '24';
    setExpanded(new Set<string>());
    setLocked(new Set<string>());
    setSplitSet(new Set<string>());
    setNames(new Map<string,string>());
    setShareApplied(null);
    if (typeof window !== 'undefined') {
      try {
        const keys = [K_INPUT, K_MAXMASK, K_EXPANDED, K_LOCKED, K_SPLIT, K_NAMES];
        for (const k of keys) localStorage.removeItem(k);
        const url = new URL(window.location.href);
        url.searchParams.delete('subnets');
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  }

  onMount(() => {
    if (typeof window === 'undefined') return;
    try {
      // Load baseline from localStorage
      const storedInput = localStorage.getItem(K_INPUT); if (storedInput) setInput(storedInput);
      const storedMask = localStorage.getItem(K_MAXMASK); if (storedMask) setMaxMask(parseInt(storedMask,10));
      const storedExpanded = localStorage.getItem(K_EXPANDED); if (storedExpanded) setExpanded(new Set(JSON.parse(storedExpanded) as string[]));
  const storedLocked = localStorage.getItem(K_LOCKED); if (storedLocked) setLocked(new Set(JSON.parse(storedLocked) as string[]));
  const storedSplit = localStorage.getItem(K_SPLIT); if (storedSplit) setSplitSet(new Set(JSON.parse(storedSplit) as string[]));
      const storedNames = localStorage.getItem(K_NAMES); if (storedNames) {
        const obj = JSON.parse(storedNames) as Record<string,string>;
        setNames(new Map(Object.entries(obj)));
      }

      // Initial query param application will happen in reactive effect below
    } catch (e) {
      // Ignore malformed persisted data
      console.warn('Failed to load persisted subnet state', e);
    }
  });

  // Reactively watch the location.search for a ?subnets= param and apply once per value
  createEffect(() => {
    if (typeof window === 'undefined') return;
    const search = location.search; // triggers effect when router updates
    const url = new URL(window.location.origin + location.pathname + search + location.hash);
    const qp = url.searchParams.get('subnets');
    if (!qp) return;
    // Avoid re-applying if we've already applied this exact payload
  if (shareApplied() === qp) return; // already applied this payload
    let jsonText = '';
    try {
      const b64 = qp.replace(/-/g,'+').replace(/_/g,'/');
      jsonText = decodeURIComponent(escape(atob(b64)));
    } catch {
      try { jsonText = decodeURIComponent(qp); } catch { jsonText = qp; }
    }
    try {
      const data = JSON.parse(jsonText);
      if (data && typeof data === 'object') {
        if (data.input) setInput(data.input);
        if (typeof data.maxMask === 'number') setMaxMask(data.maxMask);
        if (Array.isArray(data.expanded)) setExpanded(new Set(data.expanded as string[]));
        if (Array.isArray(data.locked)) setLocked(new Set(data.locked as string[]));
        if (data.names && typeof data.names === 'object') setNames(new Map(Object.entries(data.names as Record<string,string>)));
  setShareApplied(qp);
      }
    } catch (err) {
      console.warn('Invalid subnets share link data (reactive)', err);
    }
  });

  // Persistors
  createEffect(() => { if (typeof window !== 'undefined') { try { localStorage.setItem(K_INPUT, input()); } catch {} } });
  createEffect(() => { if (typeof window !== 'undefined') { try { localStorage.setItem(K_MAXMASK, String(maxMask())); } catch {} } });
  createEffect(() => { if (typeof window !== 'undefined') { try { localStorage.setItem(K_EXPANDED, JSON.stringify(Array.from(expanded()))); } catch {} } });
  createEffect(() => { if (typeof window !== 'undefined') { try { localStorage.setItem(K_LOCKED, JSON.stringify(Array.from(locked()))); } catch {} } });
  createEffect(() => { if (typeof window !== 'undefined') { try { localStorage.setItem(K_SPLIT, JSON.stringify(Array.from(splitSet()))); } catch {} } });
  createEffect(() => { if (typeof window !== 'undefined') { try { localStorage.setItem(K_NAMES, JSON.stringify(Object.fromEntries(names()))); } catch {} } });

  // Expand (split)
  function expandSubnet(cidr: string) {
    setExpanded(prev => { const next = new Set(prev); next.add(cidr); return next; });
  }
  // Collapse ONLY the subnet (retain descendant expansion state for future re-expand)
  function collapseSubnet(cidr: string) {
    setExpanded(prev => { const next = new Set(prev); next.delete(cidr); return next; });
  }
  // Join: collapse AND forget all descendant expansion states
  function joinSubnet(cidr: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      // Parse parent
      let parent: IPv4Subnet | null = null;
      try { parent = parseCIDR(cidr); } catch { parent = null; }
      // Remove parent expansion
      next.delete(cidr);
      if (parent) {
        for (const ex of Array.from(next)) {
          try {
            const node = parseCIDR(ex);
            if (node.mask > parent.mask && node.network >= parent.network && node.broadcast <= parent.broadcast) {
              next.delete(ex);
            }
          } catch {}
        }
      }
      return next;
    });
    // Remove split flag for this subnet (logical join)
    setSplitSet(prev => { const next = new Set(prev); next.delete(cidr); return next; });
  }
  function splitSubnet(cidr: string, depth?: number) {
    setSplitSet(prev => { const next = new Set(prev); next.add(cidr); return next; });
    expandSubnet(cidr);
  }
  function toggleLock(cidr: string) {
    setLocked(prev => { const next = new Set(prev); if (next.has(cidr)) next.delete(cidr); else next.add(cidr); return next; });
  }
  function setName(cidr: string, name: string) {
    setNames(prev => {
      const next = new Map(prev);
      if (name) next.set(cidr, name); else next.delete(cidr);
      return next;
    });
    if (name.trim()) {
      // Auto-lock when naming
      setLocked(prev => {
        if (prev.has(cidr)) return prev;
        const next = new Set(prev);
        next.add(cidr);
        return next;
      });
    }
  }

  // Loading & deferred computation for large tables
  const [isComputing, setIsComputing] = createSignal(false);
  const [visibleRows, setVisibleRows] = createSignal<ReturnType<typeof computeVisibleRows>>([]);
  const [lastKey, setLastKey] = createSignal('');
  // Track whether we've successfully computed at least once for the current root/maxMask pair
  const [hasComputedOnce, setHasComputedOnce] = createSignal(false);
  const [rootMaskKey, setRootMaskKey] = createSignal('');
  // Heuristic threshold: if potential row count (2^(maxMask-rootMask)) exceeds 4096, we defer computation allowing spinner to paint.
  createEffect(() => {
    const root = rootSubnet();
    if (!root) { setVisibleRows([]); return; }
    const key = [root.cidr, maxMask(), Array.from(expanded()).length, Array.from(locked()).length, Array.from(names()).length].join('|');
    if (key === lastKey()) return; // prevent redundant recompute in same tick
    setLastKey(key);
    const potential = estimatePotentialRowCount(root.mask, maxMask());
    const defer = shouldDeferSubnetCompute(root.mask, maxMask());
    // Reset initial compute tracking if root/maxMask pair changed
    const rmKey = root.cidr + '|' + maxMask();
    if (rmKey !== rootMaskKey()) {
      setRootMaskKey(rmKey);
      setHasComputedOnce(false);
    }
    if (defer) {
      setIsComputing(true);
      // Use requestIdleCallback if available, else fallback to setTimeout
      const run = () => {
        const state: ViewState = { expanded: expanded(), locked: locked(), names: names(), maxDepth: maxMask() } as any;
        const rows = computeVisibleRows({ root, state, targetMask: maxMask() });
        setVisibleRows(rows);
        setIsComputing(false);
        setHasComputedOnce(true);
      };
      if (typeof window !== 'undefined' && typeof (window as any).requestIdleCallback === 'function') {
        (window as any).requestIdleCallback(run, { timeout: 500 });
      } else {
        setTimeout(run, 0);
      }
    } else {
      const state: ViewState = { expanded: expanded(), locked: locked(), names: names(), maxDepth: maxMask() } as any;
      setVisibleRows(computeVisibleRows({ root, state, targetMask: maxMask() }));
      setIsComputing(false);
      setHasComputedOnce(true);
    }
  });
  // Pre-parse locked subnets for descendant checks
  const lockedParsed = createMemo(() => Array.from(locked()).map(c => { try { return parseCIDR(c); } catch { return null; } }).filter(Boolean) as IPv4Subnet[]);

  // Share button component (inline)
  function ShareButton(props: { getState: () => any }) {
    const [copied, setCopied] = createSignal(false);
    async function doShare() {
      try {
        const state = props.getState();
        const json = JSON.stringify(state);
        const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
        const url = new URL(window.location.href);
        url.searchParams.set('subnets', b64);
        const shareUrl = url.toString();
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(()=>setCopied(false), 1800);
        window.history.replaceState(null, '', shareUrl);
      } catch (err) {
        console.warn('Share failed, fallback plain encoding', err);
        try {
          const json = JSON.stringify(props.getState());
          const url = new URL(window.location.href);
          url.searchParams.set('subnets', encodeURIComponent(json));
          const shareUrl = url.toString();
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(()=>setCopied(false), 1800);
        } catch {}
      }
    }
    return <button type="button" onClick={doShare} class={`text-[11px] px-3 h-8 rounded border flex items-center gap-1 ${copied() ? 'bg-emerald-600 text-white border-emerald-600' : 'btn-secondary hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700'}`} title={copied() ? 'Copied share link' : 'Copy shareable link to current state'}>{copied() ? 'Link Copied' : 'Share'}</button>;
  }

  return (
    <main class="mx-auto max-w-6xl p-4 space-y-6">
      <header class="space-y-2">
        <h1 class="text-3xl font-light tracking-tight"><span class="text-sky-500 font-semibold">IPv4</span> Subnet Explorer</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 max-w-prose">Explore hierarchical subnetting. Split, name & lock notable networks for planning.</p>
      </header>
      <form class="flex flex-col md:flex-row gap-4 items-start md:items-end card p-5" onSubmit={e => e.preventDefault()}>
        <label class="flex flex-col text-sm font-medium text-primary gap-1">CIDR
          <input type="text" value={input()} onInput={e => setInput(e.currentTarget.value)} class="font-mono min-w-[12rem]" placeholder="10.0.0.0/8" />
        </label>
        <label class="flex flex-col text-sm font-medium text-primary gap-1">Max mask
          <input ref={el=>maxMaskRef=el} type="number" min={0} max={32} value={maxMask()} onInput={e => setMaxMask(e.currentTarget.valueAsNumber)} class="font-mono w-28" />
        </label>
  <div class="hidden md:block flex-grow" aria-hidden="true" />
        <div class="flex flex-wrap gap-2 pt-5">
          <ShareButton getState={() => ({
            version: 1,
            input: input(),
            maxMask: maxMask(),
            expanded: Array.from(expanded()),
            locked: Array.from(locked()),
            names: Object.fromEntries(names())
          })} />
          <button type="button" class="text-[11px] px-3 h-8 rounded btn-secondary hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700" onClick={() => {
            const payload = {
              version: 1,
              input: input(),
              maxMask: maxMask(),
              expanded: Array.from(expanded()),
              locked: Array.from(locked()),
              names: Object.fromEntries(names())
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'subnets-export.json';
            a.click();
            URL.revokeObjectURL(a.href);
          }}>Export JSON</button>
          <button type="button" class="text-[11px] px-3 h-8 rounded btn-secondary hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700" onClick={() => {
            // CSV: cidr,name,locked,expanded (include union of named, locked, expanded, plus root)
            const rows: string[] = ['cidr,name,locked,expanded'];
            const set = new Set<string>();
            for (const k of names().keys()) set.add(k);
            for (const k of locked()) set.add(k);
            for (const k of expanded()) set.add(k);
            const root = rootSubnet(); if (root) set.add(root.cidr);
            const nameMap = names();
            Array.from(set).sort().forEach(cidr => {
              const name = nameMap.get(cidr) || '';
              const lockedFlag = locked().has(cidr) ? '1' : '0';
              const expandedFlag = expanded().has(cidr) ? '1' : '0';
              const safeName = '"' + name.replace(/"/g,'""') + '"';
              rows.push([cidr, safeName, lockedFlag, expandedFlag].join(','));
            });
            const csv = rows.join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'subnets-export.csv';
            a.click();
            URL.revokeObjectURL(a.href);
          }}>Export CSV</button>
          <label class="text-[11px] px-3 h-8 rounded btn-secondary hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 flex items-center cursor-pointer">Import
            <input type="file" accept=".json,.csv,application/json,text/csv" class="hidden" onChange={e => {
              const file = e.currentTarget.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const text = String(reader.result||'');
                  if (file.name.endsWith('.json') || text.trim().startsWith('{')) {
                    const data = JSON.parse(text);
                    if (data.input) setInput(data.input);
                    if (typeof data.maxMask === 'number') setMaxMask(data.maxMask);
                    if (Array.isArray(data.expanded)) setExpanded(new Set(data.expanded as string[]));
                    if (Array.isArray(data.locked)) setLocked(new Set(data.locked as string[]));
                    if (data.names && typeof data.names === 'object') setNames(new Map(Object.entries(data.names as Record<string,string>)));
                  } else { // CSV
                    const lines = text.split(/\r?\n/).filter(l=>l.trim().length);
                    if (lines.length > 1 && lines[0].toLowerCase().startsWith('cidr')) {
                      const exp = new Set<string>();
                      const lockSet = new Set<string>();
                      const nameMap = new Map<string,string>();
                      for (let i=1;i<lines.length;i++) {
                        const line = lines[i];
                        const parts: string[] = [];
                        let cur=''; let inQ=false; for (let c=0;c<line.length;c++){ const ch=line[c]; if (ch==='"'){ if (inQ && line[c+1]==='"'){ cur+='"'; c++; } else { inQ=!inQ; } } else if(ch===',' && !inQ){ parts.push(cur); cur=''; } else cur+=ch; } parts.push(cur);
                        const [cidr,name,lockedFlag,expandedFlag] = parts;
                        if (cidr) {
                          if (name) nameMap.set(cidr, name);
                          if (lockedFlag==='1') lockSet.add(cidr);
                          if (expandedFlag==='1') exp.add(cidr);
                        }
                      }
                      setNames(nameMap); setLocked(lockSet); setExpanded(exp);
                    }
                  }
                } catch (err) {
                  alert('Failed to import: '+ (err as any).message);
                }
              };
              reader.readAsText(file);
              e.currentTarget.value = '';
            }} />
          </label>
          <button type="button" data-testid="clear-subnets" class="text-[11px] px-3 h-8 rounded btn-secondary hover:bg-rose-50 border-rose-500/40 text-rose-600 dark:text-rose-400 dark:hover:bg-rose-900/30" onClick={resetAll} title="Clear all subnet state">Clear</button>
        </div>
      </form>
      <Show when={parsed().ok} fallback={<p class="text-rose-500 font-mono">Error: {errorMsg()}</p>}>
        <div class="overflow-x-auto rounded-md table-container">
          <table class="w-full text-sm">
            <thead class="table-gradient-header table-header-text text-[11px] uppercase tracking-wide">
              <tr>
                <th class="text-left pl-2 py-2 font-medium w-[1%]">Actions</th>
                <th class="text-left py-2 font-medium">CIDR / Name / Lock</th>
                <th class="text-left py-2 font-medium">Range (Network – Broadcast)</th>
                <th class="text-right py-2 pr-3 font-medium">Usable Hosts</th>
              </tr>
            </thead>
            <tbody class="table-body-bg relative">
              {/* Initial heavy compute spinner (only before first rows available) */}
              <Show when={isComputing() && !hasComputedOnce()}>
                <tr>
                  <td colSpan={4} class="py-10">
                    <div class="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
                      <div class="w-8 h-8 border-3 border-sky-500/40 border-t-sky-600 rounded-full animate-spin" />
                      <span class="text-xs font-medium tracking-wide">Computing subnet view…</span>
                    </div>
                  </td>
                </tr>
              </Show>
              {/* Lightweight overlay during subsequent recomputes (preserve rows & scroll) */}
              <Show when={isComputing() && hasComputedOnce()}>
                <tr class="pointer-events-none">
                  <td colSpan={4} class="p-0">
                    <div class="absolute top-1 right-2 flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px]" role="status" aria-live="polite">
                      <div class="w-4 h-4 border-2 border-sky-500/40 border-t-sky-600 rounded-full animate-spin" />
                      <span>Updating…</span>
                    </div>
                  </td>
                </tr>
              </Show>
              <For each={visibleRows()}>{row => {
                const f = formatSubnet(row.subnet);
                const range = `${f.network} – ${f.broadcast}`;
                const cidr = row.subnet.cidr;
                const currentNames = names();
                const name = currentNames.get(cidr);
                const isExpanded = expanded().has(cidr);
                const canSplit = row.subnet.mask < maxMask();
                const isLocked = locked().has(cidr);
                const [editing, setEditing] = createSignal(false);
                let inputRef: HTMLInputElement | undefined;
                function saveName() { if (inputRef) { setName(cidr, inputRef.value.trim()); setEditing(false); } }
                return (
                  <tr class="table-row-border" data-depth={row.depth}>
                    <td class="align-middle pr-2">
                      <div class="relative depth-wrapper" data-depth={row.depth}>
                        <div class="depth-lines" aria-hidden="true">
                          <For each={[...Array(row.depth).keys()]}>{i => {
                            const cls = `dl-${i}`;
                            const lockedSeg = row.lockedAncestors?.[i] ? 'depth-line-locked' : '';
                            return <span class={`depth-line ${cls} ${lockedSeg}`} data-i={i} />; }}
                          </For>
                        </div>
                        <div class={`relative z-10 ${`depth-pad-${row.depth <= 32 ? row.depth : 32}`}`}>
                          {(() => {
                            // Determine if any locked descendant exists (exclude self)
                            const hasLockedDesc = lockedParsed().some(ls => ls.cidr !== cidr && ls.mask > row.subnet.mask && ls.network >= row.subnet.network && ls.broadcast <= row.subnet.broadcast);
                            const isSplit = splitSet().has(cidr); // root no longer implicitly split
                            return <RowActions rowSubnet={row.subnet} depth={row.depth} canSplit={canSplit} canJoin={!hasLockedDesc} expanded={isExpanded} isSplit={isSplit} onSplit={() => splitSubnet(cidr, row.depth)} onExpand={() => expandSubnet(cidr)} onCollapse={() => collapseSubnet(cidr)} onJoin={() => joinSubnet(cidr)} />;
                          })()}
                        </div>
                      </div>
                    </td>
                    <td class={`py-2 font-mono`}>
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-sky-500 dark:text-sky-400 select-none">{cidr}</span>
                        <Show when={!editing()} fallback={
                          <form onSubmit={(e)=>{e.preventDefault(); saveName();}} class="flex items-center gap-1">
                            <input ref={el=>inputRef=el} value={name||''} autofocus placeholder="Name" class="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-400 dark:border-slate-600 text-xs" />
                            <button type="submit" class="text-[10px] px-2 h-6 rounded bg-sky-600 text-white">Save</button>
                            <button type="button" onClick={()=>{setEditing(false);}} class="text-[10px] px-2 h-6 rounded bg-slate-400 dark:bg-slate-600 text-white">X</button>
                          </form>
                        }>
                          <span class="text-xs text-amber-500 font-medium">{name}</span>
                          <button class="text-[10px] px-2 h-6 rounded btn-secondary hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700" onClick={()=> setEditing(true)} aria-label="Edit name" title={name ? 'Rename subnet' : 'Add name to subnet'}>{name? 'Rename':'Name'}</button>
                        </Show>
                        <button
                          onClick={() => toggleLock(cidr)}
                          class={`group w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${isLocked ? 'border-amber-500 bg-amber-500/20 hover:bg-amber-500/30' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                          aria-label={isLocked ? 'Unlock subnet' : 'Lock subnet'}
                          title={isLocked ? 'Unlock subnet' : 'Lock subnet'}
                          data-pressed={isLocked ? 'true' : 'false'}
                          data-lock-btn
                        >
                          <Show when={isLocked} fallback={
                            <svg aria-hidden viewBox="0 0 24 24" class="w-4 h-4 stroke-[1.8] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                              <rect x="3" y="11" width="18" height="9" rx="2" />
                              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                              <path d="M12 15v-1" />
                            </svg>
                          }>
                            <svg aria-hidden viewBox="0 0 24 24" class="w-4 h-4 stroke-[1.8] text-amber-500" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                              <rect x="3" y="11" width="18" height="9" rx="2" />
                              <path d="M8 11V9a4 4 0 0 1 8 0v2" />
                              <path d="M12 15v-2" />
                            </svg>
                          </Show>
                        </button>
                      </div>
                    </td>
                    <td class="font-mono text-xs text-slate-600 dark:text-slate-400">{range}</td>
                    <td class="font-mono text-xs text-slate-600 dark:text-slate-400 text-right pr-3">{f.hosts}</td>
                  </tr>
                );
              }}</For>
            </tbody>
          </table>
        </div>
      </Show>
    </main>
  );
}
