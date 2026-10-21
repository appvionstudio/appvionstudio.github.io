// GA4 events for contact clicks and brief submits. Loaded after the gtag snippet in each page head.
(() => {
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

    document.addEventListener("submit", (event) => {
        if (!event.target.matches("[data-contact-form]")) return;
        send("generate_lead", { form_name: "project_brief" });
    }, true);
})();
