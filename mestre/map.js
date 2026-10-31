/* Mapa interativo do mundo (aba Mapa): zoom, arrastar, tela cheia, locais por categoria, sessões e viagens da tripulação.
   Dados em 03 Mundo/Mapas/dados/mapa-interativo.json. O mestre edita pelo próprio mapa; no portal local (serve.py) salva direto no Vault. */
window.OP_MAP=(()=>{
 'use strict';
 const TIPOS={
  ilha:{nome:'Ilhas',um:'Ilha',cor:'#3f8f5a',g:'M12 21v-9 M12 12C9 8 5 8 3 10c3 0 6 0 9 2 M12 12c3-4 7-4 9-2-3 0-6 0-9 2 M12 12c-1-4-4-6-7-6 2 1 5 3 7 6 M12 12c1-4 4-6 7-6-2 1-5 3-7 6 M7 21h10'},
  cidade:{nome:'Cidades e vilas',um:'Cidade ou vila',cor:'#c27c2c',g:'M3 20h18 M5 20v-8l5-4 5 4v8 M15 20v-6l2.5-2 2.5 2v6 M9 20v-4h2v4'},
  marinha:{nome:'Marinha',um:'Marinha',cor:'#2f6db3',g:'M12 6v14 M8 9h8 M5 13a7 7 0 0 0 14 0 M12 2.6a1.7 1.7 0 1 1 0 3.4a1.7 1.7 0 1 1 0-3.4'},
  mar:{nome:'Notas no mar',um:'Nota no mar',cor:'#0e7490',g:'M3 16c2 0 2-1.5 4.5-1.5S10 16 12 16s2.5-1.5 4.5-1.5S19 16 21 16 M3 20c2 0 2-1.5 4.5-1.5S10 20 12 20s2.5-1.5 4.5-1.5S19 20 21 20 M12 3v9 M12 3l6 4.5h-6'},
  pirata:{nome:'Piratas',um:'Piratas',cor:'#2d2a26',g:'M6 11a6 6 0 1 1 12 0c0 2-1 3.5-2 4.2V18H8v-2.8C7 14.5 6 13 6 11Z M9.5 11.5h.01 M14.5 11.5h.01 M10.5 18v2 M13.5 18v2'},
  tesouro:{nome:'Tesouros',um:'Tesouro',cor:'#b8901c',g:'M4 11h16v8H4Z M4 11c0-4 3-6 8-6s8 2 8 6 M12 13v3'},
  perigo:{nome:'Perigos',um:'Perigo',cor:'#c0392b',g:'M12 4 21 20H3Z M12 10v4 M12 17h.01'},
  misterio:{nome:'Mistérios e ruínas',um:'Mistério ou ruína',cor:'#7d4fb0',g:'M9.2 9a3 3 0 1 1 4.3 2.7c-.9.5-1.5 1.1-1.5 2.3 M12 17.5h.01'},
  marco:{nome:'Marcos do mundo',um:'Marco do mundo',cor:'#1f7a80',g:'M3 19 9 9l4 6 2-3 6 7Z'},
  ponto:{nome:'Outros',um:'Outro',cor:'#6b7280',g:'M12 7v10 M7 12h10'}};
 const VER={jogadores:'Os jogadores também',novo:'Só eu, por enquanto (ainda não descoberto)',mestre:'Só eu, é segredo (aparece em vermelho)'};
 const DRAFT='oprpg-mapa-rascunho',PREFS='oprpg-mapa-prefs';
 let A,W,root,stage,base,over,pins,pop,panel,ro,dados,original,editing=false,localSave=false,pick=null,sel=null,popAt=null,prefs,anim=0,ate=null,navAnim=null,tocando=null;
 const V={k:1,tx:0,ty:0,w:1,h:1};
 const $=s=>root.querySelector(s);
 const esc=s=>A.esc(s??'');
 const glyph=(t,c='')=>`<svg class="${c}" viewBox="0 0 24 24" aria-hidden="true"><path d="${(TIPOS[t]||TIPOS.ponto).g}"/></svg>`;
 const gm=()=>!A.isPlayer();
 const canEdit=()=>gm()&&A.D.audience!=='player';
 const seen=l=>l.visivel!=='mestre'&&!!l.descoberto;
 const ler=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??f;}catch{return f;}};
 const gravar=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v));}catch{}};
 const clone=o=>JSON.parse(JSON.stringify(o));
 const num=n=>String(n).padStart(2,'0');
 const dataBR=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')?d.split('-').reverse().join('/'):(d||'');

 /* ---------- dados: marcos fixos + locais do arquivo; na prévia do jogador, a mesma regra do build dos jogadores ---------- */
 function locais(){const by=new Map(W.fixos.map(f=>[f.id,{...f}]));
  for(const l of dados.locais){const f=by.get(l.id);by.set(l.id,f?{...f,descricao:l.descricao,segredo:l.segredo,nota:l.nota}:{...l});}
  let out=[...by.values()].filter(l=>Array.isArray(l.pos));if(!gm())out=out.filter(seen).map(l=>({...l,segredo:''}));return out;}
 function sessoes(){let s=dados.sessoes.slice();if(!gm()){const ids=new Set(locais().map(l=>l.id));s=s.filter(x=>x.visivel!=='mestre').map(x=>({...x,segredo:'',locais:(x.locais||[]).filter(i=>ids.has(i))}));}
  return s.sort((a,b)=>(a.numero||0)-(b.numero||0));}
 function viagens(){const ids=new Set(locais().map(l=>l.id)),nums=new Set(sessoes().map(s=>s.numero));
  return dados.viagens.filter(v=>ids.has(v.de)&&ids.has(v.para)&&(gm()||v.visivel!=='mestre')).map(v=>gm()?v:{...v,segredo:'',sessao:nums.has(v.sessao)?v.sessao:null});}
 const loc=id=>locais().find(l=>l.id===id);
 function regiao(l){if(l.mar)return l.mar;const R=W.regioes,[x,y]=l.pos,cx=R.reverse_mountain[0],cy=R.centro_y,gl=R.grand_line,cb=R.calm_belt;
  if(Math.hypot(x-cx,y-cy)<45)return 'Reverse Mountain';
  if(Math.abs(x-cx)<R.red_line||x<R.red_line*.75||x>R.largura-R.red_line*.75)return 'Red Line';
  const dy=Math.abs(y-cy);if(dy<=gl)return x>cx?'Grand Line · Paradise':'Grand Line · Novo Mundo';if(dy<=gl+cb)return 'Calm Belt';
  return y<cy?(x<cx?'North Blue':'East Blue'):(x<cx?'West Blue':'South Blue');}
 const sessoesDe=id=>sessoes().filter(s=>(s.locais||[]).includes(id)||viagens().some(v=>v.sessao===s.numero&&(v.de===id||v.para===id)));

 /* ---------- viagens em ordem, distância e tempo (regras: 1 nó = 2 km/h nas tabelas; navio navega até 24 h por dia) ---------- */
 const cfg=()=>({escala_km:20,horas:24,nos:null,...(dados.config||{})});
 const ordem=()=>viagens().map((v,i)=>({v,i})).sort((a,b)=>(a.v.sessao??1e9)-(b.v.sessao??1e9)||a.i-b.i).map(x=>x.v);
 function amostras(pts,n=20){if(!pts||pts.length<2)return pts||[];const out=[pts[0]];
  for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
   const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];
   for(let k=1;k<=n;k++){const t=k/n,u=1-t;out.push([u*u*u*p1[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*p2[0],u*u*u*p1[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*p2[1]]);}}
  return out;}
 const comprimento=poly=>poly.reduce((s,p,i)=>i?s+Math.hypot(p[0]-poly[i-1][0],p[1]-poly[i-1][1]):0,0);
 function pontoEm(poly,f){const L=comprimento(poly)*f;let s=0;for(let i=1;i<poly.length;i++){const d=Math.hypot(poly[i][0]-poly[i-1][0],poly[i][1]-poly[i-1][1]);if(s+d>=L){const t=d?(L-s)/d:0;return [poly[i-1][0]+(poly[i][0]-poly[i-1][0])*t,poly[i-1][1]+(poly[i][1]-poly[i-1][1])*t];}s+=d;}return poly[poly.length-1];}
 const fmtN=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:n<10?1:0});
 function tempo(v){const pts=caminho(v);if(!pts)return null;const c=cfg(),km=comprimento(amostras(pts))*(+c.escala_km||20),nos=+(v.nos||c.nos)||0,horas=Math.min(24,Math.max(1,+c.horas||24));
  const dias=v.dias!=null&&v.dias!==''?+v.dias:nos?km/(nos*2*horas):null;return {km,nos,horas,dias,registrado:v.dias!=null&&v.dias!==''};}
 /* Onde o navio está: durante a reprodução, a posição animada; na linha do tempo, o fim da última viagem até ali; senão o marcado pelo mestre ou o fim da última viagem. */
 function navioPos(){if(navAnim)return navAnim;const vs=ordem();
  if(ate!=null){const ant=vs.filter(v=>v.sessao!=null&&v.sessao<=ate);if(ant.length)return loc(ant[ant.length-1].para)?.pos;const p=vs[0]&&loc(vs[0].de);return p?.pos||null;}
  const n=dados.navio?.local&&loc(dados.navio.local);if(n)return n.pos;const u=vs[vs.length-1];return u?loc(u.para)?.pos:null;}
 /* Jornal: edições com "local:" igual ao nome do lugar ou que citam o lugar; cartazes com "local:" ou motivo que cita o lugar. */
 const semTags=h=>String(h||'').replace(/<[^>]+>/g,' ');
 function menciona(txt,nome){const k=semAcento(String(txt||'')),n=semAcento(nome||'');if(n.length<3)return false;const letra=c=>!!c&&/[\p{L}\p{N}]/u.test(c);
  for(let i=k.indexOf(n);i>=0;i=k.indexOf(n,i+1))if(!letra(k[i-1])&&!letra(k[i+n.length]))return true;return false;}
 function noticias(l){const n=semAcento(l.nome),ed=(A.D.newspapers||[]).filter(e=>!A.isPlayer()||e.published),pub=new Set(ed.map(e=>e.number));
  const eds=ed.filter(e=>semAcento(e.place||'')===n||menciona(e.headline+' '+semTags(e.standfirst)+' '+(e.articles||[]).map(a=>a.title+' '+semTags(a.html)).join(' '),l.nome)).sort((a,b)=>b.number-a.number);
  const cs=(A.D.bounties||[]).filter(p=>!A.isPlayer()||p.published).filter(p=>semAcento(p.local||'')===n||(p.history||[]).some(h=>(!A.isPlayer()||pub.has(h.edition))&&menciona(semTags(h.reason),l.nome)));
  return {eds,cs};}

 /* ---------- nomes citados: ilhas e locais abrem no mapa; personagens abrem a nota inteira (mestre) ou o que a tripulação sabe ---------- */
 const semAcento=t=>t.split('').map(c=>(c.normalize('NFD')[0]||c).toLowerCase()[0]).join('');
 let refs=null;
 function indice(){if(refs)return refs;const list=[];
  for(const l of locais())list.push({n:l.nome,alvo:{local:l.id}});
  (W.pessoas||[]).forEach((p,i)=>{const ok=gm()?true:!!(p.publico||p.ficha);if(ok)p.nomes.forEach(n=>list.push({n,alvo:{pessoa:i}}));});
  const vistos=new Set();refs=list.filter(r=>r.n&&r.n.length>2).map(r=>({...r,k:semAcento(r.n)})).filter(r=>!vistos.has(r.k+JSON.stringify(r.alvo))&&vistos.add(r.k+JSON.stringify(r.alvo))).sort((a,b)=>b.k.length-a.k.length);return refs;}
 function refLink(alvo,txt){if(alvo.local!=null)return `<button type="button" class="wm-ref" data-ir="${esc(alvo.local)}">${esc(txt)}</button>`;
  const p=W.pessoas[alvo.pessoa];if(gm()&&p.doc)return `<a class="wm-ref pessoa" href="${A.link(p.doc)}" title="Abrir a página completa de ${esc(p.nome)}${p.publico?'':' (os jogadores ainda não veem nada dele: escreva a seção O que os jogadores sabem na nota)'}">${esc(txt)}</a>`;
  if(p.publico)return `<button type="button" class="wm-ref pessoa" data-pessoa="${alvo.pessoa}">${esc(txt)}</button>`;
  if(p.ficha)return `<a class="wm-ref pessoa" href="${A.link(p.ficha)}">${esc(txt)}</a>`;return esc(txt);}
 function autolinks(txt,proprio){const k=semAcento(txt),R=indice();let out='',i=0;
  const letra=c=>!!c&&/[\p{L}\p{N}]/u.test(c);
  while(i<txt.length){let achou=null;
   if(!letra(k[i-1]))for(const r of R){if(k.startsWith(r.k,i)&&!letra(k[i+r.k.length])&&!(r.alvo.local!=null&&r.alvo.local===proprio)){achou=r;break;}}
   if(achou){out+=refLink(achou.alvo,txt.slice(i,i+achou.k.length));i+=achou.k.length;}else{out+=esc(txt[i]);i++;}}
  return out;}
 /* Texto do mapa com links: [[Nome]] ou [[Nome|texto]] força o link; nomes conhecidos viram link sozinhos. */
 function rico(txt,proprio){if(!txt)return '';return String(txt).split(/(\[\[[^\]]+\]\])/).map(parte=>{const m=parte.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
   if(!m)return autolinks(parte,proprio);const alvo=semAcento(m[1].trim()),mostra=(m[2]||m[1]).trim(),r=indice().find(x=>x.k===alvo);
   if(r)return refLink(r.alvo,mostra);const d=A.byStem(m[1].trim())||A.docs.find(x=>semAcento(x.title)===alvo);return d?`<a class="wm-ref" href="${A.link(d.id)}">${esc(mostra)}</a>`:esc(mostra);}).join('');}
 function verPessoa(i){const p=W.pessoas[i];if(!p)return;const d=document.createElement('dialog');d.className='wm-dialog wm-person';
  d.innerHTML=`<div class="wm-dialog-head"><h3>${esc(p.nome)}</h3><button type="button" class="wm-x" aria-label="Fechar">×</button></div><div class="wm-person-body"><div class="eyebrow">O QUE A TRIPULAÇÃO SABE</div><div class="article-body">${p.publico}</div>${(()=>{const h=htmlAparicoes(p.nomes);return h?`<div class="wm-apps">${h}</div>`:'';})()}${p.ficha?`<a class="btn btn-light" href="${A.link(p.ficha)}">Abrir a ficha</a>`:''}</div>`;
  root.appendChild(d);d.querySelector('.wm-x').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());d.addEventListener('click',e=>{if(e.target.closest('a'))d.close();});d.showModal();}

 /* ---------- visão: escala k (px por unidade do mapa) e deslocamento; a base é vetorial e redesenha nítida em qualquer zoom ---------- */
 const fitK=()=>Math.min(V.w/W.regioes.largura,V.h/W.regioes.altura);
 const maxK=()=>Math.max(fitK()*12,5);
 function clamp(){const L=W.regioes.largura*V.k,H=W.regioes.altura*V.k;
  V.tx=L<=V.w?(V.w-L)/2:Math.min(0,Math.max(V.w-L,V.tx));V.ty=H<=V.h?(V.h-H)/2:Math.min(0,Math.max(V.h-H,V.ty));}
 const toS=([x,y])=>[x*V.k+V.tx,y*V.k+V.ty];
 const toM=(sx,sy)=>[(sx-V.tx)/V.k,(sy-V.ty)/V.k];
 function zoomAt(f,sx=V.w/2,sy=V.h/2){const k=Math.min(maxK(),Math.max(fitK(),V.k*f));V.tx=sx-(sx-V.tx)*k/V.k;V.ty=sy-(sy-V.ty)*k/V.k;V.k=k;clamp();draw();}
 function fit(pontos,anima=true){let k,cx,cy;
  if(!pontos||!pontos.length){k=fitK();cx=W.regioes.largura/2;cy=W.regioes.altura/2;}
  else{const xs=pontos.map(p=>p[0]),ys=pontos.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
   k=Math.min(maxK()*.45,fitK()*5,Math.max(fitK(),Math.min(V.w/(x1-x0+260),V.h/(y1-y0+220))));cx=(x0+x1)/2;cy=(y0+y1)/2;}
  const alvo={k,tx:V.w/2-cx*k,ty:V.h/2-cy*k};
  if(!anima){Object.assign(V,alvo);clamp();draw();return;}
  const de={k:V.k,tx:V.tx,ty:V.ty},t0=performance.now();cancelAnimationFrame(anim);
  const passo=t=>{const p=Math.min(1,(t-t0)/380),e=1-Math.pow(1-p,3);V.k=de.k+(alvo.k-de.k)*e;V.tx=de.tx+(alvo.tx-de.tx)*e;V.ty=de.ty+(alvo.ty-de.ty)*e;clamp();draw();if(p<1)anim=requestAnimationFrame(passo);};
  anim=requestAnimationFrame(passo);}

 /* ---------- desenho ---------- */
 function curva(pts){const P=pts.map(toS);if(P.length<2)return '';let d=`M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for(let i=0;i<P.length-1;i++){const p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||p2;
   d+=`C${(p1[0]+(p2[0]-p0[0])/6).toFixed(1)} ${(p1[1]+(p2[1]-p0[1])/6).toFixed(1)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(1)} ${(p2[1]-(p3[1]-p1[1])/6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;}
  return d;}
 function caminho(v){const a=loc(v.de),b=loc(v.para);if(!a||!b)return null;const pts=[a.pos,...(v.pontos||[]),b.pos];
  if(pts.length===2){const [x1,y1]=a.pos,[x2,y2]=b.pos;pts.splice(1,0,[(x1+x2)/2-(y2-y1)*.12,(y1+y2)/2+(x2-x1)*.12]);}
  return pts;}
 function draw(){if(!base)return;
  base.setAttribute('viewBox',`${(-V.tx/V.k).toFixed(2)} ${(-V.ty/V.k).toFixed(2)} ${(V.w/V.k).toFixed(2)} ${(V.h/V.k).toFixed(2)}`);
  over.setAttribute('viewBox',`0 0 ${V.w} ${V.h}`);
  const mostrar=prefs.rotas,vs=mostrar?viagens().filter(v=>ate==null||(v.sessao!=null&&v.sessao<=ate)):[];let svg='';
  for(const v of vs){const pts=caminho(v);if(!pts)continue;const on=sel==null||v.sessao===sel,seg=v.visivel==='mestre'&&gm();
   svg+=`<g class="wm-route ${on?'on':'off'} ${sel!=null&&on?'sel':''} ${seg?'gm':''}" data-v="${esc(v.id)}"><path class="wm-route-hit" d="${curva(pts)}"/><path class="wm-route-casing" d="${curva(pts)}"/><path class="wm-route-line" d="${curva(pts)}"/></g>`;}
  if(pick?.tipo==='caminho'){const v=dados.viagens.find(x=>x.id===pick.id),pts=v&&caminho(v);if(pts)svg+=`<g class="wm-route on sel drawing"><path class="wm-route-line" d="${curva(pts)}"/>${(v.pontos||[]).map(p=>{const [x,y]=toS(p);return `<circle cx="${x}" cy="${y}" r="5" class="wm-way"/>`;}).join('')}</g>`;}
  over.innerHTML=svg;
  // setas no meio de cada rota e o número da sessão
  over.querySelectorAll('.wm-route:not(.drawing)').forEach(g=>{const p=g.querySelector('.wm-route-line'),L=p.getTotalLength();if(L<30)return;
   const v=dados.viagens.find(x=>x.id===g.dataset.v);const marcas=Math.max(1,Math.min(4,Math.floor(L/260)));let extra='';
   for(let i=1;i<=marcas;i++){const t=L*i/(marcas+1),a=p.getPointAtLength(t-2),b=p.getPointAtLength(t+2),ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
    extra+=`<path class="wm-arrow" d="M-6 -5L5 0L-6 5Z" transform="translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${ang.toFixed(1)})"/>`;}
   const tp=v&&tempo(v),dd=tp?.dias!=null?(tp.registrado?'':'≈')+fmtN(tp.dias)+' d':'';
   if((v?.sessao!=null||dd)&&L>70){const m=p.getPointAtLength(L*.5);extra+=`<g class="wm-badge" transform="translate(${m.x.toFixed(1)} ${(m.y-15).toFixed(1)})">${v.sessao!=null?`<circle r="10"/><text y="4">${esc(v.sessao)}</text>`:''}${dd&&prefs.dias?`<text class="wm-days" x="${v.sessao!=null?14:0}" y="4">${dd}</text>`:''}</g>`;}
   g.insertAdjacentHTML('beforeend',extra);});
  const nav=prefs.navio&&navioPos();if(nav){const [x,y]=toS(nav);over.insertAdjacentHTML('beforeend',`<g class="wm-ship ${navAnim?'moving':''}" transform="translate(${(x+21).toFixed(1)} ${(y-21).toFixed(1)})"><title>A tripulação está aqui</title><circle r="15"/><path d="M-9 2h18l-3.5 5.5h-11Z M0 2V-10 M0-10l7.5 9.5H0"/></g>`);}
  const ativos=sel==null?null:new Set(sessoes().find(s=>s.numero===sel)?.locais||[]);
  if(ativos)for(const v of viagens())if(v.sessao===sel){ativos.add(v.de);ativos.add(v.para);}
  pins.querySelectorAll('.wm-pin').forEach(el=>{const l=loc(el.dataset.id);if(!l)return;const [x,y]=toS(l.pos);el.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;el.classList.toggle('dim',!!ativos&&!ativos.has(l.id));});
  placePop();}
 function renderPins(){const on=new Set(prefs.tipos);
  pins.innerHTML=locais().filter(l=>on.has(TIPOS[l.tipo]?l.tipo:'ponto')).map(l=>{const t=TIPOS[l.tipo]?l.tipo:'ponto',cls=gm()&&!A.isPlayer()?(l.visivel==='mestre'?'secret':!l.descoberto?'hidden':''):'';
   const nv=prefs.jornal&&(()=>{const x=noticias(l);return x.eds.length+x.cs.length;})();
   return `<div class="wm-pin ${cls} ${l.fixo?'fixed':''} ${prefs.nomes?'named':''} ${nv?'news':''}" data-id="${esc(l.id)}" style="--c:${TIPOS[t].cor}"><button type="button" class="wm-dot" aria-label="${esc(l.nome)} (${esc(TIPOS[t].um)})" title="${esc(l.nome)}${nv?' · no jornal':''}">${glyph(t)}</button><span class="wm-name">${esc(l.nome)}</span></div>`;}).join('');
  draw();}

 /* ---------- popup ---------- */
 function placePop(){if(!popAt||pop.hidden)return;const [x,y]=toS(popAt),w=pop.offsetWidth,h=pop.offsetHeight;
  pop.style.visibility=x<-20||y<-20||x>V.w+20||y>V.h+20?'hidden':'';
  let left=x-w/2,top=y-h-26,below=false;if(top<10){top=y+26;below=true;}
  left=Math.max(10,Math.min(V.w-w-10,left));top=Math.max(10,Math.min(V.h-h-10,top));
  pop.style.left=left+'px';pop.style.top=top+'px';pop.classList.toggle('below',below);pop.style.setProperty('--ax',Math.max(14,Math.min(w-14,x-left))+'px');}
 function closePop(){pop.hidden=true;popAt=null;}
 function openLocal(id,voar=false){const l=loc(id);if(!l)return;const t=TIPOS[l.tipo]?l.tipo:'ponto',ss=sessoesDe(id),vs=viagens().filter(v=>v.de===id||v.para===id);
  const nota=l.nota&&A.byStem(l.nota);
  pop.innerHTML=`<button type="button" class="wm-x" data-act="fechar" aria-label="Fechar">×</button><div class="wm-pop-kind" style="--c:${TIPOS[t].cor}">${glyph(t)}<span>${esc(TIPOS[t].um)} · ${esc(regiao(l))}</span></div><h3>${esc(l.nome)}</h3>
   ${gm()&&!seen(l)?`<p class="wm-flag ${l.visivel==='mestre'?'red':''}">${l.visivel==='mestre'?'Segredo do mestre: os jogadores nunca veem.':'Os jogadores ainda não veem este local.'}</p>`:''}
   ${l.descricao?`<p>${rico(l.descricao,l.id)}</p>`:'<p class="wm-soft">Sem descrição ainda.</p>'}
   ${gm()&&l.segredo?`<div class="wm-secret"><strong>Só para o mestre</strong>${rico(l.segredo,l.id)}</div>`:''}
   ${ss.length?`<div class="wm-sub">Sessões aqui</div><div class="wm-chips">${ss.map(s=>`<button type="button" class="wm-chip" data-sessao="${s.numero}">Sessão ${num(s.numero)}</button>`).join('')}</div>`:''}
   ${vs.length?`<div class="wm-sub">Viagens</div><ul class="wm-trips">${vs.map(v=>{const out=v.de===id,o=loc(out?v.para:v.de);return `<li><button type="button" data-ir="${esc(o.id)}">${out?'Partiu para':'Chegou de'} <b>${esc(o.nome)}</b></button>${v.sessao!=null?` <small>sessão ${num(v.sessao)}</small>`:''}</li>`;}).join('')}</ul>`:''}
   ${(()=>{const {eds,cs}=noticias(l);if(!eds.length&&!cs.length)return '';return `<div class="wm-sub">No jornal</div><ul class="wm-trips wm-news">${eds.map(e=>`<li><a href="#jornal/${e.number}">Edição nº ${esc(e.number)}</a> <small>${esc(e.headline)}</small></li>`).join('')}${cs.map(p=>`<li><a href="#jornal/procurados">Procurado: ${esc(p.name)}</a> <small>฿ ${fmtN(p.amount||0)}</small></li>`).join('')}</ul>`;})()}
   ${dados.navio?.local===id?'<p class="wm-flag">⚓ A tripulação está aqui agora.</p>':''}
   <div class="wm-pop-actions">${nota?`<a class="btn btn-light" href="${A.link(nota.id)}">Abrir a nota</a>`:''}${l.mapaIlha?'<button type="button" class="btn btn-light" data-act="ilha">Mapa da ilha</button>':''}
   ${editing?`<button type="button" class="btn btn-light" data-act="editar">Editar</button><button type="button" class="btn btn-light" data-act="viagem">Nova viagem daqui</button><button type="button" class="btn btn-light" data-act="navio">${dados.navio?.local===id?'Tirar o navio daqui':'A tripulação está aqui'}</button>`:''}</div>`;
  pop.dataset.id=id;pop.dataset.kind='local';pop.hidden=false;popAt=l.pos;
  if(voar)fit([l.pos]);placePop();history.replaceState(null,'','#mapa/'+encodeURIComponent(id));}
 function openViagem(id){const v=viagens().find(x=>x.id===id);if(!v)return;const a=loc(v.de),b=loc(v.para),pts=caminho(v);
  pop.innerHTML=`<button type="button" class="wm-x" data-act="fechar" aria-label="Fechar">×</button><div class="wm-pop-kind" style="--c:#b0552b"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17c4-8 8 2 16-8 M15 9h5v5"/></svg><span>Viagem${v.sessao!=null?' · sessão '+num(v.sessao):''}</span></div>
   <h3>${esc(a.nome)} → ${esc(b.nome)}</h3>${gm()&&v.visivel==='mestre'?'<p class="wm-flag red">Só o mestre vê esta viagem.</p>':''}${(()=>{const t=tempo(v);if(!t)return '';
    return `<div class="wm-travel"><b>≈ ${fmtN(t.km)} km</b> pela escala do mapa${t.dias!=null?` · <b>${t.registrado?'':'≈ '}${fmtN(t.dias)} ${t.dias===1?'dia':'dias'}</b>${t.registrado?' (registrado)':` a ${fmtN(t.nos)} nós, ${t.horas} h por dia`}`:gm()?'. Para estimar os dias, informe a velocidade do navio em <b>Editar o mapa → Viagem e escala</b>.':''}</div>`;})()}${v.descricao?`<p>${rico(v.descricao)}</p>`:''}${gm()&&v.segredo?`<div class="wm-secret"><strong>Só para o mestre</strong>${rico(v.segredo)}</div>`:''}
   <div class="wm-pop-actions"><button type="button" class="btn btn-light" data-ir="${esc(a.id)}">Ir para ${esc(a.nome)}</button><button type="button" class="btn btn-light" data-ir="${esc(b.id)}">Ir para ${esc(b.nome)}</button>
   ${editing?'<button type="button" class="btn btn-light" data-act="editar-viagem">Editar</button><button type="button" class="btn btn-light" data-act="redesenhar">Desenhar o caminho</button>':''}</div>`;
  pop.dataset.id=id;pop.dataset.kind='viagem';pop.hidden=false;popAt=pts[Math.floor(pts.length/2)];placePop();}
 function verIlha(l){const d=document.createElement('dialog');d.className='wm-dialog wm-island';const svg=l.mapaIlha.startsWith('<svg');
  d.innerHTML=`<div class="wm-dialog-head"><h3>${esc(l.nome)}</h3><button type="button" class="wm-x" aria-label="Fechar">×</button></div><div class="wm-island-map">${svg?l.mapaIlha:`<img src="${esc(l.mapaIlha)}" alt="Mapa de ${esc(l.nome)}">`}</div>`;
  root.appendChild(d);d.querySelector('.wm-x').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());d.showModal();}

 /* ---------- painel lateral ---------- */
 function renderPanel(){const ls=locais(),q=A.norm($('.wm-search').value.trim()),on=new Set(prefs.tipos);
  const cont={};for(const l of ls){const t=TIPOS[l.tipo]?l.tipo:'ponto';cont[t]=(cont[t]||0)+1;}
  $('.wm-cats').innerHTML=Object.entries(TIPOS).map(([k,t])=>`<button type="button" class="wm-cat ${on.has(k)?'on':''}" data-tipo="${k}" style="--c:${t.cor}" aria-pressed="${on.has(k)}"><span class="wm-cat-ico">${glyph(k)}</span><span>${t.nome}</span><b>${cont[k]||0}</b></button>`).join('');
  $('[data-tab="locais"]').classList.toggle('on',prefs.aba!=='sessoes');$('[data-tab="sessoes"]').classList.toggle('on',prefs.aba==='sessoes');
  const lista=$('.wm-list');
  if(prefs.aba==='sessoes'){const ss=sessoes();
   const pos=ate==null?ss.length:Math.max(0,ss.filter(s=>s.numero<=ate).length);
   lista.innerHTML=(ss.length?`<div class="wm-timeline"><div class="wm-timeline-top"><button type="button" class="btn btn-light" data-act="tocar">${tocando?'■ Parar':'▶ Reviver a viagem'}</button><span class="wm-range-label">${rotuloAte(ss)}</span></div><input type="range" class="wm-range" min="0" max="${ss.length}" step="1" value="${pos}" aria-label="Linha do tempo das sessões"></div><button type="button" class="wm-all ${sel==null&&ate==null?'on':''}" data-sessao="">Todas as sessões e o trajeto completo</button>`+ss.map(s=>`<article class="wm-session ${sel===s.numero?'on':''} ${gm()&&s.visivel==='mestre'?'gm':''}" data-sessao="${s.numero}" tabindex="0"><div class="wm-session-top"><b>Sessão ${num(s.numero)}</b>${s.data?`<small>${esc(dataBR(s.data))}</small>`:''}</div>${s.titulo?`<strong>${esc(s.titulo)}</strong>`:''}${s.resumo?`<p>${rico(s.resumo)}</p>`:''}${gm()&&s.segredo?`<div class="wm-secret"><strong>Só para o mestre</strong>${rico(s.segredo)}</div>`:''}${(s.locais||[]).length?`<div class="wm-chips">${s.locais.map(i=>loc(i)).filter(Boolean).map(l=>`<span class="wm-chip static">${esc(l.nome)}</span>`).join('')}</div>`:''}${s.nota&&A.byStem(s.nota)?`<a class="text-link" href="${A.link(A.byStem(s.nota).id)}">Abrir a nota da sessão</a>`:''}${editing?`<button type="button" class="wm-mini" data-editar-sessao="${s.numero}">Editar</button>`:''}</article>`).join('')
    :`<p class="wm-empty">${gm()?'Nenhuma sessão no mapa ainda. Em <b>Editar o mapa</b>, use <b>+ Sessão</b> para registrar onde cada sessão se passou.':'O diário de bordo ainda está em branco. As sessões aparecem aqui conforme a viagem avança.'}</p>`);
  }else{const f=ls.filter(l=>on.has(TIPOS[l.tipo]?l.tipo:'ponto')&&(!q||A.norm(l.nome+' '+(l.descricao||'')+' '+regiao(l)).includes(q))).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
   lista.innerHTML=f.length?f.map(l=>{const t=TIPOS[l.tipo]?l.tipo:'ponto';return `<button type="button" class="wm-row" data-ir="${esc(l.id)}" style="--c:${TIPOS[t].cor}"><span class="wm-cat-ico">${glyph(t)}</span><span><strong>${esc(l.nome)}</strong><small>${esc(regiao(l))}${gm()&&!seen(l)?' · '+(l.visivel==='mestre'?'segredo':'oculto dos jogadores'):''}</small></span></button>`;}).join('')
    :`<p class="wm-empty">${q?'Nenhum local com esse nome.':gm()?'Nenhum local ainda. Clique em <b>Editar o mapa</b> e depois no mar para colocar a primeira ilha.':'Nenhum local descoberto ainda. O mapa se completa conforme a tripulação navega.'}</p>`;}
  $('.wm-range')?.addEventListener('input',e=>{const i=+e.target.value,ss=sessoes();pararTocar();ate=i>=ss.length?null:i===0?-1e9:ss[i-1].numero;sel=ate==null||i===0?null:ate;
   $('.wm-range-label').textContent=rotuloAte(ss);root.querySelectorAll('.wm-session').forEach(c=>c.classList.toggle('on',+c.dataset.sessao===sel));$('.wm-all')?.classList.toggle('on',ate==null);draw();});
  const ed=$('.wm-edit');if(ed)ed.innerHTML=editPanel();}
 function rotuloAte(ss){if(ate==null)return 'Até hoje';if(ate<-1e8)return 'Antes da primeira sessão';const s=ss.find(x=>x.numero===ate);return `Até a sessão ${num(ate)}${s?.titulo?' · '+s.titulo:''}`;}
 /* Reviver a viagem: o navio percorre cada rota, sessão por sessão. */
 const esperar=ms=>new Promise(r=>setTimeout(r,ms));
 function pararTocar(){if(tocando){tocando.parar=true;tocando=null;navAnim=null;}}
 async function tocar(){if(tocando){pararTocar();renderPanel();draw();return;}const token=tocando={parar:false},ss=sessoes(),vs=ordem().filter(v=>v.sessao!=null);
  if(!vs.length){A.toast('Ainda não há viagens ligadas a sessões.');tocando=null;return;}
  prefs.aba='sessoes';closePop();const pts=[];vs.forEach(v=>pts.push(...(caminho(v)||[])));fit(pts);ate=-1e9;sel=null;renderPanel();await esperar(500);
  for(const s of ss){if(token.parar)return;ate=s.numero;sel=s.numero;renderPanel();draw();
   for(const v of vs.filter(x=>x.sessao===s.numero)){const poly=amostras(caminho(v)||[]);if(poly.length<2)continue;const dur=Math.min(3200,Math.max(1100,comprimento(poly)*6)),t0=performance.now();
    await new Promise(fim=>{const passo=t=>{if(token.parar)return fim();const f=Math.min(1,(t-t0)/dur);navAnim=pontoEm(poly,f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2);draw();f<1?requestAnimationFrame(passo):fim();};requestAnimationFrame(passo);});}
   navAnim=null;await esperar(450);}
  if(token.parar)return;tocando=null;ate=null;sel=null;renderPanel();draw();}
 function editPanel(){if(!canEdit())return '';const sujo=JSON.stringify(dados)!==JSON.stringify(original);
  if(!editing)return `<button type="button" class="btn btn-primary wm-edit-on" data-act="editar-mapa">${A.icon('tools')}Editar o mapa</button>${sujo?'<p class="wm-dirty">Há alterações ainda não salvas no Vault.</p>':''}`;
  return `<div class="wm-edit-box"><strong>Editando o mapa</strong><p>Clique no mar para pôr um local; para uma nota ou sessão no meio do mar, escolha o tipo <b>Nota no mar</b>. Arraste um marcador para mudá-lo de lugar. Clique num local ou numa rota para editar.</p>
   <div class="wm-edit-grid"><button type="button" class="btn btn-light" data-act="nova-sessao">+ Sessão</button><button type="button" class="btn btn-light" data-act="nova-viagem">+ Viagem</button></div><button type="button" class="btn btn-light" data-act="escala">Viagem e escala</button>
   ${localSave?`<button type="button" class="btn btn-primary" data-act="salvar" ${sujo?'':'disabled'}>Salvar no Vault</button>`:`<button type="button" class="btn btn-primary" data-act="baixar" ${sujo?'':'disabled'}>Baixar o arquivo do mapa</button><p class="wm-soft">Neste site não dá para gravar no Vault. Abra o portal pelo <b>iniciar-portal.ps1</b> para salvar direto, ou baixe o arquivo e troque o <code>03 Mundo/Mapas/dados/mapa-interativo.json</code>. As alterações ficam guardadas neste navegador até lá.</p>`}
   ${sujo?'<button type="button" class="btn btn-light" data-act="descartar">Descartar alterações</button>':''}<button type="button" class="btn btn-light" data-act="editar-mapa">Sair da edição</button></div>`;}

 /* ---------- edição ---------- */
 function mudou(){refs=null;gravar(DRAFT,JSON.stringify(dados)===JSON.stringify(original)?null:{base:JSON.stringify(original),dados});renderPins();renderPanel();}
 function slug(nome){let s=A.norm(nome).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'local',id=s,i=2;const ids=new Set(locais().map(l=>l.id).concat(W.fixos.map(f=>f.id)));while(ids.has(id))id=s+'-'+i++;return id;}
 function dialog(titulo,corpo,onSave,onDelete){const d=document.createElement('dialog');d.className='wm-dialog';
  d.innerHTML=`<form method="dialog"><div class="wm-dialog-head"><h3>${esc(titulo)}</h3><button type="button" class="wm-x" data-fechar aria-label="Fechar">×</button></div><div class="wm-form">${corpo}</div><div class="wm-dialog-actions">${onDelete?'<button type="button" class="btn btn-light wm-del" data-apagar>Apagar</button>':''}<span></span><button type="button" class="btn btn-light" data-fechar>Cancelar</button><button class="btn btn-primary" value="ok">Salvar</button></div></form>`;
  root.appendChild(d);d.querySelectorAll('[data-fechar]').forEach(b=>b.onclick=()=>d.close());
  d.querySelector('[data-apagar]')?.addEventListener('click',()=>{if(confirm('Apagar mesmo?')){onDelete();d.close();}});
  d.querySelector('form').addEventListener('submit',e=>{const f=Object.fromEntries(new FormData(e.target));f._multi=n=>[...e.target.querySelectorAll(`[name="${n}"]:checked`)].map(i=>i.value);if(onSave(f,e.target)===false)e.preventDefault();});
  d.addEventListener('close',()=>d.remove());d.showModal();d.querySelector('input,select,textarea')?.focus();return d;}
 const campo=(rot,html,dica='')=>`<label class="wm-field"><span>${rot}</span>${html}${dica?`<small>${dica}</small>`:''}</label>`;
 const notas=()=>`<datalist id="wm-notas">${A.docs.filter(d=>!d.path.startsWith('02 Regras/')).map(d=>`<option value="${esc(d.path.split('/').pop().replace(/\.md$/,''))}">${esc(d.title)}</option>`).join('')}</datalist>`;
 function quemVe(item){return item.visivel==='mestre'?'mestre':item.descoberto?'jogadores':'novo';}
 function formLocal(id,pos){const l=id?loc(id):null,cru=id?dados.locais.find(x=>x.id===id):null,fixo=l?.fixo;
  const corpo=campo('Nome',`<input name="nome" required maxlength="80" value="${esc(l?.nome||'')}" ${fixo?'disabled':''}>`,fixo?'Vem do arquivo da ilha (ou do mapa aprovado); a posição fica presa à costa.':'')
   +campo('Tipo',`<select name="tipo" ${fixo?'disabled':''}>${Object.entries(TIPOS).map(([k,t])=>`<option value="${k}" ${(l?.tipo||'ilha')===k?'selected':''}>${t.um}</option>`).join('')}</select>`)
   +(fixo?'':campo('Quem vê',`<select name="ver">${Object.entries(VER).map(([k,t])=>`<option value="${k}" ${quemVe(l||{})===k?'selected':''}>${t}</option>`).join('')}</select>`))
   +campo('Descrição',`<textarea name="descricao" rows="4" maxlength="4000" placeholder="O que os jogadores sabem deste lugar">${esc(l?.descricao||'')}</textarea>`,'Nomes de ilhas e personagens viram link sozinhos; [[Nome]] força o link.')
   +campo('Só para o mestre',`<textarea name="segredo" rows="3" maxlength="2000" placeholder="Segredos, ganchos, quem manda ali (nunca vai para os jogadores)">${esc(l?.segredo||'')}</textarea>`)
   +campo('Nota do Vault',`<input name="nota" list="wm-notas" value="${esc(l?.nota||'')}" placeholder="Nome da nota (opcional)">${notas()}`,'Abre pelo botão "Abrir a nota" no mapa.');
  dialog(id?'Editar local':'Novo local',corpo,f=>{
   if(fixo){const o=cru||{id};o.descricao=f.descricao.trim();o.segredo=f.segredo.trim();o.nota=f.nota.trim();if(!cru)dados.locais.push(o);}
   else{const o=cru||{id:slug(f.nome),pos:pos.map(n=>Math.round(n))};o.nome=f.nome.trim();o.tipo=f.tipo;o.visivel=f.ver==='mestre'?'mestre':'jogadores';o.descoberto=f.ver==='jogadores';
    o.descricao=f.descricao.trim();o.segredo=f.segredo.trim();o.nota=f.nota.trim();if(!cru)dados.locais.push(o);id=o.id;}
   mudou();openLocal(id);},
   id&&cru&&!fixo?()=>{dados.locais=dados.locais.filter(x=>x.id!==id);dados.viagens=dados.viagens.filter(v=>v.de!==id&&v.para!==id);dados.sessoes.forEach(s=>s.locais=(s.locais||[]).filter(i=>i!==id));closePop();mudou();}:null);}
 function formSessao(numero){const s=numero!=null?dados.sessoes.find(x=>x.numero===numero):null,prox=Math.max(0,...dados.sessoes.map(x=>x.numero||0))+1,ls=locais().sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  const corpo=`<div class="wm-two">${campo('Número',`<input name="numero" type="number" min="0" required value="${s?s.numero:prox}">`)}${campo('Data',`<input name="data" type="date" value="${esc(s?.data||'')}">`)}</div>`
   +campo('Título',`<input name="titulo" maxlength="120" value="${esc(s?.titulo||'')}">`)
   +campo('Resumo',`<textarea name="resumo" rows="3" maxlength="2000" placeholder="O que aconteceu, do jeito que os jogadores lembram">${esc(s?.resumo||'')}</textarea>`)
   +`<fieldset class="wm-field"><span>Onde se passou</span><div class="wm-checks">${ls.length?ls.map(l=>`<label><input type="checkbox" name="locais" value="${esc(l.id)}" ${(s?.locais||[]).includes(l.id)?'checked':''}> ${esc(l.nome)}</label>`).join(''):'<small>Coloque os locais no mapa primeiro.</small>'}</div></fieldset>`
   +campo('Quem vê',`<select name="ver"><option value="jogadores">Os jogadores também</option><option value="mestre" ${s?.visivel==='mestre'?'selected':''}>Só eu</option></select>`)
   +campo('Só para o mestre',`<textarea name="segredo" rows="2" maxlength="2000">${esc(s?.segredo||'')}</textarea>`)
   +campo('Nota do Vault',`<input name="nota" list="wm-notas" value="${esc(s?.nota||'')}" placeholder="Nota da sessão (opcional)">${notas()}`);
  dialog(s?'Editar sessão':'Nova sessão',corpo,(f,form)=>{const n=parseInt(f.numero,10);if(dados.sessoes.some(x=>x.numero===n&&x!==s)){alert('Já existe uma sessão com esse número.');return false;}
   const o=s||{};const antigo=o.numero;Object.assign(o,{numero:n,data:f.data,titulo:f.titulo.trim(),resumo:f.resumo.trim(),locais:f._multi('locais'),visivel:f.ver,segredo:f.segredo.trim(),nota:f.nota.trim()});
   if(!s)dados.sessoes.push(o);else if(antigo!==n)dados.viagens.forEach(v=>{if(v.sessao===antigo)v.sessao=n;});
   prefs.aba='sessoes';sel=n;mudou();},
   s?()=>{dados.sessoes=dados.sessoes.filter(x=>x!==s);dados.viagens.forEach(v=>{if(v.sessao===s.numero)v.sessao=null;});sel=null;mudou();}:null);}
 function formViagem(id,de){const v=id?dados.viagens.find(x=>x.id===id):null,ls=locais().sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  if(ls.length<2){A.toast('Coloque pelo menos dois locais no mapa antes de traçar uma viagem.');return;}
  const op=sel0=>ls.map(l=>`<option value="${esc(l.id)}" ${sel0===l.id?'selected':''}>${esc(l.nome)}</option>`).join('');
  const ultima=dados.sessoes.reduce((m,s)=>Math.max(m,s.numero||0),0);
  const corpo=`<div class="wm-two">${campo('De',`<select name="de">${op(v?.de||de||ls[0].id)}</select>`)}${campo('Para',`<select name="para">${op(v?.para||ls.find(l=>l.id!==(v?.de||de||ls[0].id)).id)}</select>`)}</div>`
   +campo('Sessão',`<select name="sessao"><option value="">Nenhuma</option>${sessoes().map(s=>`<option value="${s.numero}" ${(v?v.sessao:ultima)===s.numero?'selected':''}>Sessão ${num(s.numero)}${s.titulo?' · '+esc(s.titulo):''}</option>`).join('')}</select>`)
   +campo('Descrição',`<textarea name="descricao" rows="2" maxlength="1000">${esc(v?.descricao||'')}</textarea>`)
   +`<div class="wm-two">${campo('Dias de viagem',`<input name="dias" type="number" min="0" step="0.5" value="${esc(v?.dias??'')}" placeholder="estimado">`,'O que aconteceu na mesa; vazio = estimativa.')}${campo('Velocidade (nós)',`<input name="nos" type="number" min="0" step="1" value="${esc(v?.nos??'')}" placeholder="${esc(cfg().nos??'')}">`,'Vazio = a do navio.')}</div>`
   +campo('Quem vê',`<select name="ver"><option value="jogadores">Os jogadores também</option><option value="mestre" ${v?.visivel==='mestre'?'selected':''}>Só eu</option></select>`)
   +campo('Só para o mestre',`<textarea name="segredo" rows="2" maxlength="1000">${esc(v?.segredo||'')}</textarea>`)
   +(v?'':`<label class="wm-inline"><input type="checkbox" name="desenhar" checked> Desenhar o caminho no mapa depois de salvar (senão sai uma curva simples)</label>`);
  dialog(v?'Editar viagem':'Nova viagem',corpo,f=>{if(f.de===f.para){alert('Escolha dois locais diferentes.');return false;}
   const o=v||{id:'v'+Date.now().toString(36),pontos:[]};Object.assign(o,{de:f.de,para:f.para,sessao:f.sessao===''?null:parseInt(f.sessao,10),descricao:f.descricao.trim(),visivel:f.ver,segredo:f.segredo.trim(),dias:f.dias===''?null:+f.dias,nos:f.nos===''?null:+f.nos});
   if(!v)dados.viagens.push(o);mudou();if(f.desenhar)desenhar(o.id);else openViagem(o.id);},
   v?()=>{dados.viagens=dados.viagens.filter(x=>x!==v);closePop();mudou();}:null);}
 function formEscala(){const c=cfg();
  const corpo=campo('Escala do mapa (km por unidade)',`<input name="escala_km" type="number" min="0.1" step="0.1" required value="${esc(c.escala_km)}">`,'O mapa-múndi tem 2.000 unidades de largura e é esquemático. 20 dá um mundo de uns 40.000 km de volta; ajuste se quiser outra escala.')
   +`<div class="wm-two">${campo('Velocidade do navio (nós)',`<input name="nos" type="number" min="0" step="1" value="${esc(c.nos??'')}" placeholder="ex.: 12">`,'Soma da propulsão menos a penalidade de tamanho (Embarcações).')}${campo('Horas navegando por dia',`<input name="horas" type="number" min="1" max="24" step="1" value="${esc(c.horas)}">`,'Veículo aquático pode ir até 24 h.')}</div>`
   +'<p class="wm-soft">Dias = distância ÷ (nós × 2 km/h × horas por dia), usando 1 nó = 2 km/h das tabelas do livro. Correntes e clima ficam com você: anote os dias reais na viagem.</p>';
  dialog('Viagem e escala',corpo,f=>{dados.config={escala_km:+f.escala_km||20,nos:f.nos===''?null:+f.nos,horas:Math.min(24,Math.max(1,+f.horas||24))};mudou();});}
 function desenhar(id){const v=dados.viagens.find(x=>x.id===id);if(!v)return;closePop();pick={tipo:'caminho',id,antes:clone(v.pontos||[])};v.pontos=[];hint(true);draw();fit([loc(v.de).pos,loc(v.para).pos]);}
 function fimDesenho(ok){if(!pick)return;const v=dados.viagens.find(x=>x.id===pick.id);if(v&&!ok)v.pontos=pick.antes;const id=pick.id;pick=null;hint(false);mudou();if(v)openViagem(id);}
 function hint(on){const h=$('.wm-hint');h.hidden=!on;if(on)h.innerHTML=`<span>Clique no mar para marcar o caminho, do começo ao fim da viagem.</span><button type="button" class="btn btn-light" data-act="desfazer-ponto">Desfazer ponto</button><button type="button" class="btn btn-primary" data-act="fim-desenho">Concluir</button><button type="button" class="btn btn-light" data-act="cancelar-desenho">Cancelar</button>`;}
 async function salvar(){try{const r=await fetch('api/mapa',{method:'POST',headers:{'Content-Type':'application/json','X-OPRPG':'mapa'},body:JSON.stringify(dados)});if(!r.ok)throw new Error(await r.text());
   original=clone(dados);gravar(DRAFT,null);renderPanel();A.toast('Mapa salvo no Vault. Rode o sincronizar-github.ps1 para ele ir ao site.');}
  catch(e){A.toast('Não consegui salvar no Vault. As alterações continuam guardadas neste navegador.');}}
 function baixar(){const b=new Blob([JSON.stringify({_leia:'Dados do mapa interativo. Veja a nota 03 Mundo/Mapas/00 Mapas.',...dados},null,2)+'\n'],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='mapa-interativo.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

 /* ---------- interação ---------- */
 function bind(){const ptrs=new Map();let start=null,moved=false,drag=null,pinch=null;
  stage.addEventListener('wheel',e=>{e.preventDefault();const r=stage.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*(e.deltaMode?0.05:0.0015)),e.clientX-r.left,e.clientY-r.top);},{passive:false});
  stage.addEventListener('dblclick',e=>{if(e.target.closest('.wm-pop,.wm-controls,.wm-hint'))return;const r=stage.getBoundingClientRect();zoomAt(2,e.clientX-r.left,e.clientY-r.top);});
  stage.addEventListener('pointerdown',e=>{if(e.button>0||e.target.closest('.wm-pop,.wm-controls,.wm-hint'))return;const r=stage.getBoundingClientRect();
   ptrs.set(e.pointerId,[e.clientX-r.left,e.clientY-r.top]);stage.setPointerCapture(e.pointerId);
   if(ptrs.size===1){start={x:e.clientX,y:e.clientY,tx:V.tx,ty:V.ty,alvo:e.target};moved=false;const pin=e.target.closest('.wm-pin');const l=pin&&loc(pin.dataset.id);
    drag=editing&&!pick&&l&&!l.fixo?{id:l.id}:null;}
   else if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),k:V.k};drag=null;}});
  stage.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;const r=stage.getBoundingClientRect();ptrs.set(e.pointerId,[e.clientX-r.left,e.clientY-r.top]);
   if(ptrs.size===2&&pinch){const [a,b]=[...ptrs.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);zoomAt(pinch.k*d/pinch.d/V.k,(a[0]+b[0])/2,(a[1]+b[1])/2);moved=true;return;}
   if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(!moved&&Math.hypot(dx,dy)<5)return;moved=true;
   if(drag){const o=dados.locais.find(x=>x.id===drag.id);const p=toM(e.clientX-r.left,e.clientY-r.top);o.pos=[Math.round(Math.max(0,Math.min(W.regioes.largura,p[0]))),Math.round(Math.max(0,Math.min(W.regioes.altura,p[1])))];drag.moveu=true;draw();return;}
   V.tx=start.tx+dx;V.ty=start.ty+dy;clamp();draw();stage.classList.add('panning');});
  const fim=e=>{if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);stage.classList.remove('panning');if(ptrs.size<2)pinch=null;
   if(ptrs.size)return;const r=stage.getBoundingClientRect(),alvo=start?.alvo;
   if(drag?.moveu){mudou();if(popAt&&pop.dataset.id===drag.id)openLocal(drag.id);}
   else if(!moved&&start&&e.type==='pointerup')clique(alvo,e.clientX-r.left,e.clientY-r.top);
   start=null;drag=null;};
  stage.addEventListener('pointerup',fim);stage.addEventListener('pointercancel',fim);
  stage.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select'))return;const m={'+':()=>zoomAt(1.4),'=':()=>zoomAt(1.4),'-':()=>zoomAt(1/1.4),'0':()=>fit(),ArrowLeft:()=>pan(80,0),ArrowRight:()=>pan(-80,0),ArrowUp:()=>pan(0,80),ArrowDown:()=>pan(0,-80),Escape:()=>pick?fimDesenho(false):closePop(),Enter:()=>pick&&fimDesenho(true)}[e.key];if(m){e.preventDefault();m();}});
  root.addEventListener('click',e=>{const t=e.target.closest('[data-act],[data-tipo],[data-tab],[data-sessao],[data-ir],[data-pessoa],[data-editar-sessao]');if(!t||t.closest('.wm-stage')&&!t.closest('.wm-pop,.wm-controls,.wm-hint'))return;
   if(t.dataset.tipo){const s=new Set(prefs.tipos);s.has(t.dataset.tipo)?s.delete(t.dataset.tipo):s.add(t.dataset.tipo);prefs.tipos=[...s];salvarPrefs();renderPins();renderPanel();return;}
   if(t.dataset.tab){prefs.aba=t.dataset.tab;salvarPrefs();renderPanel();return;}
   if(t.dataset.pessoa){verPessoa(parseInt(t.dataset.pessoa,10));return;}
   if(t.dataset.editarSessao){formSessao(parseInt(t.dataset.editarSessao,10));return;}
   if(t.dataset.sessao!==undefined){selecionar(t.dataset.sessao===''?null:parseInt(t.dataset.sessao,10));return;}
   if(t.dataset.ir){pararTocar();openLocal(t.dataset.ir,true);if(innerWidth<760)root.classList.remove('panel-open');return;}
   acao(t.dataset.act);});
  $('.wm-search').addEventListener('input',()=>{prefs.aba='locais';renderPanel();});
  $('.wm-search').addEventListener('keydown',e=>{if(e.key==='Enter'){const b=$('.wm-list [data-ir]');if(b)openLocal(b.dataset.ir,true);}});
  root.querySelectorAll('[data-pref]').forEach(c=>c.addEventListener('change',()=>{prefs[c.dataset.pref]=c.checked;salvarPrefs();renderPins();}));
  ro=new ResizeObserver(()=>{const r=stage.getBoundingClientRect();if(!r.width)return;const c=toM(V.w/2,V.h/2),primeira=V.w===1;V.w=r.width;V.h=r.height;
   if(primeira){inicio();return;}if(V.k<fitK())V.k=fitK();V.tx=V.w/2-c[0]*V.k;V.ty=V.h/2-c[1]*V.k;clamp();draw();});ro.observe(stage);
  document.addEventListener('fullscreenchange',telaCheiaMudou);}
 /* Abre perto de onde a tripulação está (os locais do mapa, sem os marcos fixos); sem locais, o mapa inteiro. */
 function inicio(){const pts=locais().filter(l=>!l.fixo||l.tipo==='ilha').map(l=>l.pos);fit(pts.length?pts:null,false);}
 function pan(dx,dy){V.tx+=dx;V.ty+=dy;clamp();draw();}
 function clique(alvo,sx,sy){
  if(pick){const v=dados.viagens.find(x=>x.id===pick.id);v.pontos.push(toM(sx,sy).map(n=>Math.round(n)));draw();return;}
  const pin=alvo?.closest?.('.wm-pin');if(pin){openLocal(pin.dataset.id);return;}
  const rota=alvo?.closest?.('.wm-route');if(rota?.dataset.v){openViagem(rota.dataset.v);return;}
  if(!pop.hidden){closePop();history.replaceState(null,'','#mapa');return;}
  if(editing)formLocal(null,toM(sx,sy));}
 function acao(a){const id=pop.dataset.id;
  ({fechar:()=>{closePop();history.replaceState(null,'','#mapa');},ilha:()=>verIlha(loc(id)),editar:()=>formLocal(id),viagem:()=>formViagem(null,id),'editar-viagem':()=>formViagem(id),redesenhar:()=>desenhar(id),
   'editar-mapa':()=>{editing=!editing;root.classList.toggle('editing',editing);if(!editing&&pick)fimDesenho(false);renderPanel();if(popAt)pop.dataset.kind==='local'?openLocal(id):openViagem(id);},
   'nova-sessao':()=>formSessao(null),'nova-viagem':()=>formViagem(null),salvar,baixar,tocar,'escala':formEscala,
   navio:()=>{dados.navio=dados.navio?.local===id?null:{local:id};mudou();openLocal(id);},
   descartar:()=>{if(!confirm('Descartar as alterações que ainda não foram para o Vault?'))return;dados=clone(original);gravar(DRAFT,null);closePop();renderPins();renderPanel();},
   'desfazer-ponto':()=>{const v=dados.viagens.find(x=>x.id===pick?.id);v?.pontos.pop();draw();},'fim-desenho':()=>fimDesenho(true),'cancelar-desenho':()=>fimDesenho(false),
   'zoom-mais':()=>zoomAt(1.5),'zoom-menos':()=>zoomAt(1/1.5),inteiro:()=>fit(),'tela-cheia':telaCheia,painel:()=>root.classList.toggle('panel-open')}[a]||(()=>{}))();}
 function selecionar(n){pararTocar();ate=null;sel=n;prefs.aba='sessoes';closePop();renderPanel();if(n==null){draw();fit();history.replaceState(null,'','#mapa');return;}
  const s=sessoes().find(x=>x.numero===n),pts=[];(s?.locais||[]).forEach(i=>{const l=loc(i);if(l)pts.push(l.pos);});
  viagens().filter(v=>v.sessao===n).forEach(v=>pts.push(...(caminho(v)||[])));draw();if(pts.length)fit(pts);history.replaceState(null,'','#mapa/sessao/'+n);}
 function telaCheia(){if(document.fullscreenElement){document.exitFullscreen();return;}
  if(root.requestFullscreen)root.requestFullscreen().catch(()=>root.classList.toggle('wm-full'));else root.classList.toggle('wm-full');
  if(!root.requestFullscreen)telaCheiaMudou();}
 function telaCheiaMudou(){const on=!!document.fullscreenElement||root?.classList.contains('wm-full');const b=root?.querySelector('[data-act="tela-cheia"]');if(b){b.title=on?'Sair da tela cheia':'Tela cheia';b.classList.toggle('on',on);}}
 const salvarPrefs=()=>gravar(PREFS,prefs);

 function mount(main,api,sub,extra){A=api;W=A.D.worldMap;leave();
  if(!W){main.innerHTML='<section class="empty-state"><h2>O mapa ainda não foi gerado.</h2></section>';return;}
  prefs={tipos:Object.keys(TIPOS),nomes:true,rotas:true,navio:true,dias:true,jornal:true,aba:'locais',...ler(PREFS,{})};
  original=clone(W.dados);dados=clone(W.dados);refs=null;sel=null;pick=null;popAt=null;editing=false;ate=null;navAnim=null;tocando=null;
  const rasc=canEdit()?ler(DRAFT,null):null;
  main.innerHTML=`<section class="wm ${A.isPlayer()?'':'gm-view'}" aria-label="Mapa do mundo">
   <aside class="wm-panel"><div class="wm-head"><div class="eyebrow">${A.isPlayer()?'CARTA DE NAVEGAÇÃO':'CARTA DO MESTRE'}</div><h1>Mapa do mundo</h1><p>${A.isPlayer()?'Os lugares que a tripulação já conhece e o caminho que fez até aqui.':'Locais, sessões e viagens. O que não foi descoberto fica só aqui.'}</p></div>
    ${rasc?'<div class="wm-draft"><p>Este navegador tem alterações do mapa que não foram para o Vault.</p><button type="button" class="btn btn-primary" data-rascunho="usar">Continuar de onde parei</button><button type="button" class="btn btn-light" data-rascunho="apagar">Descartar</button></div>':''}
    <input class="wm-search" type="search" placeholder="Buscar ilha, cidade, lugar…" aria-label="Buscar local no mapa">
    <div class="wm-cats"></div>
    <div class="wm-toggles"><label><input type="checkbox" data-pref="nomes" ${prefs.nomes?'checked':''}> Nomes no mapa</label><label><input type="checkbox" data-pref="rotas" ${prefs.rotas?'checked':''}> Rotas da tripulação</label><label><input type="checkbox" data-pref="navio" ${prefs.navio?'checked':''}> Navio</label><label><input type="checkbox" data-pref="dias" ${prefs.dias?'checked':''}> Dias de viagem</label><label><input type="checkbox" data-pref="jornal" ${prefs.jornal?'checked':''}> Notícias do Jornal</label></div>
    <div class="wm-tabs" role="tablist"><button type="button" data-tab="locais">Locais</button><button type="button" data-tab="sessoes">Diário de bordo</button></div>
    <div class="wm-list"></div><div class="wm-edit"></div></aside>
   <div class="wm-stage" tabindex="0" aria-label="Mapa: arraste para mover, roda do mouse ou + e − para zoom">
    <div class="wm-base">${W.svg}</div><svg class="wm-over" xmlns="http://www.w3.org/2000/svg"></svg><div class="wm-pins"></div>
    <div class="wm-pop" hidden></div><div class="wm-hint" hidden></div>
    <div class="wm-controls"><button type="button" class="wm-ctl wm-ctl-panel" data-act="painel" title="Locais e sessões">${A.icon('list')}</button><button type="button" class="wm-ctl" data-act="zoom-mais" title="Aproximar">+</button><button type="button" class="wm-ctl" data-act="zoom-menos" title="Afastar">−</button><button type="button" class="wm-ctl" data-act="inteiro" title="Mapa inteiro">${A.icon('globe')}</button><button type="button" class="wm-ctl" data-act="tela-cheia" title="Tela cheia"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5"/></svg></button></div>
   </div></section>`;
  root=main.querySelector('.wm');stage=$('.wm-stage');base=$('.wm-base svg');over=$('.wm-over');pins=$('.wm-pins');pop=$('.wm-pop');panel=$('.wm-panel');
  base.setAttribute('preserveAspectRatio','none');
  root.querySelectorAll('[data-rascunho]').forEach(b=>b.onclick=()=>{if(b.dataset.rascunho==='usar'&&rasc.base===JSON.stringify(original))dados=rasc.dados;
   else if(b.dataset.rascunho==='usar'){if(confirm('O mapa no Vault mudou depois deste rascunho. Usar o rascunho mesmo assim? (o que mudou no Vault será substituído ao salvar)'))dados=rasc.dados;else return;}
   else gravar(DRAFT,null);root.querySelector('.wm-draft').remove();if(b.dataset.rascunho==='usar'){editing=true;root.classList.add('editing');}renderPins();renderPanel();});
  const r=stage.getBoundingClientRect();V.w=r.width||1;V.h=r.height||1;
  bind();renderPins();renderPanel();if(r.width)inicio();
  if(canEdit())fetch('api/mapa',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{localSave=!!j?.local;renderPanel();}).catch(()=>{});
  if(sub==='sessao'&&extra!=null)selecionar(parseInt(extra,10));else if(sub)openLocal(decodeURIComponent(sub),true);}
 function leave(){pararTocar();ro?.disconnect();ro=null;cancelAnimationFrame(anim);document.removeEventListener('fullscreenchange',telaCheiaMudou);if(document.fullscreenElement&&root&&document.fullscreenElement===root)document.exitFullscreen().catch(()=>{});root=null;base=null;}
 /* Aparições: sessões e lugares do mapa que citam o personagem (nota do mestre) ou "Ver no mapa" para a nota de um lugar. */
 function listaAparicoes(nomes){const cita=t=>nomes.some(n=>menciona(t,n)),ss=[],ls=[];
  for(const s of sessoes()){const txt=[s.titulo,s.resumo,gm()?s.segredo:'',...viagens().filter(v=>v.sessao===s.numero).map(v=>v.descricao+' '+(gm()?v.segredo||'':''))].join(' ');if(cita(txt))ss.push(s);}
  for(const l of locais())if(cita((l.descricao||'')+' '+(gm()?l.segredo||'':'')))ls.push(l);return {ss,ls};}
 function htmlAparicoes(nomes){const {ss,ls}=listaAparicoes(nomes);if(!ss.length&&!ls.length)return '';
  return `${ss.length?`<h3>Sessões</h3><ul>${ss.map(s=>`<li><a href="#mapa/sessao/${s.numero}">Sessão ${num(s.numero)}${s.titulo?' · '+esc(s.titulo):''}</a>${s.data?` <small>${esc(dataBR(s.data))}</small>`:''}</li>`).join('')}</ul>`:''}${ls.length?`<h3>Lugares</h3><ul>${ls.map(l=>`<li><a href="#mapa/${encodeURIComponent(l.id)}">${esc(l.nome)}</a> <small>${esc(regiao(l))}</small></li>`).join('')}</ul>`:''}`;}
 function aparicoes(api,doc){if(!api.D.worldMap)return '';if(!root){A=api;W=api.D.worldMap;dados=clone(W.dados);refs=null;}
  const stem=doc.path.split('/').pop().replace(/\.md$/,''),lugar=locais().find(l=>l.nota&&(l.nota===stem||semAcento(l.nota)===semAcento(doc.title)));
  const p=(W.pessoas||[]).find(x=>x.doc===doc.id||x.ficha===doc.id),corpo=p?htmlAparicoes(p.nomes):'';
  if(!lugar&&!corpo)return '';
  return `<section class="wm-apps"><h2>No mapa do mundo</h2>${lugar?`<p><a class="btn btn-light" href="#mapa/${encodeURIComponent(lugar.id)}">Ver ${esc(lugar.nome)} no mapa</a></p>`:''}${corpo||(p?'<p class="wm-soft">Ainda não aparece em nenhuma sessão ou lugar do mapa.</p>':'')}</section>`;}
 return {mount,leave,aparicoes,TIPOS};
})();
