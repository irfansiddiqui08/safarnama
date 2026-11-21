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
  var ONLINE = !!(S.onlinePayment && S.checkoutUrl);
  function payable(item, kind) { return ONLINE && kind !== "1:1" && item.id; }
  function card(item, kind) {
    var label = kind === "1:1" ? "Book करें" : "Join करें";
    var pay = payable(item, kind), href = pay ? "#join" : (item.link || waFor(item, kind)), ext = !pay && !item.link;
    return '<div class="prog"><div><h3>' + esc(item.name) + '</h3>' + (item.duration ? '<p class="dur">' + esc(item.duration) + '</p>' : '') + '</div>' +
      '<div class="prog-buy"><span class="fee">' + esc(item.fee) + '</span><a class="btn ' + (pay || item.link ? "btn-primary" : "btn-ghost") + '" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') +
      (pay ? ' data-checkout="' + esc(item.id) + '" data-fee="' + esc(item.fee) + '"' : '') +
      ' data-buy="' + esc(item.name) + '" data-amount="' + (Number(item.amount) || 0) + '">' + label + '</a></div></div>';
  }
  var bBox = $("[data-bundle]"), B = S.bundle;
  if (bBox && B && B.fee) {
    var names = (S.programmes || []).map(function (x) { return "<span>" + esc(x.name) + "</span>"; }).join("");
    var bPay = payable(B, "bundle");
    var bHref = bPay ? "#join" : B.link || ("https://wa.me/" + (C.whatsapp || "") + "?text=" + encodeURIComponent("Hello! मुझे " + B.name + " (Complete Course, " + B.fee + ") join करना है।\nName:\nCity:"));
    bBox.innerHTML = '<div class="bundle"><div class="bundle-head"><span class="badge">Best Value · Complete Course</span><h3>' + esc(B.name) + '</h3><p>' + esc(B.note || "") + '</p></div>' +
      '<div class="ingredients">' + names + '</div>' +
      '<div class="bundle-buy"><span class="fee">' + esc(B.fee) + '</span><a class="btn btn-gold" href="' + esc(bHref) + '"' + (bPay || B.link ? '' : ' target="_blank" rel="noopener"') + (bPay ? ' data-checkout="' + esc(B.id) + '" data-fee="' + esc(B.fee) + '"' : '') + ' data-buy="' + esc(B.name) + '" data-amount="' + (Number(B.amount) || 0) + '">Complete Course Join करें</a></div></div>';
  } else if (bBox) { bBox.hidden = true; }
  var pBox = $("[data-programmes]"); if (pBox) pBox.innerHTML = (S.programmes || []).map(function (x) { return card(x, "prog"); }).join("");
  var oBox = $("[data-one-to-one]"); if (oBox) oBox.innerHTML = (S.oneToOne || []).map(function (x) { return card(x, "1:1"); }).join("");
  var anyLink = ONLINE || (S.programmes || []).concat(S.oneToOne || [], S.bundle ? [S.bundle] : []).some(function (x) { return x.link; });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-buy]"); if (!b) return;
    track("InitiateCheckout", { content_name: b.getAttribute("data-buy"), value: Number(b.getAttribute("data-amount")) || undefined, currency: "INR" });
  });

  /* ---------- online checkout (Razorpay) ---------- */
  var co = null, coItem = null, rzpLoad = null;
  function loadRzp() {
    if (window.Razorpay) return Promise.resolve();
    if (!rzpLoad) rzpLoad = new Promise(function (ok, bad) {
      var sc = document.createElement("script"); sc.src = "https://checkout.razorpay.com/v1/checkout.js";
      sc.onload = ok; sc.onerror = function () { rzpLoad = null; bad(new Error("load")); }; document.head.appendChild(sc);
    });
    return rzpLoad;
  }
  function openCheckout(btn) {
    coItem = { id: btn.getAttribute("data-checkout"), name: btn.getAttribute("data-buy"), fee: btn.getAttribute("data-fee"), amount: Number(btn.getAttribute("data-amount")) || 0 };
    if (!co) {
      co = document.createElement("div"); co.className = "co-wrap"; co.hidden = true;
      co.innerHTML = '<form class="co-box" novalidate><button type="button" class="co-x" aria-label="Close">×</button>' +
        '<p class="co-kicker">Safarnama Education 5.0</p><h3 class="co-title"></h3><p class="co-fee"></p>' +
        '<label>पूरा नाम<input name="name" autocomplete="name" required maxlength="80"></label>' +
        '<label>Email<input name="email" type="email" autocomplete="email" required maxlength="254"></label>' +
        '<p class="co-hint">इसी email से आप Safarnama app में login करेंगे। ध्यान से लिखें।</p>' +
        '<label>Mobile (WhatsApp)<input name="phone" type="tel" inputmode="numeric" autocomplete="tel" required maxlength="14"></label>' +
        '<p class="co-err" role="alert" hidden></p>' +
        '<button type="submit" class="btn btn-gold co-pay">Payment करें</button>' +
        '<p class="co-note">Secure payment by Razorpay · UPI, Cards, Netbanking</p></form>';
      document.body.appendChild(co);
      var close = function () { co.hidden = true; document.body.classList.remove("co-open"); };
      co.addEventListener("click", function (e) { if (e.target === co || e.target.closest(".co-x")) close(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !co.hidden) close(); });
      $("form", co).addEventListener("submit", submitCheckout);
    }
    $(".co-title", co).textContent = coItem.name; $(".co-fee", co).textContent = coItem.fee || "";
    $(".co-err", co).hidden = true; co.hidden = false; document.body.classList.add("co-open");
    loadRzp().catch(function () {});
    setTimeout(function () { var i = $("input[name=name]", co); if (i) i.focus(); }, 50);
  }
  function coError(msg) { var e = $(".co-err", co); e.textContent = msg; e.hidden = false; }
  function submitCheckout(e) {
    e.preventDefault();
    var f = e.target, btn = $(".co-pay", f);
    var data = { programme_id: coItem.id, name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim() };
    if (data.name.length < 2) return coError("कृपया अपना पूरा नाम लिखें");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) return coError("कृपया सही email लिखें");
    if (!/^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""))) return coError("कृपया 10 अंकों का mobile number लिखें");
    $(".co-err", co).hidden = true; btn.disabled = true; btn.textContent = "कृपया रुकें…";
    var done = function () { btn.disabled = false; btn.textContent = "Payment करें"; };
    Promise.all([
      fetch(S.checkoutUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.order_id) throw new Error(j.error || "error"); return j; }); }),
      loadRzp()
    ]).then(function (res) {
      var o = res[0];
      var rzp = new window.Razorpay({
        key: o.key_id, order_id: o.order_id, amount: o.amount, currency: o.currency || "INR",
        name: "Safarnama Education", description: o.programme,
        image: "https://safarnama.club/assets/img/safarnama-logo-180.png",
        prefill: { name: data.name, email: data.email, contact: data.phone },
        theme: { color: "#D99A0B" },
        handler: function (resp) {
          location.href = "thank-you.html?programme=" + encodeURIComponent(o.programme) + "&amount=" + Math.round(o.amount / 100) + "&payment=" + encodeURIComponent(resp.razorpay_payment_id || "");
        },
        modal: { ondismiss: done }
      });
      rzp.on("payment.failed", function () { done(); coError("Payment नहीं हो पाया। कृपया दोबारा try करें।"); });
      co.hidden = true; document.body.classList.remove("co-open");
      rzp.open();
    }).catch(function (err) {
      done();
      coError(err && err.message && err.message !== "error" && err.message !== "load" ? err.message : "Payment शुरू नहीं हो पाया। Internet check करके दोबारा try करें या WhatsApp करें।");
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-checkout]"); if (!b) return;
    e.preventDefault(); openCheckout(b);
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

  /* ---------- special event banner ---------- */
  var ev = S.event, evBox = $("[data-event]");
  if (evBox) {
    var evEnd = ev && ev.endsAt ? new Date(ev.endsAt + "+05:30") : null;
    if (ev && ev.show && (!evEnd || new Date() <= evEnd)) {
      var evHref = ev.link || ("https://wa.me/" + (C.whatsapp || "") + "?text=" + encodeURIComponent(ev.waText || ("Hello! मुझे " + ev.title + " join करना है।")));
      evBox.innerHTML = '<div class="wrap event"><div class="event-img">' + (ev.image ? '<img src="' + esc(ev.image) + '" alt="' + esc(ev.title) + ' poster" loading="lazy">' : '') + '</div>' +
        '<div class="event-body"><span class="eyebrow">Special Event</span><h2>' + esc(ev.title) + '</h2>' + (ev.subtitle ? '<p class="event-sub">' + esc(ev.subtitle) + '</p>' : '') +
        '<ul class="event-meta"><li>🗓️ ' + esc(ev.date) + '</li>' + (ev.time ? '<li>🕥 ' + esc(ev.time) + '</li>' : '') + '<li>💻 Online</li></ul>' +
        (ev.text ? '<p>' + esc(ev.text) + '</p>' : '') +
        '<a class="btn btn-gold" href="' + esc(evHref) + '"' + (ev.link ? '' : ' target="_blank" rel="noopener"') + ' data-buy="' + esc(ev.title) + '" data-amount="0">' + esc(ev.button || "Join करें") + '</a></div></div>';
      evBox.hidden = false;
    } else { evBox.hidden = true; }
  }

  /* ---------- testimonials ---------- */
  var sec = $("[data-testimonials]");
  if (sec) {
    var t = (S.testimonials || []).filter(function (x) { return x && x.text; });
    var shots = (S.screenshots || []).filter(Boolean);
    var selfV = (S.selfVideos || []).filter(function (x) { return x && x.src; });
    var vids = (S.videos || []).map(function (line) {
      var parts = String(line).split("|");
      var m = String(parts[0]).match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);
      return m ? { id: m[1], vertical: /shorts\//.test(parts[0]), cap: (parts[1] || "").trim() } : null;
    }).filter(Boolean);
    if (t.length || shots.length || vids.length || selfV.length) {
      sec.hidden = false;
      $("[data-t-text]", sec).innerHTML = t.map(function (x) {
        return '<figure class="testi"><div class="stars" aria-hidden="true">★★★★★</div><p>“' + esc(x.text) + '”</p><div class="who">' + esc(x.name) + (x.city ? "<span>" + esc(x.city) + "</span>" : "") + "</div></figure>";
      }).join("");
      $("[data-t-shots]", sec).innerHTML = shots.map(function (src, i) {
        return '<figure class="tile shot"><img src="' + esc(src) + '" alt="Student review ' + (i + 1) + '" loading="lazy"></figure>';
      }).join("");
      $("[data-t-videos]", sec).innerHTML = selfV.map(function (v) {
        return '<figure class="video vertical"><video controls preload="none" playsinline' + (v.poster ? ' poster="' + esc(v.poster) + '"' : '') + ' src="' + esc(v.src) + '"></video>' + (v.name ? "<figcaption>" + esc(v.name) + "</figcaption>" : "") + "</figure>";
      }).join("") + vids.map(function (v) {
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
    if (w) w.href = "https://wa.me/" + (C.whatsapp || "") + "?text=" + encodeURIComponent("Hello! मैंने Safarnama Education 5.0" + (S.batchName ? " (" + S.batchName + ")" : "") + " (" + (q.get("programme") || "") + ") का payment कर दिया है।\nName:\nPayment ID: " + (q.get("payment") || ""));
  }
})();
