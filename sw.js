importScripts('./release-manifest.js');
const RELEASE=self.GRIMORIO_RELEASE;
const PREFIX='grimorio-release-';
const CACHE=PREFIX+RELEASE.version;
const assetUrls=new Map(RELEASE.assets.map(path=>[new URL(path,self.registration.scope).href,path]));
async function installRelease(){
  const cache=await caches.open(CACHE);
  try{
    for(const path of RELEASE.assets){
      const response=await fetch(new URL(path,self.registration.scope),{cache:'no-store'});
      if(!response.ok)throw new Error(`Recurso no válido: ${path}`);
      if(RELEASE.hashes[path]){
        const bytes=await response.clone().arrayBuffer();
        const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
        if(digest!==RELEASE.hashes[path])throw new Error(`Versión incoherente: ${path}`);
      }
      await cache.put(new URL(path,self.registration.scope),response);
    }
  }catch(error){await caches.delete(CACHE);throw error;}
}
self.addEventListener('install',event=>event.waitUntil(installRelease()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const path=assetUrls.get(url.href);
  if(path||event.request.mode==='navigate')event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const key=path?url:new URL(url.pathname.endsWith('recuperar.html')?'recuperar.html':'index.html',self.registration.scope);
    const response=await cache.match(key);
    return response || new Response('Recurso offline no disponible. Recarga cuando la versión esté preparada.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
  })());
});
async function askClients(type){
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  return Promise.all(clients.map(client=>new Promise(resolve=>{
    const channel=new MessageChannel();const timer=setTimeout(()=>resolve(null),5000);
    channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data);};
    client.postMessage({type},[channel.port2]);
  })));
}
self.addEventListener('message',event=>{
  if(event.data?.type==='REQUEST_UPDATE')event.waitUntil((async()=>{
    const answers=await askClients('UPDATE_READY');
    if(answers.some(answer=>!answer?.ready)){event.ports[0]?.postMessage({ok:false,message:'Termina las operaciones y revisa o descarta los borradores de todas las pestañas antes de actualizar.'});return;}
    event.ports[0]?.postMessage({ok:true});await self.skipWaiting();
  })());
  if(event.data?.type==='PRUNE_RELEASES')event.waitUntil((async()=>{
    const answers=await askClients('CLIENT_RELEASE');if(answers.some(answer=>!answer?.version))return;
    const used=new Set([CACHE,...answers.map(answer=>PREFIX+answer.version)]);
    const keys=await caches.keys();await Promise.all(keys.filter(key=>(key.startsWith(PREFIX)||key.startsWith('grimorio-base3-v'))&&!used.has(key)).map(key=>caches.delete(key)));
  })());
});
