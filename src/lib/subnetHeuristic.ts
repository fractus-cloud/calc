// Heuristic for deciding whether to defer subnet view computation and show spinner.
export function shouldDeferSubnetCompute(rootMask: number, maxMask: number, threshold = 4096): boolean {
  const potential = Math.pow(2, Math.max(0, Math.min(20, maxMask - rootMask)));
  return potential > threshold;
}

export function estimatePotentialRowCount(rootMask: number, maxMask: number): number {
  return Math.pow(2, Math.max(0, Math.min(20, maxMask - rootMask)));
}