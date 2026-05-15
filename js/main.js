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
