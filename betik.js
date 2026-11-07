/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    KARMA Q'NUN KÖŞESİ — SAYFA BETİĞİ                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

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

/* ─────────────────── sigaraSayaciKur ─────────────────── */
function sigaraSayaciKur() {
  const sayac = document.querySelector("[data-sigara-sayaci]");
  if (!sayac) return;

  const baslangicMetni = sayac.getAttribute("data-baslangic");
  const baslangic = new Date(baslangicMetni);
  const durum = sayac.querySelector("[data-sayac-durum]");
  const birimler = {
    yil: sayac.querySelector('[data-sure-birim="yil"]'),
    ay: sayac.querySelector('[data-sure-birim="ay"]'),
    gun: sayac.querySelector('[data-sure-birim="gun"]'),
    saat: sayac.querySelector('[data-sure-birim="saat"]')
  };

  if (!baslangicMetni || !Number.isFinite(baslangic.getTime())) {
    durum.textContent = "Başlangıç tarihi okunamadı.";
    console.error("Sigara bırakma başlangıç tarihi geçersiz:", baslangicMetni);
    return;
  }

  function ayEkle(tarih, aySayisi) {
    const sonuc = new Date(tarih.getTime());
    const asilGun = sonuc.getDate();
    sonuc.setDate(1);
    sonuc.setMonth(sonuc.getMonth() + aySayisi);
    const ayinSonGunu = new Date(sonuc.getFullYear(), sonuc.getMonth() + 1, 0).getDate();
    sonuc.setDate(Math.min(asilGun, ayinSonGunu));
    return sonuc;
  }

  function guncelle() {
    const simdi = new Date();
    if (simdi < baslangic) {
      birimler.yil.textContent = "0";
      birimler.ay.textContent = "0";
      birimler.gun.textContent = "0";
      birimler.saat.textContent = "0";
      durum.textContent = "Bırakma zamanı henüz gelmedi.";
      return;
    }

    let yil = Math.max(0, simdi.getFullYear() - baslangic.getFullYear());
    while (yil > 0 && ayEkle(baslangic, yil * 12) > simdi) yil--;

    let imlec = ayEkle(baslangic, yil * 12);
    let ay = Math.max(0, (simdi.getFullYear() - imlec.getFullYear()) * 12 + simdi.getMonth() - imlec.getMonth());
    while (ay > 0 && ayEkle(imlec, ay) > simdi) ay--;
    imlec = ayEkle(imlec, ay);

    let gun = 0;
    while (true) {
      const sonrakiGun = new Date(imlec.getTime());
      sonrakiGun.setDate(sonrakiGun.getDate() + 1);
      if (sonrakiGun > simdi) break;
      imlec = sonrakiGun;
      gun++;
    }

    birimler.yil.textContent = String(yil);
    birimler.ay.textContent = String(ay);
    birimler.gun.textContent = String(gun);
    birimler.saat.textContent = String(Math.floor((simdi.getTime() - imlec.getTime()) / (60 * 60 * 1000)));
    durum.textContent = "sigarasız geçen süre";
  }

  guncelle();
  window.setInterval(guncelle, 60 * 1000);
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

/* ─────────────────── slotlariTara ─────────────────── */
function slotlariTara() {
  document.querySelectorAll("[data-slot]").forEach(function (el) {
    const dosya = "img/" + el.getAttribute("data-slot");
    const deneme = new Image();
    deneme.onload = function () {
      el.classList.remove("eksik");
    };
    deneme.onerror = function () {
      el.classList.add("eksik");
    };
    deneme.src = dosya;
  });
}

/* ─────────────────── fotolariTara ─────────────────── */
function fotolariTara() {
  document.querySelectorAll("img[data-foto]").forEach(function (img) {
    const dosya = "img/" + img.getAttribute("data-foto");
    const olcu = olcuAyir(img.getAttribute("data-olcu"));

    if (olcu) {
      img.style.setProperty("--foto-genislik", olcu.genislik + "px");
      img.style.setProperty("--foto-oran", olcu.oran);

      const cerceve = img.closest(".foto");
      if (cerceve) {
        cerceve.style.setProperty("--foto-genislik", olcu.genislik + "px");
        cerceve.style.setProperty("--foto-oran", olcu.oran);
      }
    }

    img.addEventListener("error", function () {
      if (img.dataset.dusuruldu) return;
      img.dataset.dusuruldu = "1";
      img.style.display = "none";

      if (olcu && olcu.genislik < 40) return;

      const yer = document.createElement("div");
      yer.className = "foto-yer";
      if (olcu) {
        yer.style.setProperty("--foto-genislik", olcu.genislik + "px");
        yer.style.setProperty("--foto-oran", olcu.oran);
      }
      yer.textContent = dosya + (img.getAttribute("data-olcu") ? "  ·  " + img.getAttribute("data-olcu") : "");
      img.parentNode.insertBefore(yer, img);
    });

    img.src = dosya;
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

    const cerceve = tetik.closest("figure");
    const yazi = cerceve ? cerceve.querySelector("figcaption") : null;
    alt.textContent = yazi ? yazi.textContent.trim() : (tetik.alt || "");

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

/* ─────────────────── Sonsuz Fotoğraf Şeridi ─────────────────── */

/* ─────────────────── sonsuzSlideriKur ─────────────────── */
function sonsuzSlideriKur(kapId) {
  const kap = document.getElementById(kapId);
  if (!kap) return;
  const ray = kap.querySelector(".galeri-ray");
  if (!ray) return;
  const asil = Array.prototype.slice.call(ray.querySelectorAll(".galeri-kare"));
  if (asil.length < 2) return;
  const adet = asil.length;
  const sayi = kap.querySelector(".galeri-sayi");
  const kareler = [];
  let aktif = adet;

  /* ─────────────────── kur ─────────────────── */
  ray.textContent = "";
  for (let set = 0; set < 3; set++) {
    asil.forEach(function (kare) {
      const kopya = kare.cloneNode(true);
      if (set !== 1) kopya.setAttribute("aria-hidden", "true");
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
    const kaydir = kap.clientWidth / 2 - (kare.offsetLeft + kare.offsetWidth / 2);

    if (aninda) {
      ray.style.transition = "none";
      ray.style.transform = "translateX(" + kaydir + "px)";
      void ray.offsetWidth;
      ray.style.transition = "";
    } else {
      ray.style.transform = "translateX(" + kaydir + "px)";
    }

    if (sayi) sayi.textContent = ((aktif % adet) + 1) + " / " + adet;
  }

  /* ─────────────────── git ─────────────────── */
  function git(yon) {
    const hedef = aktif + yon;
    if (hedef >= adet * 2 || hedef < adet) {
      aktif += hedef >= adet * 2 ? -adet : adet;
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
    if (aktif >= adet && aktif < adet * 2) return;
    aktif = ((aktif % adet) + adet) % adet + adet;
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

/* ─────────────────── Kıvılcım İzi ─────────────────── */

function kivilcimIzi() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
    setTimeout(function () { nokta.remove(); }, 900);
  });
}

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
function sonGuncellemeYaz() {
  const kap = document.getElementById("son-guncelleme");
  if (!kap) return;
  const t = new Date(document.lastModified);
  kap.textContent = isNaN(t.getTime()) ? "bilinmiyor" : tarihYaz(t.toISOString());
}

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
    dugme.setAttribute("aria-label", seciliParca ? parcaAdi(seciliParca) + " parçasını sürdür" : "Parçayı sürdür");
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
      audio.play().catch(function () {
        durum.textContent = "Parça oynatılamadı: " + (audio.currentSrc || audio.src);
        console.error("Müzik parçası oynatılamadı:", audio.currentSrc || audio.src);
      });
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
      audio.play().catch(function () {
        durum.textContent = "Parça oynatılamadı: " + (audio.currentSrc || audio.src);
        console.error("Müzik parçası oynatılamadı:", audio.currentSrc || audio.src);
      });
    } else {
      audio.pause();
    }
  });

  ilerleme.addEventListener("input", function () {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number(ilerleme.value);
  });
}

/* ─────────────────── Başlat ─────────────────── */

document.addEventListener("DOMContentLoaded", function () {
  slotlariTara();
  fotolariTara();
  sonsuzSlideriKur("galeri-slider");
  sonsuzSlideriKur("nostalji-slider");
  isikKutusuKur();
  kivilcimIzi();
  tiklamaKalbiKur();
  sonGuncellemeYaz();
  muzikOynaticiKur();
});
