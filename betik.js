/* ═══════════════════════════════════════════════════════════════════════════ */
/*                     ZEYNOBİK'İN KÖŞESİ — SAYFA BETİĞİ                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ─────────────────── Yardımcılar ─────────────────── */

  /* ─────────────────── tarihYaz ─────────────────── */
  function tarihYaz(isoMetin) {
    const t = new Date(isoMetin);
    if (isNaN(t.getTime())) return "";
    const iki = (s) => String(s).padStart(2, "0");
    return (
      iki(t.getDate()) + "." + iki(t.getMonth() + 1) + "." + t.getFullYear() +
      " " + iki(t.getHours()) + ":" + iki(t.getMinutes())
    );
  }

  /* ─────────────────── olcuAyir ─────────────────── */
  function olcuAyir(metin) {
    if (!metin) return null;
    const bulunan = String(metin).match(/(\d+)\s*[x×]\s*(\d+)/i);
    if (!bulunan) return null;
    const genislik = Number(bulunan[1]);
    const yukseklik = Number(bulunan[2]);
    if (!genislik || !yukseklik) return null;
    return { genislik: genislik, yukseklik: yukseklik, oran: genislik + " / " + yukseklik };
  }

  /* ─────────────────── Görseller ─────────────────── */

  /* ─────────────────── fotolariTara ─────────────────── */
  /* data-foto="klasör/dosya" → img/klasör/dosya. data-olcu="GENİŞLİKxYÜKSEKLİK"  */
  /* çerçevenin genişlik ve oranını belirler.                                      */
  function fotolariTara() {
    document.querySelectorAll("img[data-foto]").forEach(function (img) {
      const dosya = "img/" + img.getAttribute("data-foto");
      const olcu = olcuAyir(img.getAttribute("data-olcu"));

      const cerceve = img.closest(".foto");
      if (olcu && cerceve) {
        cerceve.style.setProperty("--foto-genislik", olcu.genislik + "px");
        cerceve.style.setProperty("--foto-oran", olcu.oran);
      }

      img.addEventListener("error", function () {
        if (img.dataset.dusuruldu) return;
        img.dataset.dusuruldu = "1";
        console.warn("Görsel bulunamadı:", dosya);

        /* Kırık görsel simgesi yerine boş çerçeve kalır */
        img.style.visibility = "hidden";
      });

      /* Yükleme önceliği HTML'deki loading ve fetchpriority ile belirlenir */
      img.decoding = "async";
      if (img.getAttribute("src") !== dosya) img.src = dosya;
    });
  }

  /* ─────────────────── onbellekKur ─────────────────── */
  /* Görseller bir kez indirildikten sonra kalıcı önbellekten anında gelir.      */
  /* Service worker yalnızca http(s) üzerinde çalışır; dosya:// ile sessizce     */
  /* devre dışı kalır.                                                           */
  function onbellekKur() {
    if ("storage" in navigator && typeof navigator.storage.persist === "function") {
      navigator.storage.persisted().then(function (kalici) {
        if (!kalici) return navigator.storage.persist();
      }).catch(function () {});
    }

    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "http:" && location.protocol !== "https:") return;

    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function (hata) {
        console.warn("Görsel önbelleği kurulamadı:", hata);
      });
    });
  }

  /* ─────────────────── Işık Kutusu ─────────────────── */

  function isikKutusuKur() {
    const kap = document.createElement("div");
    kap.className = "isik-kutusu";
    kap.hidden = true;
    kap.setAttribute("role", "dialog");
    kap.setAttribute("aria-modal", "true");
    kap.setAttribute("aria-label", "büyük görsel");

    const ic = document.createElement("div");
    ic.className = "isik-ic";

    const resim = document.createElement("img");
    resim.className = "isik-resim";
    resim.alt = "";

    const alt = document.createElement("p");
    alt.className = "isik-alt";

    const kapatDugme = document.createElement("button");
    kapatDugme.type = "button";
    kapatDugme.className = "isik-kapat";
    kapatDugme.textContent = "✕ kapat";

    ic.appendChild(resim);
    ic.appendChild(alt);
    ic.appendChild(kapatDugme);
    kap.appendChild(ic);
    document.body.appendChild(kap);

    let sonOdak = null;

    /* ─────────────────── kapat ─────────────────── */
    function kapat() {
      kap.hidden = true;
      document.body.classList.remove("isik-acik");
      resim.removeAttribute("src");
      if (sonOdak && typeof sonOdak.focus === "function") sonOdak.focus();
      sonOdak = null;
    }

    /* ─────────────────── ac ─────────────────── */
    function ac(tetik) {
      const buyuk = tetik.currentSrc || tetik.src;
      if (!buyuk) return;

      sonOdak = tetik;
      resim.src = buyuk;
      resim.alt = tetik.alt || "";

      /* Altyazı yalnızca figcaption varsa gösterilir; alt metni altyazı yerine geçmez */
      const cerceve = tetik.closest("figure");
      const yazi = cerceve ? cerceve.querySelector("figcaption") : null;
      const metin = yazi ? yazi.textContent.trim() : "";
      alt.textContent = metin;
      alt.hidden = !metin;

      kap.hidden = false;
      document.body.classList.add("isik-acik");
      kapatDugme.focus();
    }

    kap.addEventListener("click", function (olay) {
      if (olay.target === kap) kapat();
    });

    kapatDugme.addEventListener("click", kapat);

    document.addEventListener("keydown", function (olay) {
      if (kap.hidden) return;
      if (olay.key === "Escape") {
        olay.preventDefault();
        kapat();
      } else if (olay.key === "Tab") {
        /* Odak açık pencerenin dışına kaçmasın */
        olay.preventDefault();
        kapatDugme.focus();
      }
    });

    document.querySelectorAll(".foto img[data-foto], .avatar[data-foto], .muzik-kapak img[data-muzik-kapak], .galeri-kare img[data-foto]").forEach(function (img) {
      if (!img.closest('[aria-hidden="true"]')) {
        img.setAttribute("tabindex", "0");
        img.setAttribute("role", "button");
        img.setAttribute("aria-label", (img.alt || "görsel") + " — büyüt");
      }

      img.addEventListener("click", function () {
        ac(img);
      });

      img.addEventListener("keydown", function (olay) {
        if (olay.key === "Enter" || olay.key === " ") {
          olay.preventDefault();
          ac(img);
        }
      });
    });
  }

  /* ─────────────────── Galeri Şeridi ─────────────────── */

  /* ─────────────────── galeriSlideriKur ─────────────────── */
  /* Tüm galeri şeritleri aynı dili paylaşır: kareler üç set hâlinde         */
  /* çoğaltılır, ortadaki set gerçektir ve aktif kare ortada tutulur.        */
  function galeriSlideriKur(kapId) {
    const kap = document.getElementById(kapId);
    if (!kap) return;
    const ray = kap.querySelector(".galeri-ray");
    if (!ray) return;

    const ozgunKareler = Array.prototype.slice.call(ray.querySelectorAll(".galeri-kare"));
    const kareSayisi = ozgunKareler.length;
    if (kareSayisi < 2) return;

    const sayi = kap.querySelector(".galeri-sayi");
    const setSayisi = 3;
    const ortaSet = 1;
    const kareler = [];
    let aktif = ortaSet * kareSayisi;

    /* Kareler üç kez çoğaltılır: ortadaki set gerçek, yanlardakiler sonsuzluk hissi için. */
    ray.textContent = "";
    for (let set = 0; set < setSayisi; set++) {
      ozgunKareler.forEach(function (kare) {
        const kopya = kare.cloneNode(true);
        if (set !== ortaSet) kopya.setAttribute("aria-hidden", "true");
        ray.appendChild(kopya);
        kareler.push(kopya);
      });
    }

    /* ─────────────────── diz ─────────────────── */
    function diz(aninda) {
      kareler.forEach(function (kare, i) {
        kare.classList.toggle("aktif", i === aktif);
      });

      const kare = kareler[aktif];
      if (!kare) return;

      /* Aktif kare, şeridin tam ortasına hizalanır */
      const kaydir = kap.clientWidth / 2 - (kare.offsetLeft + kare.offsetWidth / 2);

      if (aninda) {
        ray.style.transition = "none";
        ray.style.transform = "translateX(" + kaydir + "px)";
        void ray.offsetWidth;
        ray.style.transition = "";
      } else {
        ray.style.transform = "translateX(" + kaydir + "px)";
      }

      if (sayi) sayi.textContent = ((aktif % kareSayisi) + 1) + " / " + kareSayisi;
    }

    /* ─────────────────── git ─────────────────── */
    /* Sınır aşılırsa görünmez geçişle orta sete dönülür, sonra tek adım atılır. */
    function git(yon) {
      const hedef = aktif + yon;

      if (hedef >= kareSayisi * 2 || hedef < kareSayisi) {
        aktif += hedef >= kareSayisi * 2 ? -kareSayisi : kareSayisi;
        diz(true);
        aktif += yon;
        diz(false);
        return;
      }

      aktif = hedef;
      diz(false);
    }

    kap.querySelectorAll(".galeri-ok").forEach(function (dugme) {
      dugme.addEventListener("click", function () {
        git(Number(dugme.getAttribute("data-yon")) || 1);
      });
    });

    /* ─────────────────── dengele ─────────────────── */
    /* Aktif kare orta setin dışına çıkarsa aynı fotoğrafın orta setteki        */
    /* kopyasına geçer; ekrandaki konum değişmediği için göze görünmez.         */
    function dengele() {
      if (aktif >= kareSayisi && aktif < kareSayisi * 2) return;
      aktif = ((aktif % kareSayisi) + kareSayisi) % kareSayisi + kareSayisi;
      diz(true);
    }

    /* Kenardaki fotoğrafa tıklayınca ortaya gelir; aktif fotoğraf büyütülür. */
    kareler.forEach(function (kare, i) {
      kare.addEventListener(
        "click",
        function (olay) {
          if (i === aktif) return;
          olay.preventDefault();
          olay.stopPropagation();
          aktif = i;
          diz(false);
          window.setTimeout(dengele, 450);
        },
        true
      );
    });

    window.addEventListener("resize", function () {
      diz(true);
    });

    diz(true);
  }

  /* ─────────────────── Hareketler ─────────────────── */

  /* ─────────────────── kivilcimIzi ─────────────────── */
  function kivilcimIzi() {
    let son = 0;
    document.addEventListener("mousemove", function (olay) {
      const simdi = Date.now();
      if (simdi - son < 55) return;
      son = simdi;
      const nokta = document.createElement("span");
      nokta.className = "kivilcim";
      nokta.textContent = Math.random() > 0.5 ? "✦" : "♥";
      nokta.style.left = olay.clientX + (Math.random() * 10 - 5) + "px";
      nokta.style.top = olay.clientY + (Math.random() * 10 - 5) + "px";
      document.body.appendChild(nokta);
      window.setTimeout(function () { nokta.remove(); }, 900);
    });
  }

  /* ─────────────────── tiklamaKalbiKur ─────────────────── */
  function tiklamaKalbiKur() {
    const renkler = ["#ff8fa3", "#f06b86", "#e76f83", "#ff9eb2", "#d95770"];
    document.addEventListener("mousedown", function (olay) {
      if (olay.button !== 0) return;

      const kalp = document.createElement("span");
      kalp.className = "tiklama-kalbi";
      kalp.setAttribute("aria-hidden", "true");
      kalp.textContent = "♥";
      kalp.style.left = olay.clientX + (Math.random() * 20 - 10) + "px";
      kalp.style.top = olay.clientY + (Math.random() * 20 - 10) + "px";
      kalp.style.setProperty("--kalp-renk", renkler[Math.floor(Math.random() * renkler.length)]);
      document.body.appendChild(kalp);

    window.setTimeout(function () {
      kalp.remove();
    }, 1000);
  }, true);
}

  /* ─────────────────── sonGuncellemeYaz ─────────────────── */
  /* Sunucu Last-Modified başlığı göndermezse tarayıcı "şu an"ı döndürür; böyle    */
  /* bir durumda ziyaretçinin saatini yazmamak için HTML'deki sabit tarih kalır.   */
  function sonGuncellemeYaz() {
    const kap = document.getElementById("son-guncelleme");
    if (!kap) return;
    const t = new Date(document.lastModified);
    if (isNaN(t.getTime()) || Math.abs(Date.now() - t.getTime()) < 60 * 1000) return;
    kap.textContent = tarihYaz(t.toISOString());
  }

  /* ─────────────────── Müzik Kutusu ─────────────────── */

  /* ─────────────────── muzikOynaticiKur ─────────────────── */
  function muzikOynaticiKur() {
    const oynatici = document.querySelector("[data-muzik-oynatici]");
    if (!oynatici) return;

    const audio = oynatici.querySelector("audio");
    const dugme = oynatici.querySelector(".muzik-oynat-dugme");
    const ilerleme = oynatici.querySelector(".muzik-ilerleme");
    const gecen = oynatici.querySelector(".muzik-gecen");
    const toplam = oynatici.querySelector(".muzik-toplam");
    const durum = oynatici.querySelector(".muzik-oynatici-durum");
    const kapak = document.querySelector(".muzik-kapak img[data-muzik-kapak]");
    const kapakBos = document.querySelector(".muzik-kapak-bos");
    const parcalar = Array.from(document.querySelectorAll("#muzik .muzik-liste [data-parca]"));
    let seciliParca = parcalar.find(function (parca) {
      return parca.hasAttribute("data-audio");
    });
    if (!audio || !dugme || !ilerleme || !gecen || !toplam || !durum || !kapak || !kapakBos || !seciliParca) return;

    const zamanYaz = function (saniye) {
      if (!Number.isFinite(saniye)) return "0:00";
      const tamSaniye = Math.floor(saniye);
      return Math.floor(tamSaniye / 60) + ":" + String(tamSaniye % 60).padStart(2, "0");
    };

    const parcaAdi = function (parca) {
      const ad = parca.querySelector(".muzik-ad");
      return ad ? ad.textContent.trim() : "parça";
    };

    const aktifYap = function (parca) {
      seciliParca = parca;
      parcalar.forEach(function (oge) {
        oge.classList.remove("muzik-aktif", "muzik-caliyor");
        oge.removeAttribute("aria-current");
      });
      parca.classList.add("muzik-aktif");
      parca.setAttribute("aria-current", "true");
      const dosya = parca.getAttribute("data-kapak");
      if (dosya && kapak.getAttribute("src") !== dosya) {
        kapak.dataset.kapak = dosya;
        kapak.hidden = true;
        kapakBos.hidden = false;
        kapak.src = dosya;
      }
    };

    const oynat = function () {
      const sonuc = audio.play();
      if (sonuc && typeof sonuc.catch === "function") {
        sonuc.catch(function () {
          durum.textContent = "Parça oynatılamadı: " + (audio.currentSrc || audio.src);
          console.error("Müzik parçası oynatılamadı:", audio.currentSrc || audio.src);
        });
      }
    };

    const hataGoster = function () {
      seciliParca.classList.remove("muzik-caliyor");
      dugme.setAttribute("aria-label", parcaAdi(seciliParca) + " parçasını oynat");
      dugme.title = "Oynat";
      dugme.disabled = true;
      durum.textContent = "Ses dosyası yüklenemedi: " + (audio.currentSrc || audio.src);
      console.error("Müzik dosyası yüklenemedi:", audio.currentSrc || audio.src);
    };

    kapak.addEventListener("error", function () {
      kapak.hidden = true;
      kapakBos.hidden = false;
      durum.textContent = "Kapak görseli yüklenemedi: " + (kapak.dataset.kapak || "");
      console.error("Müzik kapak görseli yüklenemedi:", kapak.currentSrc || kapak.src);
    });
    kapak.addEventListener("load", function () {
      kapak.hidden = false;
      kapakBos.hidden = true;
      durum.textContent = "";
    });
    if (kapak.complete) {
      if (kapak.naturalWidth > 0) {
        kapak.hidden = false;
        kapakBos.hidden = true;
      } else {
        kapak.dispatchEvent(new Event("error"));
      }
    }

    const zamaniGuncelle = function () {
      gecen.textContent = zamanYaz(audio.currentTime);
      ilerleme.value = String(audio.currentTime || 0);
    };

    audio.addEventListener("loadedmetadata", function () {
      if (Number.isFinite(audio.duration)) {
        ilerleme.max = String(audio.duration);
        toplam.textContent = zamanYaz(audio.duration);
        ilerleme.disabled = false;
        dugme.disabled = false;
      }
      zamaniGuncelle();
    });

    audio.addEventListener("durationchange", function () {
      if (!Number.isFinite(audio.duration)) return;
      ilerleme.max = String(audio.duration);
      toplam.textContent = zamanYaz(audio.duration);
    });

    audio.addEventListener("timeupdate", zamaniGuncelle);
    audio.addEventListener("play", function () {
      aktifYap(seciliParca);
      seciliParca.classList.add("muzik-caliyor");
      dugme.textContent = "Ⅱ";
      dugme.setAttribute("aria-label", parcaAdi(seciliParca) + " parçasını duraklat");
      dugme.title = "Duraklat";
    });
    audio.addEventListener("pause", function () {
      seciliParca.classList.remove("muzik-caliyor");
      if (audio.ended || audio.error) return;
      dugme.textContent = "▶";
      dugme.setAttribute("aria-label", parcaAdi(seciliParca) + " parçasını sürdür");
      dugme.title = "Devam et";
    });
    audio.addEventListener("ended", function () {
      seciliParca.classList.remove("muzik-caliyor");
      dugme.textContent = "↻";
      dugme.setAttribute("aria-label", parcaAdi(seciliParca) + " parçasını baştan oynat");
      dugme.title = "Baştan oynat";
    });
    audio.addEventListener("error", hataGoster);

    parcalar.forEach(function (parca) {
      if (!parca.hasAttribute("data-audio")) return;
      parca.setAttribute("tabindex", "0");
      parca.setAttribute("role", "button");
      parca.setAttribute("aria-label", parcaAdi(parca) + " parçasını oynat");

      parca.addEventListener("click", function () {
        const dosya = parca.getAttribute("data-audio");
        if (!dosya) return;
        aktifYap(parca);
        audio.src = dosya;
        audio.load();
        dugme.disabled = false;
        dugme.textContent = "▶";
        dugme.setAttribute("aria-label", parcaAdi(parca) + " parçasını oynat");
        dugme.title = "Oynat";
        gecen.textContent = "0:00";
        toplam.textContent = "0:00";
        ilerleme.value = "0";
        ilerleme.max = "0";
        ilerleme.disabled = true;
        oynat();
      });

      parca.addEventListener("keydown", function (olay) {
        if (olay.key !== "Enter" && olay.key !== " ") return;
        olay.preventDefault();
        parca.click();
      });
    });

    dugme.addEventListener("click", function () {
      if (audio.paused) {
        if (audio.ended) audio.currentTime = 0;
        dugme.disabled = false;
        oynat();
      } else {
        audio.pause();
      }
    });

    ilerleme.addEventListener("input", function () {
      if (Number.isFinite(audio.duration)) audio.currentTime = Number(ilerleme.value);
    });

    /* Açılışta oynatıcı, listedeki ilk parçayla (kapak, düğme, ses dosyası) uyumlu başlar */
    const ilkDosya = seciliParca.getAttribute("data-audio");
    if (audio.getAttribute("src") !== ilkDosya) audio.src = ilkDosya;
    aktifYap(seciliParca);
    dugme.setAttribute("aria-label", parcaAdi(seciliParca) + " parçasını oynat");
  }

  /* ─────────────────── Başlat ─────────────────── */

  /* Sıra önemli: şeritler önce kurulur ki çoğaltılan karelere de görsel yolu ve  */
  /* hata dinleyicisi atansın; ışık kutusu en son, bütün kareler hazır olunca.    */
  document.addEventListener("DOMContentLoaded", function () {
    galeriSlideriKur("galeri-slider");
    galeriSlideriKur("nostalji-slider");
    fotolariTara();
    isikKutusuKur();
    kivilcimIzi();
    tiklamaKalbiKur();
    sonGuncellemeYaz();
    muzikOynaticiKur();
    onbellekKur();
  });
})();