const icon=(name,size=18)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>`;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
export function bookGallery(){
 const pages=[
  {title:'Your neighbourhood store',image:'assets/storefront.webp',alt:'The actual Nabho Bazaar storefront'},
  {title:'Right around the corner',image:'assets/lively-v2/neighbours.webp',alt:'Promotional neighbours outside the Nabho Bazaar storefront'},
  {title:'Packed with care',image:'assets/lively-v2/packing.webp',alt:'Promotional Nabho Bazaar grocery packing scene'},
  {title:'Your groceries, a few taps away',image:'assets/lively-v2/ordering.webp',alt:'Promotional customer ordering Nabho Bazaar groceries from home'},
  {title:'From our shelves to your door',image:'assets/lively-v1/delivery.webp',alt:'Promotional neighbourhood grocery delivery scene'}
 ];
 return `<div class="book-gallery" aria-label="Nabho Bazaar photo book" tabindex="0"><div class="book-frame"><div class="book-spine"></div><div class="book-stack"></div><div class="book-pages">${pages.map((page,i)=>`<article class="book-page ${i===0?'is-current':''}" data-book-page="${i}" aria-hidden="${i!==0}"><span class="book-kicker">NABHO BAZAAR / ${String(i+1).padStart(2,'0')}</span><img ${i===0?`src="${page.image}"`:`data-src="${page.image}"`} alt="${page.alt}" ${i===0?'fetchpriority="high"':'loading="lazy"'}><div class="book-caption">${page.title}</div></article>`).join('')}</div></div><div class="book-controls"><button type="button" data-book="prev" aria-label="Previous photo page">${icon('arrow',18)}</button><span class="book-position" aria-live="polite">01 / 05</span><button type="button" data-book="next" aria-label="Next photo page">${icon('arrow',18)}</button><button type="button" class="book-pause" data-book="pause" aria-label="Pause photo book" aria-pressed="false">Pause</button></div></div>`;
}

function initBook(box){
 const pages=[...box.querySelectorAll('[data-book-page]')],position=box.querySelector('.book-position'),pause=box.querySelector('[data-book=pause]');
 let index=0,busy=false,paused=motion.matches,hovered=false,focused=false,timer=null,animation=null,x=null,disposed=false;
 const stop=()=>{clearInterval(timer);timer=null;};
 function play(){stop();if(!disposed&&!paused&&!hovered&&!focused&&!document.hidden&&!motion.matches)timer=setInterval(()=>go(1),7000);}
 function render(){pages.forEach((p,i)=>{p.classList.toggle('is-current',i===index);p.classList.remove('is-under','is-turning');p.setAttribute('aria-hidden',String(i!==index));});position.textContent=`${String(index+1).padStart(2,'0')} / ${String(pages.length).padStart(2,'0')}`;}
 function pauseLabel(){pause.textContent=paused?'Play':'Pause';pause.setAttribute('aria-label',paused?'Play photo book':'Pause photo book');pause.setAttribute('aria-pressed',String(paused));}
 async function go(direction){
  if(busy||disposed)return;const next=(index+direction+pages.length)%pages.length;const photo=pages[next].querySelector('img[data-src]');if(photo){photo.src=photo.dataset.src;delete photo.dataset.src;}
  if(motion.matches){index=next;render();return;}
  busy=true;const current=pages[index],target=pages[next],turning=direction>0?current:target;
  if(direction>0)target.classList.add('is-under');else current.classList.add('is-under');
  turning.classList.add('is-turning');
  const frames=direction>0?[{transform:'rotateY(0deg)',filter:'brightness(1)'},{transform:'rotateY(-100deg)',filter:'brightness(.7)'}]:[{transform:'rotateY(-100deg)',filter:'brightness(.7)'},{transform:'rotateY(0deg)',filter:'brightness(1)'}];
  animation=turning.animate(frames,{duration:850,easing:'cubic-bezier(.25,.65,.25,1)',fill:'forwards'});
  try{await animation.finished;if(disposed)return;index=next;render();}catch{/* A route change or reduced-motion preference cancels the turn. */}
  finally{animation?.cancel();animation=null;busy=false;}
 }
 box.querySelectorAll('[data-book]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.book==='pause'){paused=!paused;pauseLabel();}else go(button.dataset.book==='next'?1:-1);play();}));
 box.addEventListener('pointerenter',()=>{hovered=true;stop();});box.addEventListener('pointerleave',()=>{hovered=false;play();});
 box.addEventListener('focusin',()=>{focused=true;stop();});box.addEventListener('focusout',()=>{queueMicrotask(()=>{focused=box.contains(document.activeElement);play();});});
 box.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(e.key==='ArrowRight'?1:-1);}});
 box.addEventListener('pointerdown',e=>{if(!e.target.closest('button'))x=e.clientX;},{passive:true});box.addEventListener('pointerup',e=>{if(x!==null&&Math.abs(e.clientX-x)>50)go(e.clientX<x?1:-1);x=null;},{passive:true});box.addEventListener('pointercancel',()=>x=null);
 const visibility=()=>play();document.addEventListener('visibilitychange',visibility);
 const change=()=>{paused=motion.matches;animation?.cancel();render();pauseLabel();play();};motion.addEventListener('change',change);
 pauseLabel();render();play();
 return ()=>{disposed=true;stop();animation?.cancel();document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',change);};
}

let cleanup;export function initHero(){cleanup?.();const box=document.querySelector('.book-gallery');cleanup=box?initBook(box):null;}