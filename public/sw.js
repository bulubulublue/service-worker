let CACHE_VERSION = 0;
let CACHE_NAME = "cache_v" + CACHE_VERSION;
let CACHE_URLS = [
  "/",
  "/api/movies",
  "/js/main.js",
  "/js/render.js",
  "/js/ui.js",
  "/css/main.css",
  "/img/logo.png",
];

function precache() {
  return caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(CACHE_URLS);
  });
}

function clearCache() {
  return caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key !== CACHE_NAME) {
        caches.delete(key);
      }
    });
  });
}

// 缓存到 cacheStorage 里
function saveToCache(req, res) {
  return caches.open(CACHE_NAME).then((cache) => cache.put(req, res));
}

//请求并缓存内容
function fetchAndCache(req) {
  return fetch(req).then(function (res) {
    saveToCache(req, res.clone());
    return res;
  });
}

// 一般在install的时候缓存数据
self.addEventListener("install", function (event) {
  //waitUntil表示缓存完毕后再接着执行剩余代码
  event.waitUntil(precache());
});

// 激活后清除旧缓存
self.addEventListener("activated", function (event) {
  event.waitUntil(clearCache());
});

self.addEventListener("fetch", function (event) {
  //可以判断是否同源，如果不是，则正常请求
  let url = new URL(event.request.url);
  if (url.origin !== self.origin) {
    return;
  }

  // 默认情况下，service worker存储的是第一次请求的数据，但如果数据经常更新，需要存储上一次请求返回的数据
  if (event.request.url.includes("/api/movies")) {
    event.respondWith(
      fetchAndCache(event.request).catch(function () {
        return caches.match(event.request);
      })
    );
    return;
  }

  // 优先从网上获取，如果断网，则从cache获取
  event.respondWith(
    fetch(event.request).catch(function () {
      //从cache获取
      return caches.match(event.request);
    })
  );
});
