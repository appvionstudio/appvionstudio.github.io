(function () {
    const storageKey = "appvionStudioContent.v1";
    const canonicalContact = {
        email: "ayyaz@appvionstudio.com",
        whatsapp: "+92 346 7277143",
        whatsappUrl: "https://wa.me/923467277143",
        calendlyUrl: "https://calendly.com/ayyaz-appvionstudio/30min"
    };
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

    function projectVisual(project) {
        const title = escapeHtml(project.title || "Product");
        const status = escapeHtml(project.status || "Live");
        const theme = escapeHtml(project.theme || "campus");
        const visualLabel = escapeHtml(project.visualLabel || project.kicker || "Product flow");
        const visualHeadline = escapeHtml(project.visualHeadline || project.title || "App screen");
        const visualDetail = escapeHtml(project.visualDetail || project.description || "Operational product flow.");
        const visualItems = String(project.visualItems || "Plan\nBuild\nLaunch")
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 4);
        const colors = theme === "data"
            ? ["#f59e0b", "#10b981", "#ef4444"]
            : theme === "event"
                ? ["#8b5cf6", "#2563eb", "#10b981"]
                : ["#2563eb", "#10b981", "#f59e0b"];
        const rows = visualItems.length ? visualItems : [visualHeadline, visualLabel, "Ready"];
        return `
            <div class="case-card-visual ${theme} phone-visual">
                <div class="portfolio-phone" aria-label="${title} mobile interface preview">
                    <div class="portfolio-speaker"></div>
                    <div class="portfolio-app-head">
                        <strong>${title}</strong>
                        <span>${status}</span>
                    </div>
                    <div class="portfolio-app-list">
                        ${rows.map((item, index) => `
                            <span>
                                <i style="background:${colors[index % colors.length]}"></i>
                                <b>${escapeHtml(item)}</b>
                            </span>
                        `).join("")}
                    </div>
                    <small>${visualDetail}</small>
                    <div class="portfolio-tabs"><i></i><i></i><i></i></div>
                </div>
            </div>`;
    }
    function renderProjects(projects) {
        const grid = document.querySelector(".case-grid");
        if (!grid || !Array.isArray(projects)) return;

        grid.innerHTML = projects.map((project) => {
            const caseSlug = project.caseStudySlug || project.id || "";
            const caseHref = `case-study.html?project=${encodeURIComponent(caseSlug)}`;
            const href = project.caseStudyEnabled ? caseHref : (project.linkUrl || "#");
            const label = project.caseStudyEnabled ? "View Case Study" : (project.linkLabel || "View Live Demo");
            return `
            <article class="case-card reveal in-view">
                ${projectVisual(project)}
                <div>
                    <span class="case-kicker">${escapeHtml(project.kicker)}</span>
                    <h3>${escapeHtml(project.title)}</h3>
                    <p>${escapeHtml(project.description)}</p>
                </div>
                <a href="${escapeHtml(href)}" ${project.caseStudyEnabled ? "" : 'target="_blank" rel="noreferrer"'}>${escapeHtml(label)}</a>
            </article>
        `}).join("");
    }

    function renderServices(services) {
        const grid = document.querySelector(".service-grid");
        if (!grid || !Array.isArray(services)) return;

        grid.innerHTML = services.map((service, index) => `
            <article class="service-card reveal in-view">
                <span>${escapeHtml(service.number || String(index + 1).padStart(2, "0"))}</span>
                <h3>${escapeHtml(service.title)}</h3>
                <p>${escapeHtml(service.description)}</p>
            </article>
        `).join("");
    }

    function renderProcessSteps(steps) {
        const grid = document.querySelector(".process-grid");
        if (!grid || !Array.isArray(steps)) return;

        grid.innerHTML = steps.map((step, index) => `
            <article class="process-step reveal in-view">
                <span>${escapeHtml(step.number || String(index + 1).padStart(2, "0"))}</span>
                <h3>${escapeHtml(step.title)}</h3>
                <p>${escapeHtml(step.description)}</p>
            </article>
        `).join("");
    }

    function renderMetrics(metrics) {
        const grid = document.querySelector(".metric-grid");
        if (!grid || !Array.isArray(metrics)) return;

        grid.innerHTML = metrics.map((metric) => `
            <article>
                <strong>${escapeHtml(metric.value)}</strong>
                <span>${escapeHtml(metric.description)}</span>
            </article>
        `).join("");
    }

    function renderChoiceReasons(reasons) {
        const grid = document.querySelector(".choice-grid");
        if (!grid || !Array.isArray(reasons)) return;

        grid.innerHTML = reasons.map((reason) => `
            <article class="choice-card reveal in-view">
                <h3>${escapeHtml(reason.title)}</h3>
                <p>${escapeHtml(reason.description)}</p>
            </article>
        `).join("");
    }

    function renderEngagements(engagements) {
        const grid = document.querySelector(".engagement-grid");
        if (!grid || !Array.isArray(engagements)) return;

        grid.innerHTML = engagements.map((engagement, index) => {
            const items = String(engagement.items || "")
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean);
            return `
                <article class="engagement-card ${engagement.featured ? "featured" : ""} reveal in-view">
                    <span>${escapeHtml(engagement.number || String(index + 1).padStart(2, "0"))}</span>
                    <h3>${escapeHtml(engagement.title)}</h3>
                    <p>${escapeHtml(engagement.description)}</p>
                    <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                </article>
            `;
        }).join("");
    }

    function renderTeam(team) {
        const grid = document.querySelector(".team-grid");
        if (!grid || !Array.isArray(team)) return;

        grid.innerHTML = team.map((member) => `
            <article class="team-card ${member.featured ? "featured" : ""} reveal in-view">
                ${member.photoUrl
                    ? `<img class="team-photo" src="${escapeHtml(member.photoUrl)}" alt="${escapeHtml(member.name)}" loading="lazy">`
                    : `<div class="team-photo-placeholder" aria-hidden="true">${escapeHtml(initials(member.name))}</div>`}
                <span>${escapeHtml(member.role)}</span>
                <h3>${escapeHtml(member.name)}</h3>
                <p>${escapeHtml(member.description)}</p>
                <a class="button secondary" href="${escapeHtml(member.profileUrl || "#")}">View Profile</a>
            </article>
        `).join("");
    }

    function initials(name) {
        return String(name || "AV")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("") || "AV";
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

    function renderStack(stack) {
        const cloud = document.querySelector(".stack-cloud");
        if (!cloud || !Array.isArray(stack)) return;
        cloud.innerHTML = stack.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
    }

    function renderInsights(insights) {
        const grid = document.querySelector(".insights-grid");
        if (!grid || !Array.isArray(insights)) return;

        grid.innerHTML = insights.map((insight) => `
            <article class="insight-card reveal in-view">
                <span>${escapeHtml(insight.category)}</span>
                <h3>${escapeHtml(insight.title)}</h3>
                <p>${escapeHtml(insight.excerpt)}</p>
            </article>
        `).join("");
    }

    function renderFaqs(faqs) {
        const list = document.querySelector(".faq-list");
        if (!list || !Array.isArray(faqs)) return;

        list.innerHTML = faqs.map((faq, index) => `
            <details class="faq-item reveal in-view" ${index === 0 ? "open" : ""}>
                <summary>${escapeHtml(faq.question)}</summary>
                <p>${escapeHtml(faq.answer)}</p>
            </details>
        `).join("");
    }

    function renderSettings(settings) {
        if (!settings) return;

        const eyebrow = document.querySelector(".hero-copy .eyebrow");
        const title = document.querySelector(".hero-copy h1");
        const lead = document.querySelector(".hero-copy .lead");
        const routes = document.querySelector(".contact-routes");
        const proofText = document.querySelector(".proof-strip p");
        const ctaEyebrow = document.querySelector(".cta-copy .eyebrow");
        const ctaTitle = document.querySelector(".cta-copy h2");
        const ctaBody = document.querySelector(".cta-copy > p:not(.eyebrow)");
        const footerText = document.querySelector(".footer p");
        const descriptionMeta = document.querySelector('meta[name="description"]');

        if (eyebrow && settings.heroEyebrow) eyebrow.textContent = settings.heroEyebrow;
        if (title && settings.heroTitle) title.textContent = settings.heroTitle;
        if (lead && settings.heroLead) lead.textContent = settings.heroLead;
        if (settings.metaTitle) document.title = settings.metaTitle;
        if (descriptionMeta && settings.metaDescription) descriptionMeta.setAttribute("content", settings.metaDescription);
        if (proofText && settings.proofText) proofText.textContent = settings.proofText;
        if (ctaEyebrow && settings.ctaEyebrow) ctaEyebrow.textContent = settings.ctaEyebrow;
        if (ctaTitle && settings.ctaTitle) ctaTitle.textContent = settings.ctaTitle;
        if (ctaBody && settings.ctaBody) ctaBody.textContent = settings.ctaBody;
        if (footerText && settings.footerTagline) footerText.textContent = settings.footerTagline;

        if (routes) {
            routes.innerHTML = `
                <a class="contact-route featured" href="${escapeHtml(canonicalContact.calendlyUrl)}" target="_blank" rel="noopener noreferrer" data-contact-action="strategy-call" data-contact-label="Contact strategy session">
                    <span>Priority route</span>
                    <strong>Book a 20-min App Strategy Session</strong>
                    <small>Direct scheduling for founders and B2B teams ready to scope the build.</small>
                </a>
                <a class="contact-route" href="https://mail.google.com/mail/?view=cm&amp;fs=1&amp;to=${escapeHtml(canonicalContact.email)}" target="_blank" rel="noopener noreferrer" data-contact-action="email" data-contact-label="Contact email">
                    <span>Email</span>
                    <strong>${escapeHtml(canonicalContact.email)}</strong>
                    <small>Opens Gmail compose for briefs, RFP notes, and project context.</small>
                </a>
                <a class="contact-route" href="${escapeHtml(canonicalContact.whatsappUrl)}" target="_blank" rel="noreferrer" data-contact-action="whatsapp" data-contact-label="Contact WhatsApp">
                    <span>WhatsApp</span>
                    <strong>${escapeHtml(canonicalContact.whatsapp)}</strong>
                    <small>Fast route for availability, timeline, and quick fit checks.</small>
                </a>
            `;
        }
    }

    function renderProofLogos(logos) {
        const grid = document.querySelector(".proof-logos");
        if (!grid || !Array.isArray(logos)) return;
        grid.innerHTML = logos.map((logo) => `<span>${escapeHtml(logo)}</span>`).join("");
    }

    function applySectionVisibility(sections) {
        if (!sections) return;
        const map = {
            work: "#work",
            services: "#services",
            process: "#process",
            proof: "#proof",
            choice: ".choice-section",
            confidence: ".confidence-section",
            engagements: "#engagements",
            stack: ".stack-section",
            demos: "#demos",
            team: "#team",
            insights: ".insights-section",
            faq: "#faq",
            contact: "#contact"
        };

        Object.entries(map).forEach(([key, selector]) => {
            document.querySelectorAll(selector).forEach((section) => {
                if (key === "demos" && sections[key] !== false) return;
                section.hidden = sections[key] === false;
            });
        });
    }

    loadContent().then((content) => {
        if (!content) return;
        renderSettings(content.settings);
        renderProofLogos(content.proofLogos);
        renderProjects(content.projects);
        renderServices(content.services);
        renderProcessSteps(content.processSteps);
        renderMetrics(content.metrics);
        renderChoiceReasons(content.choiceReasons);
        renderEngagements(content.engagements);
        renderTeam(content.team);
        renderStack(content.stack);
        renderDemoLibrary(content.demoLibrary, content.settings && content.settings.sections && content.settings.sections.demos);
        renderInsights(content.insights);
        renderFaqs(content.faqs);
        applySectionVisibility(content.settings && content.settings.sections);
        window.dispatchEvent(new CustomEvent("appvion:content-rendered"));
    });
}());
