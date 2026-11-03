// 1 號道路實際尺寸示意：96×30 格，一格 = 遊戲裡一個 16×16 地圖格（左邊萌芽村 → 右邊麥穗鎮）
function drawRoute1(cv){
  const W=96,H=30;cv.width=W*8;cv.height=H*8;
  const g=cv.getContext('2d');
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
  const P=(x,y,c)=>R(x,y,1,1,c);
  const pat=(X,Y,rows,map)=>rows.forEach((row,j)=>{for(let i=0;i<8;i++){const c=map[row[i]];if(c)P(X+i,Y+j,c)}});
  const t=Array.from({length:H},()=>Array(W).fill('g'));
  const set=(x,y,v)=>{if(x>=0&&y>=0&&x<W&&y<H)t[y][x]=v};
  const at=(x,y)=>x>=0&&y>=0&&x<W&&y<H?t[y][x]:'T';

  // 上下兩側是樹林邊界，中間散落幾叢樹
  for(let x=0;x<W;x++){const top=2+Math.round(fbm(x,0,21)*3),bot=H-3-Math.round(fbm(x,9,22)*3);for(let y=0;y<H;y++)if(y<top||y>bot)t[y][x]='T'}
  [[8,23,3],[36,3,2],[61,25,2],[90,7,3],[20,19,2],[46,15,1]].forEach(([cx,cy,r])=>{for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++)if(Math.hypot(x-cx,y-cy)<=r+.3)set(x,y,'T')});
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(((x-41)/6)**2+((y-6.5)/3)**2<1)set(x,y,'W');
  // 草叢（會遇到野生契靈）
  [[14,3,13,8],[30,16,17,9],[54,3,12,8],[71,9,15,8]].forEach(([x0,y0,w,h])=>{for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)if(at(x,y)==='g'&&fbm(x*2,y*2,23)>.28)set(x,y,'G')});
  // 主路（兩格寬）與往雙子祭壇的支線
  const road=pts=>{for(let k=1;k<pts.length;k++){let[x,y]=pts[k-1];const[x2,y2]=pts[k];while(true){for(let j=0;j<2;j++)for(let i=0;i<2;i++)set(x+i,y+j,'p');if(x===x2&&y===y2)break;x+=Math.sign(x2-x);y+=Math.sign(y2-y)}}};
  road([[0,14],[12,14],[12,10],[27,10],[27,21],[50,21],[50,12],[68,12],[68,18],[95,18]]);
  road([[84,18],[84,29]]);
  // 跳下去的單向小崖（捷徑）
  for(let x=53;x<=66;x++)if(at(x,16)!=='p')set(x,16,'L');
  // 物件位置清空成草地
  const TRAINERS=[[22,12,'#d9483b'],[37,19,'#3d6fd1'],[60,10,'#8b62c9'],[78,16,'#e8890c']];
  const ITEMS=[[16,4],[44,25],[57,4],[92,24]];
  const SIGNS=[[3,12],[92,16],[86,22]];
  [...TRAINERS,...ITEMS,...SIGNS].forEach(([x,y])=>{if(at(x,y)!=='p')set(x,y,'g')});
  for(let y=22;y<=24;y++)for(let x=55;x<=58;x++)set(x,y,'g');

  const land=(x,y)=>at(x,y)!=='W';
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const X=x*8,Y=y*8,r=h2(x,y,31),q=h2(x,y,32),c=t[y][x];
    if(c==='T'){R(X,Y,8,8,'#5aa548');pat(X,Y,PAT.tree,{h:'#5dbb52',c:'#2f8a3a',s:'#1f6029',t:'#7a4f2a'})}
    else if(c==='W'){R(X,Y,8,8,'#3d78cf');if(r<.4)R(X+1+(q*4|0),Y+3,3,1,'#74a8ea');
      if(land(x,y-1))R(X,Y,8,1,'#a9cff5');if(land(x,y+1))R(X,Y+7,8,1,'#a9cff5');if(land(x-1,y))R(X,Y,1,8,'#a9cff5');if(land(x+1,y))R(X+7,Y,1,8,'#a9cff5')}
    else if(c==='G'){R(X,Y,8,8,'#4aa347');[[1,1],[5,1],[3,4],[6,5],[0,5]].forEach(([a,b])=>{P(X+a,Y+b,'#8bd66b');P(X+a,Y+b+1,'#2e7a34');if(a<7)P(X+a+1,Y+b+1,'#2e7a34')})}
    else if(c==='p'){R(X,Y,8,8,'#dcc08f');if(r<.5)P(X+(q*8|0),Y+(r*8|0),'#c4a46e')}
    else if(c==='L'){R(X,Y,8,8,'#74c25a');R(X,Y+5,8,2,'#9a6236');R(X,Y+7,8,1,'#5e3a20')}
    else{R(X,Y,8,8,'#74c25a');if(r<.5)P(X+(q*7|0),Y+(r*7|0)+1,'#5fae4a')}
  }
  // 小屋（休息站）
  {const X=55*8,Y=22*8;R(X,Y,28,10,'#d9483b');R(X+1,Y,26,1,mix('#d9483b',.35));R(X+1,Y+10,26,12,'#f4efe3');R(X+12,Y+16,4,6,'#6b4a2e');R(X+4,Y+13,4,3,'#7fb3e0');R(X+20,Y+13,4,3,'#7fb3e0')}
  // 訓練家
  TRAINERS.forEach(([x,y,shirt])=>pat(x*8,y*8,['..kkkk..','..kssk..','..ssss..','.cccccc.','.cccccc.','..cccc..','..n..n..','..k..k..'],{k:'#2a2440',s:'#f3d2b0',c:shirt,n:'#3b3f5c'}));
  // 道具
  ITEMS.forEach(([x,y])=>pat(x*8,y*8,['........','..kkkk..','.kyyyyk.','.kywyyk.','.kyyyyk.','..kkkk..','........','........'],{k:'#2a2440',y:'#c2255c',w:'#ffffff'}));
  // 告示牌
  SIGNS.forEach(([x,y])=>pat(x*8,y*8,['........','.nnnnnn.','.nssssn.','.nnnnnn.','...nn...','...nn...','...nn...','........'],{n:'#7a4f2a',s:'#e6cf9a'}));
  // 一個畫面的大小：30×17 格
  g.setLineDash([6,4]);g.lineWidth=2;g.strokeStyle='#ffffff';g.strokeRect(2*8+1,6*8+1,30*8-2,17*8-2);
}
drawRoute1(document.getElementById('route1'));
