/* Optional Supabase backup. Credentials are entered on the user's device and
 * session tokens are kept in memory. No third-party JavaScript is loaded. */
(() => {
  let session = null, revision = null, busy = false;
  const defaultConfig = {url:'https://iwdssmemkvcapogdtrur.supabase.co', key:'sb_publishable_FKZIF4pV36pSl97aJMSaQw_p8-4eQ8s'};
  let config = {...defaultConfig};
  try { config = {...defaultConfig,...JSON.parse(localStorage.getItem('soundlab-cloud-config') || '{}')}; } catch {}
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `<h2>Backup & cloud sync</h2><p class="muted">Export your workspace, or sign in to your own Supabase project to save and restore it across devices.</p>
    <div class="actions"><button id="backup-export">Export JSON</button><button id="backup-import">Import JSON</button><input type="file" id="backup-file" accept=".json,application/json" hidden></div>
    <hr style="border:0;border-top:1px solid #343b38;margin:20px 0">
    <form id="cloud-form"><label class="form-field">Supabase project URL<input type="url" id="cloud-url" required placeholder="https://your-project.supabase.co"></label>
    <label class="form-field">Publishable key<input id="cloud-key" required placeholder="sb_publishable_…"></label>
    <label class="form-field">Email<input type="email" id="cloud-email" autocomplete="username" required></label>
    <label class="form-field">Password<input type="password" id="cloud-password" autocomplete="current-password" required></label>
    <button type="submit" class="primary">Sign in</button></form>
    <div id="cloud-actions" hidden><div class="actions"><button id="cloud-pull">Load cloud copy</button><button id="cloud-push" class="primary">Save to cloud</button><button id="cloud-out">Sign out</button></div><p class="muted">Saving is explicit. Save after editing, then load on your other device. Sign out and clear local data on shared devices.</p></div>
    <p id="cloud-status" role="status" aria-live="polite" class="muted"></p><button id="cloud-close">Close</button>`;
  document.body.append(dialog);
  const el = id => document.getElementById(id), status = message => el('cloud-status').textContent = message;
  const setView = () => { el('cloud-form').hidden = !!session; el('cloud-actions').hidden = !session; };
  function safeSnapshot(input) {
    if (!input || !Array.isArray(input.projects) || !Array.isArray(input.ideas)) throw new Error('Invalid workspace file.');
    const ids = new Set();
    const strings = a => Array.isArray(a) && a.every(x => typeof x === 'string');
    const projects = input.projects.map(p => {
      if (!p || !/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id) || !['name','tagline','purpose','status','notes','github'].every(k => typeof p[k] === 'string') || !['tech','features','tasks'].every(k => strings(p[k])) || !Array.isArray(p.done) || !p.done.every(i => Number.isInteger(i) && i >= 0 && i < p.tasks.length) || !['Idea','Prototype','In progress','Complete'].includes(p.status)) throw new Error('Invalid project in backup.');
      ids.add(p.id);
      const result = {...p, done: [...new Set(p.done)]};
      delete result.demo; delete result.download;
      const original = seed.find(x => x.id === p.id);
      if (original) { result.demo = original.demo; result.download = original.download; }
      return result;
    });
    if (!strings(input.ideas)) throw new Error('Invalid ideas in backup.');
    return {projects, ideas: input.ideas};
  }
  function restore(data) { state = safeSnapshot(data); save(); route(); }
  function exportBackup() {
    const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'}), url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download='soundlab-backup.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function call(path, {method='GET', body, authorized=true, headers={}}={}) {
    const res = await fetch(config.url+path, {method, headers:{'apikey':config.key,'Content-Type':'application/json',...(authorized && session?{Authorization:'Bearer '+session.access_token}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
    const data = await res.json().catch(()=>null);
    if (!res.ok) throw new Error(data?.msg || data?.message || data?.error_description || `Request failed (${res.status})`);
    return data;
  }
  const rowPath = () => '/rest/v1/soundlab_workspaces?user_id=eq.'+encodeURIComponent(session.user.id);
  const getRow = async () => (await call(rowPath()+'&select=workspace,revision'))[0];
  async function run(fn) { if(busy)return; busy=true; status('Working…'); try{await fn()}catch(error){status(error.message)} finally{busy=false} }
  el('cloud-open').onclick=()=>{el('cloud-url').value=config.url||'';el('cloud-key').value=config.key||'';setView();dialog.showModal()};
  el('cloud-close').onclick=()=>dialog.close();el('backup-export').onclick=exportBackup;el('backup-import').onclick=()=>el('backup-file').click();
  el('backup-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>5*1024*1024)throw new Error('Backup exceeds 5 MB.');const data=safeSnapshot(JSON.parse(await file.text()));if(confirm('Replace this browser’s workspace with the imported backup?')){restore(data);status('Backup imported.')}}catch(error){status(error.message)}finally{event.target.value=''}};
  el('cloud-form').onsubmit=event=>{event.preventDefault();run(async()=>{
    const url=new URL(el('cloud-url').value), key=el('cloud-key').value.trim();
    if(url.protocol!=='https:'||!/^([a-z0-9]+)\.supabase\.co$/.test(url.hostname)||url.pathname!=='/'||url.search||url.hash||url.username||url.password) throw new Error('Use the HTTPS project URL from your Supabase dashboard.');
    if(!/^sb_publishable_[\w-]+$/.test(key)){const payload=key.split('.')[1];let role;try{role=JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/'))).role}catch{}if(role!=='anon')throw new Error('Use a publishable or legacy anon key, never a secret/service-role key.');}
    config={url:url.origin,key}; session=await call('/auth/v1/token?grant_type=password',{method:'POST',authorized:false,body:{email:el('cloud-email').value,password:el('cloud-password').value}});el('cloud-password').value='';localStorage.setItem('soundlab-cloud-config',JSON.stringify(config));revision=null;setView();status('Signed in. Load your existing cloud copy first, or save this workspace if none exists.');
  })};
  el('cloud-pull').onclick=()=>run(async()=>{const row=await getRow();if(!row){revision=0;status('No cloud copy yet. Save this workspace to create one.');return}const copy=safeSnapshot(row.workspace);if(confirm('Replace this browser’s workspace with the cloud copy?')){restore(copy);revision=row.revision;status('Cloud copy loaded.')}});
  el('cloud-push').onclick=()=>run(async()=>{const row=await getRow();if(row && revision!==row.revision){status('A cloud copy already exists or changed. Export your local backup, then load the latest cloud copy before saving.');return}const current=safeSnapshot(state);if(!row){await call('/rest/v1/soundlab_workspaces',{method:'POST',body:{user_id:session.user.id,workspace:current,revision:1},headers:{Prefer:'return=minimal'}});revision=1}else{const rows=await call(rowPath()+'&revision=eq.'+revision,{method:'PATCH',body:{workspace:current,revision:revision+1,updated_at:new Date().toISOString()},headers:{Prefer:'return=representation'}});if(!rows?.length)throw new Error('Cloud copy changed during saving. Load the latest version.');revision++}status('Workspace saved to cloud.');});
  el('cloud-out').onclick=()=>run(async()=>{try{await call('/auth/v1/logout',{method:'POST'})}finally{session=null;revision=null;setView();status('Signed out. Your local copy remains on this device.')}});
})();
