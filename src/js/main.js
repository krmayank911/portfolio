/* Theme toggle */
(function () {
  const html = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  const stored = localStorage.getItem("theme");

  if (stored) {
    html.setAttribute("data-theme", stored);
  } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    html.setAttribute("data-theme", "light");
  }

  if (btn) {
    btn.addEventListener("click", function () {
      const current = html.getAttribute("data-theme");
      const next = current === "light" ? "dark" : "light";
      html.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }
})();

/* Mobile nav toggle */
(function () {
  const hamburger = document.getElementById("nav-hamburger");
  const navLinks = document.getElementById("nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", function () {
      navLinks.classList.toggle("open");
    });

    document.addEventListener("click", function (e) {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove("open");
      }
    });
  }
})();

/* Image lightbox for problem galleries */
(function () {
  const items = Array.from(document.querySelectorAll(".gallery-item"));
  if (!items.length) return;

  // Build overlay
  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  overlay.innerHTML = `
    <div class="lightbox-inner">
      <button class="lightbox-close" aria-label="Close">&#x2715;</button>
      <button class="lightbox-nav lightbox-prev" aria-label="Previous">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <img class="lightbox-img" src="" alt="">
      <button class="lightbox-nav lightbox-next" aria-label="Next">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
      <p class="lightbox-caption"></p>
    </div>`;
  document.body.appendChild(overlay);

  const lbImg     = overlay.querySelector(".lightbox-img");
  const lbCaption = overlay.querySelector(".lightbox-caption");
  const lbPrev    = overlay.querySelector(".lightbox-prev");
  const lbNext    = overlay.querySelector(".lightbox-next");
  let current     = 0;

  function show(index) {
    current = (index + items.length) % items.length;
    const img     = items[current].querySelector(".gallery-img");
    const caption = items[current].querySelector(".gallery-caption");
    lbImg.src        = img.src;
    lbImg.alt        = img.alt;
    lbCaption.textContent = caption ? caption.textContent : "";
    lbPrev.style.display = items.length > 1 ? "flex" : "none";
    lbNext.style.display = items.length > 1 ? "flex" : "none";
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  items.forEach(function (item, i) {
    item.addEventListener("click", function () { show(i); });
  });

  lbPrev.addEventListener("click", function (e) { e.stopPropagation(); show(current - 1); });
  lbNext.addEventListener("click", function (e) { e.stopPropagation(); show(current + 1); });
  overlay.querySelector(".lightbox-close").addEventListener("click", close);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  lbImg.addEventListener("click", function (e) { e.stopPropagation(); });

  document.addEventListener("keydown", function (e) {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape")      close();
    if (e.key === "ArrowLeft")   show(current - 1);
    if (e.key === "ArrowRight")  show(current + 1);
  });
})();

/* Project carousel — filmstrip + video overlay + image peek overlay */
(function () {
  document.querySelectorAll("[data-carousel]").forEach(function (carousel) {
    const track     = carousel.querySelector(".carousel-track");
    const allSlides = Array.from(carousel.querySelectorAll(".carousel-slide-img, .carousel-slide-video"));
    const imgSlides = Array.from(carousel.querySelectorAll(".carousel-slide-img"));
    const prev      = carousel.querySelector(".carousel-prev");
    const next      = carousel.querySelector(".carousel-next");
    if (!allSlides.length) return;

    const GAP = 8;
    let offset = 0;

    function slideW(s) { return s.offsetWidth + GAP; }
    function firstSlideW() { return allSlides[0].offsetWidth + GAP; }

    function numVisible() {
      var used = 0, count = 0;
      var avail = carousel.offsetWidth - 20; // padding
      for (var i = offset; i < allSlides.length; i++) {
        used += allSlides[i].offsetWidth + GAP;
        if (used > avail) break;
        count++;
      }
      return Math.max(1, count);
    }

    function updateArrows() {
      var totalW = allSlides.reduce(function(sum, s) { return sum + s.offsetWidth + GAP; }, 0);
      var canScroll = totalW > carousel.offsetWidth - 20;
      if (prev) prev.hidden = !canScroll || offset <= 0;
      if (next) {
        // Check if last slide is fully visible
        var scrolled = allSlides.slice(0, offset).reduce(function(s, sl) { return s + sl.offsetWidth + GAP; }, 0);
        var remaining = totalW - scrolled;
        next.hidden = !canScroll || remaining <= (carousel.offsetWidth - 20);
      }
    }

    function scrollTo(newOffset) {
      offset = Math.max(0, Math.min(newOffset, allSlides.length - 1));
      var px = allSlides.slice(0, offset).reduce(function(s, sl) { return s + sl.offsetWidth + GAP; }, 0);
      track.style.transform = "translateX(-" + px + "px)";
      updateArrows();
    }

    updateArrows();
    if (prev) prev.addEventListener("click", function () { scrollTo(offset - numVisible()); });
    if (next) next.addEventListener("click", function () { scrollTo(offset + numVisible()); });

    var startX = 0;
    track.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", function (e) {
      var diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) scrollTo(offset + (diff > 0 ? 1 : -1));
    });

    window.addEventListener("resize", function () { scrollTo(offset); updateArrows(); });

    // ── Video — play inline in filmstrip ──
    function openVideo(slide) {
      var thumb = slide.querySelector(".carousel-video-thumb");
      if (slide.querySelector("iframe")) return; // already playing
      var iframe = document.createElement("iframe");
      iframe.src = slide.dataset.video;
      iframe.setAttribute("allow", "fullscreen");
      iframe.setAttribute("allowfullscreen", "");
      iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:none;";
      if (thumb) thumb.style.display = "none";
      slide.appendChild(iframe);
    }

    // ── Image peek overlay ──
    var imgData = imgSlides.map(function (s) {
      var img = s.querySelector(".carousel-img");
      return { src: img ? img.src : "", alt: img ? img.alt : "", caption: img ? img.dataset.caption || "" : "" };
    });

    var overlay = document.createElement("div");
    overlay.className = "carousel-overlay";
    var oClose = document.createElement("button");
    oClose.className = "carousel-overlay-close"; oClose.innerHTML = "&#x2715;";
    var oWrap = document.createElement("div"); oWrap.className = "carousel-overlay-track-wrap";
    var oTrack = document.createElement("div"); oTrack.className = "carousel-overlay-track";

    imgData.forEach(function (d, i) {
      var sl = document.createElement("div");
      sl.className = "carousel-overlay-slide" + (i === 0 ? " active" : "");
      var fr = document.createElement("div"); fr.className = "carousel-overlay-frame";
      var im = document.createElement("img");
      im.className = "carousel-overlay-img"; im.src = d.src; im.alt = d.alt; im.loading = "lazy";
      fr.appendChild(im); sl.appendChild(fr);
      if (d.caption) { var cp = document.createElement("p"); cp.className = "carousel-overlay-caption"; cp.textContent = d.caption; sl.appendChild(cp); }
      oTrack.appendChild(sl);
    });
    oWrap.appendChild(oTrack);

    var oBtnPrev = document.createElement("button"); oBtnPrev.className = "carousel-overlay-btn carousel-overlay-prev"; oBtnPrev.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
    var oBtnNext = document.createElement("button"); oBtnNext.className = "carousel-overlay-btn carousel-overlay-next"; oBtnNext.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
    var oDotWrap = document.createElement("div"); oDotWrap.className = "carousel-overlay-dots";
    imgData.forEach(function (_, i) {
      var dot = document.createElement("button"); dot.className = "carousel-overlay-dot" + (i === 0 ? " active" : ""); dot.setAttribute("aria-label", "Slide " + (i + 1)); oDotWrap.appendChild(dot);
    });

    overlay.appendChild(oClose); overlay.appendChild(oWrap); overlay.appendChild(oBtnPrev); overlay.appendChild(oBtnNext); overlay.appendChild(oDotWrap);
    document.body.appendChild(overlay);

    var oSlides  = Array.from(oTrack.querySelectorAll(".carousel-overlay-slide"));
    var oDots    = Array.from(oDotWrap.querySelectorAll(".carousel-overlay-dot"));
    var oCurrent = 0;
    var OGAP     = 20;

    function oGoTo(idx) {
      oCurrent = (idx + oSlides.length) % oSlides.length;
      var w = oSlides[0].offsetWidth, cw = oWrap.offsetWidth;
      oTrack.style.transform = "translateX(" + (-(oCurrent * (w + OGAP) - (cw - w) / 2)) + "px)";
      oSlides.forEach(function (s, i) { s.classList.toggle("active", i === oCurrent); });
      oDots.forEach(function (d, i)   { d.classList.toggle("active", i === oCurrent); });
    }

    function openImages(startIdx) {
      overlay.classList.add("open"); document.body.style.overflow = "hidden";
      oTrack.style.transition = "none"; oGoTo(startIdx);
      requestAnimationFrame(function () { oTrack.style.transition = ""; });
    }
    function closeImages() { overlay.classList.remove("open"); document.body.style.overflow = ""; }

    // Wire clicks
    carousel.querySelectorAll(".carousel-slide-video").forEach(function (s) {
      s.addEventListener("click", function () { openVideo(s); });
    });
    imgSlides.forEach(function (s, i) {
      s.addEventListener("click", function () { openImages(i); });
    });

    oBtnPrev.addEventListener("click", function () { oGoTo(oCurrent - 1); });
    oBtnNext.addEventListener("click", function () { oGoTo(oCurrent + 1); });
    oDots.forEach(function (d, i) { d.addEventListener("click", function () { oGoTo(i); }); });
    oClose.addEventListener("click", closeImages);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeImages(); });

    var oStartX = 0;
    oTrack.addEventListener("touchstart", function (e) { oStartX = e.touches[0].clientX; }, { passive: true });
    oTrack.addEventListener("touchend", function (e) {
      var diff = oStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) oGoTo(oCurrent + (diff > 0 ? 1 : -1));
    });

    document.addEventListener("keydown", function (e) {
      if (!overlay.classList.contains("open")) return;
      if (e.key === "Escape") closeImages();
      if (e.key === "ArrowLeft") oGoTo(oCurrent - 1);
      if (e.key === "ArrowRight") oGoTo(oCurrent + 1);
    });

    window.addEventListener("resize", function () { if (overlay.classList.contains("open")) oGoTo(oCurrent); });
  });
})();

/* STAR badge injection for problem detail pages */
(function () {
  const content = document.querySelector(".problem-content");
  if (!content) return;

  const starMap = {
    Situation: { letter: "S", color: "var(--star-s)", cls: "star-situation" },
    Task:      { letter: "T", color: "var(--star-t)", cls: "star-task"      },
    Action:    { letter: "A", color: "var(--star-a)", cls: "star-action"    },
    Result:    { letter: "R", color: "var(--star-r)", cls: "star-result"    },
  };

  content.querySelectorAll("h2").forEach(function (h2) {
    const text = h2.textContent.trim();
    const entry = starMap[text];
    if (!entry) return;

    h2.classList.add(entry.cls);

    const badge = document.createElement("span");
    badge.className = "star-badge";
    badge.textContent = entry.letter;
    badge.style.backgroundColor = entry.color;
    h2.prepend(badge);
  });
})();
