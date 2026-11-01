// Margin Notes offline cache. Bump V whenever index.html changes.
const V='margin-notes-v128';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
const PDFJS=['./pdf.min.js','./pdf.worker.min.js']; // the PDF reader, fetched once and kept for offline use
const CDN='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
self.addEventListener('install',e=>{e.waitUntil((async()=>{
  const c=await caches.open(V);
  await c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})));
  try{await c.add(new Request(CDN,{mode:'cors'}))}catch(_){}
  for(const u of PDFJS){try{await c.add(new Request(u,{cache:'reload'}))}catch(_){}}
  self.skipWaiting();
})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==V&&k.startsWith('margin-notes-'))await caches.delete(k);
  await self.clients.claim();
})())});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(r.mode==='navigate'){ // app shell: cached copy first, so it opens instantly offline
    e.respondWith(caches.match('./index.html').then(m=>m||fetch(r)));return;
  }
  const external=u.origin!==location.origin;
  e.respondWith((async()=>{
    const c=await caches.open(V),m=await c.match(r,{ignoreSearch:!external});
    if(m)return m;
    try{const res=await fetch(r);if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}
    catch(err){return m||Response.error()}
  })());
});
