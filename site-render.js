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
        const screenshots = String(project.screenshotUrls || project.thumbnailUrl || "")
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 3);

        if (screenshots.length) {
            return `
                <div class="case-card-visual real">
                    <div class="preview-top"><span>${escapeHtml(project.industry || project.kicker || "Product proof")}</span><strong>${escapeHtml(project.status || "Preview")}</strong></div>
                    <div class="case-shot-grid shots-${screenshots.length}">
                        ${screenshots.map((src, index) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(project.title)} screenshot ${index + 1}" loading="lazy">`).join("")}
                    </div>
                </div>`;
        }

        const title = escapeHtml(project.title);
        const status = escapeHtml(project.status || "Live");
        const metric = escapeHtml(project.metric || "Preview");
        const theme = escapeHtml(project.theme || "campus");
        const visualLabel = escapeHtml(project.visualLabel || (theme === "event" ? "Upcoming event" : "Product update"));
        const visualHeadline = escapeHtml(project.visualHeadline || project.title);
        const visualDetail = escapeHtml(project.visualDetail || `${metric} with role-aware workflows.`);
        const visualItems = String(project.visualItems || "Users\nAdmin\nOps")
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 3);
        const visualRows = String(project.visualRows || "ID-01 | Active | 09:00\nID-02 | Review | 09:15")
            .split("\n")
            .map((row) => row.split("|").map((cell) => escapeHtml(cell.trim())))
            .filter((row) => row.length >= 3)
            .slice(0, 3);
        const visualBars = String(project.visualBars || "54\n78\n42\n88\n66")
            .split("\n")
            .map((value) => Number.parseInt(value, 10))
            .filter((value) => Number.isFinite(value))
            .slice(0, 5);
        const itemMarkup = visualItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("");
        const rowMarkup = visualRows.map(([id, rowStatus, time]) => `<strong>${id}</strong><em>${rowStatus}</em><small>${time}</small>`).join("");
        const barMarkup = visualBars.map((value) => `<span style="height: ${Math.min(Math.max(value, 8), 100)}%"></span>`).join("");

        if (theme === "data") {
            return `
                <div class="case-card-visual data">
                    <div class="preview-top"><span>${title}</span><strong>${status}</strong></div>
                    <div class="attendance-table" aria-label="${title} preview">
                        <span>ID</span><span>Status</span><span>Time</span>
                        ${rowMarkup || "<strong>ID-01</strong><em>Active</em><small>09:00</small>"}
                    </div>
                    <div class="attendance-bars">${barMarkup || '<span style="height: 54%"></span><span style="height: 78%"></span><span style="height: 42%"></span><span style="height: 88%"></span><span style="height: 66%"></span>'}</div>
                </div>`;
        }

        if (theme === "event") {
            return `
                <div class="case-card-visual event">
                    <div class="preview-top"><span>${title}</span><strong>${status}</strong></div>
                    <div class="event-ticket"><small>${visualLabel}</small><strong>${visualHeadline}</strong><span>${visualDetail}</span></div>
                    <div class="event-flow" aria-label="${title} flow">${itemMarkup || "<span>Register</span><span>Filter</span><span>Notify</span>"}</div>
                </div>`;
        }

        return `
            <div class="case-card-visual campus">
                <div class="preview-top"><span>${title}</span><strong>${status}</strong></div>
                <div class="announcement-card"><small>${visualLabel}</small><strong>${visualHeadline}</strong><span>${visualDetail}</span></div>
                <div class="role-row" aria-label="${title} roles">${itemMarkup || "<span>Users</span><span>Admin</span><span>Ops</span>"}</div>
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
                ${member.photoUrl ? `<img class="team-photo" src="${escapeHtml(member.photoUrl)}" alt="${escapeHtml(member.name)}" loading="lazy">` : ""}
                <span>${escapeHtml(member.role)}</span>
                <h3>${escapeHtml(member.name)}</h3>
                <p>${escapeHtml(member.description)}</p>
                <a class="button secondary" href="${escapeHtml(member.profileUrl || "#")}">View Profile</a>
            </article>
        `).join("");
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
