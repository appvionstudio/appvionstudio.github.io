const storageKey = "appvionStudioContent.v1";
const unlockedKey = "appvionAdminUnlocked.v1";
const idleKey = "appvionAdminIdleMinutes.v1";
const checklistKey = "appvionOwnerChecklist.v1";
const canonicalContact = {
    email: "ayyaz@appvionstudio.com",
    whatsapp: "+92 346 7277143",
    whatsappUrl: "https://wa.me/923467277143"
};
const firebaseConfig = window.APPVION_FIREBASE_CONFIG || {};
const firebaseContentPath = window.APPVION_FIREBASE_CONTENT_PATH || ["siteContent", "home"];
const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && !String(firebaseConfig.apiKey).includes("YOUR_"));
const isLocalPreview = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
// Sample leads for testing the panel on localhost without Firebase. Never used on the live site.
const mockData = !isFirebaseConfigured && isLocalPreview ? window.APPVION_ADMIN_MOCK || null : null;
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
        ["thumbnailUrl", "Project Thumbnail Image URL", "url"],
        ["screenshotUrls", "Screenshot Image URLs, One Per Line", "textarea"],
        ["demoVideoUrl", "Demo Video URL", "url"],
        ["caseStudyEnabled", "Enable Case Study Page", "checkbox"],
        ["caseStudySlug", "Case Study Slug", "text"],
        ["industry", "Industry or Client Type", "text"],
        ["problem", "Case Study Problem", "textarea"],
        ["solution", "Case Study Solution", "textarea"],
        ["result", "Case Study Result", "textarea"],
        ["features", "Key Features, One Per Line", "textarea"],
        ["techStack", "Project Tech Stack, One Per Line", "textarea"],
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
        ["photoUrl", "Profile Photo URL", "url"],
        ["photoPositionX", "Photo Focus X (%)", "number"],
        ["photoPositionY", "Photo Focus Y (%)", "number"],
        ["displayOrder", "Display Order", "number"],
        ["role", "Role", "text"],
        ["name", "Name", "text"],
        ["description", "Description", "textarea"],
        ["profileUrl", "Profile URL", "text"],
        ["featured", "Featured Member", "checkbox"]
    ],
    demoLibrary: [
        ["title", "Demo Title", "text"],
        ["category", "Category", "text"],
        ["description", "Description", "textarea"],
        ["thumbnailUrl", "Thumbnail Image URL", "url"],
        ["demoUrl", "Demo URL", "url"],
        ["proofPoints", "Proof Points, One Per Line", "textarea"],
        ["featured", "Featured Demo", "checkbox"]
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
const requiredContentKeys = ["settings", "projects", "services", "processSteps", "metrics", "choiceReasons", "engagements", "team", "stack", "demoLibrary", "insights", "faqs"];
const sectionLabels = {
    work: "Work",
    services: "Services",
    process: "Process",
    proof: "Proof",
    choice: "Why Choose",
    confidence: "Confidence",
    engagements: "Engagements",
    stack: "Technology",
    demos: "Demos",
    team: "Team",
    insights: "Blogs",
    faq: "FAQ",
    contact: "Contact"
};

// Everything except the Demo library stopped reaching the website in October 2026,
// when the page text moved into the HTML so search engines can read it.
const archiveViews = new Set(["projects", "services", "processSteps", "metrics", "choiceReasons", "engagements", "team", "stack", "insights", "faqs", "settings", "mediaGuide"]);

const viewTitles = {
    overview: "Dashboard",
    briefs: "Leads",
    activity: "Contact activity",
    demoLibrary: "Demo library",
    health: "Site health",
    checks: "Data checks",
    publish: "Publish & backup",
    account: "Account & security",
    projects: "Projects (archive)",
    services: "Services (archive)",
    processSteps: "Process (archive)",
    metrics: "Metrics (archive)",
    choiceReasons: "Why Choose (archive)",
    engagements: "Engagements (archive)",
    team: "Team (archive)",
    stack: "Tech Stack (archive)",
    insights: "Blogs (archive)",
    faqs: "FAQ (archive)",
    settings: "Settings (archive)",
    mediaGuide: "Media Guide (archive)"
};

const leadStages = [
    ["new", "New"],
    ["contacted", "Contacted"],
    ["proposal", "Proposal sent"],
    ["won", "Won"],
    ["lost", "Lost"],
    ["spam", "Spam"]
];
const closedStages = new Set(["won", "lost", "spam"]);

const routeLabels = {
    "strategy-call": "Book a call",
    whatsapp: "WhatsApp",
    email: "Email",
    "calendly-scheduled": "Call booked"
};

const ownerChecklist = [
    ["gsc-sitemap", "Search Console: resubmit the sitemap and request indexing for new pages"],
    ["gsc-review", "Search Console: review indexed pages (3 to 17 November 2026)"],
    ["ga4-key-events", "Google Analytics: mark contact_click and generate_lead as key events"],
    ["bing", "Bing Webmaster Tools: import the site from Search Console"],
    ["gbp", "Google Business Profile: create and verify the Multan listing"],
    ["firebase-hosting", "Firebase Hosting: deploy the redirect so the old July copy disappears"],
    ["data-checks", "Data checks: fix the old names here, then Publish Live"],
    ["password", "Change the admin password if it was ever shared"]
];

const toolLinks = [
    ["Search Console", "https://search.google.com/search-console?resource_id=sc-domain%3Aappvionstudio.com", "Indexing, queries, sitemap"],
    ["Google Analytics", "https://analytics.google.com/", "Visitors, key events"],
    ["Microsoft Clarity", "https://clarity.microsoft.com/", "Session recordings, heatmaps"],
    ["PageSpeed Insights", "https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fappvionstudio.com%2F", "Mobile speed of the homepage"],
    ["Rich Results Test", "https://search.google.com/test/rich-results?url=https%3A%2F%2Fappvionstudio.com%2F", "Structured data check"],
    ["Bing Webmaster Tools", "https://www.bing.com/webmasters", "Bing and Copilot indexing"],
    ["GitHub checks", "https://github.com/appvionstudio/appvionstudio.github.io/actions", "Automatic SEO checks on every update"],
    ["Calendly", "https://calendly.com/app/scheduled_events/user/me", "Booked calls"],
    ["Firebase console", "https://console.firebase.google.com/project/appvion-studio/firestore", "Leads database"]
];

// Spellings agreed in October 2026. Left side is what gets replaced.
const legacyNames = [
    ["GMass Pulse", "GMassPulse"],
    ["Snow Grid", "SnowGrid"],
    ["ProFix", "PropFix"],
    ["Founder | Android App Developer", "Founder & CEO"],
    ["Founder and Android App Developer", "Founder & CEO"]
];

const fieldHelp = {
    photoUrl: "Paste a direct portrait image URL. Best shape: square or 4:5, clear face, professional background.",
    photoPositionX: "Adjust only if the face sits left or right in the frame. 50 is centered.",
    photoPositionY: "Adjust the vertical focus. Use 22-34 for most portraits so the top of the head stays visible.",
    displayOrder: "Position on the team grid. 1 shows first. Two cards fit per row, so 1 and 2 share the top row, 3 and 4 the next. Leave blank to fall to the end.",
    thumbnailUrl: "Paste one strong image URL. For a YouTube demo you can leave this empty: the video thumbnail is used automatically.",
    screenshotUrls: "Paste one screenshot URL per line. Case studies can show up to 6 screenshots.",
    demoVideoUrl: "Paste a YouTube, Shorts, Drive, Loom, or hosted video URL for the case study demo button.",
    linkUrl: "Paste the main project, demo, GitHub, or video link visitors should open.",
    demoUrl: "Paste the YouTube video, Shorts, Loom or hosted demo URL. Data checks warn you if a YouTube video is removed or private.",
    proofPoints: "Write one proof point per line, such as Real workflow, Admin panel, Firebase backend. The first three show on the card.",
    caseStudyEnabled: "Archived: case study pages now live in the website code under /work/.",
    caseStudySlug: "Short URL name for the case study link. Example: profix-field-service.",
    features: "Write one feature per line.",
    techStack: "Write one technology per line."
};

let content = null;
let remoteSnapshot = null;
let remoteMeta = null;
let activeView = "overview";
let selected = Object.fromEntries(collectionTypes.map((type) => [type, null]));
let projectBriefs = [];
let contactEvents = [];
let inboxLoaded = false;
let leadFilter = "open";
let leadSearch = "";
let activityRange = 30;
let activityRoute = "all";
let checkIssues = [];
let videoProbe = {};
let healthLoaded = false;
let lastActivity = Date.now();

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

/* ---------- sign in, session, auto-lock ---------- */

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
    document.querySelectorAll('[data-action="forgot-password"]').forEach((button) => {
        button.hidden = !isFirebaseConfigured;
    });
}

