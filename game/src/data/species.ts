// 契靈基本資料。目前只放 M1 會用到的：御三家和 1 號道路出沒的契靈，其餘之後從設計頁 design/data.js 搬過來
export interface Species {
  id: number;
  name: string;
  types: string[];
}

const S = (id: number, name: string, types: string): Species => ({ id, name, types: [...types] });

export const SPECIES: Record<number, Species> = Object.fromEntries([
  S(1, '芽芽鹿', '草'), S(4, '炭炭鼴', '火'), S(7, '泡泡鯨', '水'),
  S(10, '啾啾雀', '普風'), S(13, '囤囤鼠', '普'), S(15, '葉捲蟲', '蟲'), S(18, '麥芒犬', '普'),
  S(98, '瓢瓢蟲', '蟲'), S(101, '毛線貓', '普'), S(103, '土撥丸', '岩'), S(149, '牧場牛', '普'), S(151, '啄啄雞', '普'),
].map(s => [s.id, s]));
