import { findSchoolLocation, schoolEdges, schoolLocations, type LocationId } from '@/lib/data/school-map';

export type PathResult = { path: LocationId[]; distance: number; visitedCount: number };
type Neighbor = { id: LocationId; distance: number };

const graph = new Map<LocationId, Neighbor[]>(schoolLocations.map(({ id }) => [id, []]));
for (const edge of schoolEdges) {
  graph.get(edge.from)?.push({ id: edge.to, distance: edge.distance });
  graph.get(edge.to)?.push({ id: edge.from, distance: edge.distance });
}

const reconstructPath = (previous: Map<LocationId, LocationId>, start: LocationId, goal: LocationId) => {
  const path: LocationId[] = [goal];
  while (path[0] !== start) {
    const parent = previous.get(path[0]);
    if (!parent) return [];
    path.unshift(parent);
  }
  return path;
};

const lowestScore = (open: Set<LocationId>, scores: Map<LocationId, number>) =>
  [...open].reduce((best, id) => (scores.get(id) ?? Infinity) < (scores.get(best) ?? Infinity) ? id : best);

export function dijkstra(start: LocationId, goal: LocationId): PathResult {
  const open = new Set<LocationId>(schoolLocations.map(({ id }) => id));
  const distances = new Map<LocationId, number>(schoolLocations.map(({ id }) => [id, Infinity]));
  const previous = new Map<LocationId, LocationId>();
  let visitedCount = 0;
  distances.set(start, 0);
  while (open.size) {
    const current = lowestScore(open, distances);
    if ((distances.get(current) ?? Infinity) === Infinity) break;
    open.delete(current);
    visitedCount += 1;
    if (current === goal) break;
    for (const neighbor of graph.get(current) ?? []) {
      if (!open.has(neighbor.id)) continue;
      const candidate = (distances.get(current) ?? Infinity) + neighbor.distance;
      if (candidate < (distances.get(neighbor.id) ?? Infinity)) {
        distances.set(neighbor.id, candidate);
        previous.set(neighbor.id, current);
      }
    }
  }
  return { path: reconstructPath(previous, start, goal), distance: distances.get(goal) ?? Infinity, visitedCount };
}

// 간선 비용보다 작도록 축소한 맨해튼 거리: A*의 허용 가능한 휴리스틱입니다.
const heuristic = (from: LocationId, goal: LocationId) => {
  const a = findSchoolLocation(from);
  const b = findSchoolLocation(goal);
  const mapDistance = (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) * 0.2;
  const floorDistance = a.zone === 'main' && b.zone === 'main' ? Math.abs(a.floor - b.floor) * 6 : 0;
  return mapDistance + floorDistance;
};

export function aStar(start: LocationId, goal: LocationId): PathResult {
  const open = new Set<LocationId>([start]);
  const previous = new Map<LocationId, LocationId>();
  const gScore = new Map<LocationId, number>(schoolLocations.map(({ id }) => [id, Infinity]));
  const fScore = new Map<LocationId, number>(schoolLocations.map(({ id }) => [id, Infinity]));
  let visitedCount = 0;
  gScore.set(start, 0);
  fScore.set(start, heuristic(start, goal));
  while (open.size) {
    const current = lowestScore(open, fScore);
    visitedCount += 1;
    if (current === goal) return { path: reconstructPath(previous, start, goal), distance: gScore.get(goal) ?? Infinity, visitedCount };
    open.delete(current);
    for (const neighbor of graph.get(current) ?? []) {
      const candidate = (gScore.get(current) ?? Infinity) + neighbor.distance;
      if (candidate < (gScore.get(neighbor.id) ?? Infinity)) {
        previous.set(neighbor.id, current);
        gScore.set(neighbor.id, candidate);
        fScore.set(neighbor.id, candidate + heuristic(neighbor.id, goal));
        open.add(neighbor.id);
      }
    }
  }
  return { path: [], distance: Infinity, visitedCount };
}

export function compareShortestPaths(start: LocationId, goal: LocationId) {
  const dijkstraResult = dijkstra(start, goal);
  const aStarResult = aStar(start, goal);
  return { dijkstra: dijkstraResult, aStar: aStarResult, sameShortestDistance: dijkstraResult.distance === aStarResult.distance };
}
