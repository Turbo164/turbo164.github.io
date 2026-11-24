const CACHE='turbo-164-brand-v63-daily-points';
const PRECACHE=['./','index.html','app.js?v=catalog-additions-20261123','language.js?v=daily-points-20261124','config.js','catalog.json','catalog-additions.json','diorama-catalog.json','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','favicon.png','smart-camera.js','scan-references.json','community.js?v=daily-points-20261124','live-chat.js?v=community-chat-20261124-2','install.js?v=1'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('arbox-garage-')||key.startsWith('turbo-164-brand-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)))});
self.addEventListener('push',event=>{let p={};try{p=event.data.json()}catch{p={title:'TURBO 164 release update',body:event.data?.text()||'New release lead'}}event.waitUntil(self.registration.showNotification(p.title||'TURBO 164',{body:p.body||'A new release lead was found',icon:'icon-192.png',badge:'icon-192.png',data:{url:p.url||'./'}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.openWindow(event.notification.data?.url||'./'))});


