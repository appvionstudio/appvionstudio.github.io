const storageKey = "appvionStudioContent.v1";
const unlockedKey = "appvionAdminUnlocked.v1";
const firebaseConfig = window.APPVION_FIREBASE_CONFIG || {};
const firebaseContentPath = window.APPVION_FIREBASE_CONTENT_PATH || ["siteContent", "home"];
const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && !String(firebaseConfig.apiKey).includes("YOUR_"));
const isLocalPreview = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const firebaseState = {
    ready: null,
    app: null,
    auth: null,
    db: null,
    modules: null
};

const schema = {
    projects: [
        ["title", "Title", "text"],
        ["kicker", "Kicker", "text"],
        ["description", "Description", "textarea"],
        ["status", "Status", "text"],
        ["metric", "Metric", "text"],
        ["theme", "Visual Theme", "select", ["campus", "data", "event"]],
        ["visualLabel", "Preview Label", "text"],
        ["visualHeadline", "Preview Headline", "text"],
        ["visualDetail", "Preview Detail", "textarea"],
        ["visualItems", "Preview Items or Steps, One Per Line", "textarea"],
        ["visualRows", "Data Table Rows, One Per Line: ID | Status | Time", "textarea"],
        ["visualBars", "Chart Bar Heights, One Number Per Line", "textarea"],
        ["linkLabel", "Link Label", "text"],
        ["linkUrl", "Link URL", "url"]
    ],
    services: [
        ["number", "Number", "text"],
        ["title", "Title", "text"],
        ["description", "Description", "textarea"]
    ],
    processSteps: [
        ["number", "Number", "text"],
        ["title", "Title", "text"],
        ["description", "Description", "textarea"]
    ],
    metrics: [
        ["value", "Value", "text"],
        ["description", "Description", "textarea"]
    ],
    choiceReasons: [
        ["title", "Title", "text"],
        ["description", "Description", "textarea"]
    ],
    engagements: [
        ["number", "Number", "text"],
        ["title", "Title", "text"],
        ["description", "Description", "textarea"],
        ["items", "Bullet Items, One Per Line", "textarea"],
        ["featured", "Featured Card", "checkbox"]
    ],
    team: [
        ["role", "Role", "text"],
        ["name", "Name", "text"],
        ["description", "Description", "textarea"],
        ["profileUrl", "Profile URL", "text"],
        ["featured", "Featured Member", "checkbox"]
    ],
    insights: [
        ["category", "Category", "text"],
        ["title", "Title", "text"],
        ["excerpt", "Excerpt", "textarea"]
    ],
    faqs: [
        ["question", "Question", "text"],
        ["answer", "Answer", "textarea"]
    ]
};

const collectionTypes = Object.keys(schema);
const requiredContentKeys = ["settings", "projects", "services", "processSteps", "metrics", "choiceReasons", "engagements", "team", "stack", "insights", "faqs"];
const sectionLabels = {
    work: "Work",
    services: "Services",
    process: "Process",
    proof: "Proof",
    choice: "Why Choose",
    confidence: "Confidence",
    engagements: "Engagements",
    stack: "Technology",
    team: "Team",
    insights: "Blogs",
    faq: "FAQ",
    contact: "Contact"
};

let content = null;
let activeView = "overview";
let selected = Object.fromEntries(collectionTypes.map((type) => [type, null]));
let projectBriefs = [];

const pageTitle = document.querySelector("[data-page-title]");
const toast = document.querySelector("[data-toast]");
const lockScreen = document.querySelector("[data-lock-screen]");
const lockForm = document.querySelector("[data-lock-form]");
const lockHelp = document.querySelector("[data-lock-help]");
const lockButton = document.querySelector("[data-lock-button]");
const emailField = document.querySelector("[data-email-field]");
const passwordField = document.querySelector("[data-password-field]");
const publishStatus = document.querySelector("[data-publish-status]");

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function slugify(value) {
    return String(value || "item")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || `item-${Date.now()}`;
}

