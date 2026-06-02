const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-links");
const header = document.querySelector("[data-header]");
const progress = document.querySelector(".scroll-progress");
const year = document.getElementById("year");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const firebaseConfig = window.APPVION_FIREBASE_CONFIG || {};
const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && !String(firebaseConfig.apiKey).includes("YOUR_"));
const calendlyUrl = "https://calendly.com/ayyaz-appvionstudio/30min";
const adminAlertEmail = "ayyazali.sajjadali@gmail.com";
const emailAlertEndpoint = `https://formsubmit.co/${adminAlertEmail}`;
let firebaseBriefsReady = null;
let calendlyReady = null;

function withTimeout(task, timeoutMs, message) {
    return Promise.race([
        task,
        new Promise((resolve, reject) => {
            window.setTimeout(() => reject(new Error(message)), timeoutMs);
        })
    ]);
}

function updateFormStatus(message, state) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.dataset.state = state;
}

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

function buildBriefPayload(formData) {
    return {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        type: String(formData.get("type") || "").trim(),
        timeline: String(formData.get("timeline") || "").trim(),
        message: String(formData.get("message") || "").trim(),
        source: "website-contact-form",
        userAgent: navigator.userAgent
    };
}

async function getBriefsFirestore() {
    if (!isFirebaseConfigured) throw new Error("Firebase is not configured.");
    if (!firebaseBriefsReady) {
        firebaseBriefsReady = Promise.all([
            import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
        ]).then(([appModule, firestoreModule]) => {
            const app = appModule.getApps().length
                ? appModule.getApps()[0]
                : appModule.initializeApp(firebaseConfig);
            const db = firestoreModule.getFirestore(app);
            return { db, firestoreModule };
        });
    }

    return firebaseBriefsReady;
}

async function saveBriefToFirebase(payload) {
    const { db, firestoreModule } = await getBriefsFirestore();
    await firestoreModule.addDoc(firestoreModule.collection(db, "projectBriefs"), {
        ...payload,
        status: "new",
        createdAt: firestoreModule.serverTimestamp()
    });
}

async function saveContactEvent(eventData) {
    if (!eventData || !isFirebaseConfigured) return;
    const { db, firestoreModule } = await getBriefsFirestore();
    await firestoreModule.addDoc(firestoreModule.collection(db, "contactEvents"), {
        route: eventData.route || "contact",
        label: eventData.label || "Contact action",
        href: eventData.href || window.location.href,
        source: "website-contact-click",
        page: window.location.pathname || "/",
        userAgent: navigator.userAgent,
        status: "new",
        createdAt: firestoreModule.serverTimestamp()
    });
}

function sendAdminEmailAlert(subject, fields) {
    if (!subject || !fields) return;

    const frameName = "appvion-email-alert-frame";
    let frame = document.querySelector(`iframe[name="${frameName}"]`);

    if (!frame) {
        frame = document.createElement("iframe");
        frame.name = frameName;
        frame.title = "Admin email alert submission";
        frame.hidden = true;
        frame.setAttribute("aria-hidden", "true");
        document.body.appendChild(frame);
    }

    const form = document.createElement("form");
    form.action = emailAlertEndpoint;
    form.method = "POST";
    form.target = frameName;
    form.style.display = "none";

    const alertFields = {
        _subject: subject,
        _template: "table",
        _captcha: "false",
        _replyto: fields.email || adminAlertEmail,
        ...fields
    };

    Object.entries(alertFields).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value || "");
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    window.setTimeout(() => form.remove(), 1500);
}

function sendBriefEmailAlert(payload) {
    sendAdminEmailAlert("New AppVion Studio project brief", {
        name: payload.name,
        email: payload.email,
        project_type: payload.type,
        timeline: payload.timeline,
        message: payload.message,
        source: "AppVion website project brief",
        admin_inbox: `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, "")}appvion-control.html`
    });
}

function contactEventFromLink(link) {
    return {
        route: link.dataset.contactAction || "contact",
        label: link.dataset.contactLabel || link.innerText.trim().slice(0, 120) || "Contact action",
        href: link.href
    };
}

