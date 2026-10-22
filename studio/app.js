const canvas = document.querySelector('#stage');
const ctx = canvas.getContext('2d');
const projectUrl = '/api/project';
let project;
let assetImage = null;
let frame = 0;
let playing = true;
let lastTick = performance.now();
let dirty = false;
let showRig = false;

const $ = selector => document.querySelector(selector);
const markDirty = () => { dirty = true; $('#saveState').textContent = 'Ungespeichert'; $('#saveState').style.color = '#f2bb68'; };
const currentAnimation = () => project.animations[$('#animation').value];

async function loadProject() {
  const response = await fetch(`${projectUrl}?t=${Date.now()}`);
  if (!response.ok) throw new Error('Projektdatei konnte nicht geladen werden.');
  project = await response.json();
  $('#assetName').value = project.asset.label;
  $('#assetTitle').textContent = project.asset.label;
  $('#animation').innerHTML = Object.keys(project.animations).map(name => `<option value="${name}">${name}</option>`).join('');
  $('#animation').value = Object.keys(project.animations)[0];
  frame = 0;
  await loadAssets();
  updateTimeline();
  draw();
  dirty = false;
  $('#saveState').textContent = 'Verbunden';
  $('#saveState').style.color = '';
}

async function loadAssets() {
  const response = await fetch(`/api/assets?t=${Date.now()}`);
  const files = await response.json();
  $('#assetFile').innerHTML = '<option value="">Vektor-Platzhalter verwenden</option>' + files.map(file => `<option value="${encodeURIComponent(file)}">${file}</option>`).join('');
  if (project.asset.image && files.includes(project.asset.image)) $('#assetFile').value = encodeURIComponent(project.asset.image);
  await setImage($('#assetFile').value ? decodeURIComponent($('#assetFile').value) : '');
}

function setImage(name) {
  return new Promise(resolve => {
    if (!name) { assetImage = null; draw(); return resolve(); }
    const image = new Image();
    image.onload = () => { assetImage = image; draw(); resolve(); };
    image.onerror = () => { assetImage = null; draw(); resolve(); };
    image.src = `/assets/${name.split('/').map(encodeURIComponent).join('/')}?t=${Date.now()}`;
  });
}

function poseAt(anim, f) {
  const keys = [...anim.keys].sort((a, b) => a.frame - b.frame);
  if (f <= keys[0].frame) return keys[0];
  if (f >= keys[keys.length - 1].frame) return keys[keys.length - 1];
  const rightIndex = keys.findIndex(key => key.frame >= f);
  const a = keys[rightIndex - 1], b = keys[rightIndex];
  const t = (f - a.frame) / (b.frame - a.frame);
  const ease = t * t * (3 - 2 * t);
  return Object.fromEntries(['x', 'y', 'scale', 'rotation', 'capeAngle', 'alpha'].map(k => [k, (a[k] ?? (k === 'scale' || k === 'alpha' ? 1 : 0)) + ((b[k] ?? (k === 'scale' || k === 'alpha' ? 1 : 0)) - (a[k] ?? (k === 'scale' || k === 'alpha' ? 1 : 0))) * ease]));
}

function draw() {
  if (!project) return;
  const w = project.canvas.width, h = project.canvas.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.scale(canvas.width / w, canvas.height / h);
  const p = poseAt(currentAnimation(), frame);
  ctx.translate(w / 2 + p.x, h * .68 + p.y);
  ctx.rotate((p.rotation || 0) * Math.PI / 180);
  ctx.scale(p.scale || 1, p.scale || 1); ctx.globalAlpha = p.alpha ?? 1;
  if (assetImage) {
    const factor = Math.min(230 / assetImage.width, 250 / assetImage.height);
    const iw = assetImage.width * factor, ih = assetImage.height * factor;
    ctx.drawImage(assetImage, -iw / 2, -ih, iw, ih);
    if (project.rig?.capeMask) drawFlappingCape(p, factor, iw, ih);
  } else drawPlaceholder();
  ctx.restore();
  if (showRig && project.rig) drawRig();
}

function drawFlappingCape(pose, factor, iw, ih) {
  const points = project.rig.capeMask;
  const pivot = project.rig.capePivot;
  const path = () => {
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      const px = -iw / 2 + x * factor, py = -ih + y * factor;
      index === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.closePath();
  };
  // Remove the selected hem from the flat base image, then repaint those exact source pixels as a separate moving cutout.
  ctx.save(); ctx.globalCompositeOperation = 'destination-out'; path(); ctx.fill(); ctx.restore();
  const pivotX = -iw / 2 + pivot.x * factor, pivotY = -ih + pivot.y * factor;
  ctx.save(); ctx.translate(pivotX, pivotY); ctx.rotate((pose.capeAngle || 0) * Math.PI / 180); ctx.translate(-pivotX, -pivotY);
  path(); ctx.clip(); ctx.drawImage(assetImage, -iw / 2, -ih, iw, ih); ctx.restore();
}