function updateLockCopy() {
    if (lockHelp) {
        lockHelp.textContent = isFirebaseConfigured
            ? "Enter the owner Gmail and password. Access is verified by Firebase Authentication."
            : "Firebase config is not added yet. Local preview can be unlocked for testing only.";
    }
    if (lockButton) lockButton.textContent = "Unlock Admin";
    document.querySelectorAll(".local-unlock").forEach((button) => {
        button.hidden = !isLocalPreview || isFirebaseConfigured;
    });
}

function unlockAdmin() {
    sessionStorage.setItem(unlockedKey, "true");
    lockScreen.classList.add("unlocked");
}

async function lockAdmin() {
    sessionStorage.removeItem(unlockedKey);
    if (firebaseState.auth && firebaseState.auth.currentUser) {
        await firebaseState.modules.signOut(firebaseState.auth);
    }
    if (emailField) emailField.hidden = false;
    if (passwordField) passwordField.hidden = false;
    updateLockCopy();
    lockScreen.classList.remove("unlocked");
}

function initializeLock() {
    updateLockCopy();
    updatePublishStatus();
    if (!isFirebaseConfigured && sessionStorage.getItem(unlockedKey) === "true") {
        lockScreen.classList.add("unlocked");
    }
    initializeFirebaseSession();
}

async function handleLockSubmit(event) {
    event.preventDefault();
    const data = new FormData(lockForm);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");

    if (!isFirebaseConfigured) {
        showToast("Firebase config is not added yet.");
        return;
    }

    if (!email || !password) {
        showToast("Enter the owner Gmail and password.");
        return;
    }

    try {
        lockButton.disabled = true;
        const { auth, modules } = await getFirebase();
        await modules.signInWithEmailAndPassword(auth, email, password);
        unlockAdmin();
        await loadFirebaseContentIntoEditor();
        updatePublishStatus();
        showToast("Owner access unlocked.");
        lockForm.reset();
    } catch (error) {
        showToast(error.message || "Could not unlock admin.");
    } finally {
        lockButton.disabled = false;
    }
}

function localPreviewUnlock() {
    if (!isLocalPreview || isFirebaseConfigured) return;
    unlockAdmin();
    updatePublishStatus();
    showToast("Local preview unlocked. Live publishing needs Firebase config.");
}

function updatePublishStatus(message) {
    if (!publishStatus) return;
    if (message) {
        publishStatus.textContent = message;
        return;
    }
    publishStatus.textContent = isFirebaseConfigured
        ? "Ready after Firebase owner login."
        : "Add your Firebase config before live publishing.";
}

async function getFirebase() {
    if (!isFirebaseConfigured) throw new Error("Firebase config is not added yet.");
    if (firebaseState.ready) return firebaseState.ready;

    firebaseState.ready = Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
    ]).then(([appModule, authModule, firestoreModule]) => {
        firebaseState.app = appModule.initializeApp(firebaseConfig);
        firebaseState.auth = authModule.getAuth(firebaseState.app);
        firebaseState.db = firestoreModule.getFirestore(firebaseState.app);
        firebaseState.modules = {
            signInWithEmailAndPassword: authModule.signInWithEmailAndPassword,
            onAuthStateChanged: authModule.onAuthStateChanged,
            signOut: authModule.signOut,
            doc: firestoreModule.doc,
            getDoc: firestoreModule.getDoc,
            setDoc: firestoreModule.setDoc,
            serverTimestamp: firestoreModule.serverTimestamp,
            collection: firestoreModule.collection,
            query: firestoreModule.query,
            orderBy: firestoreModule.orderBy,
            limit: firestoreModule.limit,
            getDocs: firestoreModule.getDocs
        };
        return firebaseState;
    });

    return firebaseState.ready;
}

async function initializeFirebaseSession() {
    if (!isFirebaseConfigured) return;
    try {
        const { auth, modules } = await getFirebase();
        modules.onAuthStateChanged(auth, async (user) => {
            if (!user) {
                sessionStorage.removeItem(unlockedKey);
                lockScreen.classList.remove("unlocked");
                updatePublishStatus("Login with Firebase to publish live.");
                return;
            }

            unlockAdmin();
            updatePublishStatus("Firebase login active. Ready to publish.");
            await loadFirebaseContentIntoEditor();
            await loadProjectBriefs();
        });
    } catch (error) {
        showToast(error.message || "Firebase could not initialize.");
    }
}

