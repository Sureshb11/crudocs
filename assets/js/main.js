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
     Posts to the endpoint in [data-endpoint] when one is set;
     otherwise falls back to the visitor's own mail client so the
     form is never a dead end.
     --------------------------------------------------------- */
  function initForm() {
    var form = document.getElementById("enquiry-form");
    if (!form) return;

    var status = form.querySelector(".form__status");
    var submit = form.querySelector("[type=submit]");
    var endpoint = form.dataset.endpoint || "";

    function say(msg, kind) {
      if (!status) return;
      status.textContent = msg;
      status.className = "form__status is-visible form__status--" + kind;
      status.setAttribute("role", kind === "err" ? "alert" : "status");
    }

    function mailtoFallback(data) {
      var lines = [
        "Name: " + (data.get("name") || ""),
        "Company: " + (data.get("company") || "—"),
        "Email: " + (data.get("email") || ""),
        "Phone: " + (data.get("phone") || "—"),
        "Service: " + (data.get("service") || "—"),
        "",
        data.get("message") || ""
      ];
      var href = "mailto:info@crudocs.com" +
        "?subject=" + encodeURIComponent("Enquiry from crudocs.com — " + (data.get("service") || "General")) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      window.location.href = href;
      say("Opening your email app with the enquiry ready to send. If nothing happens, write to info@crudocs.com directly.", "ok");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: silently accept and drop obvious bot submissions.
      if (form.querySelector("[name=_hp]") && form.querySelector("[name=_hp]").value) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var data = new FormData(form);

      if (!endpoint) {
        mailtoFallback(data);
        return;
      }

      var original = submit ? submit.textContent : "";
      if (submit) { submit.disabled = true; submit.textContent = "Sending…"; }
      say("Sending your enquiry…", "ok");

      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          form.reset();
          say("Thank you — your enquiry has reached us. Our team will respond within one business day.", "ok");
        })
        .catch(function () {
          say("We could not submit the form just now. Please email info@crudocs.com or call +91 70003 19611.", "err");
        })
        .finally(function () {
          if (submit) { submit.disabled = false; submit.textContent = original; }
        });
    });

    // Preselect the service when arriving from a service page (?service=…).
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
