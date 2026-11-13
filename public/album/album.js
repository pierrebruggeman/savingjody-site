// Jody's Friends Album: writes the player's name on the blank album (canvas) and
// exports a PNG or a print-ready PDF (one page, A4 / US Letter, no library needed).
// The PDF always prints the album at the SAME physical size (ALBUM_MM wide) on every paper, so the
// official stickers (marketing/stickers/print_17mm) fit their spots exactly. Do not change ALBUM_MM
// without re-exporting the stickers: sticker height in the album = 536 / 5920 x ALBUM_MM = 17.2 mm.
(function () {
  var root = document.getElementById("album");
  if (!root) return;
  var input = root.querySelector("#a-name"), canvas = root.querySelector("canvas"),
      paper = root.querySelector("#a-paper"), btnPdf = root.querySelector("#a-pdf"),
      btnPng = root.querySelector("#a-png"), ctx = canvas.getContext("2d");
  var base = new Image(), meta = null, ready = false;
  var FONT = '"Luckiest Guy","Lilita One","Arial Black",system-ui,sans-serif';
  var MAX = 20;

  // US / Canada / Mexico / Philippines use Letter; the rest of the world A4
  try {
    var loc = (navigator.language || "").toUpperCase();
    if (/-(US|CA|MX|PH)$/.test(loc)) paper.value = "letter";
  } catch (e) {}

  function draw() {
    if (!ready) return;
    canvas.width = meta.w; canvas.height = meta.h;
    ctx.drawImage(base, 0, 0);
    var name = (input.value || "").trim().slice(0, MAX);
    if (!name) return;
    var b = meta.name, bw = b[2] - b[0], bh = b[3] - b[1];
    var size = Math.round(bh * 0.62);
    ctx.font = size + "px " + FONT;
    while (ctx.measureText(name).width > bw - 20 && size > 30) { size -= 4; ctx.font = size + "px " + FONT; }
    var right = meta.align === "right";
    var x = right ? b[2] - size * 0.08 : b[0] + bw / 2, y = b[1] + bh / 2 + size * 0.06;
    ctx.textAlign = right ? "right" : "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    // same look as the old "JODY'S FRIENDS ALBUM" title: yellow with a thick dark-brown outline
    ctx.lineWidth = size * 0.14; ctx.strokeStyle = "#462810";
    ctx.strokeText(name, x, y);
    ctx.fillStyle = "#ffd640"; ctx.fillText(name, x, y);
  }

  function fileName(ext) {
    var n = (input.value || "").trim().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, "");
    return "Jodys_Friends_Album" + (n ? "_" + n : "") + "." + ext;
  }

  function save(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  // Minimal one-page PDF holding the JPEG at a fixed physical width (ALBUM_MM), centred on the page.
  // 190 mm fits inside an 8 mm margin on both A4 (210 x 297) and US Letter (216 x 279).
  var ALBUM_MM = 190;
  var PAGES = { a4: [595.28, 841.89], letter: [612, 792] };
  function pdf(jpeg, wpx, hpx, page) {
    var P = PAGES[page] || PAGES.a4;
    var s = (ALBUM_MM * 72 / 25.4) / wpx;
    var w = wpx * s, h = hpx * s, x = (P[0] - w) / 2, y = (P[1] - h) / 2;   // centred
    var enc = new TextEncoder(), parts = [], len = 0, offs = [];
    function add(x) { var b = typeof x === "string" ? enc.encode(x) : x; parts.push(b); len += b.length; }
    function obj(n, body) { offs[n] = len; add(n + " 0 obj\n" + body + "\nendobj\n"); }
    var content = "q " + w.toFixed(2) + " 0 0 " + h.toFixed(2) + " " + x.toFixed(2) + " " + y.toFixed(2) + " cm /Im0 Do Q";
    add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    obj(1, "<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /PrintScaling /None >> >>");   // ask viewers to print at 100 %
    obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
    obj(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + P[0] + " " + P[1] + "] " +
           "/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>");
    offs[4] = len;
    add("4 0 obj\n<< /Type /XObject /Subtype /Image /Width " + wpx + " /Height " + hpx +
        " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpeg.length + " >>\nstream\n");
    add(jpeg); add("\nendstream\nendobj\n");
    obj(5, "<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream");
    obj(6, "<< /Title (Jody's Friends Album) /Creator (savingjody.com) >>");
    var xref = len, t = "xref\n0 7\n0000000000 65535 f \n";
    for (var i = 1; i <= 6; i++) t += String(offs[i]).padStart(10, "0") + " 00000 n \n";
    add(t + "trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
    return new Blob(parts, { type: "application/pdf" });
  }

  function busy(b, on) { b.disabled = on; b.classList.toggle("busy", on); }

  btnPng.addEventListener("click", function () {
    if (!ready) return; busy(btnPng, true); draw();
    canvas.toBlob(function (b) { save(b, fileName("png")); busy(btnPng, false); }, "image/png");
  });
  btnPdf.addEventListener("click", function () {
    if (!ready) return; busy(btnPdf, true); draw();
    canvas.toBlob(function (b) {
      b.arrayBuffer().then(function (buf) {
        save(pdf(new Uint8Array(buf), canvas.width, canvas.height, paper.value), fileName("pdf"));
        busy(btnPdf, false);
      });
    }, "image/jpeg", 0.92);
  });
  input.setAttribute("maxlength", MAX);
  input.addEventListener("input", draw);

  // the name must not be drawn before the game font is in, or it would flash in a fallback font
  var fontReady = document.fonts && document.fonts.load ? document.fonts.load('80px "Luckiest Guy"') : Promise.resolve();
  Promise.all([
    fetch("/album/album_base.json?v=" + root.dataset.v).then(function (r) { return r.json(); }),
    new Promise(function (ok, no) { base.onload = ok; base.onerror = no; base.src = "/album/album_base.jpg?v=" + root.dataset.v; }),
    fontReady.catch(function () {})
  ]).then(function (r) {
    meta = r[0]; ready = true; root.classList.add("ready");
    btnPdf.disabled = btnPng.disabled = false; draw();
  });
})();
