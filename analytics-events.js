// GA4 events for contact clicks and brief submits. Loaded after the gtag snippet in each page head.
(() => {
    // Where this visit started, kept for this browser tab only. app.js attaches it to a project brief,
    // so the admin can see which page and which search or site brought each lead. No personal data.
    try {
        if (!sessionStorage.getItem("appvion-landing")) {
            const params = new URLSearchParams(location.search);
            let referrer = "";
            try {
                const ref = new URL(document.referrer);
                if (ref.hostname !== location.hostname) referrer = ref.hostname;
            } catch (error) { /* no referrer */ }
            sessionStorage.setItem("appvion-landing", JSON.stringify({
                landingPage: location.pathname.slice(0, 200),
                referrer: referrer.slice(0, 200),
                utmSource: (params.get("utm_source") || "").slice(0, 100),
                utmMedium: (params.get("utm_medium") || "").slice(0, 100),
                utmCampaign: (params.get("utm_campaign") || "").slice(0, 100)
            }));
        }
    } catch (error) { /* storage blocked: the brief is still sent, without its source */ }

    function send(name, params) {
        if (typeof window.gtag !== "function") return;
        window.gtag("event", name, Object.assign({ transport_type: "beacon" }, params));
    }

    function contactMethod(link) {
        const action = link.getAttribute("data-contact-action");
        if (action) return action;
        const href = link.getAttribute("href") || "";
        if (href.includes("wa.me")) return "whatsapp";
        if (href.includes("calendly.com")) return "strategy-call";
        if (href.startsWith("mailto:")) return "email";
        return "";
    }

    // Email addresses and phone numbers are never sent, only the kind of contact and the button label.
    document.addEventListener("click", (event) => {
        const link = event.target.closest("a");
        if (!link) return;
        const method = contactMethod(link);
        if (!method) return;
        send("contact_click", {
            contact_method: method,
            contact_label: (link.getAttribute("data-contact-label") || "").slice(0, 100)
        });
    }, true);

    // Calendly's popup reports a finished booking through postMessage.
    window.addEventListener("message", (event) => {
        if (event.origin !== "https://calendly.com") return;
        if (event.data && event.data.event === "calendly.event_scheduled") send("call_booked", { method: "calendly" });
    });

    document.addEventListener("submit", (event) => {
        if (!event.target.matches("[data-contact-form]")) return;
        send("generate_lead", { form_name: "project_brief" });
    }, true);
})();
