export type LocationId =
  | 'classroom' | 'library' | 'computer' | 'science' | 'music' | 'gym'
  | 'g3-1' | 'g3-2' | 'g3-3' | 'g3-office' | 'g3-4' | 'g3-5' | 'weclass' | 'career'
  | 'g2-1' | 'g2-2' | 'g2-3' | 'g2-office' | 'g2-4' | 'g2-5'
  | 'art' | 'g1-2' | 'g1-3' | 'g1-office' | 'g1-4' | 'g1-5' | 'science-1'
  | 'archive' | 'main-office' | 'admin' | 'principal' | 'transition'
  | 'central' | 'east-1' | 'east-2' | 'east-3' | 'east-4'
  | 'warehouse' | 'field' | 'cafeteria';

export type SchoolLocation = {
  id: LocationId;
  name: string;
  floor: 0 | 1 | 2 | 3 | 4;
  x: number;
  y: number;
  markerId: string;
  zone: 'main' | 'annex' | 'outdoor';
};

// x/y는 학교 안내 지도의 상대 좌표입니다. floor 0은 별관 또는 야외를 뜻합니다.
export const schoolLocations: SchoolLocation[] = [
  { id: 'music', name: '음악실', floor: 4, x: 15, y: 25, markerId: 'marker-05', zone: 'main' },
  { id: 'g3-1', name: '3학년 1반', floor: 4, x: 25, y: 25, markerId: 'marker-g3-1', zone: 'main' },
  { id: 'g3-2', name: '3학년 2반', floor: 4, x: 32, y: 25, markerId: 'marker-g3-2', zone: 'main' },
  { id: 'g3-3', name: '3학년 3반', floor: 4, x: 39, y: 25, markerId: 'marker-g3-3', zone: 'main' },
  { id: 'g3-office', name: '3학년 교무실', floor: 4, x: 49, y: 25, markerId: 'marker-g3-office', zone: 'main' },
  { id: 'g3-4', name: '3학년 4반', floor: 4, x: 58, y: 25, markerId: 'marker-g3-4', zone: 'main' },
  { id: 'g3-5', name: '3학년 5반', floor: 4, x: 65, y: 25, markerId: 'marker-g3-5', zone: 'main' },
  { id: 'weclass', name: '위클래스', floor: 4, x: 72, y: 25, markerId: 'marker-weclass', zone: 'main' },
  { id: 'career', name: '진로활동실', floor: 4, x: 79, y: 25, markerId: 'marker-career', zone: 'main' },
  { id: 'computer', name: '컴퓨터실', floor: 3, x: 15, y: 37, markerId: 'marker-03', zone: 'main' },
  { id: 'g2-1', name: '2학년 1반', floor: 3, x: 25, y: 37, markerId: 'marker-g2-1', zone: 'main' },
  { id: 'g2-2', name: '2학년 2반', floor: 3, x: 32, y: 37, markerId: 'marker-g2-2', zone: 'main' },
  { id: 'g2-3', name: '2학년 3반', floor: 3, x: 39, y: 37, markerId: 'marker-g2-3', zone: 'main' },
  { id: 'g2-office', name: '2학년 교무실', floor: 3, x: 49, y: 37, markerId: 'marker-g2-office', zone: 'main' },
  { id: 'g2-4', name: '2학년 4반', floor: 3, x: 58, y: 37, markerId: 'marker-g2-4', zone: 'main' },
  { id: 'g2-5', name: '2학년 5반', floor: 3, x: 65, y: 37, markerId: 'marker-g2-5', zone: 'main' },
  { id: 'science', name: '과학실2', floor: 3, x: 75, y: 37, markerId: 'marker-04', zone: 'main' },
  { id: 'art', name: '미술실', floor: 2, x: 15, y: 47, markerId: 'marker-art', zone: 'main' },
  { id: 'classroom', name: '1학년 1반', floor: 2, x: 25, y: 47, markerId: 'marker-01', zone: 'main' },
  { id: 'g1-2', name: '1학년 2반', floor: 2, x: 32, y: 47, markerId: 'marker-g1-2', zone: 'main' },
  { id: 'g1-3', name: '1학년 3반', floor: 2, x: 39, y: 47, markerId: 'marker-g1-3', zone: 'main' },
  { id: 'g1-office', name: '1학년 교무실', floor: 2, x: 49, y: 47, markerId: 'marker-g1-office', zone: 'main' },
  { id: 'g1-4', name: '1학년 4반', floor: 2, x: 58, y: 47, markerId: 'marker-g1-4', zone: 'main' },
  { id: 'g1-5', name: '1학년 5반', floor: 2, x: 65, y: 47, markerId: 'marker-g1-5', zone: 'main' },
  { id: 'science-1', name: '과학실1', floor: 2, x: 75, y: 47, markerId: 'marker-science-1', zone: 'main' },
  { id: 'archive', name: '보건실', floor: 1, x: 15, y: 58, markerId: 'marker-archive', zone: 'main' },
  { id: 'main-office', name: '본교무실', floor: 1, x: 29, y: 58, markerId: 'marker-main-office', zone: 'main' },
  { id: 'admin', name: '행정실', floor: 1, x: 43, y: 58, markerId: 'marker-admin', zone: 'main' },
  { id: 'principal', name: '교장실', floor: 1, x: 62, y: 58, markerId: 'marker-principal', zone: 'main' },
  { id: 'transition', name: '전환반', floor: 1, x: 74, y: 58, markerId: 'marker-transition', zone: 'main' },
  { id: 'central', name: '중앙현관', floor: 1, x: 49, y: 66, markerId: '', zone: 'main' },
  { id: 'east-1', name: '동쪽 계단 1층', floor: 1, x: 84, y: 58, markerId: '', zone: 'main' },
  { id: 'east-2', name: '동쪽 계단 2층', floor: 2, x: 84, y: 47, markerId: '', zone: 'main' },
  { id: 'east-3', name: '동쪽 계단 3층', floor: 3, x: 84, y: 37, markerId: '', zone: 'main' },
  { id: 'east-4', name: '동쪽 계단 4층', floor: 4, x: 84, y: 25, markerId: '', zone: 'main' },
  { id: 'gym', name: '체육관', floor: 0, x: 20, y: 12, markerId: 'marker-06', zone: 'annex' },
  { id: 'warehouse', name: '창고', floor: 0, x: 56, y: 17, markerId: 'marker-warehouse', zone: 'annex' },
  { id: 'field', name: '운동장', floor: 0, x: 41, y: 79, markerId: 'marker-field', zone: 'outdoor' },
  { id: 'library', name: '도서관', floor: 0, x: 71, y: 77, markerId: 'marker-02', zone: 'annex' },
  { id: 'cafeteria', name: '식당', floor: 0, x: 71, y: 87, markerId: 'marker-cafeteria', zone: 'annex' },
];

