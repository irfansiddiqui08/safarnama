/* Safarnama Education — shared site script: tracking, menu, WhatsApp links, videos */
(function () {
  "use strict";
  var C = window.SAFARNAMA || {};
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  if (C.metaPixelId) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", C.metaPixelId); window.fbq("track", "PageView");
  }
  if (C.ga4Id) {
    var g = document.createElement("script"); g.async = true; g.src = "https://www.googletagmanager.com/gtag/js?id=" + C.ga4Id; document.head.appendChild(g);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date()); window.gtag("config", C.ga4Id);
  }
  function track(ev, data) {
    try { if (window.fbq) window.fbq("track", ev, data || {}); } catch (e) {}
    try { if (window.gtag) window.gtag("event", ev, data || {}); } catch (e) {}
  }

  $$("[data-wa-link]").forEach(function (a) {
    var t = a.getAttribute("data-wa-link");
    a.href = "https://wa.me/" + C.whatsapp + (t ? "?text=" + encodeURIComponent(t) : "");
    a.target = "_blank"; a.rel = "noopener";
    a.addEventListener("click", function () { track("Contact", { method: "whatsapp" }); });
  });
  $$("[data-phone]").forEach(function (el) { el.textContent = C.phoneDisplay; if (el.tagName === "A") el.href = "tel:+" + C.whatsapp; });
  $$("[data-email]").forEach(function (el) { el.textContent = C.email; if (el.tagName === "A") el.href = "mailto:" + C.email; });

  var burger = document.querySelector(".burger"), menu = document.querySelector(".menu");
  if (burger && menu) {
    burger.addEventListener("click", function () { var o = menu.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.classList.remove("open"); burger.setAttribute("aria-expanded", false); }); });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest(".video-play"); if (!b) return;
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + b.dataset.yt + "?autoplay=1&rel=0&playsinline=1";
    f.title = "Student video testimonial"; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true;
    b.replaceWith(f); track("ViewContent", { content_type: "video_testimonial" });
  });

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
