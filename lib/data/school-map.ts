export type LocationId =
  | 'classroom'
  | 'library'
  | 'computer'
  | 'science'
  | 'music'
  | 'gym'
  | 'g3-1'
  | 'g3-2'
  | 'g3-3'
  | 'g3-office'
  | 'g3-4'
  | 'g3-5'
  | 'weclass'
  | 'career'
  | 'g2-1'
  | 'g2-2'
  | 'g2-3'
  | 'g2-office'
  | 'g2-4'
  | 'g2-5'
  | 'art'
  | 'g1-1'
  | 'g1-2'
  | 'g1-3'
  | 'g1-office'
  | 'g1-4'
  | 'g1-5'
  | 'science-1'
  | 'archive'
  | 'main-office'
  | 'admin'
  | 'principal'
  | 'transition'
  | 'warehouse'
  | 'field'
  | 'cafeteria';

export type SchoolLocation = { id: LocationId; name: string; floor: 1 | 2 | 3; x: number; y: number; markerId: string };

// 실제 축제 장소와 이동 거리는 다음 단계에서 이 데이터만 수정해서 반영합니다.
export const schoolLocations: SchoolLocation[] = [
  { id: 'classroom', name: '1-1 교실', floor: 1, x: 20, y: 78, markerId: 'marker-01' },
  { id: 'library', name: '도서관', floor: 2, x: 76, y: 20, markerId: 'marker-02' },
  { id: 'computer', name: '컴퓨터실', floor: 2, x: 46, y: 20, markerId: 'marker-03' },
  { id: 'science', name: '과학실', floor: 3, x: 22, y: 20, markerId: 'marker-04' },
  { id: 'music', name: '음악실', floor: 1, x: 78, y: 48, markerId: 'marker-05' },
  { id: 'gym', name: '체육관', floor: 1, x: 78, y: 78, markerId: 'marker-06' },
];

export const schoolEdges: Array<{ from: LocationId; to: LocationId; distance: number }> = [
  { from: 'classroom', to: 'music', distance: 8 }, { from: 'classroom', to: 'gym', distance: 18 },
  { from: 'music', to: 'computer', distance: 16 }, { from: 'computer', to: 'science', distance: 10 },
  { from: 'computer', to: 'library', distance: 12 }, { from: 'library', to: 'science', distance: 14 },
];
