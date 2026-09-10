const C='attend-v11';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png',
 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js','https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css',
 'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap','https://cdn.jsdelivr.net/gh/webfontworld/kopub/KoPubWorldDotum.css'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.allSettled(FILES.map(f=>c.add(f)))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.url.includes('script.google')||e.request.url.includes('googleusercontent'))return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(e.request.method==='GET'&&res.ok){const cl=res.clone();caches.open(C).then(c=>c.put(e.request,cl));}return res;}).catch(()=>caches.match('./index.html'))));});
