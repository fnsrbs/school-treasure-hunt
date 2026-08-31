import { schoolLocations, type LocationId } from '@/lib/data/school-map';

export const assignThreeTreasures = (): LocationId[] => [...schoolLocations].sort(() => Math.random() - 0.5).slice(0, 3).map((location) => location.id);
