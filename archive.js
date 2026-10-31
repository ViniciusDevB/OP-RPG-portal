/* Arquivo da campanha: somente leitura das notas exportadas e dos dados já existentes do mapa. */
window.OP_ARCHIVE=(()=>{
 'use strict';
 const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const text=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|#39);/g,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[x])).replace(/\s+/g,' ').trim();
 const enc=encodeURIComponent;
 const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?s.split('-').reverse().join('/'):(s||'Data não registrada');
 const empty=(A,title,body)=>`<section class="empty-state"><h2>${A.esc(title)}</h2><p>${A.esc(body)}</p></section>`;
 const link=(A,href,title,cls='btn btn-light')=>`<a class="${cls}" href="${A.esc(href)}">${A.esc(title)}</a>`;
 const noteLink=(A,d)=>link(A,A.link(d.id),d.title,'archive-note-link');
 const actual=d=>!d.path.startsWith('99 Templates/');
 const find=(A,value)=>(A.docs||[]).find(d=>d.id===value||d.path===value||d.path.replace(/\.md$/,'')===value||d.title===value||d.path.split('/').pop().replace(/\.md$/,'')===value);
 const people=A=>(A.D.characters||[]).filter(c=>!A.isPlayer()||A.docs.some(d=>d.id===c.sheet));
 function world(A){
  const W=A.D.worldMap||{},data=W.dados||{},locs=new Map((W.fixos||[]).map(l=>[l.id,{...l}]));
  for(const l of data.locais||[]){const fixed=locs.get(l.id);locs.set(l.id,fixed?{...fixed,descricao:l.descricao,nota:l.nota,segredo:l.segredo}:{...l});}
  const locations=[...locs.values()].filter(l=>!A.isPlayer()||l.visivel!=='mestre'&&l.descoberto);
  const ids=new Set(locations.map(l=>l.id));
  const sessions=(data.sessoes||[]).filter(s=>!A.isPlayer()||s.visivel!=='mestre').map(s=>({...s,locais:(s.locais||[]).filter(id=>ids.has(id)),segredo:A.isPlayer()?'':s.segredo}));
  return {locations,sessions,ship:locations.find(l=>l.id===data.navio?.local)};
 }
 function sessions(A){
  const rows=new Map(),W=world(A);
  for(const s of W.sessions){
   if(s.status&&!['realizada','realizado'].includes(norm(s.status)))continue;
   const n=String(s.numero??'');if(!n)continue;
   rows.set('sessao-'+n,{id:'sessao-'+n,number:n,title:s.titulo||'Sessão '+n,date:s.data||'',summary:s.resumo||'',places:s.locais,doc:find(A,s.nota),map:true});
  }
  for(const d of A.docs.filter(d=>actual(d)&&norm(d.meta.tipo)==='sessao'&&norm(d.meta.status)==='realizada')){
   const n=d.meta.sessao||'',key=n?'sessao-'+n:'nota-'+d.id,old=rows.get(key)||{};
   rows.set(key,{...old,id:key,number:n,title:d.title,date:d.meta.data||old.date||'',summary:old.summary||sectionText(d,'Resumo')||d.summary,places:old.places||[],doc:d});
  }
  return [...rows.values()].sort((a,b)=>(Number(b.number)||0)-(Number(a.number)||0)||String(b.date).localeCompare(String(a.date))||a.id.localeCompare(b.id));
 }
 function section(d,name){
  if(!d)return null;const lines=d.body.split('\n'),start=lines.findIndex(l=>/^#{2,6}\s/.test(l)&&norm(l.replace(/^#+\s*/,''))===norm(name));
  if(start<0)return null;const level=lines[start].match(/^#+/)[0].length;let end=start+1;
  while(end<lines.length&&!(new RegExp('^#{1,'+level+'}\\s')).test(lines[end]))end++;
  const body=lines.slice(start+1,end).join('\n').trim();
  if(!body||!body.replace(/[-*\s]/g,''))return null;
  const heading=d.headings.find(h=>norm(h.title)===norm(name));return {body,heading};
 }
 function sectionText(d,name){return section(d,name)?.body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_,a,b)=>b||a).replace(/[#*`]/g,'').trim()||'';}
 function summary(A,compact=false){
  const all=sessions(A),last=all[0],W=world(A),d=last?.doc;
  const end=['Onde paramos','Situação ao final','Ganchos e situação ao final'].map(n=>sectionText(d,n)).find(Boolean);
  const goals=sectionText(d,'Objetivos em andamento'),pending=sectionText(d,'Pontos em aberto');
  return `<section class="archive-resume"><div class="section-head"><h2>Onde paramos?</h2>${compact?link(A,'#retomada','Ver retomada completa'):''}</div>${last?`<p class="archive-kicker">Última sessão registrada · ${A.esc(date(last.date))}</p><h3>${A.esc(last.title)}</h3><p class="archive-text">${A.esc(end||last.summary||'Sem resumo registrado.')}</p>${link(A,'#diario/'+enc(last.id),'Consultar a sessão')}`:A.isPlayer()?'<p>A nossa aventura ainda vai começar.</p>':'<p>A campanha ainda não tem sessão realizada registrada. O ponto de partida e os registros do jogo aguardam definição.</p>'}${W.ship?`<p><strong>Localização registrada da tripulação:</strong> ${link(A,'#mapa/'+enc(W.ship.id),W.ship.nome,'text-link')}</p>`:last?.places.length?`<p><strong>Últimos locais registrados:</strong> ${last.places.map(id=>{const l=W.locations.find(l=>l.id===id);return l?link(A,'#mapa/'+enc(id),l.nome,'text-link'):'';}).join(' · ')}</p>`:A.isPlayer()?'':'<p class="soft-note">Localização atual ainda não registrada.</p>'}${!compact&&(!A.isPlayer()||last)?`<div class="archive-columns"><section><h3>Objetivos em andamento</h3><p class="archive-text">${A.esc(goals||'Nenhum objetivo registrado na última sessão.')}</p></section><section><h3>Pontos em aberto</h3><p class="archive-text">${A.esc(pending||'Nenhuma pendência registrada na última sessão.')}</p></section></div>`:''}</section>`;
 }
 function home(main,A){
  const links=[['#library/personagens','Tripulação e dossiês','Histórias, vínculos e versões das fichas'],['#diario','Diário das sessões','Acontecimentos, descobertas e consequências'],['#conhecimento','Conhecimento da tripulação','O que já foi liberado para os jogadores'],['#mapa','Mapa do mundo','Locais, aparições e viagens'],['#library/regras','Biblioteca de regras','Fontes e referências do sistema'],['#jornal','Jornal','Notícias e cartazes publicados'],['#criar-personagem','Criar personagem','Rascunho local e exportação manual']].filter(x=>!A.isPlayer()||x[0]!=='#conhecimento').map(x=>A.isPlayer()&&x[0]==='#library/personagens'?[x[0],'Personagens','Histórias e fichas da tripulação']:x);
  if(!A.isPlayer())links.push(['#campanha/sessao','Preparar a próxima sessão','Organizar propostas antes de levar ao Foundry']);
  main.innerHTML=A.header('O diário da nossa campanha.','Personagens, acontecimentos e descobertas para consultar entre as sessões.','Memória da mesa')+summary(A,true)+`<section class="quick-grid">${links.map(([href,title,desc])=>`<a class="quick-card" href="${href}">${A.icon('book')}<span><strong>${A.esc(title)}</strong><small>${A.esc(desc)}</small></span></a>`).join('')}</section>`;
 }
 function characters(main,A,id){
  const all=people(A),c=all.find(c=>c.id===id);
  if(id&&!c){main.innerHTML=empty(A,'Dossiê não encontrado','Este personagem não consta no acervo disponível.');return;}
  if(!c){
   main.innerHTML=A.header(A.isPlayer()?'Tripulação.':'Tripulação e dossiês.',A.isPlayer()?'Personagens, histórias e fichas da campanha.':'Ficha aprovada, história, vínculos e trajetória reunidos por personagem.','Personagens')+(all.length?`<div class="entity-grid">${all.map(c=>`<article class="archive-card">${!A.isPlayer()?`<span class="tag ${c.approved?'':'proposal'}">${c.approved?'Ficha aprovada':A.esc(c.status||'Proposta')}</span>`:''}<h2>${A.esc(c.name)}</h2><p>${A.esc(c.concept)}</p><p>${A.esc(c.species)} · ${A.esc(c.style)} · nível ${A.esc(c.level)}</p>${link(A,'#personagem/'+enc(c.id),A.isPlayer()?'Ver personagem':'Abrir dossiê','btn btn-primary')}</article>`).join('')}</div>`:empty(A,'Nenhum personagem registrado ainda',A.isPlayer()?'Os personagens da campanha aparecerão aqui.':'Rascunhos do criador ficam no navegador. Os dossiês aparecem após incorporar e revisar as notas no Vault.'));
   return;
  }
  const ids=new Set(c.documents||[]),documents=A.docs.filter(d=>ids.has(d.id)),primary=documents.find(d=>d.id===c.dossier),sheet=documents.find(d=>d.id===c.sheet),versions=c.sheets||[],bio=c.data?.character;
  main.innerHTML=A.header(c.name,'História, documentos e acontecimentos associados a este personagem.','Dossiê da tripulação')+link(A,'#library/personagens','← Todos os personagens')+`<div class="archive-columns"><section class="archive-card"><h2>Identidade e ficha</h2>${!A.isPlayer()?`<span class="tag ${c.approved?'':'proposal'}">${c.approved?'Ficha aprovada':'Proposta em revisão'}</span>`:''}<p>${A.esc(c.concept)}</p><dl><dt>Espécie</dt><dd>${A.esc(c.species)}</dd><dt>Estilo</dt><dd>${A.esc(c.style)}</dd><dt>Profissão</dt><dd>${A.esc(c.profession)}</dd><dt>Nível registrado</dt><dd>${A.esc(c.level)}</dd></dl>${sheet?link(A,A.link(sheet.id),A.isPlayer()?'Consultar ficha':c.approved?'Consultar ficha aprovada':'Consultar proposta de ficha'):''}</section><section class="archive-card"><h2>${A.isPlayer()?'Ficha e história':'Documentos e versões'}</h2>${documents.map(d=>`<p>${noteLink(A,d)}${!A.isPlayer()?`<small class="archive-kicker">${A.esc(d.meta.papel_documento||'Documento')} · versão ${A.esc(d.meta.versao||'não informada')} · ${A.esc(d.meta.status||'sem estado')}</small>`:''}</p>`).join('')}${!A.isPlayer()&&versions.some(v=>!v.approved)?'<p class="soft-note">As propostas e versões em revisão ficam identificadas separadamente da ficha aprovada.</p>':''}</section></div>`+(primary?`<article class="archive-card article-body"><h2>História, vínculos e objetivos</h2>${primary.html}<p>${noteLink(A,primary)}</p></article>`:bio?.story?`<section class="archive-card"><h2>História e identidade</h2>${[['História',bio.story],['Aparência',bio.appearance],['Personalidade, vínculos e medos',bio.personality],['Sonho',bio.dream]].filter(([,value])=>value).map(([title,value])=>`<h3>${A.esc(title)}</h3><p class="archive-text">${A.esc(value)}</p>`).join('')}</section>`:empty(A,'História ainda não registrada',A.isPlayer()?'A história deste personagem ainda não está disponível.':'Inclua uma nota de dossiê com o mesmo personagem_id da ficha. Nenhuma história foi inventada.'))+(sheet?window.OP_MAP?.aparicoes?.(A,sheet)||'':'');
  A.enhance(main.querySelector('.article-body'));
 }
 function related(A,d){
  const related=A.docs.filter(x=>actual(x)&&x.id!==d.id&&((d.links||[]).includes(x.id)||(d.backlinks||[]).includes(x.id)));
  return related.length?`<section class="archive-card"><h2>Pessoas, lugares e fontes relacionados</h2><div class="archive-links">${related.map(x=>noteLink(A,x)).join('')}</div></section>`:'';
 }
 function diary(main,A,id){
  const all=sessions(A),s=all.find(s=>s.id===id),W=world(A);
  if(id&&!s){main.innerHTML=empty(A,'Sessão não encontrada','Não existe registro realizado disponível com esse identificador.');return;}
  if(!s){
   const prep=A.docs.filter(d=>actual(d)&&(d.meta.tipo==='preparacao'||d.meta.tipo==='sessao'&&norm(d.meta.status)!=='realizada'));
   main.innerHTML=A.header('Diário das sessões.','O que aconteceu, o que foi descoberto e o que ficou em aberto.','Memória da campanha')+(all.length?`<div class="archive-list">${all.map(s=>`<article class="archive-card"><small>${A.esc(date(s.date))} · Sessão ${A.esc(s.number||'sem número')}</small><h2>${A.esc(s.title)}</h2><p>${A.esc(s.summary||'Resumo ainda não registrado.')}</p>${link(A,'#diario/'+enc(s.id),'Consultar registro','btn btn-primary')}</article>`).join('')}</div>`:empty(A,'Nenhuma sessão realizada registrada','Preparações e ensaios não contam como acontecimentos da campanha.'))+(prep.length?`<section class="archive-card"><h2>Preparações e propostas</h2><p>Estes documentos não são registros de sessões realizadas.</p><div class="archive-links">${prep.map(d=>noteLink(A,d)).join('')}</div></section>`:'');
   return;
  }
  const d=s.doc,fields=['Resumo','Participantes','Descobertas','Consequências','Onde paramos','Objetivos em andamento','Pontos em aberto','Fontes e evidências'];
  main.innerHTML=A.header(s.title,date(s.date),'Sessão registrada')+link(A,'#diario','← Diário das sessões')+`<section class="archive-card"><p class="archive-text">${A.esc(s.summary||'Resumo ainda não registrado.')}</p>${s.places.map(id=>{const l=W.locations.find(l=>l.id===id);return l?link(A,'#mapa/'+enc(id),l.nome):'';}).join('')}${s.map?link(A,'#mapa/sessao/'+enc(s.number),'Ver no mapa'):''}${d?link(A,A.link(d.id),'Abrir nota completa'):''}</section>`+(d?`<div class="archive-columns">${fields.map(name=>{const part=section(d,name);return `<section class="archive-card"><h2>${A.esc(name)}</h2>${part&&part.heading?`<div class="article-body">${A.sectionHtml(d,part.heading.id)}</div>`:`<p class="archive-text">${A.esc(part?.body||'Ainda não registrado nesta seção.')}</p>`}</section>`;}).join('')}</div>`+related(A,d):'<p class="soft-note">Este registro vem do mapa. Não há uma nota de sessão liberada neste acervo.</p>');
  main.querySelectorAll('.article-body').forEach(A.enhance);
 }
 function knowledge(A){
  const people=(A.D.worldMap?.pessoas||[]).filter(p=>p.publico||p.ficha&&A.docs.some(d=>d.id===p.ficha));
  const notes=A.docs.filter(d=>actual(d)&&d.path==='03 Mundo/Conhecimento Comum - O que o mundo sabe.md');
  return {people,notes};
 }
 function known(main,A,id){if(A.isPlayer()){main.innerHTML=empty(A,'Página indisponível','Consulte o mapa, os personagens e o diário da campanha.');return;}
  const K=knowledge(A),selected=K.people.find(p=>String(p.id||p.ficha)===id);
  main.innerHTML=A.header('O que a tripulação sabe.','Pessoas e informações já liberadas pelo mestre.','Conhecimento dos jogadores')+(!A.isPlayer()?'<p class="note-tip">Esta página reúne as seções públicas já usadas pelo mapa e as notas públicas existentes. Não publica novas notas nem altera a lista permitida.</p>':'')+(selected?link(A,'#conhecimento','← Todo o conhecimento'):'')+`<div class="archive-list">${(id?selected?[selected]:[]:K.people).map(p=>`<article class="archive-card"><h2>${A.esc(p.nome)}</h2><div class="article-body">${p.publico||'<p>Consulte a ficha liberada.</p>'}</div>${p.ficha&&A.docs.some(d=>d.id===p.ficha)?link(A,A.link(p.ficha),'Consultar ficha liberada'):''}</article>`).join('')}</div>`+(id?'':K.notes.map(d=>`<section class="archive-card"><h2>${A.esc(d.title)}</h2><p>${A.esc(d.summary)}</p>${noteLink(A,d)}</section>`).join(''))+(!selected&&id?empty(A,'Informação não encontrada','Este conhecimento não está disponível no acervo atual.'):!K.people.length&&!K.notes.length?empty(A,'Nenhuma descoberta registrada ainda','O conteúdo aparecerá conforme o mestre registrar e liberar informações.'): '');
  main.querySelectorAll('.article-body').forEach(A.enhance);
 }
 function search(A,query){
  const q=norm(query).trim(),terms=q.match(/[\p{L}\p{N}]+/gu)||[];if(!terms.length)return [];
  const result=[],W=world(A),allSessions=sessions(A),chars=people(A);
  function add(row,content){const n=norm(row.title+' '+content),words=n.match(/[\p{L}\p{N}]+/gu)||[];if(!terms.every(t=>words.some(w=>w.startsWith(t))))return;row.score=(norm(row.title).includes(q)?80:0)+(norm(content).includes(q)?30:0)+terms.filter(t=>norm(row.title).includes(t)).length*15;result.push(row);}
  for(const d of A.docs){
   const neighbors=A.docs.filter(x=>x.id!==d.id&&((d.links||[]).includes(x.id)||(d.backlinks||[]).includes(x.id))).slice(0,4);
   const content=d.body||'',at=norm(content).indexOf(terms[0]),snippet=content.slice(Math.max(0,at-50),Math.max(0,at-50)+220).replace(/[\[\]#*>`|]/g,' ').replace(/\s+/g,' ');
   add({title:d.title,summary:snippet||d.summary,href:A.link(d.id),label:d.category==='sessoes'?'Notas de sessão':d.category==='personagens'?'Documentos de personagens':d.category==='mundo'?'Mundo':'Notas e regras',context:neighbors.length?'Relacionado: '+neighbors.map(x=>x.title).join(' · '):d.meta.fonte||''},content+' '+neighbors.map(x=>x.title).join(' '));
  }
  for(const c of chars){const bio=c.data?.character||{},content=[c.species,c.style,c.concept,bio.story,bio.appearance,bio.personality,bio.dream].filter(Boolean).join(' '),at=norm(content).indexOf(terms[0]);add({title:c.name,summary:at>=0?content.slice(Math.max(0,at-40),at+180):c.concept,href:'#personagem/'+enc(c.id),label:A.isPlayer()?'Personagens':'Dossiês',context:A.isPlayer()?'Personagem':c.approved?'Ficha aprovada':'Proposta em revisão'},content);}
  for(const s of allSessions)add({title:s.title,summary:s.summary,href:'#diario/'+enc(s.id),label:'Sessões',context:date(s.date)},s.summary+' '+s.places.map(id=>W.locations.find(l=>l.id===id)?.nome||'').join(' '));
  for(const l of W.locations)add({title:l.nome,summary:l.descricao||'',href:'#mapa/'+enc(l.id),label:'Locais no mapa',context:allSessions.filter(s=>s.places.includes(l.id)).map(s=>'Sessão '+s.number).join(' · ')},(l.descricao||'')+' '+(!A.isPlayer()?l.segredo||'':'')+' '+allSessions.filter(s=>s.places.includes(l.id)).map(s=>s.title).join(' '));
  if(!A.isPlayer())for(const p of knowledge(A).people)add({title:p.nome,summary:text(p.publico).slice(0,220),href:'#conhecimento/'+enc(p.id||p.ficha),label:'Conhecimento da tripulação',context:'Informação liberada pelo mestre'},text(p.publico));
  return result.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'pt-BR'));
 }
 return {home,characters,diary,known,summary,search,sessions};
})();
