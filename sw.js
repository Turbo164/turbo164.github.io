const CACHE='turbo-164-brand-v24-diecast-menu-click-fix';
const PRECACHE=['./','index.html','app.js?v=admin-full-card-8','language.js?v=3','config.js','catalog.json','manifest.webmanifest','smart-camera.js','scan-references.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('arbox-garage-')||key.startsWith('turbo-164-brand-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)))});
self.addEventListener('push',event=>{let p={};try{p=event.data.json()}catch{p={title:'TURBO 164 release update',body:event.data?.text()||'New release lead'}}event.waitUntil(self.registration.showNotification(p.title||'TURBO 164',{body:p.body||'A new release lead was found',icon:'icon-192.png',badge:'icon-192.png',data:{url:p.url||'./'}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.openWindow(event.notification.data?.url||'./'))});


