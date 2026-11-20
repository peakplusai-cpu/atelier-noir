(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var wide = window.matchMedia("(min-width: 900px)");

  var bar = document.querySelector("[data-progress]");
  var now = document.querySelector("[data-now]");
  var chapters = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));
  var pin = document.querySelector("[data-pin]");
  var sticky = pin && pin.querySelector(".pin-sticky");
  var track = pin && pin.querySelector(".pin-track");
  var counter = pin && pin.querySelector("[data-panel]");
  var panels = track ? track.children.length : 0;

  function onScrollProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var p = max > 0 ? doc.scrollTop / max : 0;
    if (bar) bar.style.transform = "scaleX(" + p + ")";
  }

  function chapter() {
    if (!now) return;
    var mark = chapters[0];
    var line = window.innerHeight * 0.42;
    chapters.forEach(function (section) {
      var top = section.getBoundingClientRect().top;
      if (top <= line) mark = section;
    });
    if (mark) now.textContent = mark.getAttribute("data-chapter");
  }

  function pinning() {
    return pin && sticky && track && wide.matches && !reduce;
  }

  function layoutPin() {
    if (!pin) return;
    var on = pinning();
    pin.classList.toggle("is-active", on);
    if (!on) {
      pin.style.height = "";
      track.style.transform = "";
      return;
    }
    var travel = Math.max(0, track.scrollWidth - sticky.clientWidth);
    pin.style.height = sticky.clientHeight + travel + "px";
  }

  function framePin() {
    if (!pinning()) return;
    var travel = Math.max(0, track.scrollWidth - sticky.clientWidth);
    var total = Math.max(1, pin.offsetHeight - sticky.clientHeight);
    var scrolled = Math.min(Math.max(-pin.getBoundingClientRect().top, 0), total);
    var p = scrolled / total;
    track.style.transform = "translate3d(" + (-p * travel).toFixed(2) + "px,0,0)";
    if (counter && panels) {
      var index = Math.min(panels, Math.max(1, Math.round(p * (panels - 1)) + 1));
      counter.textContent = String(index).padStart(2, "0") + " / " + String(panels).padStart(2, "0");
    }
  }

  function stepReel(direction) {
    if (!track || !panels) return;
    if (pinning()) {
      var travel = Math.max(0, track.scrollWidth - sticky.clientWidth);
      var step = travel / (panels - 1 || 1);
      window.scrollBy({ top: direction * step, behavior: reduce ? "auto" : "smooth" });
      return;
    }
    track.scrollBy({
      left: direction * track.clientWidth,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  document.querySelectorAll("[data-reel]").forEach(function (button) {
    button.addEventListener("click", function () {
      stepReel(button.getAttribute("data-reel") === "next" ? 1 : -1);
    });
  });

  if (track && !pinning()) {
    track.addEventListener(
      "scroll",
      function () {
        if (!counter || pinning()) return;
        var index = Math.min(panels, Math.max(1, Math.round(track.scrollLeft / track.clientWidth) + 1));
        counter.textContent = String(index).padStart(2, "0") + " / " + String(panels).padStart(2, "0");
      },
      { passive: true }
    );
  }

  var dot = document.querySelector(".dot");
  if (dot && fine && !reduce) {
    var x = window.innerWidth / 2;
    var y = window.innerHeight / 2;
    var cx = x;
    var cy = y;
    window.addEventListener(
      "pointermove",
      function (event) {
        x = event.clientX;
        y = event.clientY;
      },
      { passive: true }
    );
    function follow() {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      dot.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      requestAnimationFrame(follow);
    }
    follow();
  } else if (dot) {
    dot.remove();
  }

  function tick() {
    onScrollProgress();
    chapter();
    framePin();
  }

  layoutPin();
  tick();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      layoutPin();
      tick();
    });
  }
  window.addEventListener("scroll", tick, { passive: true });
  window.addEventListener("resize", function () {
    layoutPin();
    tick();
  });
  wide.addEventListener("change", function () {
    layoutPin();
    tick();
  });
})();