function loadCalendlyWidget() {
    if (window.Calendly && typeof window.Calendly.initPopupWidget === "function") {
        return Promise.resolve(window.Calendly);
    }

    if (calendlyReady) return calendlyReady;

    calendlyReady = new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
        const script = existingScript || document.createElement("script");

        script.addEventListener("load", () => {
            if (window.Calendly && typeof window.Calendly.initPopupWidget === "function") {
                resolve(window.Calendly);
            } else {
                reject(new Error("Calendly widget loaded without popup support."));
            }
        }, { once: true });

        script.addEventListener("error", () => {
            reject(new Error("Calendly widget could not load."));
        }, { once: true });

        if (!existingScript) {
            script.src = "https://assets.calendly.com/assets/external/widget.js";
            script.async = true;
            document.body.appendChild(script);
        }

        window.setTimeout(() => {
            if (window.Calendly && typeof window.Calendly.initPopupWidget === "function") {
                resolve(window.Calendly);
            } else {
                reject(new Error("Calendly widget timed out."));
            }
        }, 3500);
    });

    return calendlyReady;
}

function openCalendlyPopup() {
    if (window.Calendly && typeof window.Calendly.initPopupWidget === "function") {
        window.Calendly.initPopupWidget({ url: calendlyUrl });
        return true;
    }

    return false;
}

document.addEventListener("click", async (event) => {
    const link = event.target.closest("[data-contact-action]");
    if (!link) return;
    const contactEvent = contactEventFromLink(link);

    if (contactEvent.route === "strategy-call") {
        event.preventDefault();
        saveContactEvent(contactEvent).catch((error) => {
            console.warn("AppVion contact event tracking failed:", error);
        });

        try {
            await loadCalendlyWidget();
            if (!openCalendlyPopup()) throw new Error("Calendly popup was unavailable.");
        } catch (error) {
            console.warn("AppVion Calendly popup failed. Opening Calendly in a new tab.", error);
            window.open(link.href, "_blank", "noopener,noreferrer");
        }
        return;
    }

    saveContactEvent(contactEvent).catch((error) => {
        console.warn("AppVion contact event tracking failed:", error);
    });
});

window.addEventListener("message", (event) => {
    const eventName = event.data && event.data.event;
    if (typeof eventName !== "string" || !eventName.startsWith("calendly.")) return;
    if (eventName !== "calendly.event_scheduled") return;

    const payload = event.data.payload || {};
    const eventHref = payload.event && payload.event.uri ? payload.event.uri : calendlyUrl;
    saveContactEvent({
        route: "calendly-scheduled",
        label: "Confirmed Calendly booking",
        href: eventHref
    }).catch((error) => {
        console.warn("AppVion Calendly booking tracking failed:", error);
    });

    sendAdminEmailAlert("Confirmed AppVion Calendly booking", {
        booking_status: "Confirmed Calendly booking",
        calendly_event: eventHref,
        source: "AppVion website Calendly popup",
        admin_inbox: `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, "")}appvion-control.html`
    });
});

if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        if (String(formData.get("_honey") || "").trim()) return;

        const payload = buildBriefPayload(formData);
        const submitButton = contactForm.querySelector("button[type='submit']");

        updateFormStatus("Saving your project brief...", "sending");

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            await withTimeout(
                saveBriefToFirebase(payload),
                4500,
                "Firebase submit timed out."
            );

            sendBriefEmailAlert(payload);
            contactForm.reset();
            updateFormStatus(
                "Thanks. Your project brief is saved in the AppVion dashboard and an email alert has been sent to the admin.",
                "success"
            );
        } catch (error) {
            console.warn("AppVion Firebase brief submit failed. Falling back to form endpoint.", error);

            if (contactForm.action) {
                contactForm.submit();
                window.setTimeout(() => {
                    contactForm.reset();
                    updateFormStatus(
                        `Firebase did not save this brief, so it was sent through the backup email service. Check ${adminAlertEmail} and FormSubmit.`,
                        "success"
                    );
                }, 900);
            } else {
                const errorMessage = error && error.message ? error.message : String(error);
                console.warn("AppVion brief submit failed:", error);
                updateFormStatus(
                    `We could not save this brief from your browser. Please email ayyaz@appvionstudio.com directly. (${errorMessage})`,
                    "error"
                );
            }
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

    document.body.classList.toggle("show-sticky-cta", scrollY > 420);
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