function unlockAdmin() {
    sessionStorage.setItem(unlockedKey, "true");
    lockScreen.classList.add("unlocked");
    lastActivity = Date.now();
}

async function lockAdmin(message) {
    sessionStorage.removeItem(unlockedKey);
    if (firebaseState.auth && firebaseState.auth.currentUser) {
        await firebaseState.modules.signOut(firebaseState.auth);
    }
    projectBriefs = [];
    contactEvents = [];
    inboxLoaded = false;
    if (emailField) emailField.hidden = false;
    if (passwordField) passwordField.hidden = false;
    updateLockCopy();
    lockScreen.classList.remove("unlocked");
    renderAll();
    if (message) showToast(message);
}

function initializeLock() {
    updateLockCopy();
    updatePublishStatus();
    if (!isFirebaseConfigured && sessionStorage.getItem(unlockedKey) === "true") {
        lockScreen.classList.add("unlocked");
        if (mockData) loadInbox();
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
    loadInbox();
    showToast(mockData ? "Local preview unlocked with sample leads." : "Local preview unlocked. Live publishing needs Firebase config.");
}

async function sendResetLink(email) {
    if (!isFirebaseConfigured) {
        showToast("Password reset needs Firebase.");
        return;
    }
    if (!email) {
        showToast("Type your owner Gmail in the email box first.");
        return;
    }
    try {
        const { auth, modules } = await getFirebase();
        await modules.sendPasswordResetEmail(auth, email);
        showToast(`Reset link sent to ${email}. Check the inbox and spam folder.`);
    } catch (error) {
        showToast(error.message || "Could not send the reset link.");
    }
}

function idleMinutes() {
    const raw = localStorage.getItem(idleKey);
    const stored = Number(raw);
    return raw !== null && Number.isFinite(stored) && stored >= 0 ? stored : 30;
}

function watchIdle() {
    ["click", "keydown", "scroll", "touchstart"].forEach((type) => {
        document.addEventListener(type, () => { lastActivity = Date.now(); }, { passive: true });
    });
    window.setInterval(() => {
        const limit = idleMinutes();
        if (!limit || !lockScreen.classList.contains("unlocked")) return;
        if (Date.now() - lastActivity > limit * 60 * 1000) {
            lockAdmin(`Locked after ${limit} minutes without activity.`);
        }
    }, 30 * 1000);
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
            sendPasswordResetEmail: authModule.sendPasswordResetEmail,
            onAuthStateChanged: authModule.onAuthStateChanged,
            signOut: authModule.signOut,
            doc: firestoreModule.doc,
            getDoc: firestoreModule.getDoc,
            setDoc: firestoreModule.setDoc,
            updateDoc: firestoreModule.updateDoc,
            deleteDoc: firestoreModule.deleteDoc,
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
                renderSignedIn();
                return;
            }

            unlockAdmin();
            renderSignedIn();
            updatePublishStatus("Firebase login active. Ready to publish.");
            await loadFirebaseContentIntoEditor();
            await loadInbox();
        });
    } catch (error) {
        showToast(error.message || "Firebase could not initialize.");
    }
}

function currentUser() {
    return firebaseState.auth && firebaseState.auth.currentUser;
}

function renderSignedIn() {
    const label = document.querySelector("[data-signed-in]");
    const user = currentUser();
    if (label) label.textContent = user ? `Signed in as ${user.email}` : (mockData ? "Local preview with sample data" : "Admin panel");
    renderAccount();
}

/* ---------- content (Firebase document siteContent/home) ---------- */

async function readFirebaseContent() {
    if (!isFirebaseConfigured) return null;
    const { db, modules } = await getFirebase();
    const snapshot = await modules.getDoc(modules.doc(db, firebaseContentPath[0], firebaseContentPath[1]));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    remoteMeta = { updatedAt: data.updatedAt || null, updatedBy: data.updatedBy || "" };
    return data && data.content ? normalizeContent(data.content) : null;
}

async function loadFirebaseContentIntoEditor() {
    try {
        const remoteContent = await readFirebaseContent();
        if (!remoteContent) return;
        remoteSnapshot = stableStringify(remoteContent);
        const stored = localStorage.getItem(storageKey);
        // Keep an unpublished local draft if there is one; the badge in the top bar says so.
        content = stored ? normalizeContent(JSON.parse(stored)) : remoteContent;
        if (!stored) localStorage.setItem(storageKey, JSON.stringify(content));
        renderAll();
        showToast(isDirty() ? "Firebase loaded. You have unpublished local changes." : "Firebase content loaded.");
    } catch (error) {
        showToast(error.message || "Could not load Firebase content.");
    }
}

async function reloadFromFirebase() {
    if (!window.confirm("Throw away the local draft in this browser and reload the published content from Firebase?")) return;
    localStorage.removeItem(storageKey);
    if (isFirebaseConfigured && currentUser()) {
        await loadFirebaseContentIntoEditor();
    } else {
        content = await loadContent();
        renderAll();
    }
    showToast("Local draft discarded.");
}

