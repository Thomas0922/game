// 像素圖：契靈精靈圖（手繪圖在 sprites-a～e.js）與世界地圖
const SP=DEX.map((r,i)=>({id:i+1,n:r[0],t:[...r[1]],evo:r[2],d:r[3],tag:r[4]||''}));
const LINES={};
{let line=0,stage=0;SP.forEach(s=>{if(!s.evo){line=s.id;stage=0}else stage++;s.line=line;s.stage=stage;(LINES[line]=LINES[line]||[]).push(s)})}

const FIXED={k:'#1c1a2b',w:'#ffffff',r:'#f27a93',x:'#c8323f',y:'#ffd23f',f:'#ff8a2a',g:'#5cc24a',G:'#2f7d3a',n:'#9a6236',N:'#5e3a20',
  s:'#f3e2bd',i:'#d4f0ff',u:'#3f7ee0',m:'#b3bccb',M:'#6b7385',p:'#8b62c9',P:'#d4c2f5',q:'#5bd6c4',h:'#fff3b0'};
function mix(hex,f){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const m=f<0?0:255,a=Math.abs(f);r=Math.round(r+(m-r)*a);g=Math.round(g+(m-g)*a);b=Math.round(b+(m-b)*a);return'#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}

const SPR={};
function spritePixels(s){
  if(SPR[s.id])return SPR[s.id];
  const[mode,b,a0,src,Z=16]=SPRITE_DEF[s.id];
  const a=a0||(s.t[1]?TC[s.t[1]]:mix(b,.4));
  let rows=src.split('/');
  if(mode==='m'){const hw=Math.max(...rows.map(r=>r.length));rows=rows.map(r=>{r=r.padStart(hw,'.');return r+[...r].reverse().join('')})}
  const W=Math.max(...rows.map(r=>r.length)),H=rows.length;
  rows=rows.map(r=>r.padEnd(W,'.'));
  const ox=Math.floor((Z-W)/2),oy=Math.max(1,Z-1-H);
  const pal={...FIXED,b,l:mix(b,.32),d:mix(b,-.25),a,j:mix(a,.32),c:mix(a,-.25)};
  const aura=mix(a,.5).replace(/^#(..)(..)(..)$/,(m,r,g,bl)=>`rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(bl,16)},.5)`);
  const on=(x,y)=>y>=0&&y<H&&rows[y][x]!=='.'&&rows[y][x]!=='v';
  const px=Array.from({length:Z},()=>Array(Z).fill(null));
  const solid=Array.from({length:Z},()=>Array(Z).fill(false));
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const ch=rows[y][x];if(ch==='.')continue;
    // v 是光暈：半透明、不描邊
    if(ch==='v'){px[oy+y][ox+x]=aura;continue}
    let c=pal[ch]||b;
    // 主色、副色自動上明暗：上緣亮、下緣暗
    if(ch==='b'||ch==='a')c=!on(x,y-1)?pal[ch==='b'?'l':'j']:!on(x,y+1)?pal[ch==='b'?'d':'c']:c;
    px[oy+y][ox+x]=c;solid[oy+y][ox+x]=true;
  }
  const out=mix(b,-.62),res=px.map(r=>r.slice());
  const S=(x,y)=>y>=0&&y<Z&&x>=0&&x<Z&&solid[y][x];
  for(let y=0;y<Z;y++)for(let x=0;x<Z;x++){
    if(solid[y][x])continue;
    if(S(x,y-1)||S(x,y+1)||S(x-1,y)||S(x+1,y))res[y][x]=out;
  }
  return SPR[s.id]=res;
}
function drawSprite(cv,s){const p=spritePixels(s),Z=p.length;cv.width=Z;cv.height=Z;const g=cv.getContext('2d');for(let y=0;y<Z;y++)for(let x=0;x<Z;x++)if(p[y][x]){g.fillStyle=p[y][x];g.fillRect(x,y,1,1)}}
const isLegend=s=>s.tag==='傳說'||s.tag==='幻';
function spr(s,cls){return`<canvas class="spr ${cls||''}${isLegend(s)?' lg':''}" data-sp="${s.id}" width="16" height="16" aria-hidden="true"></canvas>`}
function paintAll(root){(root||document).querySelectorAll('canvas[data-sp]:not([data-done])').forEach(c=>{drawSprite(c,SP[c.dataset.sp-1]);c.dataset.done='1'})}

// ---- 世界地圖 80×50 格，每格 8px ----
const MW=80,MH=50;
function h2(x,y,s){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(s+1,982451653);h=Math.imul(h^h>>>13,1274126177);h^=h>>>16;return(h>>>0)/4294967296}
function vn(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=h2(xi,yi,s),b=h2(xi+1,yi,s),c=h2(xi,yi+1,s),d=h2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y,s){return vn(x/9,y/9,s)*.6+vn(x/4,y/4,s+7)*.3+vn(x/2,y/2,s+13)*.1}
const K={DEEP:0,SEA:1,SAND:2,GRASS:3,TALL:4,TREE:5,MTN:6,SNOW:7,PINE:8,FIELD:9,LAVA:10,ASH:11,PATH:12,TOWN:13,MIST:14,ROCK:15,WPATH:16};

function genMap(){
  const tile=[],bio=[];
  for(let y=0;y<MH;y++){tile[y]=[];bio[y]=[];for(let x=0;x<MW;x++){
    const dx=(x+.5-40)/38.5,dy=(y+.5-25)/24,d=dx**4+dy**4+(fbm(x,y,1)-.5)*.55;
    let t,b='plain';
    if(d>1.22)t=K.DEEP;else if(d>1)t=K.SEA;else{
      const n=fbm(x,y,2),m=fbm(x*1.7,y*1.7,4),r=h2(x,y,5);
      if(y<9.5+n*3&&x>16&&x<56)b='snow';
      else if(x>51&&y<18+n*3)b='mist';
      else if(x>59&&y<34)b='ash';
      else if(x>49&&y>=34)b='rock';
      else if(x<27&&y<27)b='forest';
      else if(x<25&&y<39)b='farm';
      if(b==='snow')t=m>.6&&r>.3?K.PINE:K.SNOW;
      else if(b==='mist')t=m>.58?K.MTN:K.MIST;
      else if(b==='ash')t=m>.64?K.MTN:m<.28?K.LAVA:K.ASH;
      else if(b==='rock')t=m>.66&&r>.4?K.MTN:K.ROCK;
      else if(b==='forest')t=m>.4||r>.85?K.TREE:K.GRASS;
      else if(b==='farm')t=x%5!==4&&y%4!==3&&h2(Math.floor(x/5),Math.floor(y/4),6)>.35?K.FIELD:K.GRASS;
      else t=m>.66&&r>.35?K.TREE:K.GRASS;
      if(d>.84&&(b==='plain'||b==='farm'||b==='rock'))t=K.SAND;
    }
    tile[y][x]=t;bio[y][x]=b;
  }}
  const land=(x,y)=>tile[y][x]!==K.SEA&&tile[y][x]!==K.DEEP;
  for(let x=17;x<=56;x++){const yc=10.6+Math.sin(x*.45)*.9;for(let y=8;y<=13;y++)if(Math.abs(y+.5-yc)<1.2&&land(x,y)){tile[y][x]=K.MTN;bio[y][x]='snow'}}
  for(let y=12;y<=24;y++)for(let x=69;x<MW;x++){if(!land(x,y))continue;const r=Math.hypot(x+.5-75.5,y+.5-18.5);if(r<1.8)tile[y][x]=K.LAVA;else if(r<4){tile[y][x]=K.MTN;bio[y][x]='ash'}}
  for(let y=18;y<=38;y++)for(let x=26;x<=54;x++){
    const e=((x+.5-40)/10.5)**2+((y+.5-28)/6.8)**2+(fbm(x,y,8)-.5)*.5;
    if(e<1){tile[y][x]=K.SEA;bio[y][x]='lake'}
    if(((x+.5-40)/4.2)**2+((y+.5-28)/3.2)**2<1){tile[y][x]=K.GRASS;bio[y][x]='plain'}
  }
  PATHS.forEach(pts=>{for(let k=1;k<pts.length;k++){let[x,y]=pts[k-1];const[x2,y2]=pts[k];
    while(true){const t=tile[y][x];tile[y][x]=t===K.SEA||t===K.DEEP||t===K.WPATH?K.WPATH:K.PATH;if(x===x2&&y===y2)break;x+=Math.sign(x2-x);y+=Math.sign(y2-y)}}});
  LOCS.filter(L=>L.k==='town').forEach(L=>{for(let y=L.y-2;y<=L.y+2;y++)for(let x=L.x-3;x<=L.x+2;x++)tile[y][x]=K.TOWN});
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    const t=tile[y][x];if(t!==K.GRASS&&t!==K.SNOW)continue;
    let near=false;
    for(let j=-2;j<=2&&!near;j++)for(let i=-2;i<=2;i++){const yy=y+j,xx=x+i;if(yy>=0&&xx>=0&&yy<MH&&xx<MW&&tile[yy][xx]===K.PATH){near=true;break}}
    if(near&&fbm(x*2,y*2,9)>.5)tile[y][x]=K.TALL;
  }
  return{tile,bio};
}

