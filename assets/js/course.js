/* Safarnama Education 5.0 — course page script (reads assets/js/course-config.js) */
(function () {
  "use strict";
  var S = window.SAFARNAMA || {};
  var C = S;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var inr = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  function track(ev, data) {
    try { if (window.fbq) window.fbq("track", ev, data || {}); } catch (e) {}
    try { if (window.gtag) window.gtag("event", ev, data || {}); } catch (e) {}
  }

  /* ---------- batch date + countdown ---------- */
  var start = S.startDate ? new Date(S.startDate + (/[+Z]/.test(S.startDate.slice(10)) ? "" : "+05:30")) : null;
  var dateText = start && !isNaN(start) ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(start) : "";
  $$("[data-batch-date]").forEach(function (el) { if (dateText) el.textContent = dateText; });
  $$("[data-batch-name]").forEach(function (el) { if (S.batchName) el.textContent = S.batchName; });
  $$("[data-seats]").forEach(function (el) { el.textContent = S.seatsText || "Seats Limited"; });

  var cd = $("[data-countdown]");
  function tick() {
    if (!cd || !start) return;
    var ms = start - new Date();
    if (ms <= 0) { cd.innerHTML = "<b>Batch शुरू हो चुका है</b> — अगले Batch के लिए WhatsApp करें"; return; }
    var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
    cd.innerHTML = "<span><b>" + d + "</b>दिन</span><span><b>" + h + "</b>घंटे</span><span><b>" + m + "</b>मिनट</span>";
  }
  tick(); setInterval(tick, 30000);

  /* ---------- programmes + one-to-one cards ---------- */
  function waFor(item, kind) {
    var m = kind === "1:1"
      ? "Hello! मुझे " + item.name + " (" + item.duration + ") book करना है।\nName:\nCity:"
      : "Hello! मुझे Safarnama Education 5.0" + (S.batchName ? " (" + S.batchName + ")" : "") + " में " + item.name + " join करना है।\nName:\nCity:";
    return "https://wa.me/" + (C.whatsapp || "") + "?text=" + encodeURIComponent(m);
  }
  function card(item, kind) {
    var href = item.link || waFor(item, kind), label = kind === "1:1" ? "Book करें" : "Join करें";
    return '<div class="prog"><div><h3>' + esc(item.name) + '</h3>' + (item.duration ? '<p class="dur">' + esc(item.duration) + '</p>' : '') + '</div>' +
      '<div class="prog-buy"><span class="fee">' + esc(item.fee) + '</span><a class="btn ' + (item.link ? "btn-primary" : "btn-ghost") + '" href="' + esc(href) + '"' + (item.link ? '' : ' target="_blank" rel="noopener"') +
      ' data-buy="' + esc(item.name) + '" data-amount="' + (Number(item.amount) || 0) + '">' + label + '</a></div></div>';
  }
  var pBox = $("[data-programmes]"); if (pBox) pBox.innerHTML = (S.programmes || []).map(function (x) { return card(x, "prog"); }).join("");
  var oBox = $("[data-one-to-one]"); if (oBox) oBox.innerHTML = (S.oneToOne || []).map(function (x) { return card(x, "1:1"); }).join("");
  var anyLink = (S.programmes || []).concat(S.oneToOne || []).some(function (x) { return x.link; });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-buy]"); if (!b) return;
    track("InitiateCheckout", { content_name: b.getAttribute("data-buy"), value: Number(b.getAttribute("data-amount")) || undefined, currency: "INR" });
  });

  /* ---------- general join buttons (scroll to the fee list) ---------- */
  $$("[data-pay-note]").forEach(function (el) {
    el.textContent = anyLink ? "UPI, Card या Netbanking से सुरक्षित Online Payment" : "Join करें दबाने पर WhatsApp खुलेगा — हमारी team आपको payment और class की पूरी जानकारी देगी।";
  });
  $$("[data-class-duration]").forEach(function (el) { if (S.classDuration) el.textContent = S.classDuration; });

  /* ---------- recording access + app links ---------- */
  $$("[data-recording-access]").forEach(function (el) {
    if (S.recordingAccess) el.textContent = S.recordingAccess; else { var li = el.closest("[data-hide-empty]"); if (li) li.hidden = true; }
  });
  $$("[data-app]").forEach(function (a) {
    var link = S[a.getAttribute("data-app")];
    if (link) { a.href = link; a.target = "_blank"; a.rel = "noopener"; a.classList.remove("soon"); }
    else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); }
  });

  /* ---------- testimonials ---------- */
  var sec = $("[data-testimonials]");
  if (sec) {
    var t = (S.testimonials || []).filter(function (x) { return x && x.text; });
    var shots = (S.screenshots || []).filter(Boolean);
    var vids = (S.videos || []).map(function (line) {
      var parts = String(line).split("|");
      var m = String(parts[0]).match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);
      return m ? { id: m[1], vertical: /shorts\//.test(parts[0]), cap: (parts[1] || "").trim() } : null;
    }).filter(Boolean);
    if (t.length || shots.length || vids.length) {
      sec.hidden = false;
      $("[data-t-text]", sec).innerHTML = t.map(function (x) {
        return '<figure class="testi"><div class="stars" aria-hidden="true">★★★★★</div><p>“' + esc(x.text) + '”</p><div class="who">' + esc(x.name) + (x.city ? "<span>" + esc(x.city) + "</span>" : "") + "</div></figure>";
      }).join("");
      $("[data-t-shots]", sec).innerHTML = shots.map(function (src, i) {
        return '<figure class="tile shot"><img src="' + esc(src) + '" alt="Student review ' + (i + 1) + '" loading="lazy"></figure>';
      }).join("");
      $("[data-t-videos]", sec).innerHTML = vids.map(function (v) {
        return '<figure class="video' + (v.vertical ? " vertical" : "") + '"><button type="button" class="video-play" data-yt="' + v.id + '" aria-label="Play video' + (v.cap ? ": " + esc(v.cap) : "") + '">' +
          '<img src="https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg" alt="" loading="lazy"><span class="play" aria-hidden="true"></span></button>' +
          (v.cap ? "<figcaption>" + esc(v.cap) + "</figcaption>" : "") + "</figure>";
      }).join("");
    }
  }

  /* ---------- sticky mobile bar: hide while the price card is on screen ---------- */
  var bar = $(".join-bar"), feeSec = $("#join");
  if (bar && feeSec && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { bar.classList.toggle("off", es[0].isIntersecting); }).observe(feeSec);
  }

  /* ---------- events ---------- */
  if ($("[data-course-page]")) track("ViewContent", { content_name: "Safarnama Education 5.0", content_type: "course" });
  if ($("[data-thank-you]")) {
    var key = "sf_purchase_" + (S.batchName || "");
    var seen = false; try { seen = sessionStorage.getItem(key); sessionStorage.setItem(key, "1"); } catch (e) {}
    var q = new URLSearchParams(location.search), amt = Number(q.get("amount")) || 0;
    if (!seen && anyLink) track("Purchase", { content_name: q.get("programme") || "Safarnama Education 5.0", value: amt, currency: "INR" });
    var w = $("[data-confirm-wa]");
    if (w) w.href = "https://wa.me/" + (C.whatsapp || "") + "?text=" + encodeURIComponent("Hello! मैंने Safarnama Education 5.0" + (S.batchName ? " (" + S.batchName + ")" : "") + " का payment कर दिया है।\nName:\nPayment ID:");
  }
})();
