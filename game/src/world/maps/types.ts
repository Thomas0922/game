import type { Dir } from '../Player';

/** 走出地圖邊緣時要去哪：另一張地圖的某一格，或只顯示一句提示 */
export type ExitResult = { map: string; x: number; y: number; facing: Dir } | { message: string } | null;

export interface MapDef {
  id: string;
  /** 進場時左上角顯示的地名 */
  name: string;
  w: number;
  h: number;
  grid: number[][];
  /** (x, y) 是踏出去的那一格（已經在地圖外） */
  onExit: (x: number, y: number) => ExitResult;
  /** 草叢遇敵：[契靈編號, 權重] 和等級範圍 */
  encounters?: { table: [number, number][]; levels: [number, number] };
}
