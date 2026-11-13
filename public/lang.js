document.documentElement.classList.add("js");
(function () {
  var SUPPORTED = ["fr","nl","es","it","pt","ru","zh","ko","ja","tr","pl","id","hi","vi","tl","de","th","el","ar"];
  function get() { try { return localStorage.getItem("lang"); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem("lang", v); } catch (e) {} }

  // First visit to the English home page: follow the browser language.
  if (location.pathname === "/" || location.pathname === "/index.html") {
    var saved = get(), target = null;
    if (saved) { if (saved !== "en" && SUPPORTED.indexOf(saved) >= 0) target = saved; }
    else {
      var prefs = navigator.languages || [navigator.language || ""];
      for (var i = 0; i < prefs.length; i++) {
        var p = (prefs[i] || "").toLowerCase().split("-")[0];
        if (p === "fil") p = "tl";   // iOS/Android report Filipino as fil-PH
        if (p === "en") break;
        if (SUPPORTED.indexOf(p) >= 0) { target = p; break; }
      }
    }
    if (target) { location.replace("/" + target); return; }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var menu = document.querySelector("details.lang");
    if (!menu) return;
    menu.querySelectorAll("a[data-lang]").forEach(function (a) {
      a.addEventListener("click", function () { set(a.getAttribute("data-lang")); });
    });
    document.addEventListener("click", function (e) { if (!menu.contains(e.target)) menu.removeAttribute("open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") menu.removeAttribute("open"); });
  });
})();

// gameplay gallery: tap to enlarge, arrows / swipe-free buttons, Esc or tap to close
document.addEventListener("DOMContentLoaded", function () {
  var links = Array.prototype.slice.call(document.querySelectorAll(".gallery a.g"));
  if (!links.length) return;
  var box = null, img = null, i = 0;
  function show(k) { i = (k + links.length) % links.length; img.src = links[i].getAttribute("href"); img.alt = links[i].querySelector("img").alt; }
  function close() { if (box) { box.remove(); box = null; } }
  function open(k) {
    box = document.createElement("div"); box.className = "lightbox";
    img = document.createElement("img");
    var p = document.createElement("button"); p.className = "prev"; p.textContent = "‹"; p.setAttribute("aria-label", "Previous");
    var n = document.createElement("button"); n.className = "next"; n.textContent = "›"; n.setAttribute("aria-label", "Next");
    p.onclick = function (e) { e.stopPropagation(); show(i - 1); };
    n.onclick = function (e) { e.stopPropagation(); show(i + 1); };
    box.onclick = close;
    box.appendChild(img); box.appendChild(p); box.appendChild(n);
    document.body.appendChild(box); show(k);
  }
  links.forEach(function (a, k) { a.addEventListener("click", function (e) { e.preventDefault(); open(k); }); });
  document.addEventListener("keydown", function (e) {
    if (!box) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") show(i + 1);
    if (e.key === "ArrowLeft") show(i - 1);
  });
});

// scroll reveal: sections, cards and babies fade up once as they come into view
document.addEventListener("DOMContentLoaded", function () {
  var els = document.querySelectorAll("section h2, section .lead, .clip, .card, .baby, .gallery .g, .babies .cta, .playtest .box");
  if (!("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  els.forEach(function (el, k) {
    el.classList.add("reveal");
    if (el.matches(".card, .baby, .gallery .g")) el.style.transitionDelay = (k % 6) * 60 + "ms";
    io.observe(el);
  });
});
