// Pure IPv4 subnet calculation utilities
// Focus: parsing CIDR, subdividing networks, calculating hosts, boundaries.
// No external dependencies.

export interface IPv4Subnet {
  cidr: string; // e.g. 10.0.0.0/8
  network: number; // numeric 32-bit
  mask: number; // prefix length 0-32
  netmask: string; // dotted mask
  broadcast: number;
  firstHost: number | null;
  lastHost: number | null;
  hosts: number; // usable hosts (0 for /31,/32)
}

export interface SubdivisionOptions {
  targetMask?: number; // subdivide until this prefix length
  parts?: number; // number of equal subnets (must be power of two)
}

export interface SubnetTreeNode extends IPv4Subnet {
  children?: SubnetTreeNode[];
}

// Parse dotted quad into number
function ipToNumber(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4) throw new Error('Invalid IPv4 address');
  return parts.reduce((acc, p) => {
    if (!/^\d+$/.test(p)) throw new Error('Invalid IPv4 segment');
    const n = Number(p);
    if (n < 0 || n > 255) throw new Error('Invalid IPv4 segment range');
    return (acc << 8) | n;
  }, 0);
}

function numberToIp(num: number): string {
  return [24, 16, 8, 0].map(shift => (num >>> shift) & 0xff).join('.');
}

export function parseCIDR(input: string): IPv4Subnet {
  const [ip, maskStr] = input.trim().split('/');
  if (!ip || maskStr === undefined) throw new Error('CIDR must include /mask');
  const mask = Number(maskStr);
  if (!Number.isInteger(mask) || mask < 0 || mask > 32) throw new Error('Invalid mask');
  const ipNum = ipToNumber(ip);
  const maskBits = mask === 0 ? 0 : 0xffffffff << (32 - mask) >>> 0;
  const network = ipNum & maskBits;
  const broadcast = network | (~maskBits >>> 0);
  const totalHosts = mask === 32 ? 1 : 2 ** (32 - mask);
  const usable = mask >= 31 ? 0 : totalHosts - 2;
  const firstHost = mask >= 31 ? null : network + 1;
  const lastHost = mask >= 31 ? null : broadcast - 1;
  return {
    cidr: `${numberToIp(network)}/${mask}`,
    network,
    mask,
    netmask: numberToIp(maskBits >>> 0),
    broadcast,
    firstHost,
    lastHost,
    hosts: usable,
  };
}

export function subdivide(subnet: IPv4Subnet, options: SubdivisionOptions): IPv4Subnet[] {
  const { targetMask, parts } = options;
  if (targetMask === undefined && parts === undefined) throw new Error('Provide targetMask or parts');
  let desiredMask = targetMask;
  if (parts !== undefined) {
    if (parts < 1 || (parts & (parts - 1)) !== 0) throw new Error('parts must be power of two');
    const additionalBits = Math.log2(parts);
    desiredMask = subnet.mask + additionalBits;
  }
  if (desiredMask! <= subnet.mask) throw new Error('target mask must be larger (more specific)');
  if (desiredMask! > 32) throw new Error('target mask cannot exceed /32');
  const newSize = 2 ** (32 - desiredMask!);
  const result: IPv4Subnet[] = [];
  for (let net = subnet.network; net < subnet.broadcast; net += newSize) {
    result.push(parseCIDR(`${numberToIp(net)}/${desiredMask}`));
  }
  return result;
}

export function buildSubdivisionTree(rootCidr: string, maxDepthMask: number): SubnetTreeNode {
  const root = parseCIDR(rootCidr) as SubnetTreeNode;
  function recurse(node: SubnetTreeNode) {
    if (node.mask >= maxDepthMask) return;
    const children = subdivide(node, { targetMask: node.mask + 1 }).map(s => ({ ...s }));
    node.children = children as SubnetTreeNode[];
    for (const c of children) recurse(c as SubnetTreeNode);
  }
  recurse(root);
  return root;
}

export function formatSubnet(subnet: IPv4Subnet) {
  return {
    cidr: subnet.cidr,
    network: numberToIp(subnet.network),
    broadcast: numberToIp(subnet.broadcast),
    firstHost: subnet.firstHost !== null ? numberToIp(subnet.firstHost) : null,
    lastHost: subnet.lastHost !== null ? numberToIp(subnet.lastHost) : null,
    hosts: subnet.hosts,
    netmask: subnet.netmask,
  };
}

export function safeParseCIDR(input: string): { ok: true; value: IPv4Subnet } | { ok: false; error: string } {
  try {
    return { ok: true, value: parseCIDR(input) };
  } catch (e: any) {
    return { ok: false, error: e.message || String(e) };
  }
}
