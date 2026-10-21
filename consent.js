// Cookie consent. Google Analytics runs in consent mode (no analytics cookies) until the visitor
// allows it; Microsoft Clarity loads only after "Allow". The choice is remembered on this device.
(() => {
    const KEY = "appvion-consent";
    const CLARITY_ID = "w6x06tsd9x";

    function readChoice() {
        try { return localStorage.getItem(KEY); } catch (error) { return null; }
    }

    function saveChoice(value) {
        try { localStorage.setItem(KEY, value); } catch (error) { /* private mode: ask again next visit */ }
    }

    function loadClarity() {
        if (window.clarity) return;
        (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
            t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", CLARITY_ID);
    }

    function grant() {
        if (typeof window.gtag === "function") window.gtag("consent", "update", { analytics_storage: "granted" });
        loadClarity();
    }

    function addStyles() {
        if (document.getElementById("consent-style")) return;
        const style = document.createElement("style");
        style.id = "consent-style";
        style.textContent = `
            .consent-banner {
                position: fixed; z-index: 1000;
                left: max(12px, env(safe-area-inset-left, 0px)); right: max(12px, env(safe-area-inset-right, 0px));
                bottom: calc(12px + env(safe-area-inset-bottom, 0px));
                max-width: 560px; margin-inline: auto; padding: 16px 18px;
                display: grid; gap: 12px;
                border: 1px solid rgba(15, 23, 42, 0.12); border-radius: 14px;
                background: #ffffff; color: #0f172a; -webkit-text-fill-color: #0f172a;
                box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
                font: 400 14px/1.55 "Plus Jakarta Sans", system-ui, sans-serif;
            }
            .consent-banner p { margin: 0; color: #334155 !important; -webkit-text-fill-color: #334155 !important; }
            .consent-banner a { color: #1d4ed8 !important; -webkit-text-fill-color: #1d4ed8 !important; text-decoration: underline; }
            .consent-actions { display: flex; flex-wrap: wrap; gap: 8px; }
            .consent-actions button {
                min-height: 40px; padding: 0 18px; border-radius: 999px; cursor: pointer;
                font: 700 14px/1 "Plus Jakarta Sans", system-ui, sans-serif;
            }
            .consent-allow { border: 0; background: #2457d6; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
            .consent-decline { border: 1px solid rgba(15, 23, 42, 0.2); background: #ffffff; color: #0f172a !important; -webkit-text-fill-color: #0f172a !important; }
            .consent-actions button:focus-visible { outline: 2px solid #2457d6; outline-offset: 2px; }
        `;
        document.head.appendChild(style);
    }

    function showBanner() {
        if (document.querySelector(".consent-banner")) return;
        addStyles();
        const banner = document.createElement("div");
        banner.className = "consent-banner";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-label", "Cookie choice");
        banner.innerHTML = `
            <p>We use Google Analytics and Microsoft Clarity to see which pages help visitors and where the site can improve. Allow analytics cookies? <a href="/privacy.html#cookies">Privacy policy</a></p>
            <div class="consent-actions">
                <button class="consent-allow" type="button" data-consent="granted">Allow</button>
                <button class="consent-decline" type="button" data-consent="denied">Decline</button>
            </div>
        `;
        banner.addEventListener("click", (event) => {
            const button = event.target.closest("[data-consent]");
            if (!button) return;
            saveChoice(button.dataset.consent);
            if (button.dataset.consent === "granted") grant();
            banner.remove();
        });
        document.body.appendChild(banner);
    }

    // "Cookie settings" buttons (on the privacy page) reopen the choice.
    document.addEventListener("click", (event) => {
        if (!event.target.closest("[data-cookie-settings]")) return;
        try { localStorage.removeItem(KEY); } catch (error) { /* ignore */ }
        showBanner();
    });

    const choice = readChoice();
    if (choice === "granted") loadClarity();
    else if (choice !== "denied") showBanner();
})();
