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
