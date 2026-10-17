export let products=[],categories=[];
let index=[],pending;
export const normalize=s=>String(s??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function loadCatalog(){return pending??=Promise.all([fetch('data/products.json'),fetch('data/categories.json')]).then(async responses=>{if(responses.some(r=>!r.ok))throw Error('Catalogue unavailable');[products,categories]=await Promise.all(responses.map(r=>r.json()));index=products.map(p=>({p,text:normalize([p.name,p.brand,p.pack,p.id].join(' '))}));return products;});}
export function search(query='',category='all',sort='featured'){const words=normalize(query).split(' ').filter(Boolean);let result=index.filter(({p,text})=>(category==='all'||p.catSlug===category)&&words.every(w=>text.includes(w))).map(r=>r.p);if(sort==='low')result.sort((a,b)=>a.price-b.price);else if(sort==='high')result.sort((a,b)=>b.price-a.price);else result.sort((a,b)=>Number(Boolean(b.img))-Number(Boolean(a.img)));return result;}
export const debounce=(fn,ms=180)=>{let timer;const run=(...args)=>{clearTimeout(timer);timer=setTimeout(()=>fn(...args),ms);};run.cancel=()=>clearTimeout(timer);return run;};
export const byId=id=>products.find(p=>p.id===id);
export const categoryArt=slug=>({'rice-atta-dal':'pantry','oil-spices':'spices','dairy-frozen':'dairy','drinks-beverages':'drinks','home-cleaning':'cleaning','personal-care':'personal','everyday-essentials':'everyday'}[slug]);
