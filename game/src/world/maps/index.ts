import type { MapDef } from './types';
import { SPROUT } from './sproutVillage';
import { ROUTE1 } from './route1';

export const MAPS: Record<string, MapDef> = {
  [SPROUT.id]: SPROUT,
  [ROUTE1.id]: ROUTE1,
};