async function readFirebaseContent() {
    if (!isFirebaseConfigured) return null;
    const { db, modules } = await getFirebase();
    const snapshot = await modules.getDoc(modules.doc(db, firebaseContentPath[0], firebaseContentPath[1]));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return data && data.content ? normalizeContent(data.content) : null;
}

async function loadFirebaseContentIntoEditor() {
    try {
        const remoteContent = await readFirebaseContent();
        if (!remoteContent) return;
        content = remoteContent;
        localStorage.setItem(storageKey, JSON.stringify(content));
        renderAll();
        showToast("Firebase content loaded.");
    } catch (error) {
        showToast(error.message || "Could not load Firebase content.");
    }
}

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function formatBriefDate(value) {
    if (!value) return "New";
    const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return "New";
    return date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function renderBriefs() {
    const target = document.querySelector("[data-briefs-list]");
    if (!target) return;

    if (!isFirebaseConfigured) {
        target.innerHTML = `<p class="editor-empty">Firebase config is required to read project briefs.</p>`;
        return;
    }

    if (!projectBriefs.length) {
        target.innerHTML = `<p class="editor-empty">No project briefs yet. New website submissions will appear here.</p>`;
        return;
    }

    target.innerHTML = projectBriefs.map((brief) => `
        <article class="item-card brief-item">
            <div>
                <span class="item-meta">${escapeHtml(formatBriefDate(brief.createdAt))}</span>
                <h3>${escapeHtml(brief.name || "Unnamed lead")}</h3>
                <p><strong>Email:</strong> <a href="mailto:${escapeHtml(brief.email || "")}">${escapeHtml(brief.email || "No email")}</a></p>
                <p><strong>Project:</strong> ${escapeHtml(brief.type || "Not selected")}</p>
                <p><strong>Timeline:</strong> ${escapeHtml(brief.timeline || "Not selected")}</p>
                <p>${escapeHtml(brief.message || "No brief text")}</p>
            </div>
        </article>
    `).join("");
}

async function loadProjectBriefs() {
    const target = document.querySelector("[data-briefs-list]");
    if (target) target.innerHTML = `<p class="editor-empty">Loading project briefs...</p>`;

    if (!isFirebaseConfigured) {
        renderBriefs();
        return;
    }

    try {
        const { auth, db, modules } = await getFirebase();
        if (!auth.currentUser) {
            if (target) target.innerHTML = `<p class="editor-empty">Login with Firebase to load project briefs.</p>`;
            return;
        }

        const briefsQuery = modules.query(
            modules.collection(db, "projectBriefs"),
            modules.orderBy("createdAt", "desc"),
            modules.limit(50)
        );
        const snapshot = await modules.getDocs(briefsQuery);
        projectBriefs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderBriefs();
    } catch (error) {
        if (target) target.innerHTML = `<p class="editor-empty">Could not load briefs. Check Firebase rules.</p>`;
        showToast(error.message || "Could not load project briefs.");
    }
}

function normalizeContent(data) {
    data.settings = data.settings || {};
    data.settings.sections = data.settings.sections || {};
    Object.keys(sectionLabels).forEach((key) => {
        if (typeof data.settings.sections[key] !== "boolean") data.settings.sections[key] = true;
    });
    data.proofLogos = Array.isArray(data.proofLogos) ? data.proofLogos : [];
    data.stack = Array.isArray(data.stack) ? data.stack : [];
    collectionTypes.forEach((type) => {
        data[type] = Array.isArray(data[type]) ? data[type] : [];
    });
    return data;
}

function saveContent(message = "Draft saved only on this device. Click Publish Live so everyone can see it.") {
    localStorage.setItem(storageKey, JSON.stringify(content));
    renderAll();
    updatePublishStatus("Unpublished local changes. Click Publish Live to update the public website.");
    showToast(message);
}

async function loadContent() {
    const stored = localStorage.getItem(storageKey);
    if (stored) return normalizeContent(JSON.parse(stored));

    const response = await fetch("appvion-content.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load appvion-content.json");
    return normalizeContent(await response.json());
}

function activateView(view) {
    activeView = view;
    document.querySelectorAll("[data-view]").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === view);
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.panel === view);
    });
    pageTitle.textContent = {
        overview: "Overview",
        projects: "Projects",
        services: "Services",
        processSteps: "Process",
        metrics: "Metrics",
        choiceReasons: "Why Choose",
        engagements: "Engagements",
        team: "Team",
        stack: "Tech Stack",
        insights: "Blogs",
        faqs: "FAQ",
        briefs: "Briefs",
        settings: "Settings",
        publish: "Publish"
    }[view] || "Admin";
    renderAll();
}