function drawRig() {
  const byName = Object.fromEntries(project.rig.bones.map(b => [b.name, b]));
  const points = {};
  const point = bone => {
    if (points[bone.name]) return points[bone.name];
    const parent = bone.parent ? point(byName[bone.parent]) : { x: 0, y: 0 };
    return points[bone.name] = { x: parent.x + bone.x, y: parent.y + bone.y };
  };
  ctx.save(); ctx.scale(canvas.width / project.canvas.width, canvas.height / project.canvas.height); ctx.globalAlpha = .95; ctx.lineWidth = 1.5;
  for (const bone of project.rig.bones) {
    const p = point(bone);
    if (bone.parent) { const parent = point(byName[bone.parent]); ctx.strokeStyle = '#75e6d0'; ctx.beginPath(); ctx.moveTo(parent.x, parent.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    ctx.fillStyle = bone.name === 'root' ? '#ffe66d' : '#f8ffff'; ctx.strokeStyle = '#132224'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, bone.name === 'root' ? 4 : 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function drawPlaceholder() {
  ctx.save();
  const gradient = ctx.createLinearGradient(-65, -130, 75, -5);
  gradient.addColorStop(0, '#fff2a4'); gradient.addColorStop(.4, '#e9ac35'); gradient.addColorStop(1, '#8b4d11');
  ctx.shadowColor = 'rgba(255,188,55,.45)'; ctx.shadowBlur = 20;
  ctx.fillStyle = gradient; ctx.strokeStyle = '#fff1ac'; ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const radius = i % 2 ? 46 : 92; const angle = -Math.PI / 2 + i * Math.PI / 5; const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff2ba'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('WILD', 0, 5);
  ctx.restore();
}

function updateTimeline() {
  const anim = currentAnimation();
  $('#animName').textContent = $('#animation').value;
  $('#scrub').max = anim.duration; $('#scrub').value = Math.min(frame, anim.duration);
  $('#timelineTicks').innerHTML = Array.from({ length: 7 }, (_, index) => `<span>${Math.round(anim.duration * index / 6)}</span>`).join('');
  $('#frameReadout').textContent = `Frame ${Math.round(frame)} / ${anim.duration}`;
  $('#keySummary').value = JSON.stringify(anim.keys, null, 2);
}

function tick(now) {
  const anim = currentAnimation();
  if (playing && anim) {
    frame += (now - lastTick) * project.canvas.fps / 1000;
    if (frame > anim.duration) frame = anim.loop ? frame % anim.duration : anim.duration;
    draw();
    $('#scrub').value = Math.round(frame);
    $('#frameReadout').textContent = `Frame ${Math.round(frame)} / ${anim.duration}`;
  }
  lastTick = now;
  requestAnimationFrame(tick);
}

$('#animation').addEventListener('change', () => { frame = 0; updateTimeline(); draw(); });
$('#rigToggle').addEventListener('click', () => { showRig = !showRig; $('#rigToggle').textContent = showRig ? 'Bones ausblenden' : 'Bones anzeigen'; draw(); });
$('#play').addEventListener('click', () => { playing = !playing; $('#play').textContent = playing ? 'Ⅱ' : '▶'; });
$('#scrub').addEventListener('input', event => { playing = false; $('#play').textContent = '▶'; frame = Number(event.target.value); updateTimeline(); draw(); });
$('#assetName').addEventListener('input', event => { project.asset.label = event.target.value; $('#assetTitle').textContent = event.target.value; markDirty(); });
$('#assetFile').addEventListener('change', async event => { project.asset.image = event.target.value ? decodeURIComponent(event.target.value) : ''; await setImage(project.asset.image); markDirty(); });
$('#keySummary').addEventListener('change', event => { try { const keys = JSON.parse(event.target.value); if (!Array.isArray(keys) || !keys.length) throw new Error('Keyframes müssen eine nichtleere Liste sein.'); currentAnimation().keys = keys; currentAnimation().duration = Math.max(...keys.map(key => Number(key.frame) || 0)); frame = 0; updateTimeline(); draw(); markDirty(); } catch (error) { alert(`Ungültiges Keyframe-JSON: ${error.message}`); updateTimeline(); } });
$('#reload').addEventListener('click', () => loadProject().catch(error => alert(error.message)));
$('#save').addEventListener('click', async () => { const response = await fetch(projectUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(project, null, 2) }); if (!response.ok) return alert('Speichern fehlgeschlagen.'); dirty = false; $('#saveState').textContent = 'Gespeichert'; $('#saveState').style.color = '#9bd768'; });
$('#export').addEventListener('click', () => { const blob = new Blob([JSON.stringify(project, null, 2) + '\n'], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${project.asset.id}_animation_project.json`; a.click(); URL.revokeObjectURL(a.href); });
$('#upload').addEventListener('click', () => $('#fileInput').click());
$('#fileInput').addEventListener('change', async event => { const file = event.target.files[0]; if (!file) return; const response = await fetch(`/api/upload?name=${encodeURIComponent(file.name)}`, { method: 'POST', body: file }); if (!response.ok) return alert('Asset konnte nicht hochgeladen werden.'); const { name } = await response.json(); await loadAssets(); $('#assetFile').value = encodeURIComponent(name); project.asset.image = name; await setImage(name); markDirty(); event.target.value = ''; });
window.addEventListener('dragover', event => event.preventDefault());
window.addEventListener('drop', async event => { event.preventDefault(); const file = [...event.dataTransfer.files].find(f => /image\/(png|jpeg|webp)/.test(f.type)); if (!file) return; const response = await fetch(`/api/upload?name=${encodeURIComponent(file.name)}`, { method: 'POST', body: file }); if (!response.ok) return alert('Asset konnte nicht importiert werden.'); const { name } = await response.json(); await loadAssets(); $('#assetFile').value = encodeURIComponent(name); project.asset.image = name; await setImage(name); markDirty(); });
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });

loadProject().then(() => requestAnimationFrame(tick)).catch(error => { $('#saveState').textContent = error.message; $('#saveState').style.color = '#ff8787'; });
