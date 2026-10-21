// Mobile menu for pages that don't load app.js (same behaviour as app.js).
(() => {
    const menuToggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".nav-links");
    const year = document.getElementById("year");

    if (year) year.textContent = new Date().getFullYear().toString();

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
})();