function overviewCard(label, count, detail) {
    return `
        <article class="admin-card stat-card">
            <p class="eyebrow">${escapeHtml(label)}</p>
            <strong>${escapeHtml(count)}</strong>
            <span>${escapeHtml(detail)}</span>
        </article>
    `;
}

function renderOverview() {
    const target = document.querySelector("[data-overview]");
    if (!target) return;
    const enabledSections = Object.values(content.settings.sections || {}).filter(Boolean).length;
    target.innerHTML = [
        overviewCard("Projects", content.projects.length, "Portfolio cards on homepage"),
        overviewCard("Services", content.services.length, "Offerings clients can scan"),
        overviewCard("Editable Areas", collectionTypes.length + 2, "Collections, settings, and section visibility"),
        overviewCard("Visible Sections", enabledSections, "Homepage sections currently enabled")
    ].join("");
}

function itemTitle(type, item) {
    if (type === "faqs") return item.question;
    if (type === "metrics") return item.value;
    if (type === "team") return item.name;
    return item.title;
}

function itemMeta(type, item) {
    if (type === "projects") return item.kicker || item.theme;
    if (type === "services" || type === "processSteps" || type === "engagements") return item.number || type;
    if (type === "insights") return item.category || "Blog";
    if (type === "team") return item.role || "Team";
    return type === "faqs" ? "FAQ" : "Metric";
}

function itemBody(type, item) {
    if (type === "faqs") return item.answer;
    if (type === "insights") return item.excerpt;
    return item.description;
}

function renderCollection(type) {
    const target = document.querySelector(`[data-list="${type}"]`);
    if (!target) return;

    target.innerHTML = content[type].map((item) => `
        <article class="item-card">
            <div>
                <span class="item-meta">${escapeHtml(itemMeta(type, item))}</span>
                <h3>${escapeHtml(itemTitle(type, item))}</h3>
                <p>${escapeHtml(itemBody(type, item))}</p>
            </div>
            <div class="item-actions">
                <button class="button ghost" type="button" data-edit="${type}" data-id="${escapeHtml(item.id)}">Edit</button>
                <button class="button danger" type="button" data-delete="${type}" data-id="${escapeHtml(item.id)}">Delete</button>
            </div>
        </article>
    `).join("");

    renderEditor(type);
}

function blankItem(type) {
    const base = { id: `${type}-${Date.now()}` };
    schema[type].forEach(([key, label, fieldType, options]) => {
        if (fieldType === "checkbox") base[key] = false;
        else if (key === "theme") base[key] = options[0];
        else if (key === "number") base[key] = String(content[type].length + 1).padStart(2, "0");
        else if (key === "linkLabel") base[key] = "View project";
        else if (key === "items") base[key] = "First point\nSecond point\nThird point";
        else if (key === "visualLabel") base[key] = "Product update";
        else if (key === "visualHeadline") base[key] = "New product preview";
        else if (key === "visualDetail") base[key] = "Short visual detail shown inside the project card.";
        else if (key === "visualItems") base[key] = "Users\nAdmin\nOps";
        else if (key === "visualRows") base[key] = "ID-01 | Active | 09:00\nID-02 | Review | 09:15";
        else if (key === "visualBars") base[key] = "54\n78\n42\n88\n66";
        else base[key] = "";
    });
    return base;
}

