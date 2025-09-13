import { IPv4Subnet, subdivide } from './subnet';

export interface VisibleRow {
  subnet: IPv4Subnet;
  depth: number;
  locked: boolean;
  name?: string;
  // Boolean per ancestor depth index (0..depth-1) indicating that ancestor subnet at that depth is locked.
  lockedAncestors: boolean[];
}

export interface ViewState {
  expanded: Set<string>; // cidr expanded
  locked: Set<string>;   // cidr locked (must stay visible)
  names: Map<string,string>; // cidr -> name
  maxDepth: number;
}

export interface ComputeOptions {
  root: IPv4Subnet;
  state: ViewState;
  targetMask: number; // user max mask (same as state.maxDepth)
}

// Build visible rows breadth-first but honor expansion; ensure locked descendants appear even if ancestor chain collapsed.
export function computeVisibleRows(opts: ComputeOptions): VisibleRow[] {
  const { root, state } = opts;
  const rows: VisibleRow[] = [];
  const byCidr = new Map<string, IPv4Subnet>();
  byCidr.set(root.cidr, root);

  // Helper to lazily subdivide
  function getChildren(s: IPv4Subnet): IPv4Subnet[] {
    if (s.mask >= state.maxDepth) return [];
    return subdivide(s, { targetMask: s.mask + 1 });
  }

  // We'll traverse a dynamic frontier. For locked nodes we need to guarantee path visibility; if a locked node's ancestor isn't expanded, we still surface the locked node directly under the closest visible ancestor with computed depth (depth of ancestor +1 for display), indicating it's isolated.

  function walk(current: IPv4Subnet, depth: number, lockedAncestors: boolean[]) {
    rows.push({ subnet: current, depth, locked: state.locked.has(current.cidr), name: state.names.get(current.cidr), lockedAncestors });
    const isExpanded = state.expanded.has(current.cidr);
    if (!isExpanded) return;
    for (const child of getChildren(current)) {
      byCidr.set(child.cidr, child);
      const childLockedAncestors = lockedAncestors.concat(state.locked.has(current.cidr));
      walk(child, depth + 1, childLockedAncestors);
    }
  }

  walk(root, 0, []);

  // Post-process to ensure locked nodes present.
  // Generate potential descendants up to maxDepth for any locked node not present because its ancestors weren't expanded.
  const present = new Set(rows.map(r => r.subnet.cidr));
  for (const cidr of state.locked) {
    if (present.has(cidr)) continue;
    // Recreate path by progressively subdividing from root until we reach the locked node mask.
    // For simplicity: expand downward blindly each level adding both children; select the one whose network matches prefix.
    // This is acceptable for IPv4 small depths; can optimize later.
    let frontier: IPv4Subnet[] = [root];
    let found: IPv4Subnet | undefined;
    while (frontier.length && !found) {
      const next: IPv4Subnet[] = [];
      for (const node of frontier) {
        if (node.cidr === cidr) { found = node; break; }
        if (node.mask < state.maxDepth) {
          for (const c of getChildren(node)) {
            next.push(c);
          }
        }
      }
      frontier = next;
    }
    if (found) {
      // Place under root with depth 1 if root not expanded, else find nearest visible ancestor depth
      let depth = 1;
      // naive: keep depth relative to mask difference: depth = found.mask - root.mask
      depth = found.mask - root.mask;
  // For synthetic locked visibility (ancestor chain collapsed) we approximate ancestor lock info by mask difference
  const lockedAncestors: boolean[] = new Array(depth).fill(false);
  rows.push({ subnet: found, depth, locked: true, name: state.names.get(found.cidr), lockedAncestors });
    }
  }

  // Deduplicate (if we added locked node that was already in) preferring earlier depth (the real depth from traversal)
  const unique = new Map<string, VisibleRow>();
  for (const r of rows) {
    if (!unique.has(r.subnet.cidr)) unique.set(r.subnet.cidr, r);
  }
  return Array.from(unique.values()).sort((a,b)=> a.subnet.network - b.subnet.network || a.subnet.mask - b.subnet.mask);
}
