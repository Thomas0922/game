// 頁面互動：地圖、圖鑑、相剋表、試算器
const $=s=>document.querySelector(s);
const eff=(a,d)=>{const c=CH[a];return c[2].includes(d)?0:c[0].includes(d)?2:c[1].includes(d)?.5:1};
const effM=(a,ds)=>ds.reduce((m,d)=>m*eff(a,d),1);
function lum(hex){const n=parseInt(hex.slice(1),16);return[n>>16,n>>8&255,n&255].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)}
const INK='#1a1f36',INKL=lum(INK);
function chip(t){const L=lum(TC[t]),white=1.05/(L+.05)>(L+.05)/(INKL+.05);return`<span class="chip" style="background:${TC[t]};color:${white?'#fff':INK}">${t}</span>`}
const no=id=>'#'+String(id).padStart(3,'0');
const chips=s=>s.t.map(chip).join('');
function mini(id){const s=SP[id-1];return`<button type="button" class="mini" data-open="${id}">${spr(s)}<span><span class="mini-n">${s.n}</span><span class="mini-t">${chips(s)}</span></span></button>`}
function teamMon([id,lv]){const s=SP[id-1];return`<button type="button" class="tm" data-open="${id}" title="${s.n} Lv${lv}">${spr(s)}<span>Lv${lv}</span></button>`}

function hab(s){
  if(s.stage>0){const prev=LINES[s.line][s.stage-1];return`由 ${prev.n} 進化（${s.evo}）`}
  if(s.tag==='御三家')return'萌芽村，白樺博士處三選一。另外兩隻可以跟另一位玩家交換取得。';
  if(isLegend(s)){const L=LEGENDS[s.id];return`${L.loc}（Lv${L.lv}）。條件：${L.cond}。`}
  const ls=LOCS.filter(L=>L.sp&&L.sp.includes(s.id)).map(L=>L.n+(L.lv?`（Lv ${L.lv}）`:''));
  let t=ls.join('、')||'—';
  if(s.tag==='化石')t+='：挖到化石後帶去鋼鐵都研究所復原';
  return t;
}
function legendBox(s){
  const L=LEGENDS[s.id];
  return`<div class="lg-box"><div><span class="lg-k">地點</span>${L.loc}</div><div><span class="lg-k">條件</span>${L.cond}</div><div><span class="lg-k">等級</span>Lv${L.lv}</div><div><span class="lg-k">${s.tag==='幻'?'對戰':'首領戰'}</span>${L.boss}</div></div>`;
}

// 圖鑑對話框
const dlg=$('#dexDlg'),dlgBody=$('#dexBody');
function openDex(id){
  const s=SP[id-1],chain=LINES[s.line],gp={};
  T.forEach(a=>{const m=effM(a,s.t);if(m!==1)(gp[m]=gp[m]||[]).push(a)});
  const row=(l,k)=>gp[k]?`<div class="mu"><span class="mu-l">${l}</span><span class="mu-c">${gp[k].map(chip).join('')}</span></div>`:'';
  const evo=chain.length>1?`<div class="chain">${chain.map((c,i)=>`${i?`<span class="arrow">→<small>${c.evo}</small></span>`:''}<button type="button" class="ch${c.id===s.id?' on':''}" data-open="${c.id}">${spr(c)}<span>${c.n}</span></button>`).join('')}</div>`:'<p class="muted">不會進化。</p>';
  const lg=isLegend(s);
  dlgBody.innerHTML=`<div class="dx-top"><div class="dx-art${lg?' legend':''}">${spr(s,'big')}</div><div class="dx-info"><div class="dx-no pix">${no(s.id)}${s.tag?` · ${s.tag}`:''}</div><h3>${s.n}</h3><div class="ty">${chips(s)}</div><p>${s.d}</p></div></div>
  ${lg?`<div><div class="label">在哪裡遇到</div>${legendBox(s)}</div>`:`<div><div class="label">進化</div>${evo}</div>
  <div><div class="label">取得方式</div><p>${hab(s)}</p></div>`}
  <div><div class="label">被這些屬性打中時</div>${row('×4',4)}${row('×2',2)}${row('×½',.5)}${row('×¼',.25)}${row('×0',0)}</div>`;
  paintAll(dlgBody);
  if(!dlg.open)dlg.showModal();
}
$('#dexClose').addEventListener('click',()=>dlg.close());
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b)openDex(+b.dataset.open)});

// 開場三選一
$('#picks').innerHTML=[1,4,7].map(id=>{const s=SP[id-1];return`<button type="button" class="pick" data-open="${id}">${spr(s)}<span class="pk-n">${s.n}</span>${chips(s)}</button>`}).join('');

