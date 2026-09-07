import { locations, locationById } from '@/data/locations';
import { edges, schoolGraph } from '@/data/schoolGraph';
import type { Route } from '@/types/game';

type Point = { x: number; y: number };
// Use room centers in the original map; the original location data stays intact.
const positions: Record<string, Point> = Object.fromEntries(locations.map(location => {
  const p = location.mapPosition;
  return [location.id, { x: p.x + p.width / 2, y: p.y + p.height / 2 }];
}));
// Virtual right-stair vertices share the corridor x and their floor's room y.
['전환반', '과학실1', '과학실2', '진로활동실'].forEach((room, i) => {
  const p = locationById[room].mapPosition;
  positions[`stairs-right-${i + 1}`] = { x: 1380, y: p.y + p.height / 2 };
});
function straightDistance(a: string, b: string): number {
  const p = positions[a], q = positions[b];
  return p && q ? Math.hypot(p.x - q.x, p.y - q.y) : 0;
}
// Pixel distances are not walking distances. Choose one conservative conversion
// factor so scale * Euclidean(u,v) <= weight(u,v) on every edge. Triangle
// inequality then makes h admissible and consistent, including floor changes.
export const heuristicScale = Math.min(...edges.map(([a, b, weight]) => {
  const length = straightDistance(a, b);
  return length > 0 ? weight / length : Infinity;
}));
export function estimateDistance(currentId: string, destinationId: string): number {
  return straightDistance(currentId, destinationId) * heuristicScale;
}

export function findShortestPath(startId: string, destinationId: string): Route {
  if (!Object.hasOwn(schoolGraph, startId) || !Object.hasOwn(schoolGraph, destinationId)) {
    return { path: [], distance: Infinity };
  }
  const g: Record<string, number> = Object.fromEntries(Object.keys(schoolGraph).map(id => [id, Infinity]));
  const f: Record<string, number> = {};
  const previous: Record<string, string> = {};
  const open = new Set([startId]);
  g[startId] = 0;
  f[startId] = g[startId] + estimateDistance(startId, destinationId);

  while (open.size > 0) {
    let current = open.values().next().value!;
    for (const id of open) {
      if (f[id] < f[current]) current = id;
    }
    if (current === destinationId) {
      const path = [current];
      while (path[0] !== startId) path.unshift(previous[path[0]]);
      return { path, distance: g[current] };
    }
    open.delete(current);
    for (const { to, weight } of schoolGraph[current]) {
      const candidateG = g[current] + weight;
      if (candidateG < g[to]) {
        previous[to] = current;
        g[to] = candidateG;
        f[to] = g[to] + estimateDistance(to, destinationId);
        // Reopen a node if a shorter route is found.
        open.add(to);
      }
    }
  }
  return { path: [], distance: Infinity };
}
