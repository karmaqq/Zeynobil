/* ═══════════════════════════════════════════════════════════════════════════ */
/*                  ZEYNOBİK'İN KÖŞESİ — GÖRSEL ÖNBELLEĞİ                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* Elle güncellenen liste yok: görseller ilk istendiğinde kendiliğinden eklenir. */
const ONBELLEK_ADI = "zeynobil-gorseller";

/* Önbellekteki bir görsel bu süreden eskiyse bir kez ağdan tazelenir. */
const TAZELEME_SURESI = 24 * 60 * 60 * 1000;

/* ─────────────────── Kurulum ─────────────────── */
self.addEventListener("install", function (olay) {
  olay.waitUntil(
    caches
      .open(ONBELLEK_ADI)
      .then(function () {
        return self.skipWaiting();
      })
  );
});

/* ─────────────────── Etkinleştirme ─────────────────── */
/* Eski sürümlerden kalan önbellekler temizlenir; güncel olan korunur. */
self.addEventListener("activate", function (olay) {
  olay.waitUntil(
    caches
      .keys()
      .then(function (adlar) {
        return Promise.all(
          adlar
            .filter(function (ad) {
              return ad.indexOf("zeynobil-gorseller") === 0 && ad !== ONBELLEK_ADI;
            })
            .map(function (ad) {
              return caches.delete(ad);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

/* ─────────────────── Yardımcılar ─────────────────── */

/* ─────────────────── tazele ─────────────────── */
/* İsteği ağdan alır ve başarılı yanıtı önbelleğe yazar. Yazma işi           */
/* waitUntil ile uzatılır; sayfa kapansa bile önbellek tamamlanır.            */
function tazele(istek, olay) {
  return fetch(istek).then(function (yanit) {
    if (yanit && yanit.status === 200) {
      const kopya = yanit.clone();
      const yazma = caches
        .open(ONBELLEK_ADI)
        .then(function (onbellek) {
          return onbellek.put(istek, kopya);
        })
        .catch(function () {});
      if (olay && typeof olay.waitUntil === "function") olay.waitUntil(yazma);
    }
    return yanit;
  });
}

/* ─────────────────── yas ─────────────────── */
function yas(yanit) {
  const tarih = new Date(yanit.headers.get("date") || 0);
  if (isNaN(tarih.getTime())) return Infinity;
  return Date.now() - tarih.getTime();
}

/* ─────────────────── İstek Yakalama ─────────────────── */
/* Görseller: taze önbellek varsa doğrudan, yoksa ağdan (ve önbelleğe).        */
/* Sayfa/stil/betik: önce ağ (güncelleme anında görünsün), olmazsa önbellek.   */
self.addEventListener("fetch", function (olay) {
  const istek = olay.request;
  if (istek.method !== "GET") return;

  const adres = new URL(istek.url);
  if (adres.origin !== self.location.origin) return;

  const gorsel =
    istek.destination === "image" ||
    /\.(png|jpe?g|webp|gif|svg|avif|ico)$/i.test(adres.pathname);

  if (gorsel) {
    olay.respondWith(
      caches.match(istek).then(function (eski) {
        if (eski && yas(eski) < TAZELEME_SURESI) return eski;
        return tazele(istek, olay).catch(function () {
          return eski || Response.error();
        });
      })
    );
    return;
  }

  olay.respondWith(
    fetch(istek)
      .then(function (yanit) {
        if (yanit && yanit.status === 200) {
          const kopya = yanit.clone();
          const yazma = caches
            .open(ONBELLEK_ADI)
            .then(function (onbellek) {
              return onbellek.put(istek, kopya);
            })
            .catch(function () {});
          olay.waitUntil(yazma);
        }
        return yanit;
      })
      .catch(function () {
        return caches.match(istek, { ignoreSearch: true }).then(function (onbellek) {
          return (
            onbellek ||
            new Response("Çevrimdışısınız.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" }
            })
          );
        });
      })
  );
});