// 地圖
drawMap($('#map'));
const pinBox=$('#pins'),locPanel=$('#loc');
LOCS.forEach(L=>{
  const b=document.createElement('button');
  b.type='button';b.className='pin '+L.k;b.dataset.loc=L.id;b.setAttribute('aria-pressed','false');
  b.innerHTML=L.k==='route'?L.lab:L.k==='spot'?`<span>★</span><span class="pin-t">${L.n}</span>`:L.n;
  if(L.k!=='town')b.setAttribute('aria-label',L.n);
  b.style.left=(L.x+.5)/MW*100+'%';
  b.style.top=(L.k==='town'?(L.y-2.2)/MH:(L.y+.5)/MH)*100+'%';
  b.addEventListener('click',()=>selectLoc(L.id));
  pinBox.appendChild(b);
});
function selectLoc(id){
  const L=LOCS.find(l=>l.id===id);
  pinBox.querySelectorAll('.pin').forEach(p=>p.setAttribute('aria-pressed',String(p.dataset.loc===id)));
  let h=`<div class="label">${{town:'城鎮',route:'道路',spot:'特殊地點'}[L.k]}${L.lv?` · 野生 Lv ${L.lv}`:''}</div><h3>${L.n}</h3><p class="loc-d">${L.d}</p>`;
  const G=L.g!=null?GYMS[L.g]:L.champ?CHAMP:null;
  if(G)h+=`<div class="gym-mini"><div>${L.champ?'冠軍':`第 ${L.g+1} 道館 ${chip(G.t)}`} <b>${G.leader}</b><span class="muted">・${G.role}</span></div>${G.badge?`<div class="muted">${G.badge}，解鎖「${G.unlock}」</div>`:''}<div class="team">${G.team.map(teamMon).join('')}</div></div>`;
  const wild=(L.sp||[]).filter(id=>!isLegend(SP[id-1])),lgs=(L.sp||[]).filter(id=>isLegend(SP[id-1]));
  if(wild.length)h+=`<div class="label">${L.id==='sprout'?'御三家（三選一）':'會遇到的契靈'}</div><div class="sp-list">${wild.map(mini).join('')}</div>`;
  if(lgs.length)h+=`<div class="label">傳說・幻之契靈</div><div class="sp-list">${lgs.map(id=>mini(id).replace('class="mini"','class="mini legend"')).join('')}</div>`;
  locPanel.innerHTML=h;paintAll(locPanel);
}
selectLoc('sprout');

// 圖鑑
let fType='全部',fQ='';
$('#dexFilters').innerHTML=['全部',...T].map(t=>`<button type="button" class="fbtn" data-f="${t}" aria-pressed="${t==='全部'}">${t==='全部'?'':`<i style="background:${TC[t]}"></i>`}${t}</button>`).join('');
$('#dexFilters').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;fType=b.dataset.f;$('#dexFilters').querySelectorAll('.fbtn').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderDex()});
$('#dexQ').addEventListener('input',e=>{fQ=e.target.value.trim();renderDex()});
function renderDex(){
  const list=SP.filter(s=>(fType==='全部'||s.t.includes(fType))&&(!fQ||s.n.includes(fQ)||no(s.id).includes(fQ)));
  $('#dexGrid').innerHTML=list.map(s=>`<button type="button" class="card${isLegend(s)?' legend':''}" data-open="${s.id}"><span class="art">${spr(s)}</span><span class="no pix">${no(s.id)}${s.tag?` · ${s.tag}`:''}</span><span class="nm">${s.n}</span><span class="ty">${chips(s)}</span></button>`).join('')||'<p class="muted">沒有符合的契靈。</p>';
  $('#dexCount').textContent=`顯示 ${list.length} / ${SP.length} 隻`;
  paintAll($('#dexGrid'));
}
renderDex();

// 傳說與幻之契靈
$('#legendGrid').innerHTML=Object.keys(LEGENDS).map(id=>{const s=SP[id-1];
  return`<article class="lg-card"><button type="button" class="lg-art" data-open="${s.id}" aria-label="${s.n}">${spr(s)}</button>
  <div class="lg-body"><div class="lg-no pix">${no(s.id)} · ${s.tag}</div><h3>${s.n}</h3><div class="ty">${chips(s)}</div>${legendBox(s)}</div></article>`}).join('');
$('#shards').innerHTML=SHARDS.map(([w,how,when],i)=>`<tr><td class="pix">${i+1}</td><td>${w}</td><td>${how}</td><td class="num">${when}</td></tr>`).join('');

// 御三家
$('#starterGrid').innerHTML=STARTERS.map(S=>{
  const ch=S.ids.map(id=>SP[id-1]),fin=ch[2],col=TC[ch[0].t[0]];
  const st=['HP','攻擊','防禦','速度'].map((l,i)=>`<div class="stat"><span>${l}</span><span class="bar"><i style="width:${S.stats[i]/120*100}%;background:${col}"></i></span><span class="tnum">${S.stats[i]}</span></div>`).join('');
  return`<article class="st"><div class="st-chain">${ch.map((c,i)=>`${i?`<span class="lv pix">Lv${c.evo.replace('Lv','')}</span>`:''}<button type="button" data-open="${c.id}" class="s${i}">${spr(c)}<span>${c.n}</span></button>`).join('')}</div>
  <div class="st-h"><h3>${ch[0].n}</h3><span class="muted">${S.role}</span></div>
  <div><div class="label">${fin.n}（最終型）基本能力</div>${st}</div>
  <p><b>特性「${S.abil[0]}」</b>${S.abil[1]}</p>
  <div><div class="label">升級學會</div><table class="learn">${S.learn.map(([lv,m])=>`<tr><td class="pix">Lv${lv}</td><td>${m}</td></tr>`).join('')}</table></div></article>`;
}).join('');

