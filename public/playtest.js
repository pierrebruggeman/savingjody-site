// Playtester sign-up (home page). Writes one document per email to Firestore over plain HTTPS:
// playtesters/<sha256(email)>. The rules (../firebase/firestore.rules) allow create only, so
// nobody can read the list from the web, and signing up twice just says "you're on the list".
(function () {
  var PROJECT = "savingjody";
  var URL = "https://firestore.googleapis.com/v1/projects/" + PROJECT + "/databases/(default)/documents/playtesters?documentId=";
  // Google Apps Script web app ("Saving Jody playtester emails" in Pierre's account): emails Pierre each NEW sign-up.
  var NOTIFY = "https://script.google.com/macros/s/AKfycbyC2vtISopoRg8nYsHGKCfcpLGabLSQdOSDwgPa3n6jpqjnofRkEKz2DQR4t38onSu8/exec";

  function sha256(text) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("pt-form");
    if (!form) return;
    var box = form.closest(".playtest"), msg = document.getElementById("pt-msg"), btn = form.querySelector("button");

    function show(kind) {
      msg.className = "msg " + kind;
      msg.innerHTML = box.querySelector("template.pt-" + kind).innerHTML;
      msg.hidden = false;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.website.value) { box.classList.add("done"); show("ok"); return; }   // bot filled the hidden field
      var email = form.email.value.trim().toLowerCase();
      var name = form.fname.value.trim().slice(0, 40);
      var device = (form.querySelector("input[name=device]:checked") || {}).value;
      var fields = {
        email: { stringValue: email }, device: { stringValue: device },
        lang: { stringValue: document.documentElement.lang.slice(0, 8) },
        at: { timestampValue: new Date().toISOString() }
      };
      if (name) fields.name = { stringValue: name };
      btn.disabled = true; btn.classList.add("busy"); msg.hidden = true;
      sha256(email).then(function (id) {
        return fetch(URL + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: fields }) });
      }).then(function (r) {
        // 409 = this email already signed up: same happy ending
        if (r.ok) {   // brand-new sign-up (409 = already on the list): ping the email script, fire and forget
          try { fetch(NOTIFY, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ email: email, name: name, device: device, lang: fields.lang.stringValue }) }); } catch (x) {}
        }
        if (r.ok || r.status === 409) { box.classList.add("done"); show("ok"); form.reset(); }
        else throw new Error(r.status);
      }).catch(function () {
        show("err");
      }).then(function () { btn.disabled = false; btn.classList.remove("busy"); });
    });
  });
})();
