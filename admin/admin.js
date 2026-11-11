/* Safarnama admin panel — talks to Supabase directly; the database only allows admins to change data. */
(function () {
  "use strict";
  const cfg = window.SF_ADMIN || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const IST = "Asia/Kolkata";
  const fmt = (iso, opts) => new Date(iso).toLocaleString("en-IN", { timeZone: IST, ...opts });
  const when = (iso) => fmt(iso, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const day = (iso) => fmt(iso, { day: "numeric", month: "short", year: "numeric" });
  const istToIso = (local) => new Date(local + ":00+05:30").toISOString();
  const todayIST = () => new Date(Date.now() + 5.5 * 3.6e6).toISOString().slice(0, 10);

  function toast(msg, err) {
    const t = $("#toast"); t.textContent = msg; t.className = "show" + (err ? " err" : "");
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = ""), 3200);
  }
  function fail(e) { console.error(e); toast(e?.message || String(e), true); }

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    $("#loginMsg").textContent = "Setup pending: add the Supabase URL and anon key in admin/config.js.";
    $$("#login form button").forEach((b) => (b.disabled = true));
    return;
  }
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  let programmes = [], batches = [], classes = [];
  const progName = (id) => programmes.find((p) => p.id === id)?.name || id;

  /* ---------------- login ---------------- */
  let loginEmail = "";
  $("#emailForm").addEventListener("submit", async (e) => {
    e.preventDefault(); loginEmail = $("#email").value.trim().toLowerCase();
    const { error } = await sb.auth.signInWithOtp({ email: loginEmail, options: { shouldCreateUser: false } });
    if (error) return ($("#loginMsg").textContent = error.message);
    $("#emailForm").hidden = true; $("#codeForm").hidden = false; $("#code").focus();
    $("#loginMsg").textContent = "";
  });
  $("#codeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const { error } = await sb.auth.verifyOtp({ email: loginEmail, token: $("#code").value.trim(), type: "email" });
    if (error) return ($("#loginMsg").textContent = "Wrong or expired code.");
    start();
  });
  $("#logout").addEventListener("click", async () => { await sb.auth.signOut(); location.reload(); });

  async function start() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data: isAdmin } = await sb.rpc("is_admin");
    if (!isAdmin) { $("#loginMsg").textContent = "This email is not an admin."; await sb.auth.signOut(); return; }
    $("#login").hidden = true; $("#tabs").hidden = false; $("#logout").hidden = false; $("#who").textContent = user.email;
    await loadLookups();
    show("students");
  }

  /* ---------------- tabs ---------------- */
  const loaders = { students: loadStudents, classes: loadClasses, recordings: loadRecordings, payments: loadPayments, more: loadMore };
  function show(tab) {
    $$("nav button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    Object.keys(loaders).forEach((k) => ($("#" + k).hidden = k !== tab));
    loaders[tab]().catch(fail);
  }
  $$("nav button").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));

  async function loadLookups() {
    const [p, b] = await Promise.all([
      sb.from("programmes").select("id, name, amount, access_days, is_bundle").order("sort"),
      sb.from("batches").select("id, name, starts_on, active").order("starts_on", { ascending: false }),
    ]);
    programmes = p.data || []; batches = b.data || [];
    // Classes belong to a real programme (bundle buyers see every programme's classes automatically).
    const opt = (list) => '<option value="">Choose…</option>' + list.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("");
    $$(".programmeSelect").forEach((s) => (s.innerHTML = opt(s.closest("#classForm") ? programmes.filter((x) => !x.is_bundle) : programmes)));
    $$(".batchSelect").forEach((s) => (s.innerHTML = '<option value="">—</option>' + batches.map((x) => `<option value="${x.id}" ${x.active ? "selected" : ""}>${esc(x.name)}</option>`).join("")));
    const { count } = await sb.from("payments_unmatched").select("*", { count: "exact", head: true }).eq("resolved", false);
    $("#unmatchedCount").hidden = !count; $("#unmatchedCount").textContent = count || "";
  }

  /* ---------------- students ---------------- */
  let enrols = [];
  async function loadStudents() {
    const { data, error } = await sb.from("enrolments").select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) throw error; enrols = data; renderStudents();
  }
  function renderStudents() {
    const q = $("#studentSearch").value.trim().toLowerCase();
    const rows = enrols.filter((e) => !q || [e.email, e.full_name, e.phone, progName(e.programme_id)].join(" ").toLowerCase().includes(q));
    const today = todayIST();
    $("#enrolRows").innerHTML = rows.length ? rows.map((e) => `<tr>
      <td><b>${esc(e.full_name || "—")}</b><small>${esc(e.email)}${e.phone ? " · " + esc(e.phone) : ""}</small></td>
      <td>${esc(progName(e.programme_id))}</td>
      <td><span class="pill ${e.source === "razorpay" ? "green" : ""}">${esc(e.source)}</span>${e.amount_paid ? `<small>₹${e.amount_paid}</small>` : ""}</td>
      <td>${e.valid_until ? `<span class="pill ${e.valid_until < today ? "red" : ""}">${day(e.valid_until)}</span>` : '<span class="muted small">no end</span>'}</td>
      <td class="small">${day(e.created_at)}</td>
      <td><button class="link" data-del-enrol="${e.id}">Remove</button></td></tr>`).join("") : '<tr class="empty"><td colspan="6">No students yet</td></tr>';
    $("#enrolCount").textContent = `${rows.length} enrolment${rows.length === 1 ? "" : "s"} · ${new Set(rows.map((r) => r.email)).size} students`;
  }
  $("#studentSearch").addEventListener("input", renderStudents);
  $("#enrolForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    const row = { email: f.email.trim().toLowerCase(), full_name: f.full_name || null, phone: f.phone || null, programme_id: f.programme_id, batch_id: f.batch_id || null, valid_until: f.valid_until || null, source: "manual" };
    const p = programmes.find((x) => x.id === row.programme_id);
    if (!row.valid_until && p?.access_days) { const d = new Date(); d.setDate(d.getDate() + p.access_days); row.valid_until = d.toISOString().slice(0, 10); }
    const { error } = await sb.from("enrolments").insert(row);
    if (error) return fail(error.code === "23505" ? new Error("This student is already enrolled in that programme and batch.") : error);
    e.target.reset(); loadLookups(); toast("Student added — they can log in to the app with " + row.email); loadStudents();
  });
  document.addEventListener("click", async (e) => {
    const id = e.target.dataset?.delEnrol; if (!id) return;
    if (!confirm("Remove this enrolment? The student loses access to this programme.")) return;
    const { error } = await sb.from("enrolments").delete().eq("id", id);
    if (error) return fail(error); toast("Removed"); loadStudents();
  });

  /* ---------------- classes ---------------- */
  async function loadClasses() {
    const since = new Date(Date.now() - 14 * 864e5).toISOString();
    const { data, error } = await sb.from("classes").select("*").gte("starts_at", since).order("starts_at");
    if (error) throw error; classes = data;
    const now = Date.now();
    $("#classRows").innerHTML = data.length ? data.map((c) => {
      const past = new Date(c.starts_at).getTime() + c.duration_min * 6e4 < now;
      return `<tr style="${past ? "opacity:.55" : ""}"><td><b>${when(c.starts_at)}</b><small>${c.duration_min} min</small></td>
        <td>${esc(c.title)}</td><td>${esc(progName(c.programme_id))}</td>
        <td>${c.zoom_url ? `<a href="${esc(c.zoom_url)}" target="_blank" rel="noopener">Link</a>${c.zoom_passcode ? `<small>${esc(c.zoom_passcode)}</small>` : ""}` : '<span class="pill red">missing</span>'}</td>
        <td><button class="link" data-del-class="${c.id}">Delete</button></td></tr>`;
    }).join("") : '<tr class="empty"><td colspan="5">No classes scheduled</td></tr>';
  }
  $("#classForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    const n = f.repeat ? Math.max(2, Math.min(90, Number(f.repeat_days) || 2)) : 1;
    const base = new Date(istToIso(f.starts_at));
    const rows = Array.from({ length: n }, (_, i) => ({
      programme_id: f.programme_id, batch_id: f.batch_id || null,
      title: n > 1 ? `${f.title} – Day ${i + 1}` : f.title,
      starts_at: new Date(base.getTime() + i * 864e5).toISOString(),
      duration_min: Number(f.duration_min) || 90, zoom_url: f.zoom_url || null, zoom_passcode: f.zoom_passcode || null,
    }));
    const { error } = await sb.from("classes").insert(rows);
    if (error) return fail(error); toast(n > 1 ? `${n} classes scheduled` : "Class scheduled"); e.target.reset(); loadLookups(); loadClasses();
  });
  document.addEventListener("click", async (e) => {
    const id = e.target.dataset?.delClass; if (!id) return;
    if (!confirm("Delete this class (and its recording)?")) return;
    const { error } = await sb.from("classes").delete().eq("id", id);
    if (error) return fail(error); toast("Deleted"); loadClasses();
  });

  /* ---------------- recordings ---------------- */
  async function loadRecordings() {
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const [{ data: cls }, { data: recs, error }] = await Promise.all([
      sb.from("classes").select("id, title, programme_id, starts_at").gte("starts_at", since).lte("starts_at", new Date(Date.now() + 864e5).toISOString()).order("starts_at", { ascending: false }),
      sb.from("recordings").select("id, title, available_until, bunny_video_id, class:classes(title, programme_id, starts_at)").order("created_at", { ascending: false }).limit(50),
    ]);
    if (error) throw error;
    const opts = (cls || []).map((c) => `<option value="${c.id}">${esc(when(c.starts_at))} — ${esc(c.title)}</option>`).join("") || '<option value="">No recent classes — schedule one first</option>';
    $("#recClass").innerHTML = opts; $(".recClassCopy").innerHTML = opts;
    const now = Date.now();
    $("#recRows").innerHTML = recs.length ? recs.map((r) => {
      const open = new Date(r.available_until).getTime() > now;
      return `<tr><td><b>${esc(r.title || r.class?.title)}</b><small>${esc(r.bunny_video_id)}</small></td><td>${esc(progName(r.class?.programme_id))}</td>
      <td>${when(r.available_until)}</td><td><span class="pill ${open ? "green" : "red"}">${open ? "visible" : "expired"}</span></td>
      <td><button class="link" data-del-rec="${r.id}">Remove</button></td></tr>`;
    }).join("") : '<tr class="empty"><td colspan="5">No recordings yet</td></tr>';
  }
  async function saveRecording(class_id, vid) {
    const c = classes.find((x) => x.id === class_id);
    const { error } = await sb.from("recordings").insert({ class_id, bunny_video_id: vid, title: c?.title || null });
    if (error) throw error;
  }
  $("#uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target, file = form.file.files[0], class_id = form.class_id.value;
    if (!file || !class_id) return;
    const title = form.class_id.selectedOptions[0].textContent;
    const btn = form.querySelector("button"); btn.disabled = true;
    $("#uploadProgress").hidden = false; $("#uploadText").textContent = "Preparing upload…";
    try {
      const { data, error } = await sb.functions.invoke("bunny-upload", { body: { title } });
      if (error) throw error;
      await new Promise((resolve, reject) => {
        const up = new tus.Upload(file, {
          endpoint: data.endpoint, retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
          headers: { AuthorizationSignature: data.signature, AuthorizationExpire: String(data.expire), VideoId: data.videoId, LibraryId: String(data.libraryId) },
          metadata: { filetype: file.type, title },
          onError: reject,
          onProgress: (s, t) => { const p = Math.round((s / t) * 100); $("#uploadProgress .bar span").style.width = p + "%"; $("#uploadText").textContent = `Uploading… ${p}% (keep this tab open)`; },
          onSuccess: resolve,
        });
        up.findPreviousUploads().then((prev) => { if (prev.length) up.resumeFromPreviousUpload(prev[0]); up.start(); });
      });
      if (!classes.length) { const { data: c } = await sb.from("classes").select("*"); classes = c || []; }
      await saveRecording(class_id, data.videoId);
      $("#uploadText").textContent = "Done! Bunny is processing the video — it will play in the app in a few minutes.";
      toast("Recording uploaded"); form.reset(); loadRecordings();
    } catch (err) { fail(err); $("#uploadText").textContent = "Upload failed — try again."; }
    finally { btn.disabled = false; }
  });
  $("#pasteForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    try { if (!classes.length) { const { data: c } = await sb.from("classes").select("*"); classes = c || []; } await saveRecording(f.class_id, f.vid.trim()); toast("Recording saved"); e.target.reset(); loadRecordings(); } catch (err) { fail(err); }
  });
  document.addEventListener("click", async (e) => {
    const id = e.target.dataset?.delRec; if (!id) return;
    if (!confirm("Remove this recording from the app now?")) return;
    const { error } = await sb.from("recordings").delete().eq("id", id);
    if (error) return fail(error); toast("Removed"); loadRecordings();
  });

  /* ---------------- payments ---------------- */
  async function loadPayments() {
    const [{ data, error }, { data: map }] = await Promise.all([
      sb.from("payments_unmatched").select("*").eq("resolved", false).order("created_at", { ascending: false }),
      sb.from("razorpay_map").select("*"),
    ]);
    if (error) throw error;
    const opts = '<option value="">Choose programme…</option>' + programmes.map((x) => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("");
    $("#payRows").innerHTML = data.length ? data.map((p) => `<tr><td><b>${esc(p.payment_id)}</b><small>${when(p.created_at)}</small></td>
      <td>${esc(p.email || "—")}<small>${esc(p.phone || "")}</small></td><td>₹${p.amount ?? "?"}</td>
      <td><select data-pay-prog="${esc(p.payment_id)}">${opts}</select></td>
      <td><button class="btn small" data-assign="${esc(p.payment_id)}">Enrol</button> <button class="link" data-dismiss="${esc(p.payment_id)}">Dismiss</button></td></tr>`).join("")
      : '<tr class="empty"><td colspan="5">All payments matched 🎉</td></tr>';
    $("#mapList").innerHTML = (map || []).map((m) => `<li><code>${esc(m.match_key)}</code> → ${esc(progName(m.programme_id))} <button class="link" data-del-map="${esc(m.match_key)}">remove</button></li>`).join("");
    payments = data;
  }
  let payments = [];
  document.addEventListener("click", async (e) => {
    const t = e.target.dataset || {};
    if (t.assign) {
      const p = payments.find((x) => x.payment_id === t.assign); if (!p?.email) return fail(new Error("This payment has no email — add the student manually."));
      const programme_id = $(`[data-pay-prog="${CSS.escape(t.assign)}"]`).value;
      if (!programme_id) return fail(new Error("Choose the programme first."));
      const prog = programmes.find((x) => x.id === programme_id);
      let valid_until = null; if (prog?.access_days) { const d = new Date(); d.setDate(d.getDate() + prog.access_days); valid_until = d.toISOString().slice(0, 10); }
      const batch = batches.find((b) => b.active);
      const { error } = await sb.from("enrolments").insert({ email: p.email, phone: p.phone, programme_id, batch_id: batch?.id || null, source: "razorpay", payment_id: p.payment_id, amount_paid: p.amount, valid_until });
      if (error) return fail(error);
      await sb.from("payments_unmatched").update({ resolved: true }).eq("payment_id", p.payment_id);
      toast("Enrolled " + p.email); loadLookups(); loadPayments();
    }
    if (t.dismiss) {
      if (!confirm("Dismiss this payment (e.g. a 1:1 session)?")) return;
      await sb.from("payments_unmatched").update({ resolved: true }).eq("payment_id", t.dismiss); loadLookups(); loadPayments();
    }
    if (t.delMap) { await sb.from("razorpay_map").delete().eq("match_key", t.delMap); loadPayments(); }
  });
  $("#mapForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    const { error } = await sb.from("razorpay_map").upsert({ match_key: f.match_key.trim(), programme_id: f.programme_id });
    if (error) return fail(error); e.target.reset(); toast("Saved"); loadPayments();
  });

  /* ---------------- more: devices, announcements, batches ---------------- */
  async function loadMore() {
    const [{ data: ann }] = await Promise.all([sb.from("announcements").select("*").order("created_at", { ascending: false }).limit(10)]);
    $("#annList").innerHTML = (ann || []).map((a) => `<li>${a.active ? "🟢" : "⚪"} ${esc(a.message)} <small class="muted">${day(a.created_at)}</small> <button class="link" data-toggle-ann="${a.id}" data-active="${a.active}">${a.active ? "hide" : "show"}</button></li>`).join("") || "<li class='muted'>None</li>";
    $("#batchList").innerHTML = batches.map((b) => `<li>${esc(b.name)} — starts ${day(b.starts_on)} ${b.active ? '<span class="pill green">current</span>' : `<button class="link" data-activate="${b.id}">make current</button>`}</li>`).join("");
  }
  $("#deviceForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const email = e.target.email.value.trim().toLowerCase();
    const { data: prof } = await sb.from("profiles").select("id").eq("email", email).maybeSingle();
    if (!prof) { $("#deviceList").innerHTML = "<li>This student hasn't logged in to the app yet.</li>"; return; }
    const { data: devs } = await sb.from("devices").select("*").eq("user_id", prof.id);
    $("#deviceList").innerHTML = (devs || []).map((d) => `<li>${esc(d.label || d.device_id)} — last used ${day(d.last_seen)} <button class="link" data-del-dev="${esc(d.device_id)}" data-user="${prof.id}">remove</button></li>`).join("") || "<li>No devices registered.</li>";
  });
  document.addEventListener("click", async (e) => {
    const t = e.target.dataset || {};
    if (t.delDev) { await sb.from("devices").delete().eq("user_id", t.user).eq("device_id", t.delDev); toast("Device removed"); $("#deviceForm").requestSubmit(); }
    if (t.toggleAnn) { await sb.from("announcements").update({ active: t.active !== "true" }).eq("id", t.toggleAnn); loadMore(); }
    if (t.activate) { await sb.from("batches").update({ active: false }).neq("id", t.activate); await sb.from("batches").update({ active: true }).eq("id", t.activate); await loadLookups(); loadMore(); }
  });
  $("#annForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const { error } = await sb.from("announcements").insert({ message: e.target.message.value.trim() });
    if (error) return fail(error); e.target.reset(); toast("Posted to the app"); loadMore();
  });
  $("#batchForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    const { error } = await sb.from("batches").insert({ name: f.name, starts_on: f.starts_on, active: false });
    if (error) return fail(error); e.target.reset(); await loadLookups(); loadMore();
  });

  // already logged in?
  sb.auth.getSession().then(({ data }) => { if (data.session) start(); });
})();
