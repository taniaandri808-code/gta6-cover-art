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