// 對戰示意
$('#btFoe').innerHTML=spr(SP[30]);$('#btMe').innerHTML=spr(SP[5]);
$('#btFoeT').innerHTML=chips(SP[30]);$('#btMeT').innerHTML=chips(SP[5]);

// 相剋表
{let h='<thead><tr><th class="corner">攻＼守</th>'+T.map(t=>`<th>${chip(t)}</th>`).join('')+'</tr></thead><tbody>';
T.forEach(a=>{h+=`<tr><th>${chip(a)}</th>`+T.map(d=>{const e=eff(a,d);return e===2?'<td class="s">2</td>':e===.5?'<td class="r">½</td>':e===0?'<td class="i">0</td>':'<td></td>'}).join('')+'</tr>'});
$('#typeChart').innerHTML=h+'</tbody>';}

// 招式表
$('#moves').innerHTML=MOVES.map(([t,...ms])=>`<tr><td>${chip(t)}</td>${ms.map(([n,p,e])=>`<td><b>${n}</b> <span class="muted tnum">${p?'威力 '+p:'輔助'}</span>${e?`<div class="note">${e}</div>`:''}</td>`).join('')}</tr>`).join('');

// 球
const multTxt=m=>m===Infinity?'必中':m==null?'PvP 專用':'×'+m;
$('#balls').innerHTML=BALLS.map(([n,m,p,d,c])=>`<tr><td class="ball-n"><i class="orb" style="background:${c}"></i>${n}</td><td class="num">${multTxt(m)}</td><td class="num">${p}</td><td>${d}</td></tr>`).join('');
const RAR=[['常見（60%）',.6],['一般（45%）',.45],['稀有（25%）',.25],['進化型（15%）',.15],['傳說（3%）',.03]];
const STS=[['沒有',1],['麻痺・中毒・灼燒（×1.5）',1.5],['睡眠・凍結（×2）',2]];
const opt=(arr,sel)=>arr.map((a,i)=>`<option value="${i}"${i===sel?' selected':''}>${a}</option>`).join('');
$('#cRar').innerHTML=opt(RAR.map(r=>r[0]),1);
$('#cBall').innerHTML=BALLS.map((b,i)=>b[1]==null?'':`<option value="${i}"${i===1?' selected':''}>${b[0]}（${multTxt(b[1])}${b[1]===3||b[1]===4?'，條件符合時':''}）</option>`).join('');
$('#cSt').innerHTML=opt(STS.map(s=>s[0]),0);
function calc(){
  const base=RAR[$('#cRar').value][1],m=BALLS[$('#cBall').value][1],st=STS[$('#cSt').value][1],hp=$('#cHp').value/100;
  $('#cHpOut').textContent=$('#cHp').value+'%';
  const p=m===Infinity?1:Math.min(.95,base*m*st*(1-.7*hp));
  $('#cBig').textContent=(p*100).toFixed(p<.1?1:0)+'%';
  $('#cMeter').style.width=p*100+'%';
  $('#cAvg').textContent=p>=1?'一定成功':p>=.95?'到上限了（95%）':`平均約丟 ${(1/p).toFixed(1)} 顆`;
}
['#cRar','#cBall','#cSt','#cHp'].forEach(s=>$(s).addEventListener('input',calc));calc();

// 進化方式
$('#evos').innerHTML=EVOS.map(([k,d,ex,a,b])=>`<div class="evo"><h4>${k}</h4><div class="evo-pair"><button type="button" data-open="${a}" aria-label="${SP[a-1].n}">${spr(SP[a-1])}</button><span class="muted">→</span><button type="button" data-open="${b}" aria-label="${SP[b-1].n}">${spr(SP[b-1])}</button></div><p>${d}</p><p class="muted note">例：${ex}</p></div>`).join('');

// 道館
$('#gymRows').innerHTML=GYMS.map((G,i)=>{const L=LOCS.find(l=>l.g===i);return`<tr><td class="pix">${i+1}</td><td>${L.n}</td><td>${chip(G.t)}</td><td><b>${G.leader}</b><div class="note muted">${G.role}</div></td><td><div class="team">${G.team.map(teamMon).join('')}</div></td><td>${G.badge}<div class="note muted">解鎖「${G.unlock}」</div></td></tr>`}).join('')
 +`<tr class="champ"><td class="pix">★</td><td>天頂聯盟</td><td>混合</td><td><b>${CHAMP.leader}</b><div class="note muted">${CHAMP.role}</div></td><td><div class="team">${CHAMP.team.map(teamMon).join('')}</div></td><td>通關</td></tr>`;

paintAll();
