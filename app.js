const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-links");
const header = document.querySelector("[data-header]");
const progress = document.querySelector(".scroll-progress");
const year = document.getElementById("year");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (year) {
    year.textContent = new Date().getFullYear().toString();
}

function closeMenu() {
    if (!menuToggle || !nav) return;
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
}

if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });

    nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
    });
}

function updateViewportState() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    if (header) {
        header.classList.toggle("is-scrolled", scrollY > 12);
    }

    if (progress) {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const amount = scrollHeight > 0 ? scrollY / scrollHeight : 0;
        progress.style.transform = `scaleX(${Math.min(Math.max(amount, 0), 1)})`;
    }
}

updateViewportState();
window.addEventListener("scroll", updateViewportState, { passive: true });
window.addEventListener("resize", updateViewportState);

const revealNodes = Array.from(document.querySelectorAll(".reveal"));

if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("in-view"));
} else {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.14, rootMargin: "0px 0px -42px 0px" });

    revealNodes.forEach((node, index) => {
        node.style.setProperty("--delay", `${Math.min(index % 4, 3) * 70}ms`);
        observer.observe(node);
    });
}

if (!prefersReducedMotion) {
    document.querySelectorAll("[data-parallax]").forEach((target) => {
        target.addEventListener("pointermove", (event) => {
            const rect = target.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3);
            const y = ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3);
            target.style.setProperty("--mx", x);
            target.style.setProperty("--my", y);
        });

        target.addEventListener("pointerleave", () => {
            target.style.setProperty("--mx", "0");
            target.style.setProperty("--my", "0");
        });
    });

    document.querySelectorAll(".case-card, .service-card, .choice-card, .team-card, .insight-card").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            if (window.innerWidth < 900) return;
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 4).toFixed(2)}deg) translateY(-3px)`;
        });

        card.addEventListener("pointerleave", () => {
            card.style.transform = "";
        });
    });
}
