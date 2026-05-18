const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-links");
const header = document.querySelector("[data-header]");
const progress = document.querySelector(".scroll-progress");
const year = document.getElementById("year");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
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

if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const name = String(formData.get("name") || "").trim();
        const submitButton = contactForm.querySelector("button[type='submit']");

        if (formStatus) {
            formStatus.textContent = "Sending your project brief...";
        }

        if (submitButton) {
            submitButton.disabled = true;
        }

        formData.set("_subject", `Project brief from ${name || "AppVion website"}`);

        try {
            const response = await fetch("https://formsubmit.co/ajax/appvionstudio@gmail.com", {
                method: "POST",
                headers: {
                    "Accept": "application/json"
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error("Form submit failed");
            }

            contactForm.reset();

            if (formStatus) {
                formStatus.textContent = "Thanks. Your project brief has been sent to AppVion Studio.";
            }
        } catch (error) {
            if (formStatus) {
                formStatus.textContent = "Opening the secure form submit page to finish sending...";
            }

            contactForm.submit();
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
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

}
