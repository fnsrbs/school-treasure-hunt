import { compareShortestPaths } from '@/lib/algorithms/pathfinding';
import { findSchoolLocation, type LocationId } from '@/lib/data/school-map';
import { findLocation } from '@/lib/treasure-data';

export type RouteGuide = { hints: [string, string, string]; path: LocationId[]; distance: number; dijkstraVisited: number; aStarVisited: number };

const movementHint = (start: LocationId, next: LocationId, goal: LocationId) => {
  const from = findSchoolLocation(start);
  const waypoint = findSchoolLocation(next);
  const target = findSchoolLocation(goal);
  if (from.zone !== target.zone) return target.zone === 'main' ? '본관으로 이동할 수 있는 길을 찾아보세요.' : '본관 밖으로 이어지는 출입구 쪽으로 이동해 보세요.';
  if (from.floor !== waypoint.floor) return waypoint.floor > from.floor ? '가까운 계단을 이용해 위층으로 이동해 보세요.' : '가까운 계단을 이용해 아래층으로 이동해 보세요.';
  return waypoint.x < from.x ? '현재 위치에서 복도의 왼쪽 방향으로 이동해 보세요.' : '현재 위치에서 복도의 오른쪽 방향으로 이동해 보세요.';
};

export function createRouteGuide(start: LocationId, goal: LocationId): RouteGuide {
  const comparison = compareShortestPaths(start, goal);
  const route = comparison.sameShortestDistance && comparison.aStar.path.length ? comparison.aStar : comparison.dijkstra;
  const target = findLocation(goal);
  return {
    hints: [movementHint(start, route.path[1] ?? goal, goal), target.hints[1], target.hints[2]],
    path: route.path,
    distance: route.distance,
    dijkstraVisited: comparison.dijkstra.visitedCount,
    aStarVisited: comparison.aStar.visitedCount,
  };
}
