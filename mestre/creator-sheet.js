/* Ficha no estilo bloco de estatísticas do 5etools, adaptada ao OP RPG. Recebe o resultado de OP_CREATOR.calculateDraft. */
window.OP_SHEET=(()=>{
 'use strict';
 const A=['FOR','DES','CON','SAB','VON','PRE'],AN={FOR:'Força',DES:'Destreza',CON:'Constituição',SAB:'Sabedoria',VON:'Vontade',PRE:'Presença'};
 const SK={'Atletismo':'FOR','Acrobacia':'DES','Furtividade':'DES','Prestidigitação':'DES','História':'SAB','Investigação':'SAB','Natureza':'SAB','Sobrevivência':'SAB','Haki':'VON','Intuição':'VON','Percepção':'VON','Sobrenatural':'VON','Sorte':'VON','Atuação':'PRE','Enganação':'PRE','Intimidação':'PRE','Persuasão':'PRE','Provocação':'PRE'};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sign=n=>(n>=0?'+':'')+n;
 const src=s=>typeof s==='string'?s:s?`${(s.book||'Livro do Jogador 1.5.7').replace('Livro do Jogador','LJ').replace(/(\D)(\d)/,'$1 $2')}, p. ${s.pages||'?'}`:'';
 const num=n=>String(n).replace('.',',');

 /* Rolagens: clique rola, Shift = vantagem, Ctrl/Alt = desvantagem, como no 5etools. */
 const roll=sides=>1+Math.floor(Math.random()*sides);
 function rollExpr(expr){const m=String(expr).replace(/\s/g,'').match(/^(\d*)d(\d+)([+-]\d+)?$/i);if(!m)return null;const n=Number(m[1]||1),s=Number(m[2]),k=Number(m[3]||0);const dice=Array.from({length:n},()=>roll(s));return {dice,mod:k,total:dice.reduce((a,b)=>a+b,0)+k};}
 function rollButton(expr,label,text){return `<button type="button" class="ops-roll" data-roll="${esc(expr)}" data-label="${esc(label)}" title="Rolar ${esc(expr)} (Shift: vantagem · Ctrl: desvantagem)">${esc(text??expr)}</button>`;}
 function d20(bonus,label,text){return rollButton('1d20'+sign(bonus),label,text??sign(bonus));}
 function showRoll(btn,ev){const expr=btn.dataset.roll,label=btn.dataset.label;const isD20=/^1d20/.test(expr);let r=rollExpr(expr),r2=null,mode='';if(isD20&&(ev.shiftKey||ev.ctrlKey||ev.altKey||ev.metaKey)){r2=rollExpr(expr);const adv=ev.shiftKey;mode=adv?'vantagem':'desvantagem';if(adv?r2.total>r.total:r2.total<r.total)[r,r2]=[r2,r];}
  const nat=isD20?r.dice[0]:null;const box=ensureBox();const row=document.createElement('div');row.className='ops-rollrow'+(nat===20?' is-crit':nat===1?' is-fumble':'');row.innerHTML=`<div class="ops-rollrow__label">${esc(label)}${mode?` <em>(${mode})</em>`:''}</div><div class="ops-rollrow__total">${r.total}</div><div class="ops-rollrow__detail">${esc(expr)} → [${r.dice.join(', ')}]${r.mod?' '+sign(r.mod):''}${r2?` · descartado ${r2.total}`:''}${nat===20?' · 20 natural!':nat===1?' · 1 natural':''}</div>`;box.querySelector('.ops-rollbox__list').prepend(row);box.hidden=false;while(box.querySelectorAll('.ops-rollrow').length>12)box.querySelector('.ops-rollrow:last-child').remove();}
 function ensureBox(){let box=document.getElementById('ops-rollbox');if(box)return box;box=document.createElement('aside');box.id='ops-rollbox';box.className='ops-rollbox print-hide';box.hidden=true;box.innerHTML='<div class="ops-rollbox__head">Rolagens<button type="button" aria-label="Fechar rolagens">×</button></div><div class="ops-rollbox__list"></div>';box.querySelector('button').onclick=()=>{box.hidden=true;};document.body.appendChild(box);return box;}

 /* Markdown mínimo para os textos do Vault: parágrafos, negrito, itálico, listas e tabelas. */
 function inline(s){return esc(s).replace(/\[\[([^\]]+)\]\]/g,(_,v)=>v.split('|').pop().split('/').pop()).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');}
 function md(text){const out=[];const blocks=String(text||'').trim().split(/\n{2,}/);for(const b of blocks){const lines=b.split('\n');if(lines.every(l=>/^\s*\|/.test(l))){const rows=lines.filter(l=>!/^\s*\|[\s:|-]+\|\s*$/.test(l)).map(l=>l.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));out.push(`<table class="ops-table"><thead><tr>${rows[0].map(c=>`<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r=>`<tr>${r.map(c=>`<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);}else if(lines.every(l=>/^\s*[-*] /.test(l)))out.push(`<ul>${lines.map(l=>`<li>${inline(l.replace(/^\s*[-*] /,''))}</li>`).join('')}</ul>`);else out.push(`<p>${inline(b).replace(/\n/g,'<br>')}</p>`);}return out.join('');}

 function avg(dice,mod){const m=String(dice||'').match(/^(\d*)d(\d+)$/i);if(m)return Math.max(1,Math.floor(Number(m[1]||1)*(Number(m[2])+1)/2)+(mod||0));const n=Number(dice);return Number.isFinite(n)?Math.max(1,n+(mod||0)):null;}
 function attackLine(a,r){const ranged=a.category==='firearm'||/\//.test(a.range||'')&&!/1,5 m/.test(a.range||'');const kind=a.save_profile?'Efeito':ranged?'Ataque à Distância':'Ataque Corpo a Corpo';const dice=a.damage_dice||a.damageDice||'';const mod=a.damage_modifier||0;const dexpr=/d/.test(dice)?dice+(mod?sign(mod):''):'';const av=avg(dice,mod);
  const hit=a.save_profile?`salvaguarda de ${AN[a.save_profile.attribute]||a.save_profile.attribute} CD ${a.save_profile.dc||'a definir'}`:`${d20(a.attack_bonus,a.name+' · acerto')} para acertar`;
  const dmg=av===null?esc(a.damageText||'conforme regra'):`${av}${dexpr?` (${rollButton(dexpr,a.name+' · dano',dice+(mod?' '+(mod>0?'+ ':'− ')+Math.abs(mod):''))})`:''}`;
  return `<div class="ops-entry"><p><strong><em>${esc(a.name)}.</em></strong> <em>${kind}${a.category&&a.category!=='firearm'||ranged?' com Arma':''}:</em> ${hit}, ${ranged?'alcance':'alcance'} ${esc(a.range||'1,5 m')}, um alvo. <em>Acerto:</em> ${dmg} de dano ${esc(a.damage_type||'')}${a.damage_multiplier===0.5?' (metade do dano total)':''}.${a.properties?` <span class="ops-muted">${esc(a.properties)}.</span>`:''}${a.requires_manual_review?' <span class="ops-flag" title="Este item pede conferência do mestre">conferir</span>':''}</p><div class="ops-src">${esc(src(a.source))}</div></div>`;}

 function entry(x,r,extra=''){const body=x.display_text||x.description||x.effect||x.summary||'';const long=body.length>420;const flag=x.requires_manual_review?' <span class="ops-flag" title="'+esc((x.review_notes||[]).join(' '))+'">conferir</span>':'';
  const head=`<strong><em>${esc(x.name)}.</em></strong>${flag}`;
  return long?`<details class="ops-entry ops-entry--long"><summary>${head} <span class="ops-muted">${inline(teaser(body))}…</span></summary>${md(body)}${extra}<div class="ops-src">${esc(src(x.source))}</div></details>`:`<div class="ops-entry">${md(body).replace(/^<p>/,`<p>${head} `)}${extra}<div class="ops-src">${esc(src(x.source))}</div></div>`;}

 function teaser(body){const para=String(body).split(/\n{2,}/).find(b=>!/^\s*\|/.test(b))||'';return para.replace(/\*\*/g,'').replace(/\n/g,' ').slice(0,160);}
 function section(title,content){return content?`<h3 class="ops-h">${esc(title)}</h3>${content}`:'';}
 function trackers(id,r){let t={};try{t=JSON.parse(localStorage.getItem('ops-track-'+id)||'{}');}catch{}const hp=t.hp??r.hp_max,pp=t.pp??(r.pp_max??0);return `<div class="ops-track print-hide" data-track="${esc(id)}"><label>PV atuais<span><button type="button" data-delta="hp:-1">−</button><input type="number" data-field="hp" value="${hp}"><button type="button" data-delta="hp:1">+</button></span><small>de ${r.hp_max}</small></label><label>PV temporários<span><input type="number" data-field="tmp" value="${t.tmp??0}"></span></label><label>PP atuais<span><button type="button" data-delta="pp:-1">−</button><input type="number" data-field="pp" value="${pp}"><button type="button" data-delta="pp:1">+</button></span><small>de ${r.pp_max??'?'}</small></label><label>Exaustão<span><input type="number" min="0" max="6" data-field="ex" value="${t.ex??0}"></span></label></div>`;}

 function render(r,opts={}){const c=r.character,m=r.modifiers;const prof=k=>r.skill_proficiencies?(r.skill_proficiencies[k]||0)>0:r.skills[k]-m[SK[k]]>=r.proficiency;const expert=k=>(r.skill_proficiencies?.[k]||0)>=2;
  const groups={trait:[],tech:[],prof:[]};for(const x of r.details)(x.kind==='combat'||x.kind==='auxiliary'?groups.tech:x.kind==='profession'||x.kind==='subprofession'?groups.prof:groups.trait).push(x);
  const id=(c.name||'personagem').toLowerCase().replace(/[^a-z0-9]+/g,'-');
  const savesP=A.filter(a=>r.save_proficiencies.includes(a));
  const profSkills=Object.keys(r.skills).filter(prof);
  return `<article class="ops-sheet" id="ops-sheet">
  <header class="ops-head">
   <div><h1 class="ops-name">${esc(c.name||'Personagem sem nome')}</h1>
   <p class="ops-sub">${esc(c.species)}${c.variant&&c.variant!==c.species?` (${esc(c.variant)})`:''}, ${esc(c.style)}${c.path?` — ${esc(c.path)}`:''} nível ${c.level} · ${esc(c.profession||'sem profissão')} · ${esc(c.background||'')}${c.age?` · ${c.age} anos`:''}</p></div>
   <div class="ops-badge ops-badge--${r.concerns.length?'warn':'ok'}">${r.concerns.length?`Proposta · ${r.concerns.length} pendência${r.concerns.length>1?'s':''}`:'Proposta pronta para o mestre'}</div>
  </header>
  <div class="ops-rule"></div>
  <div class="ops-vitals">
   <div><span>Classe de Resistência</span><strong>${r.cr}</strong><small>sem armadura</small></div>
   <div><span>Pontos de Vida</span><strong>${r.hp_max}</strong><small>${esc(r.hp_formula)}</small></div>
   <div><span>Pontos de Poder</span><strong>${r.pp_max??'—'}</strong><small>${r.pp_max==null?'a definir pelo mestre':esc(r.pp_source||'reserva')}</small></div>
   <div><span>Iniciativa</span><strong>${d20(r.initiative,'Iniciativa')}</strong><small>DES</small></div>
   <div><span>Deslocamento</span><strong>${num(r.speed_m)} m</strong><small>nado ${r.swim_m==null?'a definir':num(r.swim_m)+' m'}</small></div>
   <div><span>Proficiência</span><strong>${sign(r.proficiency)}</strong><small>nível ${c.level}${r.hit_dice?' · '+esc(r.hit_dice):''}</small></div>
  </div>
  ${opts.trackers===false?'':trackers(id,r)}
  <div class="ops-rule"></div>
  <table class="ops-abilities"><thead><tr>${A.map(a=>`<th title="${AN[a]}">${a}</th>`).join('')}</tr></thead><tbody><tr>${A.map(a=>`<td><div class="ops-score">${r.attributes[a]}</div>${d20(m[a],AN[a]+' · teste',`(${sign(m[a])})`)}</td>`).join('')}</tr><tr class="ops-saverow">${A.map(a=>`<td>${savesP.includes(a)?'<b title="Proficiente">●</b> ':''}salv ${d20(r.saves[a],AN[a]+' · salvaguarda')}</td>`).join('')}</tr></tbody></table>
  <div class="ops-rule"></div>
  <div class="ops-props">
   <p><strong>Salvaguardas</strong> ${savesP.map(a=>`${AN[a]} ${d20(r.saves[a],AN[a]+' · salvaguarda')}`).join(', ')||'nenhuma'}</p>
   <p><strong>Perícias</strong> ${profSkills.map(k=>`${esc(k)}${expert(k)?' <span class="ops-muted" title="Proficiência dobrada">(×2)</span>':''} ${d20(r.skills[k],k)}`).join(', ')||'<span class="ops-muted">nenhuma perícia escolhida ainda</span>'}</p>
   ${r.special_skill?`<p><strong>Perícia de profissão</strong> ${esc(r.special_skill.name)} (${r.special_skill.ability}) ${d20(r.special_skill.bonus,r.special_skill.name)}</p>`:''}
   <p><strong>Sentidos</strong> Percepção passiva ${r.passive_perception}${r.conditionals.filter(x=>/Percep/.test(x)).map(x=>`; <span class="ops-muted">${esc(x)}</span>`).join('')}</p>
   <p><strong>Técnicas</strong> atributo ${esc(r.technique_attribute)} · ataque ${d20(r.technique_attack,'Técnica · ataque')} · CD ${r.technique_dc}</p>
   <p><strong>Treinamentos</strong> ${r.training_points.spent}/${r.training_points.available} PT gastos</p>${r.akuma?`<p><strong>Akuma no Mi</strong> ${esc(r.akuma.name)}${r.akuma.type?' · '+esc(r.akuma.type):''} · usuário ${esc(r.akuma.user==='avancado'?'Avançado':'Simples')}</p>`:''}${r.xp!=null&&c.level>1?`<p><strong>Experiência</strong> ${Number(r.xp).toLocaleString('pt-BR')} XP · técnicas até o ${r.max_grade}º grau</p>`:''}
  </div>
  <details class="ops-allskills"><summary>Todas as perícias</summary><div class="ops-skillgrid">${Object.entries(r.skills).map(([k,v])=>`<div class="${prof(k)?'is-prof':''}"><span>${expert(k)?'◆':prof(k)?'●':'○'} ${esc(k)} <small>${SK[k]}</small></span>${d20(v,k)}</div>`).join('')}</div></details>
  <div class="ops-rule"></div>
  <div class="ops-cols">
   ${section('Traços e habilidades',groups.trait.map(x=>entry(x,r)).join(''))}
   ${section('Ações',r.attacks.map(a=>attackLine(a,r)).join(''))}
   ${section('Técnicas',groups.tech.map(x=>entry(x,r,`<p class="ops-muted">Ataque de técnica ${sign(r.technique_attack)} · CD ${r.technique_dc}</p>`)).join(''))}
   ${section('Profissão',groups.prof.map(x=>entry(x,r)).join(''))}
   ${section('Efeitos condicionais',r.conditionals.length?`<ul class="ops-list">${r.conditionals.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'')}
   ${section('Equipamento',`<ul class="ops-list">${r.equipment.map(x=>`<li>${esc(x)}</li>`).join('')}${(r.inventory||[]).map(x=>`<li>${esc(x.name)} ×${x.qty}${x.equipped?' <span class="ops-muted">(equipado)</span>':''}${x.note?` <span class="ops-muted">· ${esc(x.note)}</span>`:''}</li>`).join('')}</ul>${r.inventory_totals&&(r.inventory||[]).length?`<p class="ops-muted">Valor conhecido ${r.inventory_totals.value.toLocaleString('pt-BR')} Bellys · peso conhecido ${num(r.inventory_totals.weight)} kg de ${r.carry_kg} kg de carga.</p>`:''}<p><strong>Dinheiro</strong> ${typeof r.money==='number'?r.money.toLocaleString('pt-BR')+' Bellys':r.money?rollButton(`${r.money.dice}d${r.money.sides}`,'Dinheiro inicial (× '+r.money.multiplier+' Bellys)')+` × ${r.money.multiplier.toLocaleString('pt-BR')} Bellys, ainda não rolado`:'conforme equipamento inicial'}</p>`)}
   ${section('Quem é',[c.dream&&`<p><strong><em>Sonho.</em></strong> ${esc(c.dream)}</p>`,c.story&&`<p><strong><em>História.</em></strong> ${esc(c.story)}</p>`,c.appearance&&`<p><strong><em>Aparência.</em></strong> ${esc(c.appearance)}</p>`,c.personality&&`<p><strong><em>Personalidade.</em></strong> ${esc(c.personality)}</p>`].filter(Boolean).join('')||'<p class="ops-muted">Sonho, história e aparência ainda em branco.</p>')}
  </div>
  ${r.concerns.length?`<details class="ops-concerns print-hide"><summary>${r.concerns.length} pendências antes da aprovação</summary><ul>${r.concerns.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:''}
  <footer class="ops-foot">Proposta de nível ${c.level} gerada pelo criador do portal · ${esc(r.source)} · não é cânone até a aprovação do mestre.</footer>
 </article>`;}

 let printBound=false;
 function bind(root){if(!printBound){printBound=true;/* Imprime o texto completo: abre os blocos recolhidos e restaura depois. */window.addEventListener('beforeprint',()=>document.querySelectorAll('.ops-entry--long:not([open])').forEach(d=>{d.open=true;d.dataset.printOpened='1';}));window.addEventListener('afterprint',()=>document.querySelectorAll('[data-print-opened]').forEach(d=>{d.open=false;delete d.dataset.printOpened;}));}root.addEventListener('click',ev=>{const b=ev.target.closest('.ops-roll');if(b){ev.preventDefault();showRoll(b,ev);}const d=ev.target.closest('[data-delta]');if(d){const [f,v]=d.dataset.delta.split(':');const inp=d.parentElement.querySelector(`[data-field="${f}"]`);inp.value=Number(inp.value||0)+Number(v);inp.dispatchEvent(new Event('input',{bubbles:true}));}});
  root.addEventListener('input',ev=>{const t=ev.target.closest('.ops-track');if(!t)return;const data={};t.querySelectorAll('[data-field]').forEach(i=>data[i.dataset.field]=Number(i.value||0));try{localStorage.setItem('ops-track-'+t.dataset.track,JSON.stringify(data));}catch{}});}
 return {render,bind};
})();