export type SchoolEdge = { from: LocationId; to: LocationId; distance: number };
const corridor = (ids: LocationId[], distances: number[]): SchoolEdge[] =>
  ids.slice(0, -1).map((from, index) => ({ from, to: ids[index + 1], distance: distances[index] }));

// 같은 층은 복도 순서로, 층 사이는 중앙 계단 부근의 교무실을 통해 연결합니다.
export const schoolEdges: SchoolEdge[] = [
  ...corridor(['music', 'g3-1', 'g3-2', 'g3-3', 'g3-office', 'g3-4', 'g3-5', 'weclass', 'career'], [12, 8, 8, 12, 8, 8, 12, 3]),
  ...corridor(['computer', 'g2-1', 'g2-2', 'g2-3', 'g2-office', 'g2-4', 'g2-5', 'science'], [12, 8, 8, 12, 8, 8, 12]),
  ...corridor(['art', 'classroom', 'g1-2', 'g1-3', 'g1-office', 'g1-4', 'g1-5', 'science-1'], [12, 8, 8, 12, 8, 8, 12]),
  ...corridor(['archive', 'main-office', 'admin', 'central', 'principal', 'transition'], [15, 12, 15, 14, 14]),
  { from: 'music', to: 'computer', distance: 10 },
  { from: 'computer', to: 'art', distance: 10 },
  { from: 'art', to: 'archive', distance: 10 },
  { from: 'g3-office', to: 'g2-office', distance: 10 },
  { from: 'g2-office', to: 'g1-office', distance: 10 },
  { from: 'g1-office', to: 'central', distance: 10 },
  { from: 'career', to: 'east-4', distance: 10 },
  { from: 'east-4', to: 'east-3', distance: 10 },
  { from: 'science', to: 'east-3', distance: 5 },
  { from: 'east-3', to: 'east-2', distance: 10 },
  { from: 'science-1', to: 'east-2', distance: 5 },
  { from: 'east-2', to: 'east-1', distance: 10 },
  { from: 'transition', to: 'east-1', distance: 5 },
  { from: 'central', to: 'field', distance: 25 },
  { from: 'field', to: 'library', distance: 30 },
  { from: 'central', to: 'library', distance: 20 },
  { from: 'library', to: 'cafeteria', distance: 20 },
  { from: 'central', to: 'gym', distance: 40 },
  { from: 'central', to: 'warehouse', distance: 35 },
];

export const findSchoolLocation = (id: LocationId) => {
  const location = schoolLocations.find((item) => item.id === id);
  if (!location) throw new Error(`Unknown school location: ${id}`);
  return location;
};