function isRequiredField(key, fieldType) {
    const optionalProjectFields = ["visualLabel", "visualHeadline", "visualDetail", "visualItems", "visualRows", "visualBars", "linkUrl"];
    return fieldType !== "url" && !optionalProjectFields.includes(key);
}

function renderField(item, [key, label, fieldType, options]) {
    const value = item[key] ?? "";
    const required = isRequiredField(key, fieldType) ? "required" : "";
    if (fieldType === "textarea") {
        return `
            <label>
                <span>${escapeHtml(label)}</span>
                <textarea name="${escapeHtml(key)}" ${required}>${escapeHtml(value)}</textarea>
            </label>
        `;
    }
    if (fieldType === "select") {
        return `
            <label>
                <span>${escapeHtml(label)}</span>
                <select name="${escapeHtml(key)}">
                    ${options.map((option) => `<option value="${escapeHtml(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
                </select>
            </label>
        `;
    }
    if (fieldType === "checkbox") {
        return `
            <label class="section-toggle">
                <span>${escapeHtml(label)}</span>
                <input name="${escapeHtml(key)}" type="checkbox" ${value ? "checked" : ""}>
            </label>
        `;
    }
    return `
        <label>
            <span>${escapeHtml(label)}</span>
            <input name="${escapeHtml(key)}" type="${fieldType}" value="${escapeHtml(value)}" ${required}>
        </label>
    `;
}

function renderEditor(type) {
    const form = document.querySelector(`[data-editor="${type}"]`);
    if (!form) return;
    const item = content[type].find((entry) => entry.id === selected[type]);
    if (!item) {
        form.innerHTML = `<p class="editor-empty">Select an item to edit, or create a new one from the button above.</p>`;
        return;
    }
    form.innerHTML = `
        <div>
            <p class="eyebrow">Editor</p>
            <h2>${escapeHtml(itemTitle(type, item) || "New item")}</h2>
        </div>
        <div class="field-grid">
            ${schema[type].map((field) => renderField(item, field)).join("")}
        </div>
        <div class="button-row">
            <button class="button primary" type="submit">Save Changes</button>
            <button class="button ghost" type="button" data-cancel="${type}">Close</button>
        </div>
    `;
}

function renderSectionControls() {
    return `
        <div>
            <p class="eyebrow">Section visibility</p>
            <h2>Show or hide homepage sections</h2>
        </div>
        <div class="section-control-grid">
            ${Object.entries(sectionLabels).map(([key, label]) => `
                <label class="section-toggle">
                    <span>${escapeHtml(label)}</span>
                    <input name="section:${escapeHtml(key)}" type="checkbox" ${content.settings.sections[key] ? "checked" : ""}>
                </label>
            `).join("")}
        </div>
    `;
}

function renderSettings() {
    const form = document.querySelector("[data-settings-form]");
    if (!form) return;
    const settings = content.settings;
    form.innerHTML = `
        <div>
            <p class="eyebrow">Global website settings</p>
            <h2>Hero, SEO, CTA, contact, and visibility</h2>
        </div>
        <div class="field-grid two">
            <label><span>Studio Name</span><input name="studioName" value="${escapeHtml(settings.studioName)}" required></label>
            <label><span>Hero Eyebrow</span><input name="heroEyebrow" value="${escapeHtml(settings.heroEyebrow)}" required></label>
        </div>
        <label><span>Hero Title</span><input name="heroTitle" value="${escapeHtml(settings.heroTitle)}" required></label>
        <label><span>Hero Lead</span><textarea name="heroLead" required>${escapeHtml(settings.heroLead)}</textarea></label>
        <label><span>SEO Title</span><input name="metaTitle" value="${escapeHtml(settings.metaTitle)}" required></label>
        <label><span>SEO Description</span><textarea name="metaDescription" required>${escapeHtml(settings.metaDescription)}</textarea></label>
        <label><span>Proof Strip Text</span><textarea name="proofText" required>${escapeHtml(settings.proofText)}</textarea></label>
        <label><span>Proof Logos, One Per Line</span><textarea name="proofLogos">${escapeHtml(content.proofLogos.join("\n"))}</textarea></label>
        <div class="field-grid two">
            <label><span>CTA Eyebrow</span><input name="ctaEyebrow" value="${escapeHtml(settings.ctaEyebrow)}" required></label>
            <label><span>CTA Title</span><input name="ctaTitle" value="${escapeHtml(settings.ctaTitle)}" required></label>
        </div>
        <label><span>CTA Body</span><textarea name="ctaBody" required>${escapeHtml(settings.ctaBody)}</textarea></label>
        <label><span>Footer Tagline</span><textarea name="footerTagline" required>${escapeHtml(settings.footerTagline)}</textarea></label>
        <div class="field-grid two">
            <label><span>Email</span><input name="email" type="email" value="${escapeHtml(settings.email)}" required></label>
            <label><span>WhatsApp Label</span><input name="whatsapp" value="${escapeHtml(settings.whatsapp)}" required></label>
        </div>
        <label><span>WhatsApp URL</span><input name="whatsappUrl" type="url" value="${escapeHtml(settings.whatsappUrl)}" required></label>
        <label><span>LinkedIn URL</span><input name="linkedinUrl" type="url" value="${escapeHtml(settings.linkedinUrl)}" required></label>
        <label><span>Instagram URL</span><input name="instagramUrl" type="url" value="${escapeHtml(settings.instagramUrl)}" required></label>
        ${renderSectionControls()}
        <div class="button-row">
            <button class="button primary" type="submit">Save Settings</button>
        </div>
    `;
}

function renderStack() {
    const form = document.querySelector("[data-stack-form]");
    if (!form) return;
    form.innerHTML = `
        <div>
            <p class="eyebrow">Technology cloud</p>
            <h2>Tech stack tags</h2>
            <p class="muted">Write one technology per line. These render in the homepage Technology section.</p>
        </div>
        <label>
            <span>Stack Tags</span>
            <textarea name="stack" required>${escapeHtml(content.stack.join("\n"))}</textarea>
        </label>
        <div class="button-row">
            <button class="button primary" type="submit">Save Stack</button>
        </div>
    `;
}

function renderPublish() {
    const output = document.querySelector("[data-json-output]");
    if (output) output.value = JSON.stringify(content, null, 2);
}

function renderAll() {
    if (!content) return;
    renderOverview();
    collectionTypes.forEach(renderCollection);
    renderSettings();
    renderStack();
    renderPublish();
    renderBriefs();
}

function addItem(type) {
    const item = blankItem(type);
    content[type].push(item);
    selected[type] = item.id;
    saveContent("New item created as a local draft. Add details, save, then Publish Live.");
}

function deleteItem(type, id) {
    const item = content[type].find((entry) => entry.id === id);
    if (!item) return;
    const confirmed = window.confirm(`Delete "${itemTitle(type, item)}"?`);
    if (!confirmed) return;
    content[type] = content[type].filter((entry) => entry.id !== id);
    if (selected[type] === id) selected[type] = null;
    saveContent("Item deleted only from this local draft. Publish Live to remove it from the public website.");
}

function saveEditor(type, form) {
    const item = content[type].find((entry) => entry.id === selected[type]);
    if (!item) return;
    const data = new FormData(form);
    schema[type].forEach(([key, label, fieldType]) => {
        item[key] = fieldType === "checkbox" ? data.has(key) : String(data.get(key) || "").trim();
    });
    item.id = item.id || slugify(itemTitle(type, item));
    saveContent("Changes saved as a local draft. Click Publish Live so other devices can see them.");
}

function saveSettings(form) {
    const data = new FormData(form);
    Object.keys(content.settings).forEach((key) => {
        if (key !== "sections" && data.has(key)) content.settings[key] = String(data.get(key) || "").trim();
    });
    Object.keys(sectionLabels).forEach((key) => {
        content.settings.sections[key] = data.has(`section:${key}`);
    });
    content.proofLogos = String(data.get("proofLogos") || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
    saveContent("Settings saved as a local draft. Click Publish Live so other devices can see them.");
}

function saveStack(form) {
    const data = new FormData(form);
    content.stack = String(data.get("stack") || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
    saveContent("Tech stack saved as a local draft. Click Publish Live so other devices can see it.");
}

function exportContent() {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "appvion-content.json";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Content JSON downloaded.");
}

async function copyContent() {
    const json = JSON.stringify(content, null, 2);
    await navigator.clipboard.writeText(json);
    showToast("Content JSON copied.");
}

async function publishLive() {
    if (!isFirebaseConfigured) {
        showToast("Add your Firebase config before live publishing.");
        updatePublishStatus("Firebase config is not added yet.");
        return;
    }

    const { auth, db, modules } = await getFirebase();
    if (!auth.currentUser) {
        lockAdmin();
        showToast("Login with Firebase before publishing live.");
        return;
    }

    const button = document.querySelector('[data-action="publish-live"]');
    try {
        if (button) button.disabled = true;
        updatePublishStatus("Publishing to Firebase...");
        await modules.setDoc(modules.doc(db, firebaseContentPath[0], firebaseContentPath[1]), {
            content,
            updatedAt: modules.serverTimestamp(),
            updatedBy: auth.currentUser.email || "owner"
        }, { merge: true });
        updatePublishStatus("Published to Firebase. Refresh the public site to see it.");
        showToast("Live content published to Firebase.");
    } catch (error) {
        updatePublishStatus("Publish failed. Check Firebase setup and rules.");
        showToast(error.message || "Publish failed.");
    } finally {
        if (button) button.disabled = false;
    }
}

function importContent() {
    const input = document.querySelector("[data-json-import]");
    if (!input || !input.value.trim()) {
        showToast("Paste JSON first.");
        return;
    }
    try {
        const parsed = JSON.parse(input.value);
        requiredContentKeys.forEach((key) => {
            if (!parsed[key]) throw new Error(`Missing ${key}`);
        });
        content = normalizeContent(parsed);
        saveContent("Imported content saved as a local draft. Click Publish Live so other devices can see it.");
    } catch (error) {
        showToast(`Import failed: ${error.message}`);
    }
}

function resetLocalContent() {
    const confirmed = window.confirm("Reset all local dashboard changes and reload the original content file?");
    if (!confirmed) return;
    localStorage.removeItem(storageKey);
    window.location.reload();
}

document.addEventListener("click", (event) => {
    const target = event.target.closest("button, a");
    if (!target) return;
    if (target.dataset.view) activateView(target.dataset.view);
    if (target.dataset.add) addItem(target.dataset.add);
    if (target.dataset.edit) {
        selected[target.dataset.edit] = target.dataset.id;
        renderEditor(target.dataset.edit);
    }
    if (target.dataset.delete) deleteItem(target.dataset.delete, target.dataset.id);
    if (target.dataset.cancel) {
        selected[target.dataset.cancel] = null;
        renderEditor(target.dataset.cancel);
    }
    if (target.dataset.action === "export") exportContent();
    if (target.dataset.action === "copy") copyContent();
    if (target.dataset.action === "publish-live") publishLive();
    if (target.dataset.action === "refresh-briefs") loadProjectBriefs();
    if (target.dataset.action === "import") importContent();
    if (target.dataset.action === "reset") resetLocalContent();
    if (target.dataset.action === "logout") lockAdmin();
    if (target.dataset.action === "local-unlock") localPreviewUnlock();
});

document.addEventListener("submit", (event) => {
    const form = event.target;
    event.preventDefault();
    const editorType = form.dataset.editor;
    if (editorType) saveEditor(editorType, form);
    if (form.matches("[data-settings-form]")) saveSettings(form);
    if (form.matches("[data-stack-form]")) saveStack(form);
});

if (lockForm) lockForm.addEventListener("submit", handleLockSubmit);

initializeLock();
loadContent()
    .then((loaded) => {
        content = loaded;
        renderAll();
    })
    .catch((error) => {
        showToast(error.message);
    });
