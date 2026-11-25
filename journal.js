/* Jornal News Coo's: edições e cartazes de recompensa gerados do Vault (13 Jornal). O build dos jogadores só recebe o que está publicado. */
window.OP_JOURNAL=(()=>{
 'use strict';
 let A=null;
 const NAME="NEWS COO'S";
 const fmt=n=>Number(n||0).toLocaleString('pt-BR');
 const gull=`<svg class="np-gull" viewBox="0 0 64 40" aria-hidden="true"><path d="M2 22c8-9 18-12 27-6 2-6 7-9 13-8-3 2-4 4-4 6 7-4 15-4 24 1-9 0-15 3-19 8-4 6-11 9-18 8 3-2 4-4 4-6-8 3-17 2-27-3Z" fill="currentColor"/><circle cx="44" cy="14" r="1.6" fill="#f3efe4"/><path d="M50 15l7 2-7 1" fill="#c9a23a"/></svg>`;
 const berry=`<svg class="berry" viewBox="0 0 36 52" aria-hidden="true"><text x="3" y="43" font-family="'Old Standard TT',Georgia,serif" font-weight="700" font-size="46" fill="currentColor">B</text><path d="M10 3v47M17 3v47" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;
 const silhouette=`<svg viewBox="0 0 100 110" aria-hidden="true"><circle cx="50" cy="38" r="22" fill="currentColor"/><path d="M8 110c2-28 20-42 42-42s40 14 42 42Z" fill="currentColor"/></svg>`;

 /* Na prévia do jogador (ou no build dos jogadores) só aparece o que foi publicado. */
 const editions=()=>(A.D.newspapers||[]).filter(e=>!A.isPlayer()||e.published).sort((a,b)=>b.number-a.number);
 function posters(){const pub=new Set(editions().map(e=>e.number));return (A.D.bounties||[]).filter(p=>!A.isPlayer()||p.published).map(p=>{const history=A.isPlayer()?p.history.filter(h=>pub.has(h.edition)):p.history;return {...p,history,amount:history.length?history[history.length-1].amount:0};}).filter(p=>!A.isPlayer()||p.history.length).sort((a,b)=>b.amount-a.amount||a.name.localeCompare(b.name,'pt-BR'));}
 const scopeLabel=e=>{const s=A.norm(e.scope||'');return s.startsWith('local')?'Edição local'+(e.place?' · '+e.place:''):s.startsWith('mund')?'Edição mundial':s?e.scope:'';};

 function poster(p,opts={}){const h=p.history;const last=h[h.length-1],prev=h.length>1?h[h.length-2]:null;
  const entry=opts.edition!=null?h.find(x=>x.edition===opts.edition):null;const before=entry?h[h.indexOf(entry)-1]:null;const amount=entry?entry.amount:p.amount;
  const change=entry?(before?`<span class="w-change up">Antes ฿${fmt(before.amount)}</span>`:'<span class="w-change new">Primeira recompensa</span>'):(prev?`<span class="w-change up">+฿${fmt(last.amount-prev.amount)} na edição nº ${last.edition}</span>`:'');
  return `<figure class="wanted-wrap ${opts.small?'small':''}"><article class="wanted ${p.published?'':'is-draft'}" aria-label="Cartaz de procurado: ${A.esc(p.name)}, recompensa de ${fmt(amount)} berries">${p.published?'':'<span class="w-draft">Rascunho</span>'}<div class="w-title">WANTED</div><div class="w-photo">${p.image?`<img src="${p.image}" alt="Retrato de ${A.esc(p.name)}">`:`<div class="w-silhouette">${silhouette}<small>Sem foto</small></div>`}</div><div class="w-cond">${A.esc(p.condition||'DEAD OR ALIVE')}</div><div class="w-name">${A.esc(p.name)}</div><div class="w-bounty">${berry}${fmt(amount)}<span class="dash">-</span></div><div class="w-foot"><span>MARINE</span></div></article><figcaption>${p.alias?`<strong>“${A.esc(p.alias)}”</strong>`:''}${p.crew?`<span>${A.esc(p.crew)}</span>`:''}${change}${entry&&entry.reason?`<span class="w-reason">${entry.reason}</span>`:''}</figcaption></figure>`;}

 function newspaper(e){const pins=posters().filter(p=>p.history.some(h=>h.edition===e.number));const [lead,...rest]=e.articles;
  const leadHtml=lead?`<section class="np-lead ${e.image?'with-image':''}">${e.image?`<figure class="np-photo"><img src="${e.image}" alt="${A.esc(e.imageCaption||'Ilustração da manchete')}">${e.imageCaption?`<figcaption>${A.esc(e.imageCaption)}</figcaption>`:''}</figure>`:''}<div class="np-story np-story--lead"><h2>${A.esc(lead.title)}</h2><div class="np-text">${lead.html}</div></div></section>`:'';
  return `<article class="newspaper ${e.published?'':'is-draft'}">${e.published?'':'<div class="np-stamp">Rascunho · só o mestre vê</div>'}
   <header class="np-mast"><div class="np-ear">Edição nº ${e.number}${e.date?`<br><span>${A.esc(e.date)}</span>`:''}</div><div class="np-name">${gull}<span>${NAME}</span>${gull}</div><div class="np-ear right">${e.price?`Preço<br><span>${A.esc(e.price)}</span>`:'Entregue<br><span>por News Coo</span>'}</div></header>
   <div class="np-rule"><span>O jornal que voa por todos os mares</span><span>${A.esc(scopeLabel(e))}</span></div>
   <h1 class="np-headline">${A.esc(e.headline)}</h1>
   ${e.standfirst?`<div class="np-standfirst">${e.standfirst}</div>`:''}
   <div class="np-byline">${A.esc(e.editor||"Redação do News Coo's")}</div>
   ${leadHtml}
   ${rest.length?`<div class="np-columns n${Math.min(3,rest.length)}">${rest.map(a=>`<section class="np-story"><h2>${A.esc(a.title)}</h2><div class="np-text">${a.html}</div></section>`).join('')}</div>`:''}
   ${pins.length?`<section class="np-bounties"><h2><span>Recompensas desta edição</span></h2><div class="np-bounty-row">${pins.map(p=>poster(p,{edition:e.number,small:true})).join('')}</div></section>`:''}
   <footer class="np-foot"><span>${NAME}</span><span>Nº ${e.number}</span><span>Distribuído em todos os mares</span></footer>
  </article>${e.gmNotes&&!A.isPlayer()?`<aside class="np-gm"><div class="eyebrow">Notas do mestre · não vão para os jogadores</div><div class="article-body">${e.gmNotes}</div><small>Arquivo: ${A.esc(e.path||'')}</small></aside>`:''}`;}

 function tabs(active){const n=editions().length,w=posters().length;return `<nav class="np-tabs" aria-label="Seções do jornal"><a href="#jornal" class="${active==='ultima'?'active':''}">Última edição</a><a href="#jornal/edicoes" class="${active==='edicoes'?'active':''}">Todas as edições <small>${n}</small></a><a href="#jornal/procurados" class="${active==='procurados'?'active':''}">Procurados <small>${w}</small></a></nav>`;}
 function gmTip(){if(A.isPlayer())return '';const guide=A.byStem('00 Como usar o Jornal');return `<div class="note-tip">Cada edição é uma nota em <strong>13 Jornal/Edicoes</strong> e cada cartaz uma nota em <strong>13 Jornal/Cartazes</strong>. Só vai para os jogadores o que tiver <code>publicado: sim</code>; a seção “Notas do mestre” nunca vai.${guide?` <a href="${A.link(guide.id)}"><strong>Como publicar ↗</strong></a>`:''}</div>`;}
 function empty(){return `<div class="empty-state">${A.icon('news')}<h2>Nenhum News Coo pousou por aqui ainda.</h2><p>${A.isPlayer()?'Quando sair uma edição, ela aparece aqui, com as notícias do mundo e as recompensas da tripulação.':'Nenhuma edição foi criada. Copie o modelo “Template - Edicao do Jornal” para 13 Jornal/Edicoes.'}</p></div>`;}
 function card(e){return `<a class="np-card ${e.published?'':'is-draft'}" href="#jornal/${e.number}"><div class="np-card-mast">${NAME}</div><div class="np-card-meta"><span>Nº ${e.number}</span><span>${A.esc(e.date||'')}</span></div><h3>${A.esc(e.headline)}</h3><div class="np-card-foot">${scopeLabel(e)?`<span class="tag">${A.esc(scopeLabel(e))}</span>`:''}${e.published?'':'<span class="tag proposal">Rascunho</span>'}</div></a>`;}
 const toolbar=e=>`<div class="np-toolbar"><a class="btn btn-light" href="#jornal/edicoes">← Todas as edições</a><button type="button" class="btn btn-light" data-np-print>${A.icon('download')}Imprimir ou salvar PDF</button>${(()=>{const l=editions();const i=l.findIndex(x=>x.number===e.number);return (l[i+1]?`<a class="btn btn-light" href="#jornal/${l[i+1].number}">Edição anterior</a>`:'')+(l[i-1]?`<a class="btn btn-light" href="#jornal/${l[i-1].number}">Próxima edição</a>`:'');})()}</div>`;

 function mount(main,api,sub){A=api;const list=editions();document.title="Jornal News Coo's · Diário de bordo";
  const head=A.header("Jornal News Coo's",'Notícias do mundo e dos mares por onde a tripulação passa, com os cartazes de recompensa de cada edição.','Entregue pelas gaivotas');
  if(sub==='procurados'){const ps=posters();main.innerHTML=head+tabs('procurados')+gmTip()+(ps.length?`<p class="np-intro">${A.isPlayer()?'Os cartazes publicados pela Marinha até a última edição.':'Todos os cartazes do Vault, com os que ainda não foram publicados marcados como rascunho.'}</p><div class="wanted-wall">${ps.map(p=>poster(p)+(p.gmNotes&&!A.isPlayer()?`<details class="np-gm-mini"><summary>Notas do mestre: ${A.esc(p.name)}</summary><div class="article-body">${p.gmNotes}</div></details>`:'')).join('')}</div>`:`<div class="empty-state">${A.icon('target')}<h2>Nenhum cartaz em circulação.</h2><p>${A.isPlayer()?'Por enquanto ninguém da tripulação tem a cabeça a prêmio.':'Copie o modelo “Template - Cartaz de Recompensa” para 13 Jornal/Cartazes e ligue cada valor a uma edição.'}</p></div>`);return;}
  if(sub==='edicoes'){main.innerHTML=head+tabs('edicoes')+gmTip()+(list.length?`<div class="np-archive">${list.map(card).join('')}</div>`:empty());return;}
  const e=sub?list.find(x=>String(x.number)===String(sub)):list.find(x=>x.published)||list[0];
  if(sub&&!e){main.innerHTML=head+tabs('edicoes')+`<div class="empty-state">${A.icon('news')}<h2>Essa edição não está nas bancas.</h2><p>Ela pode não existir ou ainda não ter sido publicada.</p><a class="btn btn-light" href="#jornal/edicoes">Ver todas as edições</a></div>`;return;}
  main.innerHTML=head+tabs(sub?'':'ultima')+gmTip()+(e?toolbar(e)+newspaper(e):empty());
  main.querySelectorAll('.np-text,.np-standfirst').forEach(el=>A.enhance(el));
  /* Matéria principal longa vira duas colunas com capitular; curta fica em uma, para não quebrar a página. */
  main.querySelectorAll('.np-story--lead .np-text').forEach(el=>el.classList.toggle('np-cols',el.textContent.length>700));
  main.querySelector('[data-np-print]')?.addEventListener('click',()=>{document.body.classList.add('np-print');const done=()=>{document.body.classList.remove('np-print');window.removeEventListener('afterprint',done);};window.addEventListener('afterprint',done);window.print();});}

 const count=()=>{try{return (window.OP_DATA.newspapers||[]).length;}catch{return 0;}};
 return {mount,editions:()=>A?editions():[],count};
})();
