/* Porta do GitHub Pages: pede a senha, decifra dados.bin (AES-GCM, chave PBKDF2) e só então carrega o portal. Gerado por portal/pages.py. */
(()=>{
 const G=window.OP_GATE,$=s=>document.querySelector(s);
 const keyName='oprpg-chave-'+G.area;
 const store={get(){try{return localStorage.getItem(keyName);}catch{return null;}},set(v){try{localStorage.setItem(keyName,v);}catch{}},drop(){try{localStorage.removeItem(keyName);}catch{}}};
 const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 const style=document.createElement('style');
 style.textContent=`.porta{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:25px;background:radial-gradient(ellipse at 70% 0%,#2a6c9a,#122f4c 60%,#0c2238);font:15px 'Nunito','Nunito Sans',Arial,sans-serif;color:#1f3047;overflow:auto}
.porta form{position:relative;max-width:420px;width:100%;background:#fffdf8;border-radius:26px;padding:36px 34px 28px;box-shadow:0 30px 60px -24px #000c,0 0 0 6px #ffffff14}
.porta .flag{display:block;width:120px;margin:-82px auto 0;filter:drop-shadow(0 8px 14px #0006)}.porta h1{font:40px 'Lilita One','Bangers',Impact,sans-serif;letter-spacing:.3px;text-align:center;margin:12px 0 8px;color:#1f3047;line-height:1.05}
.porta p{line-height:1.7;font-size:13px;text-align:center;margin:0 0 6px}.porta label{font-size:12px;font-weight:800;display:block;margin-top:18px}
.porta input[type=password]{width:100%;font:inherit;padding:13px 16px;border-radius:14px;margin-top:8px;border:1px solid #eee0c2;background:#fbf4e4;color:#1f3047}
.porta .lembrar{display:flex;gap:8px;align-items:center;font-weight:400;font-size:12px}.porta button{width:100%;font:inherit;padding:13px;border-radius:999px;background:linear-gradient(180deg,#ef4b45,#d83136);color:#fff;border:0;font-weight:800;cursor:pointer;margin-top:22px;box-shadow:0 10px 20px -10px #d83136,inset 0 1px #ffffff4d}
.porta button:disabled{opacity:.7;cursor:wait}.porta button:focus-visible,.porta input:focus-visible{outline:3px solid #f7c843;outline-offset:3px}
.porta .erro{background:#fde2dc;border-radius:12px;padding:10px;color:#9a2420;font-size:12px;margin-top:14px;text-align:center}.porta .trocar{display:block;text-align:center;font-size:12px;font-weight:700;color:#b9282c;margin-top:16px;text-decoration:none}.porta .trocar:hover{text-decoration:underline}.porta small{display:block;font-size:10px;font-weight:800;letter-spacing:2px;text-align:center;color:#d99a12;margin-top:22px}`;
 document.head.append(style);
 const box=document.createElement('div');box.className='porta';
 box.innerHTML=`<form autocomplete="on"><img class="flag" src="logo-one-piece.svg" alt=""><h1></h1><p>Este diário está trancado. Digite a senha para abrir.</p><input type="text" name="username" autocomplete="username" value="${G.area}" hidden><label for="porta-senha">Senha</label><input id="porta-senha" type="password" autocomplete="current-password" required><label class="lembrar"><input type="checkbox" id="porta-lembrar"> Lembrar neste navegador</label><button type="submit">Abrir →</button><div class="erro" role="alert" hidden></div><a class="trocar" href="${G.area==='mestre'?'../':'mestre/'}">${G.area==='mestre'?'← Voltar ao portal dos jogadores':'Sou o mestre → entrar no portal do mestre'}</a><small>ONE PIECE · OP RPG</small></form>`;
 box.querySelector('h1').textContent=G.title;
 const form=box.querySelector('form'),input=box.querySelector('#porta-senha'),button=box.querySelector('button'),error=box.querySelector('.erro');
 let cipher;
 const dados=()=>cipher||(cipher=fetch('dados.bin',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('sem dados');return r.arrayBuffer();}));
 async function derive(password){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:b64(G.salt),iterations:G.iterations},base,{name:'AES-GCM',length:256},true,['decrypt']);
 }
 async function open(key){
  const buf=new Uint8Array(await dados());
  return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:buf.slice(0,12)},key,buf.slice(12)));
 }
 const load=src=>new Promise((ok,fail)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>fail(new Error(src));document.body.append(s);});
 async function start(text){
  const url=URL.createObjectURL(new Blob([text],{type:'text/javascript'}));
  await load(url);URL.revokeObjectURL(url);
  box.remove();
  for(const src of G.scripts)await load(src);
 }
 async function remembered(){
  const raw=store.get();if(!raw)return false;
  try{const key=await crypto.subtle.importKey('raw',b64(raw),'AES-GCM',false,['decrypt']);await start(await open(key));return true;}
  catch{store.drop();return false;}
 }
 form.onsubmit=async e=>{
  e.preventDefault();error.hidden=true;button.disabled=true;button.textContent='Abrindo…';
  try{
   const key=await derive(input.value);let text;
   try{text=await open(key);}catch(err){if(err.message==='sem dados')throw err;error.textContent='Senha incorreta. Tente de novo.';error.hidden=false;input.select();return;}
   if(box.querySelector('#porta-lembrar').checked)store.set(btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.exportKey('raw',key)))));
   await start(text);
  }catch{error.textContent='Não consegui carregar o diário. Recarregue a página.';error.hidden=false;}
  finally{button.disabled=false;button.textContent='Abrir →';}
 };
 remembered().then(ok=>{if(!ok){document.body.append(box);input.focus();}});
})();