// Firestore returns map keys in its own order, so compare with sorted keys.
function stableStringify(value) {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    if (value && typeof value === "object") {
        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
}

function isDirty() {
    return Boolean(content && remoteSnapshot && stableStringify(content) !== remoteSnapshot);
}

function renderDirty() {
    const badge = document.querySelector("[data-dirty-badge]");
    if (badge) badge.hidden = !isDirty();
}

function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ---------- dates ---------- */

function toDate(value) {
    if (!value) return null;
    const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, withTime = true) {
    const date = toDate(value);
    if (!date) return "Just now";
    return date.toLocaleString([], withTime
        ? { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
        : { year: "numeric", month: "short", day: "numeric" });
}

function daysAgo(value) {
    const date = toDate(value);
    return date ? (Date.now() - date.getTime()) / 86400000 : Infinity;
}

function todayIso() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/* ---------- leads and contact activity ---------- */

async function loadInbox() {
    const target = document.querySelector("[data-briefs-list]");
    if (target) target.innerHTML = `<p class="editor-empty">Loading leads...</p>`;

    if (mockData) {
        projectBriefs = (mockData.briefs || []).map((item) => ({ ...item }));
        contactEvents = (mockData.events || []).map((item) => ({ ...item }));
        inboxLoaded = true;
        renderAll();
        return;
    }

    if (!isFirebaseConfigured) {
        renderAll();
        return;
    }

    try {
        const { auth, db, modules } = await getFirebase();
        if (!auth.currentUser) {
            if (target) target.innerHTML = `<p class="editor-empty">Sign in to load leads.</p>`;
            return;
        }

        const [briefsSnapshot, eventsSnapshot] = await Promise.all([
            modules.getDocs(modules.query(modules.collection(db, "projectBriefs"), modules.orderBy("createdAt", "desc"), modules.limit(200))),
            modules.getDocs(modules.query(modules.collection(db, "contactEvents"), modules.orderBy("createdAt", "desc"), modules.limit(500)))
        ]);
        projectBriefs = briefsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        contactEvents = eventsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        inboxLoaded = true;
        renderAll();
    } catch (error) {
        if (target) target.innerHTML = `<p class="editor-empty">Could not load leads. Check Firebase rules.</p>`;
        showToast(error.message || "Could not load leads.");
    }
}

function leadStage(lead) {
    return leadStages.some(([key]) => key === lead.status) ? lead.status : "new";
}

function filteredLeads() {
    const term = leadSearch.trim().toLowerCase();
    return projectBriefs.filter((lead) => {
        const stage = leadStage(lead);
        if (leadFilter === "open" && closedStages.has(stage)) return false;
        if (leadFilter !== "open" && leadFilter !== "all" && stage !== leadFilter) return false;
        if (!term) return true;
        return [lead.name, lead.email, lead.type, lead.message, lead.notes].some((value) => String(value || "").toLowerCase().includes(term));
    });
}

function replyHref(lead) {
    const subject = encodeURIComponent("Re: your project brief - AppVion Studio");
    const body = encodeURIComponent(`Hi ${String(lead.name || "").split(" ")[0] || "there"},\n\nThank you for your brief about ${lead.type || "your project"}.\n\n`);
    return `mailto:${encodeURIComponent(lead.email || "")}?subject=${subject}&body=${body}`;
}

function renderLeadFilters() {
    const target = document.querySelector("[data-lead-filters]");
    if (!target) return;
    const counts = Object.fromEntries(leadStages.map(([key]) => [key, 0]));
    projectBriefs.forEach((lead) => { counts[leadStage(lead)] += 1; });
    const open = projectBriefs.filter((lead) => !closedStages.has(leadStage(lead))).length;
    const chips = [["open", "Open", open], ["all", "All", projectBriefs.length], ...leadStages.map(([key, label]) => [key, label, counts[key]])];
    target.innerHTML = chips.map(([key, label, count]) => `
        <button class="chip ${leadFilter === key ? "active" : ""}" type="button" data-lead-filter="${key}">${escapeHtml(label)} <b>${count}</b></button>
    `).join("");
}

function renderLeads() {
    renderLeadFilters();
    const target = document.querySelector("[data-briefs-list]");
    if (!target) return;

    if (!inboxLoaded) {
        target.innerHTML = `<p class="editor-empty">${isFirebaseConfigured || mockData ? "Sign in to load leads." : "Firebase config is required to read leads."}</p>`;
        return;
    }

    const leads = filteredLeads();
    if (!leads.length) {
        target.innerHTML = `<p class="editor-empty">${projectBriefs.length ? "No leads match this filter." : "No project briefs yet. Form submissions from the website appear here."}</p>`;
        return;
    }

    target.innerHTML = leads.map((lead) => {
        const stage = leadStage(lead);
        const overdue = lead.followUpAt && lead.followUpAt <= todayIso() && !closedStages.has(stage);
        return `
            <article class="item-card brief-item lead-card stage-${stage}">
                <div class="lead-head">
                    <span class="item-meta">${escapeHtml(formatDate(lead.createdAt))} &middot; ${escapeHtml(lead.type || "Project type not given")} &middot; ${escapeHtml(lead.timeline || "No timeline")}</span>
                    <span class="stage-pill stage-${stage}">${escapeHtml(leadStages.find(([key]) => key === stage)[1])}</span>
                </div>
                <h3>${escapeHtml(lead.name || "Unnamed lead")}</h3>
                <p><a href="${replyHref(lead)}">${escapeHtml(lead.email || "No email")}</a>${overdue ? ` <span class="overdue">Follow-up due ${escapeHtml(lead.followUpAt)}</span>` : ""}</p>
                <p class="lead-message">${escapeHtml(lead.message || "No brief text")}</p>
                <form class="lead-form" data-lead-form="${escapeHtml(lead.id)}">
                    <label>
                        <span>Stage</span>
                        <select name="status">
                            ${leadStages.map(([key, label]) => `<option value="${key}" ${key === stage ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
                        </select>
                    </label>
                    <label>
                        <span>Follow up on</span>
                        <input type="date" name="followUpAt" value="${escapeHtml(lead.followUpAt || "")}">
                    </label>
                    <label class="wide">
                        <span>Private notes</span>
                        <textarea name="notes" placeholder="Call summary, budget, next step...">${escapeHtml(lead.notes || "")}</textarea>
                    </label>
                    <div class="button-row wide">
                        <button class="button primary" type="submit">Save lead</button>
                        <a class="button ghost" href="${replyHref(lead)}">Reply by email</a>
                        <button class="button danger" type="button" data-delete-lead="${escapeHtml(lead.id)}">Delete</button>
                    </div>
                </form>
            </article>
        `;
    }).join("");
}

async function saveLead(id, form) {
    const data = new FormData(form);
    const changes = {
        status: String(data.get("status") || "new"),
        followUpAt: String(data.get("followUpAt") || ""),
        notes: String(data.get("notes") || "").trim().slice(0, 4000)
    };
    const lead = projectBriefs.find((item) => item.id === id);
    if (!lead) return;
    try {
        if (!mockData) {
            const { db, modules } = await getFirebase();
            await modules.updateDoc(modules.doc(db, "projectBriefs", id), { ...changes, updatedAt: modules.serverTimestamp() });
        }
        Object.assign(lead, changes);
        renderAll();
        showToast("Lead saved.");
    } catch (error) {
        showToast(error.message || "Could not save the lead.");
    }
}

async function deleteLead(id) {
    const lead = projectBriefs.find((item) => item.id === id);
    if (!lead) return;
    if (!window.confirm(`Delete the lead from ${lead.name || lead.email || "this visitor"} permanently? This cannot be undone.`)) return;
    try {
        if (!mockData) {
            const { db, modules } = await getFirebase();
            await modules.deleteDoc(modules.doc(db, "projectBriefs", id));
        }
        projectBriefs = projectBriefs.filter((item) => item.id !== id);
        renderAll();
        showToast("Lead deleted.");
    } catch (error) {
        showToast(error.message || "Could not delete the lead.");
    }
}

function eventsInRange(range) {
    return contactEvents.filter((event) => !range || daysAgo(event.createdAt) <= range);
}

function renderActivity() {
    const rangeTarget = document.querySelector("[data-activity-range]");
    const routeTarget = document.querySelector("[data-activity-route]");
    const summary = document.querySelector("[data-activity-summary]");
    const table = document.querySelector("[data-activity-table]");
    if (!table) return;

    if (rangeTarget) {
        rangeTarget.innerHTML = [[7, "7 days"], [30, "30 days"], [90, "90 days"], [0, "All"]].map(([days, label]) => `
            <button class="chip ${activityRange === days ? "active" : ""}" type="button" data-activity-days="${days}">${label}</button>
        `).join("");
    }

    if (!inboxLoaded) {
        table.innerHTML = `<p class="editor-empty">Sign in to load contact activity.</p>`;
        if (summary) summary.innerHTML = "";
        return;
    }

    const inRange = eventsInRange(activityRange);
    const routes = [...new Set(contactEvents.map((event) => event.route || "contact"))];
    if (routeTarget) {
        routeTarget.innerHTML = [["all", "All routes"], ...routes.map((route) => [route, routeLabels[route] || route])].map(([key, label]) => `
            <button class="chip ${activityRoute === key ? "active" : ""}" type="button" data-activity-filter="${escapeHtml(key)}">${escapeHtml(label)}</button>
        `).join("");
    }

    if (summary) {
        const counts = {};
        inRange.forEach((event) => { counts[event.route || "contact"] = (counts[event.route || "contact"] || 0) + 1; });
        summary.innerHTML = `<div class="mini-stats">${Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([route, count]) => `
            <span><strong>${count}</strong> ${escapeHtml(routeLabels[route] || route)}</span>
        `).join("") || `<span>No clicks in this period.</span>`}</div>`;
    }

    const rows = inRange.filter((event) => activityRoute === "all" || (event.route || "contact") === activityRoute);
    if (!rows.length) {
        table.innerHTML = `<p class="editor-empty">No contact clicks in this period.</p>`;
        return;
    }
    table.innerHTML = `
        <table class="data-table">
            <thead><tr><th>When</th><th>Action</th><th>Button</th><th>Page</th></tr></thead>
            <tbody>
                ${rows.slice(0, 300).map((event) => `
                    <tr>
                        <td>${escapeHtml(formatDate(event.createdAt))}</td>
                        <td><span class="route-pill">${escapeHtml(routeLabels[event.route] || event.route || "contact")}</span></td>
                        <td>${escapeHtml(event.label || "")}</td>
                        <td><a href="${escapeHtml(event.page || "/")}" target="_blank" rel="noopener noreferrer">${escapeHtml(event.page || "/")}</a></td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function downloadCsv(filename, header, rows) {
    const cell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

function exportLeads() {
    if (!inboxLoaded) return showToast("Sign in to export leads.");
    downloadCsv(`appvion-leads-${todayIso()}.csv`,
        ["Received", "Name", "Email", "Project type", "Timeline", "Stage", "Follow up", "Message", "Notes"],
        projectBriefs.map((lead) => [formatDate(lead.createdAt), lead.name, lead.email, lead.type, lead.timeline, leadStage(lead), lead.followUpAt, lead.message, lead.notes]));
    showToast("Leads exported.");
}

function exportActivity() {
    if (!inboxLoaded) return showToast("Sign in to export activity.");
    downloadCsv(`appvion-contact-activity-${todayIso()}.csv`,
        ["When", "Action", "Button", "Page", "Link"],
        contactEvents.map((event) => [formatDate(event.createdAt), routeLabels[event.route] || event.route, event.label, event.page, event.href]));
    showToast("Contact activity exported.");
}

/* ---------- dashboard ---------- */

function overviewCard(label, count, detail, tone = "") {
    return `
        <article class="admin-card stat-card ${tone}">
            <p class="eyebrow">${escapeHtml(label)}</p>
            <strong>${escapeHtml(count)}</strong>
            <span>${escapeHtml(detail)}</span>
        </article>
    `;
}

function barList(entries, empty) {
    if (!entries.length) return `<p class="editor-empty">${escapeHtml(empty)}</p>`;
    const max = Math.max(...entries.map(([, count]) => count));
    return `<div class="bar-list">${entries.map(([label, count]) => `
        <div class="bar-row">
            <span class="bar-label">${escapeHtml(label)}</span>
            <span class="bar-track"><span class="bar-fill" style="width:${Math.max(6, Math.round(count / max * 100))}%"></span></span>
            <b>${count}</b>
        </div>
    `).join("")}</div>`;
}

function renderOverview() {
    const target = document.querySelector("[data-overview]");
    if (!target) return;
    const month = eventsInRange(30);
    const count = (route) => inboxLoaded ? month.filter((event) => event.route === route).length : "-";
    const newLeads = inboxLoaded ? projectBriefs.filter((lead) => leadStage(lead) === "new").length : "-";
    const recentLeads = inboxLoaded ? projectBriefs.filter((lead) => daysAgo(lead.createdAt) <= 30).length : "-";
    target.innerHTML = [
        overviewCard("New leads", newLeads, "Briefs nobody has answered yet", newLeads > 0 ? "attention" : ""),
        overviewCard("Leads, 30 days", recentLeads, "Project briefs received"),
        overviewCard("Book a call", count("strategy-call"), "Clicks in the last 30 days"),
        overviewCard("WhatsApp", count("whatsapp"), "Clicks in the last 30 days"),
        overviewCard("Email", count("email"), "Clicks in the last 30 days")
    ].join("");

    const badge = document.querySelector("[data-new-leads]");
    if (badge) {
        badge.hidden = !(inboxLoaded && newLeads > 0);
        badge.textContent = newLeads;
    }

    const pages = document.querySelector("[data-top-pages]");
    if (pages) {
        if (!inboxLoaded) {
            pages.innerHTML = `<p class="editor-empty">Sign in to load contact activity.</p>`;
        } else {
            const byPage = {};
            month.forEach((event) => { byPage[event.page || "/"] = (byPage[event.page || "/"] || 0) + 1; });
            pages.innerHTML = barList(Object.entries(byPage).sort((a, b) => b[1] - a[1]).slice(0, 6), "No contact clicks in the last 30 days.");
        }
    }

    const pipeline = document.querySelector("[data-pipeline]");
    if (pipeline) {
        if (!inboxLoaded) {
            pipeline.innerHTML = `<p class="editor-empty">Sign in to load leads.</p>`;
        } else {
            const counts = leadStages.map(([key, label]) => [label, projectBriefs.filter((lead) => leadStage(lead) === key).length]).filter(([, n]) => n > 0);
            pipeline.innerHTML = barList(counts, "No leads yet.");
        }
    }

    const followups = document.querySelector("[data-followups]");
    if (followups) {
        const due = projectBriefs
            .filter((lead) => lead.followUpAt && lead.followUpAt <= todayIso() && !closedStages.has(leadStage(lead)))
            .sort((a, b) => a.followUpAt.localeCompare(b.followUpAt));
        followups.innerHTML = due.length
            ? `<ul class="followup-list">${due.map((lead) => `<li><b>${escapeHtml(lead.followUpAt)}</b> ${escapeHtml(lead.name || lead.email)} <a href="${replyHref(lead)}">Reply</a></li>`).join("")}</ul>`
            : `<p class="editor-empty">Nothing due. Set a follow-up date on a lead and it shows here on the day.</p>`;
    }

    renderChecklist();
}

function renderChecklist() {
    const target = document.querySelector("[data-checklist]");
    if (!target) return;
    let done = {};
    try { done = JSON.parse(localStorage.getItem(checklistKey) || "{}"); } catch (error) { done = {}; }
    target.innerHTML = `<div class="checklist">${ownerChecklist.map(([key, label]) => `
        <label class="check-row ${done[key] ? "done" : ""}">
            <input type="checkbox" data-checklist-item="${key}" ${done[key] ? "checked" : ""}>
            <span>${escapeHtml(label)}</span>
        </label>
    `).join("")}</div>`;
}

function toggleChecklist(key, checked) {
    let done = {};
    try { done = JSON.parse(localStorage.getItem(checklistKey) || "{}"); } catch (error) { done = {}; }
    done[key] = checked;
    localStorage.setItem(checklistKey, JSON.stringify(done));
    renderChecklist();
}

/* ---------- site health ---------- */

function healthCard(label, value, detail, tone, href) {
    const inner = `
        <p class="eyebrow">${escapeHtml(label)}</p>
        <strong>${escapeHtml(value)}</strong>
        <span>${escapeHtml(detail)}</span>
    `;
    return href
        ? `<a class="admin-card stat-card ${tone}" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
        : `<article class="admin-card stat-card ${tone}">${inner}</article>`;
}

async function loadHealth(force = false) {
    if (healthLoaded && !force) return;
    healthLoaded = true;
    const target = document.querySelector("[data-health-cards]");
    if (!target) return;
    target.innerHTML = `<p class="editor-empty">Checking the live site...</p>`;
    const repo = "https://api.github.com/repos/appvionstudio/appvionstudio.github.io";
    const json = (url) => fetch(url, { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject(new Error(response.status)));
    const text = (url) => fetch(url, { cache: "no-store" }).then((response) => response.ok ? response.text() : Promise.reject(new Error(response.status)));
    const [runs, commit, sitemap, llms] = await Promise.allSettled([
        json(`${repo}/actions/workflows/seo-checks.yml/runs?branch=main&per_page=1`),
        json(`${repo}/commits/main`),
        text("/sitemap.xml"),
        text("/llms-full.txt")
    ]);

    const cards = [];
    if (runs.status === "fulfilled" && runs.value.workflow_runs && runs.value.workflow_runs[0]) {
        const run = runs.value.workflow_runs[0];
        const ok = run.conclusion === "success";
        const value = run.status !== "completed" ? "Running" : ok ? "Passing" : "Failing";
        cards.push(healthCard("Automatic SEO checks", value, `Last run ${formatDate(run.created_at)}`, run.status !== "completed" ? "" : ok ? "good" : "attention", run.html_url));
    } else {
        cards.push(healthCard("Automatic SEO checks", "Unknown", "GitHub could not be reached", "", "https://github.com/appvionstudio/appvionstudio.github.io/actions"));
    }
    if (commit.status === "fulfilled") {
        const info = commit.value.commit || {};
        cards.push(healthCard("Last website update", formatDate(info.committer && info.committer.date, false), String(info.message || "").split("\n")[0].slice(0, 90), "", commit.value.html_url));
    }
    if (sitemap.status === "fulfilled") {
        cards.push(healthCard("Pages in the sitemap", (sitemap.value.match(/<loc>/g) || []).length, "Pages offered to Google", "", "/sitemap.xml"));
    }
    if (llms.status === "fulfilled") {
        const generated = (llms.value.match(/Generated (\d{4}-\d{2}-\d{2})/) || [])[1] || "unknown";
        const stale = generated !== "unknown" && daysAgo(generated) > 45;
        cards.push(healthCard("AI summary file", generated, stale ? "Over 45 days old: ask your developer to regenerate it" : "llms-full.txt for AI assistants", stale ? "attention" : "good", "/llms-full.txt"));
    }
    const demos = content ? content.demoLibrary.length : 0;
    const demosOn = content && content.settings.sections.demos;
    cards.push(healthCard("Demo library", demos, demos && demosOn ? "Shown on the homepage" : "Hidden on the homepage", ""));
    target.innerHTML = cards.join("");
}

function renderToolLinks() {
    const target = document.querySelector("[data-tool-links]");
    if (!target || target.childElementCount) return;
    target.innerHTML = toolLinks.map(([label, href, detail]) => `
        <a class="tool-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
            <strong>${escapeHtml(label)}</strong>
            <span>${escapeHtml(detail)}</span>
        </a>
    `).join("");
}

/* ---------- data checks ---------- */

function youtubeId(url) {
    const match = String(url || "").match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : "";
}

function cleanSpaces(value) {
    return String(value).split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim()).join("\n").trim();
}

function fixText(value) {
    let next = cleanSpaces(value);
    legacyNames.forEach(([from, to]) => { next = next.split(from).join(to); });
    return next;
}

function textFields() {
    const fields = [];
    if (!content) return fields;
    Object.entries(content.settings).forEach(([key, value]) => {
        if (typeof value === "string") fields.push({ where: `Settings: ${key}`, get: () => content.settings[key], set: (v) => { content.settings[key] = v; } });
    });
    ["proofLogos", "stack"].forEach((list) => {
        content[list].forEach((value, index) => {
            fields.push({ where: `${list === "stack" ? "Tech Stack" : "Proof logos"}: ${value}`, get: () => content[list][index], set: (v) => { content[list][index] = v; } });
        });
    });
    collectionTypes.forEach((type) => {
        content[type].forEach((item) => {
            schema[type].forEach(([key, , fieldType]) => {
                if (fieldType === "checkbox" || typeof item[key] !== "string") return;
                fields.push({ where: `${viewTitles[type].replace(" (archive)", "")}: ${itemTitle(type, item) || item.id} (${key})`, get: () => item[key], set: (v) => { item[key] = v; } });
            });
        });
    });
    return fields;
}

function runChecks() {
    const issues = [];
    textFields().forEach((field) => {
        const value = field.get();
        if (!value) return;
        const names = legacyNames.filter(([from]) => value.includes(from)).map(([from, to]) => `"${from}" should be "${to}"`);
        if (names.length) issues.push({ level: "error", where: field.where, text: names.join("; "), field });
        if (cleanSpaces(value) !== value) issues.push({ level: "warn", where: field.where, text: "Extra spaces", field });
    });
    content.demoLibrary.forEach((demo) => {
        const where = `Demo library: ${demo.title || demo.id}`;
        if (!demo.title) issues.push({ level: "error", where, text: "Missing title" });
        if (!demo.demoUrl) issues.push({ level: "error", where, text: "Missing demo URL" });
        const id = youtubeId(demo.demoUrl);
        if (id && videoProbe[id] === false) issues.push({ level: "error", where, text: `YouTube video ${id} is removed or private. Replace the link.` });
        if (id && videoProbe[id] === undefined) probeVideo(id);
    });
    if (content.demoLibrary.length && !content.settings.sections.demos) {
        issues.push({ level: "info", where: "Demo library", text: "Demos exist but the Demos section is switched off, so visitors do not see them." });
    }
    checkIssues = issues;
    return issues;
}

function probeVideo(id) {
    videoProbe[id] = null;
    const image = new Image();
    // YouTube serves a 120 px wide placeholder for videos that do not exist.
    image.onload = () => { videoProbe[id] = image.naturalWidth > 120; renderChecks(); };
    image.onerror = () => { videoProbe[id] = false; renderChecks(); };
    image.src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
}

function renderChecks() {
    if (!content) return;
    const issues = runChecks();
    const badge = document.querySelector("[data-issue-count]");
    const fixable = issues.filter((issue) => issue.level !== "info").length;
    if (badge) {
        badge.hidden = !fixable;
        badge.textContent = fixable;
    }
    const target = document.querySelector("[data-checks-list]");
    if (!target) return;
    if (!issues.length) {
        target.innerHTML = `<p class="editor-empty good-note">No problems found. Names, spacing and demo links all look right.</p>`;
        return;
    }
    target.innerHTML = `<div class="check-list">${issues.map((issue, index) => `
        <div class="check-item ${issue.level}">
            <span class="check-level">${issue.level === "error" ? "Fix" : issue.level === "warn" ? "Tidy" : "Note"}</span>
            <div>
                <strong>${escapeHtml(issue.where)}</strong>
                <span>${escapeHtml(issue.text)}</span>
            </div>
            ${issue.field ? `<button class="button ghost" type="button" data-fix-issue="${index}">Fix</button>` : ""}
        </div>
    `).join("")}</div>`;
}

function fixIssue(index) {
    const issue = checkIssues[index];
    if (!issue || !issue.field) return;
    issue.field.set(fixText(issue.field.get()));
    saveContent("Fixed in the local draft. Publish Live to save it to Firebase.");
}

function fixAll() {
    const fields = checkIssues.filter((issue) => issue.field).map((issue) => issue.field);
    if (!fields.length) return showToast("Nothing to fix.");
    fields.forEach((field) => field.set(fixText(field.get())));
    saveContent(`${fields.length} fixes saved in the local draft. Open Publish & backup and click Publish Live.`);
}

/* ---------- account ---------- */

function renderAccount() {
    const info = document.querySelector("[data-account-info]");
    const user = currentUser();
    if (info) {
        info.innerHTML = user
            ? `<dl class="facts">
                    <div><dt>Email</dt><dd>${escapeHtml(user.email)}</dd></div>
                    <div><dt>Last sign-in</dt><dd>${escapeHtml(formatDate(user.metadata && user.metadata.lastSignInTime))}</dd></div>
                    <div><dt>Account created</dt><dd>${escapeHtml(formatDate(user.metadata && user.metadata.creationTime, false))}</dd></div>
               </dl>`
            : `<p class="editor-empty">${mockData ? "Local preview: no real account." : "Not signed in."}</p>`;
    }
    const idle = document.querySelector("[data-idle-options]");
    if (idle) {
        const current = idleMinutes();
        idle.innerHTML = [[15, "15 minutes"], [30, "30 minutes"], [60, "1 hour"], [0, "Never"]].map(([minutes, label]) => `
            <button class="chip ${current === minutes ? "active" : ""}" type="button" data-idle="${minutes}">${label}</button>
        `).join("");
    }
}

/* ---------- archive editors and demo library ---------- */

function normalizeContent(data) {
    data.settings = data.settings || {};
    data.settings.email = canonicalContact.email;
    data.settings.whatsapp = canonicalContact.whatsapp;
    data.settings.whatsappUrl = canonicalContact.whatsappUrl;
    data.settings.sections = data.settings.sections || {};
    Object.keys(sectionLabels).forEach((key) => {
        if (typeof data.settings.sections[key] !== "boolean") data.settings.sections[key] = true;
    });
    data.proofLogos = Array.isArray(data.proofLogos) ? data.proofLogos : [];
    data.stack = Array.isArray(data.stack) ? data.stack : [];
    collectionTypes.forEach((type) => {
        data[type] = Array.isArray(data[type]) ? data[type] : [];
    });
    data.team.forEach((member) => {
        member.photoPositionX = member.photoPositionX || "50";
        member.photoPositionY = member.photoPositionY || "28";
    });
    return data;
}

function saveContent(message = "Draft saved only on this device. Click Publish Live so everyone can see it.") {
    localStorage.setItem(storageKey, JSON.stringify(content));
    renderAll();
    updatePublishStatus(isDirty() || !remoteSnapshot ? "Unpublished local changes. Click Publish Live to update Firebase." : "Everything is published.");
    showToast(message);
}

async function loadContent() {
    const stored = localStorage.getItem(storageKey);
    if (stored) return normalizeContent(JSON.parse(stored));

    const response = await fetch("appvion-content.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load appvion-content.json");
    return normalizeContent(await response.json());
}

function addArchiveBanner(view) {
    const panel = document.querySelector(`[data-panel="${view}"]`);
    if (!panel || panel.querySelector(".archive-banner")) return;
    panel.insertAdjacentHTML("afterbegin", `
        <div class="archive-banner">
            <strong>Not shown on the live website.</strong>
            Since October 2026 the site's text, case studies, team and FAQ live in the website code so Google can read them.
            This content is kept as a record. To change the website, ask your developer.
        </div>
    `);
}

function activateView(view) {
    activeView = view;
    document.querySelectorAll("[data-view]").forEach((button) => {
        button.classList.toggle("active", button.dataset.view === view);
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.panel === view);
    });
    if (archiveViews.has(view)) {
        addArchiveBanner(view);
        const archive = document.querySelector(".nav-archive");
        if (archive) archive.open = true;
    }
    pageTitle.textContent = viewTitles[view] || "Admin";
    if (view === "health") {
        renderToolLinks();
        loadHealth();
    }
    renderAll();
}

function itemTitle(type, item) {
    if (type === "faqs") return item.question;
    if (type === "metrics") return item.value;
    if (type === "team") return item.name;
    return item.title;
}

function itemMeta(type, item) {
    if (type === "projects") return item.kicker || item.theme;
    if (type === "demoLibrary") return item.category || "Demo";
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
    `).join("") || `<p class="editor-empty">Nothing here yet.</p>`;

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
        else if (key === "photoPositionX") base[key] = "50";
        else if (key === "photoPositionY") base[key] = "28";
        else if (key === "caseStudySlug") base[key] = slugify(base.title || type);
        else if (key === "features") base[key] = "Core workflow\nAdmin visibility\nMobile-first experience";
        else if (key === "techStack") base[key] = "Android Native\nKotlin\nFirebase";
        else if (key === "proofPoints") base[key] = "";
        else base[key] = "";
    });
    return base;
}

function isRequiredField(key, fieldType) {
    const optionalProjectFields = [
        "visualLabel",
        "visualHeadline",
        "visualDetail",
        "visualItems",
        "visualRows",
        "visualBars",
        "thumbnailUrl",
        "screenshotUrls",
        "demoVideoUrl",
        "caseStudySlug",
        "industry",
        "problem",
        "solution",
        "result",
        "features",
        "techStack",
        "linkUrl",
        "photoUrl",
        "photoPositionX",
        "photoPositionY",
        "displayOrder",
        "profileUrl",
        "demoUrl",
        "proofPoints"
    ];
    return fieldType !== "url" && !optionalProjectFields.includes(key);
}

function fieldPlaceholder(key, fieldType) {
    const placeholders = {
        photoUrl: "https://your-image-host.com/team/ayyaz.jpg",
        photoPositionX: "50",
        photoPositionY: "28",
        displayOrder: "1",
        thumbnailUrl: "Leave empty for a YouTube demo",
        screenshotUrls: "https://your-image-host.com/projects/screen-1.jpg\nhttps://your-image-host.com/projects/screen-2.jpg",
        demoVideoUrl: "https://youtu.be/your-demo-video",
        linkUrl: "https://github.com/appvionstudio/project-or-demo",
        demoUrl: "https://youtu.be/your-demo-video",
        proofPoints: "Real app workflow\nAdmin dashboard\nLive data integration",
        features: "Role-based access\nRealtime updates\nAdmin approval flow",
        techStack: "Kotlin\nJetpack Compose\nFirebase"
    };
    if (placeholders[key]) return placeholders[key];
    return fieldType === "url" ? "https://..." : "";
}

function renderField(item, [key, label, fieldType, options]) {
    const value = item[key] ?? "";
    const required = isRequiredField(key, fieldType) ? "required" : "";
    const help = fieldHelp[key] ? `<small class="field-help">${escapeHtml(fieldHelp[key])}</small>` : "";
    const placeholder = fieldPlaceholder(key, fieldType);
    if (fieldType === "textarea") {
        return `
            <label>
                <span>${escapeHtml(label)}</span>
                <textarea name="${escapeHtml(key)}" placeholder="${escapeHtml(placeholder)}" ${required}>${escapeHtml(value)}</textarea>
                ${help}
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
                ${help}
            </label>
        `;
    }
    return `
        <label>
            <span>${escapeHtml(label)}</span>
            <input name="${escapeHtml(key)}" type="${fieldType}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${required}>
            ${help}
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
        ${renderMediaPreview(type, item)}
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
            <p class="muted">Only the Demos switch still has an effect on the live site. It is also on the Demo library page.</p>
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
            <label><span>Email</span><input name="email" type="email" value="${escapeHtml(canonicalContact.email)}" readonly required></label>
            <label><span>WhatsApp Label</span><input name="whatsapp" value="${escapeHtml(canonicalContact.whatsapp)}" readonly required></label>
        </div>
        <label><span>WhatsApp URL</span><input name="whatsappUrl" type="url" value="${escapeHtml(canonicalContact.whatsappUrl)}" readonly required></label>
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
            <p class="muted">Write one technology per line.</p>
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

function renderMediaGuide() {
    const target = document.querySelector("[data-media-guide]");
    if (!target || !content) return;

    target.innerHTML = `
        <div class="media-guide-grid">
            <article class="admin-card media-guide-card featured">
                <p class="eyebrow">Demo videos</p>
                <h2>Adding a demo that visitors can watch</h2>
                <p class="muted">Upload the video to YouTube (Public or Unlisted, not Private), copy its link, open Demo library, click Add Demo and paste the link. Save, then Publish Live. The thumbnail is filled in for you.</p>
                <div class="roadmap-steps">
                    <span>Upload to YouTube</span>
                    <span>Paste the link in Demo library</span>
                    <span>Save</span>
                    <span>Publish Live</span>
                </div>
            </article>
            <article class="admin-card media-guide-card">
                <p class="eyebrow">Website photos and screenshots</p>
                <h2>Changing images on the website</h2>
                <p class="muted">Team photos, case-study screenshots and share images are files in the website code since October 2026. Send new images to your developer.</p>
            </article>
        </div>
    `;
}

function mediaLines(value) {
    return String(value || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
}

function renderMediaPreview(type, item) {
    const images = [];
    const links = [];

    if (type === "team" && item.photoUrl) {
        images.push({ src: item.photoUrl, label: "Profile photo" });
    }

    if (type === "projects") {
        if (item.thumbnailUrl) images.push({ src: item.thumbnailUrl, label: "Thumbnail" });
        mediaLines(item.screenshotUrls).slice(0, 3).forEach((src, index) => {
            images.push({ src, label: `Screenshot ${index + 1}` });
        });
        if (item.demoVideoUrl) links.push({ href: item.demoVideoUrl, label: "Demo video" });
        if (item.linkUrl) links.push({ href: item.linkUrl, label: item.linkLabel || "Project link" });
    }

    if (type === "demoLibrary") {
        const id = youtubeId(item.demoUrl);
        if (item.thumbnailUrl) images.push({ src: item.thumbnailUrl, label: "Demo thumbnail" });
        else if (id) images.push({ src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, label: "YouTube thumbnail" });
        if (item.demoUrl) links.push({ href: item.demoUrl, label: "Open demo" });
    }

    if (!images.length && !links.length) {
        return `
            <div class="editor-media-preview empty">
                <strong>No media added yet</strong>
                <span>Paste a video, photo or screenshot link below. A preview appears here after saving.</span>
            </div>
        `;
    }

    return `
        <div class="editor-media-preview">
            ${images.map((image) => `
                <figure>
                    <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.label)} preview" loading="lazy">
                    <figcaption>${escapeHtml(image.label)}</figcaption>
                </figure>
            `).join("")}
            ${links.map((link) => `
                <a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>
            `).join("")}
        </div>
    `;
}

function renderDemoToggle() {
    const toggle = document.querySelector("[data-demos-visible]");
    if (toggle) toggle.checked = Boolean(content.settings.sections.demos);
}

function renderPublish() {
    const output = document.querySelector("[data-json-output]");
    if (output) output.value = JSON.stringify(content, null, 2);
    const meta = document.querySelector("[data-publish-meta]");
    if (meta) {
        meta.innerHTML = remoteMeta
            ? `<dl class="facts">
                    <div><dt>Last published</dt><dd>${escapeHtml(formatDate(remoteMeta.updatedAt))}</dd></div>
                    <div><dt>Published by</dt><dd>${escapeHtml(remoteMeta.updatedBy || "unknown")}</dd></div>
                    <div><dt>This browser</dt><dd>${isDirty() ? "Has unpublished changes" : "Matches Firebase"}</dd></div>
               </dl>`
            : `<p class="editor-empty">Sign in to see when the content was last published.</p>`;
    }
}

function renderAll() {
    if (!content) return;
    renderOverview();
    collectionTypes.forEach(renderCollection);
    renderSettings();
    renderStack();
    renderMediaGuide();
    renderDemoToggle();
    renderPublish();
    renderLeads();
    renderActivity();
    renderChecks();
    renderSignedIn();
    renderDirty();
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
    saveContent("Item deleted only from this local draft. Publish Live to remove it from Firebase.");
}

function saveEditor(type, form) {
    const item = content[type].find((entry) => entry.id === selected[type]);
    if (!item) return;
    const data = new FormData(form);
    schema[type].forEach(([key, label, fieldType]) => {
        item[key] = fieldType === "checkbox" ? data.has(key) : cleanSpaces(data.get(key) || "");
    });
    if (type === "demoLibrary" && !item.thumbnailUrl) {
        const id = youtubeId(item.demoUrl);
        if (id) item.thumbnailUrl = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
    item.id = item.id || slugify(itemTitle(type, item));
    saveContent("Changes saved as a local draft. Click Publish Live so other devices can see them.");
}

function saveSettings(form) {
    const data = new FormData(form);
    Object.keys(content.settings).forEach((key) => {
        if (key !== "sections" && data.has(key)) content.settings[key] = cleanSpaces(data.get(key) || "");
    });
    content.settings.email = canonicalContact.email;
    content.settings.whatsapp = canonicalContact.whatsapp;
    content.settings.whatsappUrl = canonicalContact.whatsappUrl;
    Object.keys(sectionLabels).forEach((key) => {
        content.settings.sections[key] = data.has(`section:${key}`);
    });
    content.proofLogos = mediaLines(data.get("proofLogos"));
    saveContent("Settings saved as a local draft. Click Publish Live so other devices can see them.");
}

function saveStack(form) {
    const data = new FormData(form);
    content.stack = mediaLines(data.get("stack"));
    saveContent("Tech stack saved as a local draft. Click Publish Live so other devices can see it.");
}

function exportContent() {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `appvion-content-${todayIso()}.json`;
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
        lockAdmin("Sign in with Firebase before publishing live.");
        return;
    }

    const errors = runChecks().filter((issue) => issue.level === "error");
    if (errors.length && !window.confirm(`Data checks found ${errors.length} problem(s), such as: ${errors[0].where}: ${errors[0].text}\n\nPublish anyway?`)) {
        activateView("checks");
        return;
    }

    const buttons = document.querySelectorAll('[data-action="publish-live"]');
    try {
        buttons.forEach((button) => { button.disabled = true; });
        updatePublishStatus("Publishing to Firebase...");
        await modules.setDoc(modules.doc(db, firebaseContentPath[0], firebaseContentPath[1]), {
            content,
            updatedAt: modules.serverTimestamp(),
            updatedBy: auth.currentUser.email || "owner"
        }, { merge: true });
        remoteSnapshot = stableStringify(content);
        remoteMeta = { updatedAt: new Date(), updatedBy: auth.currentUser.email || "owner" };
        renderAll();
        updatePublishStatus("Published to Firebase. Refresh the public site to see it.");
        showToast("Published.");
    } catch (error) {
        updatePublishStatus("Publish failed. Check Firebase setup and rules.");
        showToast(error.message || "Publish failed.");
    } finally {
        buttons.forEach((button) => { button.disabled = false; });
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

/* ---------- events ---------- */

document.addEventListener("click", (event) => {
    const target = event.target.closest("button, a");
    if (!target) return;
    const { dataset } = target;
    if (dataset.view) activateView(dataset.view);
    if (dataset.add) addItem(dataset.add);
    if (dataset.edit) {
        selected[dataset.edit] = dataset.id;
        renderEditor(dataset.edit);
    }
    if (dataset.delete) deleteItem(dataset.delete, dataset.id);
    if (dataset.cancel) {
        selected[dataset.cancel] = null;
        renderEditor(dataset.cancel);
    }
    if (dataset.leadFilter) {
        leadFilter = dataset.leadFilter;
        renderLeads();
    }
    if (dataset.deleteLead) deleteLead(dataset.deleteLead);
    if (dataset.activityDays !== undefined) {
        activityRange = Number(dataset.activityDays);
        renderActivity();
    }
    if (dataset.activityFilter) {
        activityRoute = dataset.activityFilter;
        renderActivity();
    }
    if (dataset.fixIssue !== undefined) fixIssue(Number(dataset.fixIssue));
    if (dataset.idle !== undefined) {
        localStorage.setItem(idleKey, dataset.idle);
        renderAccount();
        showToast(Number(dataset.idle) ? `The panel now locks after ${dataset.idle} idle minutes.` : "Auto-lock is off on this device.");
    }

    const actions = {
        export: exportContent,
        copy: copyContent,
        "publish-live": publishLive,
        "refresh-briefs": loadInbox,
        "export-leads": exportLeads,
        "export-activity": exportActivity,
        "run-checks": () => { videoProbe = {}; renderChecks(); showToast("Checks run again."); },
        "fix-all": fixAll,
        "reset-password": () => sendResetLink(currentUser() && currentUser().email),
        "forgot-password": () => sendResetLink(String(new FormData(lockForm).get("email") || "").trim().toLowerCase()),
        "reload-remote": reloadFromFirebase,
        import: importContent,
        reset: resetLocalContent,
        logout: () => lockAdmin("Admin locked."),
        "local-unlock": localPreviewUnlock
    };
    if (dataset.action && actions[dataset.action]) actions[dataset.action]();
});

document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("[data-checklist-item]")) toggleChecklist(target.dataset.checklistItem, target.checked);
    if (target.matches("[data-demos-visible]")) {
        content.settings.sections.demos = target.checked;
        saveContent(target.checked ? "Demos section switched on in the draft. Publish Live to show it." : "Demos section switched off in the draft. Publish Live to hide it.");
    }
});

document.addEventListener("input", (event) => {
    if (event.target.matches("[data-lead-search]")) {
        leadSearch = event.target.value;
        renderLeads();
    }
});

document.addEventListener("submit", (event) => {
    const form = event.target;
    if (form === lockForm) return;
    event.preventDefault();
    const editorType = form.dataset.editor;
    if (editorType) saveEditor(editorType, form);
    if (form.dataset.leadForm) saveLead(form.dataset.leadForm, form);
    if (form.matches("[data-settings-form]")) saveSettings(form);
    if (form.matches("[data-stack-form]")) saveStack(form);
});

if (lockForm) lockForm.addEventListener("submit", handleLockSubmit);

watchIdle();
initializeLock();
loadContent()
    .then((loaded) => {
        content = loaded;
        renderAll();
    })
    .catch((error) => {
        showToast(error.message);
    });
