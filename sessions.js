/* Gravações das sessões: ouvir de novo e ler a transcrição sincronizada. Dados de 08 Transcricoes/Brutas e áudio de gravacoes/ (só no portal do mestre). */
window.OP_SESSIONS=(()=>{
 'use strict';
 let A=null,audio=null,current=null,follow=true,activeLine=-1,saveTimer=null;
 const COLORS=['#c73730','#1e5a8a','#2f7a3a','#9a5b12','#6b3f8f','#0f7a78','#a33a6b','#56606b'];
 const svg=(d,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
 const I={play:'M7 4v16l13-8Z',pause:'M7 4h3v16H7Z M14 4h3v16h-3Z',back:'M11 5 4 12l7 7 M20 12H5',fwd:'m13 5 7 7-7 7 M4 12h15',mic:'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M5 11a7 7 0 0 0 14 0 M12 18v3 M8 21h8',dl:'M12 4v11 m-5-5 5 5 5-5 M5 20h14',note:'M6 3h9l4 4v14H6Z M14 3v5h5 M9 13h7 M9 17h5',link:'M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1 M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1',search:'m21 21-4.3-4.3 M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z',wave:'M3 12h2 M7 8v8 M11 5v14 M15 9v6 M19 7v10 M21 12h0'};
 const list=()=>(A.D.recordings||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)||b.session-a.session);
 const clock=s=>{s=Math.max(0,Math.floor(s||0));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0');};
 const longDate=d=>d?new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase()):'Data não informada';
 const hours=s=>s>=3600?`${Math.floor(s/3600)} h ${String(Math.round(s%3600/60)).padStart(2,'0')} min`:`${Math.max(1,Math.round(s/60))} min`;
 const color=(r,i)=>r.speakers[i]?.gm?COLORS[0]:COLORS[1+(i%(COLORS.length-1))];
 const title=r=>`Sessão ${String(r.session).padStart(2,'0')}${r.rehearsal?' · ensaio':''}`;
 const posKey=r=>'oprpg-gravacao-'+r.id;
 const mark=(text,terms)=>{let out=A.esc(text);for(const t of terms){if(!t)continue;out=out.replace(new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'),'<mark>$1</mark>');}return out;};
 const terms=q=>A.norm(q||'').split(/\s+/).filter(t=>t.length>1);
 const hit=(text,ts)=>{const n=A.norm(text);return ts.every(t=>n.includes(t));};

 function stop(){if(audio){try{A.store.set(posKey(current),audio.currentTime);}catch{}audio.pause();}audio=null;current=null;activeLine=-1;clearInterval(saveTimer);}

 /* ---------- Lista de sessões ---------- */
 function overview(main){
  const recs=list();
  const total=recs.reduce((s,r)=>s+(r.duration||0),0);
  const card=r=>{const pos=+A.store.get(posKey(r),0)||0;const pct=r.duration?Math.min(100,pos/r.duration*100):0;
   return `<a class="rec-card ${r.rehearsal?'is-rehearsal':''}" href="#gravacoes/${encodeURIComponent(r.id)}"><div class="rec-card-top"><span class="rec-num">${String(r.session).padStart(2,'0')}</span><div><small>${r.rehearsal?'Ensaio de gravação':'Sessão'}</small><strong>${A.esc(longDate(r.date))}</strong></div><span class="rec-play">${svg(I.play)}</span></div>
   <div class="rec-wave" aria-hidden="true">${wave(r)}</div>
   <div class="rec-meta"><span>${svg(I.wave)}${r.duration?hours(r.duration):'—'}</span><span>${svg(I.note)}${r.lines.length} falas</span><span class="${r.audio?'':'rec-missing'}">${svg(I.mic)}${r.audio?'Áudio disponível':'Sem áudio'}</span></div>
   <div class="rec-people">${r.speakers.map((p,i)=>`<span style="--c:${color(r,i)}">${A.esc(p.name)}</span>`).join('')}</div>
   ${pct>1&&pct<99?`<div class="rec-progress" title="Você parou em ${clock(pos)}"><span style="width:${pct}%"></span></div>`:''}</a>`;};
  main.innerHTML=A.header('Gravações das sessões','Ouça de novo qualquer sessão e acompanhe a transcrição, fala por fala.','Mesa · Diário de bordo')+
  (recs.length?`<div class="rec-summary">${(n=>`<div><strong>${n}</strong><small>${n===1?'sessão gravada':'sessões gravadas'}</small></div>`)(recs.filter(r=>!r.rehearsal).length)}<div><strong>${hours(total)}</strong><small>de áudio</small></div><div><strong>${recs.reduce((s,r)=>s+r.lines.length,0).toLocaleString('pt-BR')}</strong><small>${recs.reduce((s,r)=>s+r.lines.length,0)===1?'fala transcrita':'falas transcritas'}</small></div></div>
   <label class="rec-search">${svg(I.search)}<input type="search" id="rec-global" placeholder="Procurar em todas as transcrições: um nome, uma ilha, um golpe…" autocomplete="off"></label>
   <div id="rec-results"></div><div class="rec-grid" id="rec-grid">${recs.map(card).join('')}</div>`
  :`<div class="empty-state rec-empty">${svg(I.mic,'rec-empty-icon')}<h2>Nenhuma sessão gravada ainda</h2><p>Depois de uma sessão, baixe o .zip multifaixa do Craig e rode <code>transcrever-sessao.ps1</code> na pasta do projeto. A transcrição vai para <code>08 Transcricoes/Brutas</code> e o áudio para <code>gravacoes/</code>; esta página mostra os dois sozinha.</p><p>Também dá para colocar um áudio à mão em <code>gravacoes/</code>, com o nome <code>AAAA-MM-DD-S01.m4a</code> (ou .mp3, .ogg).</p></div>`);
  const input=main.querySelector('#rec-global');if(!input)return;
  input.oninput=()=>{const ts=terms(input.value);const box=main.querySelector('#rec-results');main.querySelector('#rec-grid').hidden=!!ts.length;
   if(!ts.length){box.innerHTML='';return;}
   let found=0;const html=recs.map(r=>{const hits=r.lines.map((l,i)=>[l,i]).filter(([l])=>hit(l[2],ts)||hit(r.speakers[l[1]]?.name||'',ts));found+=hits.length;if(!hits.length)return '';
    return `<section class="rec-hits"><h3><a href="#gravacoes/${encodeURIComponent(r.id)}">${A.esc(title(r))}</a><small>${A.esc(longDate(r.date))} · ${hits.length} ${hits.length===1?'trecho':'trechos'}</small></h3>${hits.slice(0,30).map(([l])=>`<a class="rec-hit" href="#gravacoes/${encodeURIComponent(r.id)}/${Math.floor(l[0])}"><time>${clock(l[0])}</time><b style="--c:${color(r,l[1])}">${A.esc(r.speakers[l[1]]?.name||'')}</b><span>${mark(l[2],ts)}</span></a>`).join('')}${hits.length>30?`<p class="rec-more">E mais ${hits.length-30} trechos nesta sessão.</p>`:''}</section>`;}).join('');
   box.innerHTML=`<p class="rec-count">${found} ${found===1?'trecho encontrado':'trechos encontrados'}</p>`+(html||'<div class="empty-state"><p>Nada encontrado. Tente outra palavra.</p></div>');};}

 /* Um desenho de onda com a densidade de falas ao longo da sessão. */
 function wave(r,bars=56){if(!r.duration||!r.lines.length)return '';const n=new Array(bars).fill(0);r.lines.forEach(l=>{n[Math.min(bars-1,Math.floor(l[0]/r.duration*bars))]+=l[2].length;});const max=Math.max(...n)||1;return n.map(v=>`<i style="height:${12+Math.round(v/max*88)}%"></i>`).join('');}

 /* ---------- Uma sessão: player e transcrição ---------- */
 function session(main,id,startAt){
  const r=(A.D.recordings||[]).find(x=>x.id===id);
  if(!r){main.innerHTML=A.header('Gravação não encontrada','Esta sessão não está mais no acervo.','Gravações')+'<p><a class="btn btn-light" href="#gravacoes">Ver todas as gravações</a></p>';return;}
  current=r;follow=true;activeLine=-1;
  const hidden=new Set();
  const doc=r.transcript&&A.byId.get(r.transcript),note=r.sessionNote&&A.byId.get(r.sessionNote);
  main.innerHTML=A.header(title(r),longDate(r.date),'Gravações das sessões')+`
  <section class="rec-player ${r.audio?'':'no-audio'}">
   ${r.audio?`<audio id="rec-audio" preload="metadata" src="${A.esc(r.audio)}"></audio>`:''}
   <button type="button" class="rec-big" id="rec-toggle" ${r.audio?'':'disabled'} aria-label="Tocar">${svg(I.play)}</button>
   <div class="rec-track">
    <div class="rec-bar"><div class="rec-wave rec-wave--player" aria-hidden="true">${wave(r,120)}</div><input type="range" id="rec-seek" min="0" max="${Math.ceil(r.duration||1)}" step="1" value="0" aria-label="Posição na gravação" ${r.audio?'':'disabled'}></div>
    <div class="rec-controls">
     <span class="rec-time"><b id="rec-now">0:00</b> / <span id="rec-total">${clock(r.duration)}</span></span>
     <button type="button" class="rec-btn" data-skip="-15" title="Voltar 15 segundos" ${r.audio?'':'disabled'}>${svg(I.back)}15 s</button>
     <button type="button" class="rec-btn" data-skip="15" title="Avançar 15 segundos" ${r.audio?'':'disabled'}>15 s${svg(I.fwd)}</button>
     <span class="rec-speeds" role="group" aria-label="Velocidade">${[1,1.25,1.5,2].map(s=>`<button type="button" class="rec-btn ${s===1?'on':''}" data-speed="${s}">${String(s).replace('.',',')}×</button>`).join('')}</span>
     ${r.audio?`<a class="rec-btn" href="${A.esc(r.audio)}" download="${A.esc(r.audioName)}" title="Baixar o áudio">${svg(I.dl)}Baixar</a>`:''}
    </div>
   </div>
  </section>
  ${r.audio?'':`<div class="rec-warning">${svg(I.mic)}<span>O áudio desta sessão não foi encontrado. Coloque o arquivo em <code>gravacoes/${A.esc(r.id)}.m4a</code> (ou .mp3, .ogg) na pasta do projeto e recarregue. A transcrição continua disponível abaixo.</span></div>`}
  <div class="rec-layout">
   <aside class="rec-side">
    <h3>Quem falou</h3>
    <div class="rec-speakers">${r.speakers.map((p,i)=>{const n=r.lines.filter(l=>l[1]===i).length;return `<button type="button" class="rec-speaker on" data-speaker="${i}" style="--c:${color(r,i)}"><span class="dot"></span><span><strong>${A.esc(p.name)}</strong><small>${n} ${n===1?'fala':'falas'}</small></span></button>`;}).join('')}</div>
    <h3>Nesta gravação</h3>
    <div class="rec-links">${note?`<a href="${A.link(note.id)}">${svg(I.note)}Nota da sessão</a>`:''}${doc?`<a href="${A.link(doc.id)}">${svg(I.note)}Transcrição no acervo</a>`:''}<button type="button" data-copy-link>${svg(I.link)}Copiar link deste momento</button></div>
    <p class="rec-hint">Clique numa fala para ouvir daquele ponto. Espaço toca e pausa; as setas avançam e voltam 5 segundos.</p>
   </aside>
   <section class="rec-transcript">
    <div class="rec-tools"><label class="rec-search rec-search--small">${svg(I.search)}<input type="search" id="rec-filter" placeholder="Procurar nesta sessão…" autocomplete="off"></label><label class="rec-follow"><input type="checkbox" id="rec-follow" checked> Acompanhar o áudio</label><span class="rec-count" id="rec-count"></span></div>
    <ol class="rec-lines" id="rec-lines">${r.lines.map((l,i)=>`<li data-i="${i}" data-t="${l[0]}" style="--c:${color(r,l[1])}"><button type="button" class="rec-ts" title="Ouvir a partir daqui">${clock(l[0])}</button><b>${A.esc(r.speakers[l[1]]?.name||'')}</b><p>${A.esc(l[2])}</p></li>`).join('')||'<li class="rec-none">Esta gravação ainda não tem transcrição.</li>'}</ol>
   </section>
  </div>`;
  const $=s=>main.querySelector(s),lines=[...main.querySelectorAll('#rec-lines li[data-i]')],times=r.lines.map(l=>l[0]);
  const el=audio=$('#rec-audio'),player=$('.rec-player');
  const seek=$('#rec-seek'),now=$('#rec-now'),toggle=$('#rec-toggle');
  const setActive=t=>{let lo=0,hi=times.length-1,k=-1;while(lo<=hi){const m=(lo+hi)>>1;if(times[m]<=t+0.25){k=m;lo=m+1;}else hi=m-1;}
   if(k===activeLine)return;lines[activeLine]?.classList.remove('active');activeLine=k;const li=lines[k];if(!li)return;li.classList.add('active');
   if(follow&&!li.hidden&&!el?.paused){const box=li.getBoundingClientRect();if(box.top<90||box.bottom>innerHeight-40)li.scrollIntoView({block:'center',behavior:'smooth'});}};
  const playFrom=t=>{if(!el){A.toast('O áudio desta sessão não está disponível.');return;}el.currentTime=Math.max(0,t);el.play().catch(()=>{});};
  if(el){
   const pos=startAt!=null?+startAt:+A.store.get(posKey(r),0)||0;
   el.addEventListener('loadedmetadata',()=>{seek.max=Math.ceil(el.duration);$('#rec-total').textContent=clock(el.duration);if(pos)el.currentTime=Math.min(pos,el.duration-1);if(startAt!=null)el.play().catch(()=>{});},{once:true});
   el.addEventListener('timeupdate',()=>{if(!seek.matches(':active'))seek.value=el.currentTime;now.textContent=clock(el.currentTime);seek.style.setProperty('--p',(el.currentTime/(el.duration||r.duration||1)*100)+'%');setActive(el.currentTime);});
   const icon=()=>{toggle.innerHTML=svg(el.paused?I.play:I.pause);toggle.setAttribute('aria-label',el.paused?'Tocar':'Pausar');player.classList.toggle('playing',!el.paused);};
   el.addEventListener('play',icon);el.addEventListener('pause',()=>{icon();A.store.set(posKey(r),el.currentTime);});
   el.addEventListener('ended',()=>A.store.set(posKey(r),0));
   el.addEventListener('error',()=>{player.classList.add('no-audio');A.toast('Não consegui abrir o áudio desta sessão.');});
   toggle.onclick=()=>el.paused?el.play().catch(()=>{}):el.pause();
   seek.oninput=()=>{now.textContent=clock(seek.value);};seek.onchange=()=>{el.currentTime=+seek.value;};
   saveTimer=setInterval(()=>{if(el&&!el.paused)A.store.set(posKey(r),el.currentTime);},5000);
   if(startAt!=null)setTimeout(()=>{setActive(+startAt);lines[activeLine]?.scrollIntoView({block:'center'});},0);
  }
  main.querySelectorAll('[data-skip]').forEach(b=>b.onclick=()=>{if(el)el.currentTime=Math.max(0,el.currentTime+ +b.dataset.skip);});
  main.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{if(!el)return;el.playbackRate=+b.dataset.speed;main.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('on',x===b));});
  $('#rec-lines').addEventListener('click',e=>{const li=e.target.closest('li[data-t]');if(!li||getSelection().toString())return;playFrom(+li.dataset.t);});
  $('#rec-follow').onchange=e=>{follow=e.target.checked;};
  main.querySelector('[data-copy-link]').onclick=()=>{const t=Math.floor(el?.currentTime||0);const url=location.href.split('#')[0]+'#gravacoes/'+encodeURIComponent(r.id)+'/'+t;navigator.clipboard?.writeText(url).then(()=>A.toast('Link copiado: '+clock(t)+'.'),()=>A.toast(url));};
  const filter=()=>{const ts=terms($('#rec-filter').value);let shown=0;
   lines.forEach((li,i)=>{const l=r.lines[i];const ok=!hidden.has(l[1])&&(!ts.length||hit(l[2],ts));li.hidden=!ok;if(ok)shown++;li.querySelector('p').innerHTML=ts.length&&ok?mark(l[2],ts):A.esc(l[2]);});
   $('#rec-count').textContent=ts.length||hidden.size?`${shown} de ${lines.length} falas`:'';};
  $('#rec-filter').oninput=filter;
  main.querySelectorAll('[data-speaker]').forEach(b=>b.onclick=()=>{const i=+b.dataset.speaker;hidden.has(i)?hidden.delete(i):hidden.add(i);b.classList.toggle('on',!hidden.has(i));filter();});
 }

 /* Atalhos de teclado só valem com a página de uma sessão aberta e fora dos campos de texto. */
 document.addEventListener('keydown',e=>{if(!audio||!document.body.contains(audio)||e.target.closest('input,textarea,select,[contenteditable],dialog'))return;
  if(e.key===' '){e.preventDefault();audio.paused?audio.play().catch(()=>{}):audio.pause();}
  else if(e.key==='ArrowRight'){e.preventDefault();audio.currentTime+=5;}else if(e.key==='ArrowLeft'){e.preventDefault();audio.currentTime=Math.max(0,audio.currentTime-5);}});
 window.addEventListener('hashchange',()=>{if(!location.hash.startsWith('#gravacoes/'+encodeURIComponent(current?.id||'\0')))stop();});

 function mount(main,api,id,at){A=api;stop();id?session(main,decodeURIComponent(id),at):overview(main);}
 return {mount,stop};
})();