const PAT={
  tree:['..hccc..','.hhcccc.','hhcccccs','hccccccs','.cccccs.','..sccs..','...tt...','...tt...'],
  pine:['...cc...','..wcc...','..cccc..','.wccccc.','.cccccs.','ccccccss','...tt...','...tt...'],
  mtn:['........','...ww...','..wwdd..','..lldd..','.lllddd.','.lllddd.','lllldddd','lllldddd']
};
const GROUND={plain:'#74c25a',farm:'#74c25a',forest:'#5aa548',snow:'#eef3f8',mist:'#77738f',ash:'#5e4d4b',rock:'#c79a6a',lake:'#74c25a'};
const MTNC={snow:['#c9d3df','#93a0b3','#ffffff'],mist:['#8d88a8','#5d5878','#c9c6dc'],ash:['#6e5a57','#463837','#8a7470'],rock:['#c99b6b','#956a43','#e2c29b'],plain:['#a8a196','#7a746c','#f4f6f8']};

function drawMap(cv){
  const{tile,bio}=genMap();
  cv.width=MW*8;cv.height=MH*8;
  const g=cv.getContext('2d');
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
  const P=(x,y,c)=>R(x,y,1,1,c);
  const pat=(X,Y,rows,map)=>rows.forEach((row,j)=>{for(let i=0;i<8;i++){const c=map[row[i]];if(c)P(X+i,Y+j,c)}});
  const isLand=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&![K.SEA,K.DEEP,K.WPATH].includes(tile[y][x]);
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    const t=tile[y][x],b=bio[y][x],X=x*8,Y=y*8,r=h2(x,y,11),q=h2(x,y,12),gr=GROUND[b]||'#74c25a';
    switch(t){
      case K.DEEP:R(X,Y,8,8,'#27468f');if(r<.35)R(X+1+(q*4|0),Y+2+(r*10|0)%5,3,1,'#3b5fae');break;
      case K.SEA:case K.WPATH:
        R(X,Y,8,8,'#3d78cf');
        if(t===K.WPATH)R(X+3,Y+3,2,2,'#cfe4fb');else if(r<.45)R(X+1+(q*4|0),Y+2+(r*12|0)%5,3,1,'#74a8ea');
        if(isLand(x,y-1))R(X,Y,8,1,'#a9cff5');if(isLand(x,y+1))R(X,Y+7,8,1,'#a9cff5');
        if(isLand(x-1,y))R(X,Y,1,8,'#a9cff5');if(isLand(x+1,y))R(X+7,Y,1,8,'#a9cff5');break;
      case K.SAND:R(X,Y,8,8,'#ecd596');P(X+(r*8|0),Y+(q*8|0),'#d6bb72');P(X+(q*8|0),Y+(r*8|0),'#f6e6b4');break;
      case K.GRASS:R(X,Y,8,8,gr);if(r<.6){const c=b==='forest'?'#4a9440':'#5fae4a';P(X+(q*7|0),Y+(r*7|0)+1,c);P(X+(q*7|0)+1,Y+(r*7|0),c)}break;
      case K.TALL:{const sn=b==='snow',lt=sn?'#ffffff':'#8bd66b',dk=sn?'#8fb9b6':'#2e7a34';R(X,Y,8,8,sn?'#d5ebe8':'#4aa347');
        [[1,1],[5,1],[3,4],[6,5],[0,5]].forEach(([a,c])=>{P(X+a,Y+c,lt);P(X+a,Y+c+1,dk);if(a<7)P(X+a+1,Y+c+1,dk)});break}
      case K.TREE:R(X,Y,8,8,gr);pat(X,Y,PAT.tree,{h:'#5dbb52',c:'#2f8a3a',s:'#1f6029',t:'#7a4f2a'});break;
      case K.PINE:R(X,Y,8,8,'#eef3f8');pat(X,Y,PAT.pine,{c:'#2f6b5c',s:'#1f4a40',w:'#ffffff',t:'#6b4a2e'});break;
      case K.MTN:{R(X,Y,8,8,gr);const[l,d,w]=MTNC[b]||MTNC.plain;pat(X,Y,PAT.mtn,{l,d,w});break}
      case K.SNOW:R(X,Y,8,8,'#eef3f8');if(r<.5)P(X+(q*8|0),Y+(r*8|0),'#cbd8e6');break;
      case K.FIELD:R(X,Y,8,8,'#e3c04b');for(let j=1;j<8;j+=2)R(X,Y+j,8,1,'#cda436');if(r<.5)P(X+(q*8|0),Y+(r*4|0)*2,'#f5dc7a');break;
      case K.LAVA:R(X,Y,8,8,'#e0532d');P(X+(r*7|0),Y+(q*7|0),'#ffbe3d');P(X+(q*7|0)+1,Y+(r*7|0)+1,'#ff8a3d');break;
      case K.ASH:R(X,Y,8,8,'#5e4d4b');P(X+(r*8|0),Y+(q*8|0),'#4a3b3a');P(X+(q*8|0),Y+(r*8|0),'#76625f');break;
      case K.PATH:R(X,Y,8,8,'#dcc08f');if(r<.6)P(X+(q*8|0),Y+(r*8|0),'#c4a46e');break;
      case K.TOWN:R(X,Y,8,8,'#d3cbbb');R(X,Y,8,1,'#c3b9a6');R(X,Y,1,8,'#c3b9a6');break;
      case K.MIST:R(X,Y,8,8,'#77738f');P(X+(r*8|0),Y+(q*8|0),'#8c88a6');P(X+(q*8|0),Y+(r*8|0),'#625e7b');break;
      case K.ROCK:R(X,Y,8,8,'#c79a6a');if(r<.5)R(X+(q*5|0),Y+(r*7|0),3,1,'#ab7f53');break;
    }
  }
  const house=(x,y,w,h,roof)=>{const rh=Math.ceil(h*.5);R(x+1,y+h,w,1,'rgba(0,0,0,.22)');R(x,y,w,rh,roof);R(x+1,y,w-2,1,mix(roof,.35));R(x,y+rh-1,w,1,mix(roof,-.3));
    R(x+1,y+rh,w-2,h-rh,'#f4efe3');R(x+(w>>1)-1,y+h-3,2,3,'#6b4a2e');R(x+2,y+rh+1,2,2,'#7fb3e0');R(x+w-4,y+rh+1,2,2,'#7fb3e0')};
  LOCS.filter(L=>L.k==='town').forEach(L=>{
    const X0=(L.x-3)*8,Y0=(L.y-2)*8,big=L.g!=null?TC[GYMS[L.g].t]:L.champ?'#f2c12e':'#cfd8e3';
    house(X0+3,Y0+3,12,10,'#d9483b');house(X0+33,Y0+3,12,10,'#3d6fd1');house(X0+3,Y0+25,11,10,'#6c9a3a');
    house(X0+18,Y0+17,17,16,big);
    if(L.g!=null||L.champ){R(X0+26,Y0+12,1,5,'#3b2f2f');R(X0+27,Y0+12,4,3,big)}
  });
  {const X=27*8,Y=36*8;R(X+1,Y+2,1,6,'#d6d0c4');R(X+6,Y+2,1,6,'#d6d0c4');R(X,Y,2,2,'#f3a7c4');R(X+6,Y,2,2,'#7d60aa')}
  {const X=46*8,Y=31*8;R(X+1,Y+1,6,6,'#2b5fb3');R(X+2,Y+2,4,4,'#3d78cf');R(X+3,Y+3,2,2,'#cfe4fb')}
}
