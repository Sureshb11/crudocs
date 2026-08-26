/* =============================================================
   Crudo — crudocs.com
   Progressive enhancement only: the site works fully without JS.
   ============================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------- */
  function initNav() {
    var toggle = document.querySelector(".nav__toggle");
    var menu = document.getElementById("nav-menu");
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      document.body.style.overflow = open && window.innerWidth <= 960 ? "hidden" : "";
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Close when a link is tapped, or on Escape, or when resized to desktop.
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    var lastWidth = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        if (window.innerWidth > 960) setOpen(false);
      }
    });
  }

  /* ---------------------------------------------------------
     Sticky header shadow + back-to-top visibility
     --------------------------------------------------------- */
  function initScrollUI() {
    var header = document.querySelector(".header");
    var toTop = document.querySelector(".fab--top");
    var ticking = false;

    function update() {
      var y = window.scrollY;
      if (header) header.classList.toggle("is-stuck", y > 8);
      if (toTop) toTop.classList.toggle("is-visible", y > 600);
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();

    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      });
    }
  }

  /* ---------------------------------------------------------
     Scroll reveal
     --------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Animated stat counters
     --------------------------------------------------------- */
  function initCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;

    function render(el, value) {
      var suffix = el.dataset.suffix || "";
      el.textContent = value.toLocaleString("en-IN");
      if (suffix) {
        var s = document.createElement("span");
        s.textContent = suffix;
        el.appendChild(s);
      }
    }

    function run(el) {
      var target = parseFloat(el.dataset.count);
      if (isNaN(target)) return;
      if (reduceMotion) { render(el, target); return; }

      var duration = 1400;
      var start = null;

      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        render(el, Math.round(target * eased));
        if (p < 1) window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window)) {
      nums.forEach(function (el) { render(el, parseFloat(el.dataset.count)); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Contact form

     Three delivery routes, in priority order:
       1. data-endpoint  — a real form backend, if one is configured
       2. WhatsApp       — deep link to the business number
       3. Email          — mailto with the enquiry pre-composed

     Whichever route is used, the composed enquiry is also offered as
     copyable text, so a blocked popup or an unconfigured mail client
     can never swallow a buyer's message.
     --------------------------------------------------------- */
  function initForm() {
    var form = document.getElementById("enquiry-form");
    if (!form) return;

    var status = form.querySelector(".form__status");
    var endpoint = form.dataset.endpoint || "";
    var WHATSAPP = form.dataset.whatsapp || "917000319611";
    var EMAIL = form.dataset.email || "info@crudocs.com";

    function say(html, kind) {
      if (!status) return;
      status.innerHTML = html;
      status.className = "form__status is-visible form__status--" + kind;
      status.setAttribute("role", kind === "err" ? "alert" : "status");
      status.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    }

    function field(data, name) {
      var v = (data.get(name) || "").toString().trim();
      return v || "—";
    }

    /** The enquiry as plain text, used by every route. */
    function compose(data) {
      return [
        "ENQUIRY FROM CRUDOCS.COM",
        "",
        "Name: " + field(data, "name"),
        "Company: " + field(data, "company"),
        "Email: " + field(data, "email"),
        "Phone: " + field(data, "phone"),
        "Interest: " + field(data, "service"),
        "Destination: " + field(data, "destination"),
        "",
        "Requirement:",
        field(data, "message")
      ].join("\n");
    }

    function subjectFor(data) {
      var svc = (data.get("service") || "").toString().trim();
      return "Enquiry from crudocs.com" + (svc ? " — " + svc : "");
    }

    /** Offer the text for copying, so a failed hand-off is recoverable. */
    function offerCopy(text, lead, kind) {
      var id = "enq-copy";
      say(
        lead +
        '<div class="form__copy">' +
        '<button type="button" class="btn btn--ghost form__copybtn" data-copy>Copy enquiry text</button>' +
        '<a class="btn btn--ghost" href="mailto:' + EMAIL + '">' + EMAIL + "</a>" +
        "</div>" +
        '<pre class="form__pre" id="' + id + '"></pre>',
        kind
      );
      var pre = status.querySelector("#" + id);
      if (pre) pre.textContent = text;

      var btn = status.querySelector("[data-copy]");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var done = function () {
          btn.textContent = "Copied";
          window.setTimeout(function () { btn.textContent = "Copy enquiry text"; }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { selectPre(pre); });
        } else {
          selectPre(pre);
        }
      });
    }

    function selectPre(pre) {
      if (!pre) return;
      var range = document.createRange();
      range.selectNodeContents(pre);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }

    /** Open a URL in a new tab, falling back to same-tab navigation. */
    function openUrl(url) {
      var w = window.open(url, "_blank", "noopener");
      if (!w) window.location.href = url;
      return !!w;
    }

    function sendWhatsApp(data) {
      var text = compose(data);
      openUrl("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(text));
      offerCopy(
        text,
        "<strong>WhatsApp is opening with your enquiry ready to send.</strong> " +
          "Press send there to reach us. If WhatsApp did not open, copy the text below " +
          "and message or email it to us.",
        "ok"
      );
    }

    function sendEmail(data) {
      var text = compose(data);
      window.location.href =
        "mailto:" + EMAIL +
        "?subject=" + encodeURIComponent(subjectFor(data)) +
        "&body=" + encodeURIComponent(text);
      offerCopy(
        text,
        "<strong>Your email app is opening with the enquiry ready to send.</strong> " +
          "If nothing happened, copy the text below and send it to " + EMAIL + ".",
        "ok"
      );
    }

    function postToEndpoint(data, button) {
      var original = button ? button.textContent : "";
      if (button) { button.disabled = true; button.textContent = "Sending…"; }
      say("Sending your enquiry…", "ok");

      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          form.reset();
          say(
            "<strong>Thank you — your enquiry has reached us.</strong> " +
              "Our team will respond within one business day.",
            "ok"
          );
        })
        .catch(function () {
          offerCopy(
            compose(data),
            "<strong>We could not submit the form just now.</strong> " +
              "Copy the text below and send it to us on WhatsApp or by email — " +
              "it will not be lost.",
            "err"
          );
        })
        .finally(function () {
          if (button) { button.disabled = false; button.textContent = original; }
        });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: silently drop obvious bot submissions.
      var hp = form.querySelector("[name=_hp]");
      if (hp && hp.value) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new FormData(form);
      var button = e.submitter || form.querySelector("[type=submit]");
      var channel = button && button.dataset ? button.dataset.channel : "";

      if (endpoint) { postToEndpoint(data, button); return; }
      if (channel === "email") { sendEmail(data); return; }
      sendWhatsApp(data);
    });

    // Preselect the interest when arriving from a product page (?service=…).
    var preset = new URLSearchParams(window.location.search).get("service");
    if (preset) {
      var select = form.querySelector("[name=service]");
      if (select) {
        Array.prototype.forEach.call(select.options, function (opt) {
          if (opt.value.toLowerCase() === preset.toLowerCase()) select.value = opt.value;
        });
      }
    }
  }

  /* ---------------------------------------------------------
     Current year in the footer
     --------------------------------------------------------- */
  function initYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  function init() {
    initNav();
    initScrollUI();
    initReveal();
    initCounters();
    initForm();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
