(function () {
    // The homepage's text, project cards, team and links live in index.html (Git is the
    // source of truth for anything search engines read). The admin panel now feeds only
    // the optional Demo library section, so this script waits until the page has loaded
    // and stays out of the critical rendering path.
    const storageKey = "appvionStudioContent.v1";
    const firebaseConfig = window.APPVION_FIREBASE_CONFIG || {};
    const firebaseContentPath = window.APPVION_FIREBASE_CONTENT_PATH || ["siteContent", "home"];
    const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && !String(firebaseConfig.apiKey).includes("YOUR_"));
    let firebaseReady = null;

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getStoredContent() {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn("Could not read AppVion admin content.", error);
            return null;
        }
    }

    async function getFirebaseContent() {
        if (!isFirebaseConfigured) return null;
        if (!firebaseReady) {
            firebaseReady = Promise.all([
                import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
                import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
            ]).then(([appModule, firestoreModule]) => {
                const app = appModule.initializeApp(firebaseConfig);
                const db = firestoreModule.getFirestore(app);
                return { db, firestoreModule };
            });
        }

        const { db, firestoreModule } = await firebaseReady;
        const snapshot = await firestoreModule.getDoc(firestoreModule.doc(db, firebaseContentPath[0], firebaseContentPath[1]));
        if (!snapshot.exists()) return null;
        const data = snapshot.data();
        return data && data.content ? data.content : null;
    }

    async function loadContent() {
        const stored = getStoredContent();
        if (stored) return stored;

        try {
            const firebaseContent = await getFirebaseContent();
            if (firebaseContent) return firebaseContent;
        } catch (error) {
            console.warn("Could not load AppVion Firebase content.", error);
        }

        try {
            const response = await fetch("appvion-content.json", { cache: "no-store" });
            if (!response.ok) throw new Error("Content file unavailable");
            return await response.json();
        } catch (error) {
            console.warn("Could not load AppVion content file.", error);
            return null;
        }
    }

    function renderDemoLibrary(demos, isVisible) {
        const grid = document.querySelector(".demo-library-grid");
        const section = document.querySelector("#demos");
        if (!grid || !section) return;

        if (isVisible === false || !Array.isArray(demos) || !demos.length) {
            section.hidden = true;
            grid.innerHTML = "";
            return;
        }

        section.hidden = false;
        grid.innerHTML = demos.map((demo) => {
            const points = String(demo.proofPoints || "")
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean)
                .slice(0, 3);

            return `
                <article class="demo-card ${demo.featured ? "featured" : ""} reveal in-view">
                    ${demo.thumbnailUrl ? `<img class="demo-thumb" src="${escapeHtml(demo.thumbnailUrl)}" alt="${escapeHtml(demo.title)} preview" loading="lazy">` : ""}
                    <span>${escapeHtml(demo.category || "Demo")}</span>
                    <h3>${escapeHtml(demo.title)}</h3>
                    <p>${escapeHtml(demo.description)}</p>
                    ${points.length ? `<ul>${points.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
                    ${demo.demoUrl ? `<a href="${escapeHtml(demo.demoUrl)}" target="_blank" rel="noreferrer">Open Demo</a>` : ""}
                </article>
            `;
        }).join("");
    }

    function start() {
        loadContent().then((content) => {
            if (!content) return;
            const sections = content.settings && content.settings.sections;
            renderDemoLibrary(content.demoLibrary, sections && sections.demos);
            window.dispatchEvent(new CustomEvent("appvion:content-rendered"));
        });
    }

    // Fetch the admin content only after the page has finished loading and the browser
    // is idle, so the Firebase SDK never competes with the hero for bandwidth.
    function whenIdle() {
        const idle = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 1200));
        idle(start);
    }

    if (document.readyState === "complete") {
        whenIdle();
    } else {
        window.addEventListener("load", whenIdle, { once: true });
    }
}());
