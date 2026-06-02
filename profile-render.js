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

    function initials(name) {
        return String(name || "AV")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("") || "AV";
    }

    function getStoredContent() {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn("Could not read AppVion profile content.", error);
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
                const app = appModule.getApps().length ? appModule.getApps()[0] : appModule.initializeApp(firebaseConfig);
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
            console.warn("Could not load AppVion Firebase profile content.", error);
        }

        try {
            const response = await fetch("appvion-content.json", { cache: "no-store" });
            if (!response.ok) throw new Error("Content file unavailable");
            return await response.json();
        } catch (error) {
            console.warn("Could not load AppVion profile content file.", error);
            return null;
        }
    }

    function renderProfile(member) {
        const photoSlot = document.querySelector("[data-profile-photo]");
        const nameTargets = document.querySelectorAll("[data-profile-photo-name]");
        const roleTargets = document.querySelectorAll("[data-profile-photo-role]");
        if (!photoSlot || !member) return;

        nameTargets.forEach((target) => {
            target.textContent = member.name || target.textContent;
        });
        roleTargets.forEach((target) => {
            target.textContent = member.role || target.textContent;
        });

        photoSlot.innerHTML = member.photoUrl
            ? `<img src="${escapeHtml(member.photoUrl)}" alt="${escapeHtml(member.name)}" loading="lazy">`
            : `<div class="profile-photo-placeholder">${escapeHtml(initials(member.name))}</div>`;
    }

    loadContent().then((content) => {
        const profileId = document.body.dataset.profileId;
        if (!profileId || !content || !Array.isArray(content.team)) return;
        renderProfile(content.team.find((member) => member.id === profileId));
    });
}());
