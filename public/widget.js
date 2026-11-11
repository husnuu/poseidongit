/*!
 * Poseidon tekne turu widget'ı — partner sitelerine gömülür.
 *
 * <script src="https://cesmetekneturu.net/widget.js" data-partner="otel-adi" async></script>
 *
 * data-partner  (zorunlu) partner bağlantı adı
 * data-lang     tr | en | de | ru                       (varsayılan tr)
 * data-mode     list | tour | button                    (varsayılan list)
 * data-content  all | tours | yachts  listede turlar, tekne kiralama ya da ikisi (varsayılan all)
 * data-tour     tek tur modunda turun kimliği
 * data-tours    listede yalnızca bu turlar (virgülle)
 * data-category daily | private | special
 * data-color    ana renk, örn. #0f766e
 * data-prices   0 → fiyatlar gizlenir
 * data-label    buton modunda buton yazısı
 * data-target   widget'ın yerleşeceği öğe (CSS seçici); yoksa betiğin hemen altı
 */
(function () {
  'use strict';
  var SOURCE = 'poseidon-widget';
  var script = document.currentScript;
  if (!script || !script.src) return;

  var d = script.dataset || {};
  var base;
  try {
    base = new URL(script.src, window.location.href).origin;
  } catch (e) {
    return;
  }
  var partner = String(d.partner || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(partner)) {
    if (window.console) console.warn('[Poseidon widget] data-partner eksik veya geçersiz.');
    return;
  }
  var lang = /^(tr|en|de|ru)$/.test(d.lang || '') ? d.lang : 'tr';
  var mode = d.mode === 'tour' || d.mode === 'button' ? d.mode : 'list';
  var color = /^#?[0-9a-fA-F]{6}$/.test(d.color || '') ? d.color.replace('#', '') : '';
  var wid = Math.random().toString(36).slice(2, 10);

  var q = ['wid=' + wid];
  if (color) q.push('color=' + color);
  if (d.prices === '0') q.push('prices=0');
  if (d.tours) q.push('tours=' + encodeURIComponent(d.tours));
  if (d.category) q.push('category=' + encodeURIComponent(d.category));
  if (d.content === 'tours' || d.content === 'yachts') q.push('content=' + d.content);
  if (mode === 'tour' && d.tour) q.push('tour=' + encodeURIComponent(d.tour));
  var src = base + '/embed/' + lang + '/' + partner + '?' + q.join('&');

  var LABELS = {
    tr: 'Tekne Turu Rezervasyonu',
    en: 'Book a Boat Tour',
    de: 'Bootstour buchen',
    ru: 'Забронировать морскую прогулку',
  };
  var CLOSE = { tr: 'Kapat', en: 'Close', de: 'Schließen', ru: 'Закрыть' };

  function makeIframe(autoHeight) {
    var f = document.createElement('iframe');
    f.src = src;
    f.title = d.title || LABELS[lang];
    f.setAttribute('allow', 'clipboard-write');
    f.style.cssText =
      'display:block;width:100%;border:0;background:transparent;' + (autoHeight ? 'height:640px;' : 'height:100%;');
    if (autoHeight) f.setAttribute('scrolling', 'no');
    return f;
  }

  var mount = document.createElement('div');
  mount.className = 'poseidon-widget';
  var target = null;
  if (d.target) {
    try {
      target = document.querySelector(d.target);
    } catch (e) {
      target = null;
    }
  }
  if (target) target.appendChild(mount);
  else script.parentNode.insertBefore(mount, script.nextSibling);

  var iframe = null;
  var modal = null;

  window.addEventListener('message', function (e) {
    if (e.origin !== base || !e.data || e.data.source !== SOURCE || e.data.id !== wid || !iframe) return;
    if (e.data.type === 'navigate') {
      // Ödeme/onay ya da yat sayfası: misafir sitemize gider (yalnızca kendi alan adımız).
      var url = String(e.data.url || '');
      if (url.indexOf(base + '/') === 0) window.location.assign(url);
    } else if (e.data.type === 'height' && !modal) {
      var h = Number(e.data.height);
      if (h > 0 && h < 20000) iframe.style.height = h + 'px';
    } else if (e.data.type === 'scrollTop' && !modal) {
      var top = iframe.getBoundingClientRect().top;
      if (top < 0) window.scrollTo({ top: window.pageYOffset + top - 16, behavior: 'smooth' });
    }
  });

  if (mode !== 'button') {
    iframe = makeIframe(true);
    mount.appendChild(iframe);
    return;
  }

  // Buton modu: tıklanınca tam ekran pencerede açılır (iframe içi kaydırmalı).
  var button = document.createElement('button');
  button.type = 'button';
  button.textContent = d.label || LABELS[lang];
  button.style.cssText =
    'display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 24px;border:0;border-radius:10px;' +
    'background:#' + (color || '2168b8') + ';color:#fff;font:700 15px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer;';
  mount.appendChild(button);

  var prevOverflow = '';
  function close() {
    if (!modal) return;
    modal.style.display = 'none';
    document.documentElement.style.overflow = prevOverflow;
    document.removeEventListener('keydown', onKey);
    button.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  function open() {
    if (!modal) {
      modal = document.createElement('div');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', LABELS[lang]);
      modal.style.cssText =
        'position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
      var panel = document.createElement('div');
      panel.style.cssText =
        'position:relative;width:100%;max-width:1040px;height:100%;max-height:900px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.3);';
      var x = document.createElement('button');
      x.type = 'button';
      x.setAttribute('aria-label', CLOSE[lang]);
      x.innerHTML = '&times;';
      x.style.cssText =
        'position:absolute;top:8px;right:8px;z-index:1;width:40px;height:40px;border:0;border-radius:999px;background:rgba(255,255,255,.95);' +
        'box-shadow:0 2px 8px rgba(0,0,0,.15);font:400 26px/1 system-ui,sans-serif;color:#131719;cursor:pointer;';
      x.addEventListener('click', close);
      modal.addEventListener('click', function (e) {
        if (e.target === modal) close();
      });
      iframe = makeIframe(false);
      panel.appendChild(iframe);
      panel.appendChild(x);
      modal.appendChild(panel);
      document.body.appendChild(modal);
      if (window.matchMedia && window.matchMedia('(max-width: 640px)').matches) {
        modal.style.padding = '0';
        panel.style.borderRadius = '0';
        panel.style.maxHeight = 'none';
      }
    }
    modal.style.display = 'flex';
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
  }
  button.addEventListener('click', open);
})();
