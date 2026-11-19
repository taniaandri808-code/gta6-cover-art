import { renderPoster } from './poster.js';
import { palettes } from './palettes.js';

const state = { images: [null,null,null], transforms: Array(3).fill({scale:1,ox:0,oy:0}), captionLines: ['NEON','','',''], paletteIndex: 0 };
const loadImage = src => new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});
const cv = document.getElementById('preview'); cv.width=540; cv.height=540;
const render = () => renderPoster(cv, state);
const loadSample = (i,src) => loadImage(src).then(img=>{state.images[i]=img;render();});
loadSample(0,'./samples/pier.jpg'); loadSample(1,'./samples/boulevard.jpg');
document.getElementById('cap0').value='NEON';
for(let i=0;i<4;i++){const el=document.getElementById(`cap${i}`);if(el)el.addEventListener('input',e=>{state.captionLines[i]=e.target.value;render();});}
for(let i=0;i<5;i++){const btn=document.getElementById(`pal-${i}`);if(btn)btn.addEventListener('click',()=>{state.paletteIndex=i;document.querySelectorAll('[id^="pal-"]').forEach(b=>b.classList.remove('on'));btn.classList.add('on');render();});}
for(let i=0;i<3;i++){const input=document.getElementById(`p${i+1}`);if(input)input.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>loadImage(ev.target.result).then(img=>{state.images[i]=img;render();});r.readAsDataURL(f);});}
for(let i=0;i<3;i++){const r=document.getElementById(`z${i+1}`);if(r)r.addEventListener('input',e=>{state.transforms[i].scale=parseFloat(e.target.value);render();});}

// dropzone
const drop = document.getElementById('drop');
if (drop) {
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('hover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('hover'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('hover');
    const f = e.dataTransfer.files[0];
    if (!f) return;
    const i = state.images.findIndex(x => !x) ?? 0;
    const r = new FileReader();
    r.onload = ev => loadImage(ev.target.result).then(img => { state.images[i] = img; render(); });
    r.readAsDataURL(f);
  });
}

// pan
let drag = null;
cv.addEventListener('pointerdown', e => {
  drag = { x: e.clientX, y: e.clientY, i: state.images.findIndex(x => x) === -1 ? 0 : state.images.findIndex(x => x) };
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', e => {
  if (!drag) return;
  const t = state.transforms[drag.i];
  t.ox -= (e.clientX - drag.x) * 2;
  t.oy -= (e.clientY - drag.y) * 2;
  drag.x = e.clientX;
  drag.y = e.clientY;
  render();
});
cv.addEventListener('pointerup', () => { drag = null; });

// export
const sizes = { exp1: [1080, 1080], exp2: [1080, 1350], exp3: [1920, 1080] };
for (const id in sizes) {
  const btn = document.getElementById(id);
  if (!btn) continue;
  btn.addEventListener('click', () => {
    const [w, h] = sizes[id];
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    renderPoster(off, state);
    off.toBlob(b => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'cover-' + w + 'x' + h + '.png';
      a.click();
      const s = document.getElementById('status');
      if (s) s.textContent = 'Exported ' + w + ' x ' + h + ' PNG';
    }, 'image/png');
  });
}
