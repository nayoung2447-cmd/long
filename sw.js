const CACHE="toolkit-v3";
const ASSETS=["./","./index.html","./tabs.html","./shared.css","./shared.js",
"./portfolio_pie.html","./portfolio_pie_us.html","./rebalance.html","./pnl_tax.html",
"./trade_journal.html","./opinion.html","./watchlist.html","./manifest.json","./icon-192.png","./icon-512.png","./icon-180.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener("activate",e=>{e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
)});
self.addEventListener("message",e=>{if(e.data==="skipWaiting")self.skipWaiting();});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const url=new URL(e.request.url);
  const isDoc=e.request.mode==="navigate"||/\.(html|js|css|json)$/.test(url.pathname);
  if(isDoc){
    // 네트워크 우선(최신 우선), 실패 시 캐시
    e.respondWith(fetch(e.request).then(res=>{
      if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}
      return res;
    }).catch(()=>caches.match(e.request).then(c=>c||caches.match("./index.html"))));
  }else{
    e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
  }
});
