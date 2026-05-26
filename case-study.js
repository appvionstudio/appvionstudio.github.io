(function () {
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

    function lines(value) {
        return String(value || "")
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    function getStoredContent() {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn("Could not read AppVion case study draft.", error);
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
                const app = appModule.getApps().length
                    ? appModule.getApps()[0]
                    : appModule.initializeApp(firebaseConfig);
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
            console.warn("Could not load AppVion Firebase case study content.", error);
        }

        const response = await fetch("appvion-content.json", { cache: "no-store" });
        if (!response.ok) throw new Error("Content file unavailable");
        return response.json();
    }

    function projectMatches(project, target) {
        return [project.caseStudySlug, project.id, project.title]
            .filter(Boolean)
            .map((value) => String(value).toLowerCase())
            .includes(String(target || "").toLowerCase());
    }

    function renderList(title, items) {
        if (!items.length) return "";
        return `
            <section class="study-panel">
                <p class="eyebrow">${escapeHtml(title)}</p>
                <ul class="study-list">
                    ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
            </section>
        `;
    }

    function renderProject(project) {
        const root = document.querySelector("[data-case-study-root]");
        if (!root) return;

        const screenshots = lines(project.screenshotUrls || project.thumbnailUrl).slice(0, 6);
        const features = lines(project.features);
        const techStack = lines(project.techStack);
        const pageTitle = `${project.title || "Case Study"} | AppVion Studio`;

        document.title = pageTitle;
        const description = document.querySelector('meta[name="description"]');
        if (description) description.setAttribute("content", project.description || "AppVion Studio product case study.");

        root.innerHTML = `
            <section class="section study-hero-section">
                <div class="container study-hero">
                    <div>
                        <p class="eyebrow">${escapeHtml(project.kicker || project.industry || "Case study")}</p>
                        <h1>${escapeHtml(project.title || "Product case study")}</h1>
                        <p class="lead">${escapeHtml(project.description || "A product workflow shaped by AppVion Studio.")}</p>
                        <div class="hero-proof">
                            ${project.status ? `<span>${escapeHtml(project.status)}</span>` : ""}
                            ${project.metric ? `<span>${escapeHtml(project.metric)}</span>` : ""}
                            ${project.industry ? `<span>${escapeHtml(project.industry)}</span>` : ""}
                        </div>
                    </div>
                    <div class="study-gallery ${screenshots.length ? "" : "empty"}">
                        ${screenshots.length
                            ? screenshots.map((src, index) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(project.title)} screenshot ${index + 1}" loading="lazy">`).join("")
                            : `<div><strong>Screenshot-ready</strong><span>Add real app screenshots in Admin > Projects.</span></div>`}
                    </div>
                </div>
            </section>

            <section class="section">
                <div class="container study-grid">
                    <section class="study-panel">
                        <p class="eyebrow">Problem</p>
                        <p>${escapeHtml(project.problem || "Add the real client or product problem from the admin panel.")}</p>
                    </section>
                    <section class="study-panel">
                        <p class="eyebrow">Solution</p>
                        <p>${escapeHtml(project.solution || "Add the product direction, system design, and app workflow from the admin panel.")}</p>
                    </section>
                    <section class="study-panel">
                        <p class="eyebrow">Result</p>
                        <p>${escapeHtml(project.result || "Add measurable or inspectable proof once the project has real outcomes.")}</p>
                    </section>
                    ${renderList("Key Features", features)}
                    ${renderList("Tech Stack", techStack)}
                </div>
            </section>

            <section class="section">
                <div class="container study-actions">
                    ${project.demoVideoUrl ? `<a class="button primary" href="${escapeHtml(project.demoVideoUrl)}" target="_blank" rel="noreferrer">Watch Demo</a>` : ""}
                    ${project.linkUrl ? `<a class="button secondary" href="${escapeHtml(project.linkUrl)}" target="_blank" rel="noreferrer">${escapeHtml(project.linkLabel || "Open Project")}</a>` : ""}
                    <a class="button secondary" href="index.html#contact">Discuss a Build</a>
                </div>
            </section>
        `;
    }

    function renderMissing() {
        const root = document.querySelector("[data-case-study-root]");
        if (!root) return;
        root.innerHTML = `
            <section class="section">
                <div class="container">
                    <p class="eyebrow">Case study unavailable</p>
                    <h1>This project is not ready yet.</h1>
                    <p class="lead">Enable the case study and add details from Admin > Projects, then publish live.</p>
                    <a class="button primary" href="index.html#work">Back to Work</a>
                </div>
            </section>
        `;
    }

    const params = new URLSearchParams(window.location.search);
    const target = params.get("project");

    loadContent()
        .then((content) => {
            const projects = Array.isArray(content.projects) ? content.projects : [];
            const project = projects.find((item) => projectMatches(item, target));
            if (!project) {
                renderMissing();
                return;
            }
            renderProject(project);
        })
        .catch((error) => {
            console.warn("Could not render AppVion case study.", error);
            renderMissing();
        });
})();
