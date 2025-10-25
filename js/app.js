// ===== util =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const byId = id => document.getElementById(id);

// ===== nav/view switch =====
$$('.nav__link').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.nav__link').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const v = btn.dataset.view;
    $$('.view').forEach(s=>s.classList.remove('is-visible'));
    byId(`view-${v}`).classList.add('is-visible');
  });
});
$$('[data-view-jump]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const v = btn.dataset.viewJump;
    $(`.nav__link[data-view="${v}"]`).click();
  });
});

// ===== background fx (soft moving orbs) =====
(() => {
  const c = byId('fx-bg');
  const ctx = c.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const orbs = new Array(12).fill(0).map((_,i)=>({
    x: Math.random(), y: Math.random(), r: Math.random()*60+40,
    dx: (Math.random()-.5)*0.0008, dy:(Math.random()-.5)*0.0008,
    hue: 160 + Math.random()*120
  }));
  function resize(){
    c.width = innerWidth * DPR;
    c.height = innerHeight * DPR;
    ctx.scale(DPR, DPR);
  }
  resize(); addEventListener('resize', resize);

  function tick(){
    ctx.clearRect(0,0,innerWidth,innerHeight);
    orbs.forEach(o=>{
      o.x+=o.dx; o.y+=o.dy;
      if(o.x<0||o.x>1) o.dx*=-1;
      if(o.y<0||o.y>1) o.dy*=-1;
      const g = ctx.createRadialGradient(o.x*innerWidth, o.y*innerHeight, 0, o.x*innerWidth, o.y*innerHeight, o.r);
      g.addColorStop(0, `hsla(${o.hue}, 90%, 65%, .16)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x*innerWidth, o.y*innerHeight, o.r, 0, Math.PI*2);
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();
})();

// ===== Roulette logic =====
const LOL_ROLES = ["TOP","JUNGLE","MID","ADC","SUPPORT"];

function linesToList(text){
  return text.split(/[\n,]/).map(s=>s.trim()).filter(Boolean);
}

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function assignRolesOrTeams(){
  const members = linesToList(byId('members').value);
  const useLol = byId('lolMode').checked;
  const teamCount = Math.max(2, Math.min(4, parseInt(byId('teamCount').value||'2',10)));

  if(members.length === 0){
    byId('assignResult').innerHTML = `<span class="muted">メンバーを入力してください。</span>`;
    return;
  }

  // LoLロール割り当て
  if(useLol){
    const m = members.slice(0, LOL_ROLES.length); // 5人まで
    const roles = LOL_ROLES.slice(0, m.length);
    const mapping = shuffle(roles).map((r, i)=>({ role:r, name: m[i] }));
    const rest = members.slice(LOL_ROLES.length);
    let html = `<h3>ロール割り当て</h3><ul>`;
    mapping.forEach(p=>{
      html += `<li><strong>${p.role}</strong> → ${p.name}</li>`;
    });
    html += `</ul>`;
    if(rest.length){
      html += `<p class="muted">※ 6人目以降（観戦/サブ）： ${rest.join(', ')}</p>`;
    }
    byId('assignResult').innerHTML = html;
    return;
  }

  // チーム分け（均等配分）
  const shuffled = shuffle(members);
  const teams = Array.from({length:teamCount}, ()=>[]);
  shuffled.forEach((name,i)=> teams[i%teamCount].push(name));

  let html = `<h3>チーム分け（${teamCount}）</h3><div class="grid-2 gap-lg">`;
  teams.forEach((t, idx)=>{
    html += `<div class="card"><h4>Team ${idx+1}</h4><ol>${t.map(n=>`<li>${n}</li>`).join('')}</ol></div>`;
  });
  html += `</div>`;
  byId('assignResult').innerHTML = html;
}

byId('assignBtn').addEventListener('click', assignRolesOrTeams);
byId('clearAssign').addEventListener('click', ()=>{
  byId('assignResult').innerHTML = '';
  byId('members').value = '';
});

// チェックに応じて「チーム数」行を表示/非表示
byId('lolMode').addEventListener('change', (e)=>{
  byId('teamRow').style.display = e.target.checked ? 'none' : 'flex';
});

// ===== Wheel (canvas roulette) =====
const wheelCanvas = byId('wheel');
const wctx = wheelCanvas.getContext('2d');
let wheelItems = [];
let angle = 0;
let spinning = false;

function parseWheelItems(){
  const items = linesToList(byId('rouletteItems').value);
  wheelItems = items;
  drawWheel();
}
byId('rouletteItems').addEventListener('input', parseWheelItems);
byId('addMembersToWheel').addEventListener('click', ()=>{
  const list = linesToList(byId('members').value);
  byId('rouletteItems').value = list.join(', ');
  parseWheelItems();
});
byId('addRolesToWheel').addEventListener('click', ()=>{
  byId('rouletteItems').value = LOL_ROLES.join(', ');
  parseWheelItems();
});

function drawWheel(){
  const c = wheelCanvas;
  const ctx = wctx;
  const R = c.width/2;
  ctx.clearRect(0,0,c.width,c.height);

  // pointer
  ctx.save();
  ctx.translate(R, R);
  // segments
  const n = wheelItems.length || 8;
  for(let i=0;i<n;i++){
    const start = angle + i*(Math.PI*2/n);
    const end = start + (Math.PI*2/n);
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,R-4,start,end);
    const hue = 180 + (i*360/n);
    ctx.fillStyle = `hsla(${hue}, 75%, 60%, .85)`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // labels
  ctx.fillStyle = '#0b0f1a';
  ctx.font = '16px Inter, sans-serif';
  for(let i=0;i<(wheelItems.length||0);i++){
    const mid = angle + (i+.5)*(Math.PI*2/wheelItems.length);
    const r = R*0.62;
    ctx.save();
    ctx.rotate(mid);
    ctx.translate(r, 0);
    ctx.rotate(Math.PI/2);
    const label = wheelItems[i];
    const text = label.length>18 ? label.slice(0,18)+'…' : label;
    ctx.textAlign='center';
    ctx.fillText(text, 0, 8);
    ctx.restore();
  }
  // center knob
  ctx.beginPath();
  ctx.arc(0,0,24,0,Math.PI*2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  ctx.stroke();

  ctx.restore();

  // pointer triangle
  ctx.beginPath();
  ctx.moveTo(R, 8);
  ctx.lineTo(R-14, -8);
  ctx.lineTo(R+14, -8);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  ctx.stroke();
}

function spin(){
  if(spinning) return;
  if(wheelItems.length === 0){
    byId('spinResult').textContent = '候補を入力してください。';
    return;
  }
  spinning = true;
  const n = wheelItems.length;
  const targetIndex = Math.floor(Math.random()*n);
  const targetAngle = (Math.PI*2/n) * targetIndex + (Math.PI*2/n)/2;
  // spin 3〜5回転 + 誤差を調整
  const rotations = (Math.PI*2) * (3 + Math.floor(Math.random()*3));
  const finalAngle = (Math.PI*3/2) - targetAngle + rotations; // pointerは上

  const start = angle;
  const duration = 2800 + Math.random()*1200;
  const startTime = performance.now();

  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  function anim(now){
    const t = Math.min(1, (now - startTime)/duration);
    angle = start + (finalAngle - start) * easeOutCubic(t);
    drawWheel();
    if(t<1) requestAnimationFrame(anim);
    else{
      spinning = false;
      const landedIndex = (n - Math.floor(((angle - Math.PI*1.5) % (Math.PI*2) + Math.PI*2) / (Math.PI*2/n)) ) % n;
      const winner = wheelItems[landedIndex];
      byId('spinResult').textContent = `🎉 結果：${winner}`;
    }
  }
  requestAnimationFrame(anim);
}
byId('spinBtn').addEventListener('click', spin);
drawWheel();

// ===== Clips (in-memory only) =====
const clips = [];
function renderClips(){
  const list = byId('clipList');
  list.innerHTML = '';
  clips.forEach((c, i)=>{
    const li = document.createElement('li');
    li.className = 'clip';
    li.innerHTML = `
      <h4>${escapeHtml(c.title || '（無題）')}</h4>
      <div class="meta">${c.time.toLocaleString()}</div>
      <div>${toLinkOrText(c.body)}</div>
      <div class="actions">
        <button class="btn" data-copy="${i}">コピー</button>
        <button class="btn" data-del="${i}">削除</button>
      </div>
    `;
    list.appendChild(li);
  });
  list.addEventListener('click', onClipClick, { once:true });
}
function onClipClick(e){
  if(e.target.matches('[data-copy]')){
    const idx = +e.target.dataset.copy;
    navigator.clipboard.writeText(clips[idx].body).then(()=> {
      e.target.textContent = 'コピー済';
      setTimeout(()=> e.target.textContent='コピー', 1200);
    });
  }else if(e.target.matches('[data-del]')){
    const idx = +e.target.dataset.del;
    clips.splice(idx,1);
    renderClips();
  }
}
byId('addClip').addEventListener('click', ()=>{
  const title = byId('clipTitle').value.trim();
  const body = byId('clipBody').value.trim();
  if(!title && !body) return;
  clips.unshift({ title, body, time: new Date() });
  byId('clipTitle').value=''; byId('clipBody').value='';
  renderClips();
});
byId('clearClips').addEventListener('click', ()=>{
  clips.length = 0;
  renderClips();
});
function escapeHtml(s){
  return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[m]));
}
function toLinkOrText(s){
  const url = s.match(/https?:\/\/\S+/);
  if(url) return `<a href="${url[0]}" target="_blank" rel="noreferrer">${escapeHtml(s)}</a>`;
  return `<pre style="white-space:pre-wrap;margin:0">${escapeHtml(s)}</pre>`;
}

// ===== YouTube share (in-memory) =====
const ytItems = [];
function extractYouTubeId(url){
  try{
    const u = new URL(url);
    if(u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if(u.searchParams.get('v')) return u.searchParams.get('v');
    if(u.hostname.includes('youtube.com') && u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
    return '';
  }catch{ return '' }
}
function renderYT(){
  const wrap = byId('ytList');
  wrap.innerHTML = '';
  ytItems.forEach(id=>{
    const iframe = document.createElement('iframe');
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.src = `https://www.youtube.com/embed/${id}`;
    wrap.appendChild(iframe);
  });
}
byId('addYt').addEventListener('click', ()=>{
  const url = byId('ytUrl').value.trim();
  const id = extractYouTubeId(url);
  if(!id){ byId('ytUrl').focus(); return; }
  ytItems.push(id);
  byId('ytUrl').value='';
  renderYT();
});
byId('clearYt').addEventListener('click', ()=>{
  ytItems.length = 0;
  renderYT();
});

// accessibility: Enterで追加
['ytUrl','clipTitle','clipBody'].forEach(id=>{
  byId(id).addEventListener('keydown', (e)=>{ if(e.key==='Enter' && (id!=='clipBody' || e.ctrlKey)){ e.preventDefault(); e.target.blur(); }});
});

// 初期表示
renderClips();
renderYT();
parseWheelItems();
