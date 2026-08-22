/* ============================================================
   AppVion Studio - Interactive Product Showcase
   Renders the app catalog in showcase-data.js as real, readable
   device screens and drives the exploration experience.

   Architecture
     renderScreen()   one canonical 300x650 screen, scaled by CSS
     buildDevice()    device frame + stage + screen transitions
     mountHero()      hero device, auto-cycles, pointer parallax
     mountFlagship()  in-page ProFix prototype with screen tabs
     upgradeCards()   portfolio cards get real mini screens
     Explorer         full-screen prototype player (modal)

   No dependencies. No images. Transform/opacity animation only.
   ============================================================ */
(function () {
    "use strict";

    var DATA = window.APPVION_SHOWCASE;
    if (!DATA || !DATA.apps || !DATA.apps.length) return;

    // Which product leads the hero, and which of its screens cycle there.
    var HERO = {
        app: "snowgrid",
        screens: ["site-measurement", "live-dispatch", "fleet-intelligence"]
    };

    var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var reduceMotion = motionQuery.matches;
    if (typeof motionQuery.addEventListener === "function") {
        motionQuery.addEventListener("change", function (event) {
            reduceMotion = event.matches;
        });
    }

    /* ---------- helpers ---------- */

    function esc(value) {
        return String(value === undefined || value === null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function el(html) {
        var wrap = document.createElement("div");
        wrap.innerHTML = html.trim();
        return wrap.firstElementChild;
    }

    function pad(number) {
        return number < 10 ? "0" + number : String(number);
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    /* ---------- block renderers ---------- */

    var BLOCKS = {
        metric: function (b) {
            return '<div class="av-b av-metric">' +
                '<span class="av-metric-label">' + esc(b.label) + "</span>" +
                '<strong class="av-metric-value">' + esc(b.value) + "</strong>" +
                (b.delta ? '<span class="av-metric-delta">' + esc(b.delta) + "</span>" : "") +
                (typeof b.progress === "number"
                    ? '<span class="av-progress"><i style="width:' + clamp(b.progress, 0, 100) + '%"></i></span>'
                    : "") +
                "</div>";
        },

        tiles: function (b) {
            return '<div class="av-b av-tiles">' + (b.items || []).map(function (item) {
                return '<div class="av-tile" data-tone="' + esc(item.tone || "slate") + '">' +
                    "<span>" + esc(item.label) + "</span>" +
                    "<strong>" + esc(item.value) + "</strong>" +
                    "</div>";
            }).join("") + "</div>";
        },

        chips: function (b) {
            return '<div class="av-b av-chips-b">' +
                (b.title ? '<p class="av-b-title">' + esc(b.title) + "</p>" : "") +
                '<div class="av-chips">' + (b.items || []).map(function (item, index) {
                return '<span class="av-chip' + (index === b.active ? " is-on" : "") + '">' + esc(item) + "</span>";
            }).join("") + "</div></div>";
        },

        list: function (b) {
            return '<div class="av-b av-list">' +
                (b.title ? '<p class="av-b-title">' + esc(b.title) + "</p>" : "") +
                (b.items || []).map(function (item) {
                    var lead = item.initials
                        ? '<span class="av-avatar">' + esc(item.initials) + "</span>"
                        : '<span class="av-dot" data-tone="' + esc(item.dot || "blue") + '"></span>';
                    return '<div class="av-row">' + lead +
                        '<span class="av-row-copy"><b>' + esc(item.title) + "</b>" +
                        '<i>' + esc(item.meta) + "</i></span>" +
                        (item.pill
                            ? '<span class="av-pill" data-tone="' + esc(item.pill.tone || "slate") + '">' + esc(item.pill.text) + "</span>"
                            : "") +
                        "</div>";
                }).join("") + "</div>";
        },

        steps: function (b) {
            return '<div class="av-b av-steps">' + (b.items || []).map(function (item) {
                return '<div class="av-step" data-state="' + esc(item.state || "todo") + '">' +
                    '<span class="av-step-mark"></span>' +
                    '<span class="av-step-copy"><b>' + esc(item.title) + "</b><i>" + esc(item.meta) + "</i></span>" +
                    "</div>";
            }).join("") + "</div>";
        },

        chart: function (b) {
            var bars = b.bars || [];
            var peak = bars.reduce(function (max, bar) { return Math.max(max, bar.value || 0); }, 1);
            return '<div class="av-b av-chart">' +
                (b.title ? '<p class="av-b-title">' + esc(b.title) + "</p>" : "") +
                '<div class="av-chart-plot">' + bars.map(function (bar) {
                    var height = clamp(Math.round((bar.value / peak) * 100), 8, 100);
                    return '<span class="av-bar"><i style="height:' + height + '%"></i><em>' + esc(bar.label) + "</em></span>";
                }).join("") + "</div></div>";
        },

        table: function (b) {
            var head = (b.head || []).map(function (cell) { return "<span>" + esc(cell) + "</span>"; }).join("");
            var rows = (b.rows || []).map(function (row, index) {
                var tone = (b.tones && b.tones[index]) || "slate";
                return '<div class="av-tr">' + row.map(function (cell, cellIndex) {
                    return cellIndex === 1
                        ? '<span class="av-cell-status" data-tone="' + esc(tone) + '">' + esc(cell) + "</span>"
                        : "<span>" + esc(cell) + "</span>";
                }).join("") + "</div>";
            }).join("");
            return '<div class="av-b av-table"><div class="av-th">' + head + "</div>" + rows + "</div>";
        },

        note: function (b) {
            return '<div class="av-b av-note">' +
                '<span class="av-note-kicker">' + esc(b.kicker) + "</span>" +
                "<strong>" + esc(b.title) + "</strong>" +
                "<p>" + esc(b.body) + "</p>" +
                "</div>";
        },

        proof: function (b) {
            return '<div class="av-b av-proof">' + (b.items || []).map(function (item) {
                return '<span class="av-proof-tile" data-tone="' + esc(item.tone || "slate") + '">' +
                    '<i class="av-proof-glyph"></i><b>' + esc(item.label) + "</b></span>";
            }).join("") + "</div>";
        },

        profile: function (b) {
            return '<div class="av-b av-profile">' +
                '<span class="av-profile-avatar">' + esc(b.initials) + "</span>" +
                "<strong>" + esc(b.name) + "</strong>" +
                "<em>" + esc(b.role) + "</em>" +
                '<div class="av-profile-rows">' + (b.rows || []).map(function (row) {
                    return "<span><i>" + esc(row.label) + "</i><b>" + esc(row.value) + "</b></span>";
                }).join("") + "</div></div>";
        },

        search: function (b) {
            return '<div class="av-b av-search"><i class="av-search-glyph"></i><span>' + esc(b.placeholder) + "</span></div>";
        },

        actions: function (b) {
            return '<div class="av-b av-actions">' + (b.items || []).map(function (item) {
                return '<span class="av-action" data-kind="' + esc(item.kind || "ghost") + '">' + esc(item.label) + "</span>";
            }).join("") + "</div>";
        }
    };

    /* ---------- screen rendering ---------- */

    function renderScreen(app, screen) {
        if (screen.image) return renderImageScreen(app, screen);

        var bar = screen.appBar || {};
        var tabs = screen.tabs || { items: [], active: 0 };

        var blocks = (screen.blocks || []).map(function (block) {
            var renderer = BLOCKS[block.t];
            return renderer ? renderer(block) : "";
        }).join("");

        return '<div class="av-screen" data-screen="' + esc(screen.id) + '" data-tone="' + esc(app.accent) + '">' +
            '<div class="av-statusbar"><span>9:41</span>' +
            '<span class="av-sb-icons"><i></i><i></i><i></i></span></div>' +

            '<div class="av-appbar">' +
            (bar.back ? '<span class="av-appbar-back"></span>' : "") +
            '<span class="av-appbar-copy"><b>' + esc(bar.title) + "</b>" +
            (bar.subtitle ? "<i>" + esc(bar.subtitle) + "</i>" : "") + "</span>" +
            '<span class="av-appbar-action"></span>' +
            "</div>" +

            '<div class="av-screen-body">' + blocks + "</div>" +

            '<div class="av-tabbar">' + (tabs.items || []).map(function (item, index) {
                return '<span class="av-tab' + (index === tabs.active ? " is-on" : "") + '">' +
                    '<i class="av-tab-glyph"></i><b>' + esc(item) + "</b></span>";
            }).join("") + "</div>" +
            "</div>";
    }

    function renderImageScreen(app, screen) {
        return '<div class="av-screen av-screen-image" data-kind="image" ' +
            'data-screen="' + esc(screen.id) + '" data-tone="' + esc(app.accent) + '">' +
            '<img src="' + esc(screen.image) + '" width="600" height="1300" ' +
            'loading="lazy" decoding="async" ' +
            'alt="' + esc(app.name + " app screen: " + screen.name) + '">' +
            '<span class="av-screen-fallback" aria-hidden="true">' +
            "<b>" + esc(app.name) + "</b><i>" + esc(screen.name) + "</i></span>" +
            "</div>";
    }

    // A missing asset must never break the showcase - fall back to the label card.
    function guardImages(node) {
        var image = node.querySelector ? node.querySelector("img") : null;
        if (!image) return;
        image.addEventListener("error", function () {
            node.classList.add("av-image-failed");
        }, { once: true });
    }

    function preloadNeighbours(app, index) {
        var screens = app.screens || [];
        var idle = window.requestIdleCallback || function (fn) { return window.setTimeout(fn, 1200); };
        idle(function () {
            [index + 1, index - 1].forEach(function (offset) {
                var screen = screens[((offset % screens.length) + screens.length) % screens.length];
                if (!screen || !screen.image) return;
                var image = new Image();
                image.src = screen.image;
            });
        });
    }

    /* ---------- device ---------- */

    function buildDevice(options) {
        var scale = (options && options.scale) || null;
        var device = el(
            '<div class="av-device"' + (scale ? ' style="--av-scale:' + scale + '"' : "") + ">" +
            '<div class="av-device-tilt">' +
            '<div class="av-device-frame">' +
            '<span class="av-device-notch"></span>' +
            '<div class="av-device-screen"><div class="av-stage"></div></div>' +
            "</div></div></div>"
        );

        var stage = device.querySelector(".av-stage");
        var current = null;
        var currentIndex = -1;

        function show(app, index, direction) {
            var screens = app.screens || [];
            if (!screens.length) return;
            var safeIndex = ((index % screens.length) + screens.length) % screens.length;
            if (current && safeIndex === currentIndex && stage.dataset.app === app.id) return;

            var next = el(renderScreen(app, screens[safeIndex]));
            guardImages(next);
            preloadNeighbours(app, safeIndex);
            var previous = current;
            var dir = direction || (safeIndex > currentIndex ? "next" : "prev");

            stage.dataset.app = app.id;
            currentIndex = safeIndex;
            current = next;

            if (reduceMotion || !previous) {
                if (previous) previous.remove();
                stage.appendChild(next);
                return;
            }

            next.classList.add("av-enter", dir === "next" ? "av-from-right" : "av-from-left");
            stage.appendChild(next);

            // Force layout so the entering transform is committed before release.
            void next.offsetWidth;
            next.classList.remove("av-from-right", "av-from-left");
            previous.classList.add("av-leave", dir === "next" ? "av-to-left" : "av-to-right");

            window.setTimeout(function () {
                if (previous && previous.parentNode) previous.remove();
                next.classList.remove("av-enter");
            }, 420);
        }

        return {
            node: device,
            show: show,
            index: function () { return currentIndex; }
        };
    }

    /* ---------- explorer (modal prototype player) ---------- */

    var Explorer = (function () {
        var root = null;
        var device = null;
        var activeApp = null;
        var activeIndex = 0;
        var lastFocus = null;
        var restoreHash = "";

        function build() {
            root = el(
                '<div class="av-explorer" role="dialog" aria-modal="true" aria-label="Product prototype explorer" hidden>' +
                '<div class="av-explorer-scrim" data-av-close></div>' +
                '<div class="av-explorer-panel" role="document">' +

                '<header class="av-ex-head">' +
                '<div class="av-ex-headline">' +
                '<p class="av-ex-kicker"></p>' +
                '<h2 class="av-ex-title"></h2>' +
                "</div>" +
                '<button type="button" class="av-ex-close" data-av-close aria-label="Close prototype">' +
                '<span aria-hidden="true"></span></button>' +
                "</header>" +

                '<nav class="av-ex-apps" aria-label="Choose a product"></nav>' +

                '<div class="av-ex-body">' +
                '<div class="av-ex-stage">' +
                '<button type="button" class="av-nav av-nav-prev" aria-label="Previous screen"></button>' +
                '<div class="av-ex-device"></div>' +
                '<button type="button" class="av-nav av-nav-next" aria-label="Next screen"></button>' +
                "</div>" +

                '<aside class="av-ex-side">' +
                '<p class="av-ex-tagline"></p>' +
                '<div class="av-ex-screen-meta" aria-live="polite">' +
                '<span class="av-ex-count"></span>' +
                '<h3 class="av-ex-screen-name"></h3>' +
                '<p class="av-ex-caption"></p>' +
                "</div>" +
                '<ol class="av-ex-screens" aria-label="Screens"></ol>' +
                '<div class="av-ex-stack"></div>' +
                '<p class="av-ex-hint">Arrow keys move between screens. Esc closes.</p>' +
                '<div class="av-ex-cta">' +
                '<a class="av-ex-link" target="_blank" rel="noreferrer"></a>' +
                '<button type="button" class="av-ex-brief">Build something like this</button>' +
                "</div>" +
                "</aside>" +
                "</div>" +
                "</div></div>"
            );

            document.body.appendChild(root);
            device = buildDevice({});
            root.querySelector(".av-ex-device").appendChild(device.node);

            root.addEventListener("click", function (event) {
                if (event.target.closest("[data-av-close]")) close();
            });

            root.querySelector(".av-nav-prev").addEventListener("click", function () { step(-1); });
            root.querySelector(".av-nav-next").addEventListener("click", function () { step(1); });

            root.querySelector(".av-ex-apps").addEventListener("click", function (event) {
                var button = event.target.closest("button[data-app]");
                if (button) open(button.dataset.app, 0);
            });

            root.querySelector(".av-ex-brief").addEventListener("click", function () {
                close();
                var target = document.querySelector("#contact");
                if (target) {
                    window.setTimeout(function () {
                        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
                    }, reduceMotion ? 0 : 280);
                }
            });

            root.querySelector(".av-ex-screens").addEventListener("click", function (event) {
                var button = event.target.closest("button[data-index]");
                if (button) go(Number(button.dataset.index));
            });

            document.addEventListener("keydown", onKeydown);
            bindSwipe(root.querySelector(".av-ex-device"));
            window.addEventListener("resize", fit, { passive: true });
        }

        // CSS cannot divide a length down to a unitless scale, so the device
        // is fitted to the viewport here instead.
        function fit() {
            if (!root || root.hidden) return;
            var device = root.querySelector(".av-ex-device .av-device");
            if (!device) return;

            var narrow = window.innerWidth <= 980;
            var byHeight = (window.innerHeight - (narrow ? 250 : 300)) / 670;
            var byWidth = (window.innerWidth - (narrow ? 48 : 580)) / 320;
            var scale = Math.min(byHeight, byWidth, narrow ? 0.8 : 0.95);
            device.style.setProperty("--av-scale", Math.max(0.44, scale).toFixed(3));
        }

        function onKeydown(event) {
            if (!root || root.hidden) return;
            if (event.key === "Escape") { event.preventDefault(); close(); return; }
            if (event.key === "ArrowRight") { event.preventDefault(); step(1); return; }
            if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); return; }
            if (event.key === "Tab") trapFocus(event);
        }

        function trapFocus(event) {
            var focusables = root.querySelectorAll("button, a[href], [tabindex]:not([tabindex='-1'])");
            if (!focusables.length) return;
            var first = focusables[0];
            var last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        function bindSwipe(target) {
            var startX = 0;
            var startY = 0;
            var tracking = false;

            target.addEventListener("touchstart", function (event) {
                if (event.touches.length !== 1) return;
                tracking = true;
                startX = event.touches[0].clientX;
                startY = event.touches[0].clientY;
            }, { passive: true });

            target.addEventListener("touchend", function (event) {
                if (!tracking) return;
                tracking = false;
                var touch = event.changedTouches[0];
                var dx = touch.clientX - startX;
                var dy = touch.clientY - startY;
                if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
            }, { passive: true });
        }

        function renderAppRail() {
            root.querySelector(".av-ex-apps").innerHTML = DATA.apps.map(function (app) {
                return '<button type="button" data-app="' + esc(app.id) + '"' +
                    (app.id === activeApp.id ? ' class="is-on" aria-current="true"' : "") + ">" +
                    "<b>" + esc(app.name) + "</b><i>" + esc(app.kicker) + "</i></button>";
            }).join("");

            var current = root.querySelector(".av-ex-apps button.is-on");
            if (current && current.scrollIntoView) {
                current.scrollIntoView({ inline: "center", block: "nearest" });
            }
        }

        function renderSide() {
            var screens = activeApp.screens || [];
            var screen = screens[activeIndex];

            root.querySelector(".av-ex-kicker").textContent = activeApp.kicker;
            root.querySelector(".av-ex-title").textContent = activeApp.name;
            root.querySelector(".av-ex-tagline").textContent = activeApp.tagline;
            root.querySelector(".av-ex-count").textContent = pad(activeIndex + 1) + " / " + pad(screens.length);
            root.querySelector(".av-ex-screen-name").textContent = screen.name;
            root.querySelector(".av-ex-caption").textContent = screen.caption;

            var list = root.querySelector(".av-ex-screens");
            list.dataset.dense = screens.length > 5 ? "true" : "false";
            list.innerHTML = screens.map(function (item, index) {
                return "<li><button type=\"button\" data-index=\"" + index + "\"" +
                    (index === activeIndex ? ' class="is-on" aria-current="true"' : "") + ">" +
                    "<span>" + pad(index + 1) + "</span>" + esc(item.name) + "</button></li>";
            }).join("");

            root.querySelector(".av-ex-stack").innerHTML = (activeApp.stack || []).map(function (item) {
                return "<span>" + esc(item) + "</span>";
            }).join("");

            var link = root.querySelector(".av-ex-link");
            if (activeApp.link && activeApp.link.url) {
                link.href = activeApp.link.url;
                link.textContent = activeApp.link.label;
                link.hidden = false;
            } else {
                link.hidden = true;
            }

            root.querySelector(".av-explorer-panel").dataset.tone = activeApp.accent || "blue";
        }

        function syncHash() {
            var hash = "#app/" + activeApp.id + "/" + activeApp.screens[activeIndex].id;
            if (window.location.hash !== hash) {
                window.history.replaceState(null, "", hash);
            }
        }

        function go(index, direction) {
            var screens = activeApp.screens || [];
            if (!screens.length) return;
            var next = clamp(index, 0, screens.length - 1);
            var dir = direction || (next > activeIndex ? "next" : "prev");
            activeIndex = next;
            device.show(activeApp, activeIndex, dir);
            renderSide();
            syncHash();
        }

        function step(delta) {
            var screens = activeApp.screens || [];
            var next = (activeIndex + delta + screens.length) % screens.length;
            go(next, delta > 0 ? "next" : "prev");
        }

        function open(appId, screenIndex) {
            if (!root) build();
            var app = DATA.byId(appId) || DATA.apps[0];
            var opening = root.hidden;

            if (opening) {
                lastFocus = document.activeElement;
                restoreHash = window.location.hash;
                root.hidden = false;
                document.body.classList.add("av-locked");
                window.requestAnimationFrame(function () { root.classList.add("is-open"); });
            }

            activeApp = app;
            activeIndex = clamp(screenIndex || 0, 0, (app.screens || []).length - 1);
            renderAppRail();
            fit();
            device.show(activeApp, activeIndex, "next");
            renderSide();
            syncHash();

            if (opening) {
                window.setTimeout(function () {
                    var close = root.querySelector(".av-ex-close");
                    if (close) close.focus();
                }, 40);
            }
        }

        function close() {
            if (!root || root.hidden) return;
            root.classList.remove("is-open");
            document.body.classList.remove("av-locked");

            var hash = restoreHash && restoreHash.indexOf("#app/") !== 0 ? restoreHash : "";
            window.history.replaceState(null, "", window.location.pathname + window.location.search + hash);

            window.setTimeout(function () {
                root.hidden = true;
                if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
            }, reduceMotion ? 0 : 260);
        }

        return { open: open, close: close };
    })();

    /* ---------- hero ---------- */

    function mountHero() {
        var lab = document.querySelector(".hero .device-lab");
        if (!lab) return;

        var app = DATA.byId(HERO.app) || DATA.apps[0];
        // Ordered by HERO.screens, not by the app's own screen order.
        var cycle = HERO.screens.map(function (id) {
            return (app.screens || []).filter(function (screen) { return screen.id === id; })[0];
        }).filter(Boolean);
        if (cycle.length < 2) cycle = (app.screens || []).slice(0, 3);
        if (!cycle.length) return;

        lab.classList.add("av-hero-lab");
        lab.innerHTML = "";

        var device = buildDevice({});
        var trigger = el(
            '<button type="button" class="av-hero-trigger" ' +
            'aria-label="Explore the ' + esc(app.name) + ' prototype"></button>'
        );

        var dots = el('<div class="av-hero-dots" role="tablist" aria-label="Preview screens"></div>');
        cycle.forEach(function (screen, index) {
            var dot = el('<button type="button" role="tab" class="av-hero-dot" ' +
                'aria-label="' + esc(screen.name) + '"></button>');
            dot.addEventListener("click", function () {
                setIndex(index, "manual");
            });
            dots.appendChild(dot);
        });

        var caption = el('<p class="av-hero-caption"><b></b><i></i></p>');

        trigger.appendChild(device.node);
        lab.appendChild(trigger);
        lab.appendChild(dots);
        lab.appendChild(caption);

        var index = 0;
        var timer = null;
        var paused = false;

        var heroApp = { id: app.id, accent: app.accent, name: app.name, screens: cycle };

        function paint() {
            device.show(heroApp, index, "next");
            var screen = cycle[index];
            caption.querySelector("b").textContent = screen.name;
            caption.querySelector("i").textContent = screen.caption;
            Array.prototype.forEach.call(dots.children, function (dot, dotIndex) {
                dot.classList.toggle("is-on", dotIndex === index);
                dot.setAttribute("aria-selected", dotIndex === index ? "true" : "false");
            });
        }

        function setIndex(next) {
            index = ((next % cycle.length) + cycle.length) % cycle.length;
            paint();
            restart();
        }

        function restart() {
            window.clearInterval(timer);
            if (reduceMotion || paused) return;
            timer = window.setInterval(function () {
                setIndexQuiet(index + 1);
            }, 4600);
        }

        function setIndexQuiet(next) {
            index = ((next % cycle.length) + cycle.length) % cycle.length;
            paint();
        }

        trigger.addEventListener("click", function () {
            Explorer.open(app.id, app.screens.indexOf(cycle[index]));
        });

        ["pointerenter", "focusin"].forEach(function (name) {
            lab.addEventListener(name, function () { paused = true; window.clearInterval(timer); });
        });
        ["pointerleave", "focusout"].forEach(function (name) {
            lab.addEventListener(name, function () { paused = false; restart(); });
        });

        document.addEventListener("visibilitychange", function () {
            if (document.hidden) window.clearInterval(timer);
            else restart();
        });

        if ("IntersectionObserver" in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) restart();
                    else window.clearInterval(timer);
                });
            }, { threshold: 0.2 });
            observer.observe(lab);
        }

        bindParallax(trigger, device.node);
        paint();

        var first = device.node.querySelector("img");
        if (first) {
            first.loading = "eager";
            first.setAttribute("fetchpriority", "high");
        }

        restart();
    }

    function bindParallax(surface, target) {
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        var frame = 0;

        surface.addEventListener("pointermove", function (event) {
            if (reduceMotion) return;
            if (frame) return;
            frame = window.requestAnimationFrame(function () {
                frame = 0;
                var rect = surface.getBoundingClientRect();
                var x = (event.clientX - rect.left) / rect.width - 0.5;
                var y = (event.clientY - rect.top) / rect.height - 0.5;
                target.style.setProperty("--av-rx", (-y * 5).toFixed(2) + "deg");
                target.style.setProperty("--av-ry", (x * 6).toFixed(2) + "deg");
                target.style.setProperty("--av-lift", "-6px");
            });
        });

        surface.addEventListener("pointerleave", function () {
            target.style.setProperty("--av-rx", "0deg");
            target.style.setProperty("--av-ry", "0deg");
            target.style.setProperty("--av-lift", "0px");
        });
    }

    /* ---------- flagship case visual ---------- */

    function mountFlagship() {
        var visual = document.querySelector(".case-hero .case-visual");
        if (!visual || visual.dataset.avMounted === "true") return;

        // A real screenshot already sits here - leave it alone.
        if (visual.querySelector("img")) return;

        var app = DATA.byId("profix") || DATA.apps[0];
        var screens = app.screens || [];
        if (!screens.length) return;

        visual.dataset.avMounted = "true";
        visual.classList.add("av-flagship");
        visual.innerHTML = "";

        var device = buildDevice({});
        var stage = el('<div class="av-flagship-stage"></div>');
        var trigger = el('<button type="button" class="av-flagship-trigger" ' +
            'aria-label="Open the ' + esc(app.name) + ' prototype"></button>');
        trigger.appendChild(device.node);
        stage.appendChild(trigger);

        var tabs = el('<div class="av-seg" role="tablist" aria-label="' + esc(app.name) + ' screens"></div>');
        var index = 0;

        screens.forEach(function (screen, screenIndex) {
            var button = el('<button type="button" role="tab" class="av-seg-item">' + esc(screen.name) + "</button>");
            button.addEventListener("click", function () {
                var direction = screenIndex > index ? "next" : "prev";
                index = screenIndex;
                device.show(app, index, direction);
                paint();
            });
            tabs.appendChild(button);
        });

        var open = el('<button type="button" class="av-open-proto">' +
            "<span>Open full prototype</span></button>");
        open.addEventListener("click", function () { Explorer.open(app.id, index); });
        trigger.addEventListener("click", function () { Explorer.open(app.id, index); });

        function paint() {
            Array.prototype.forEach.call(tabs.children, function (button, buttonIndex) {
                button.classList.toggle("is-on", buttonIndex === index);
                button.setAttribute("aria-selected", buttonIndex === index ? "true" : "false");
            });
        }

        visual.appendChild(stage);
        visual.appendChild(tabs);
        visual.appendChild(open);

        device.show(app, 0, "next");
        paint();
        bindParallax(trigger, device.node);
    }

    /* ---------- portfolio cards ---------- */

    function appForCard(card) {
        var heading = card.querySelector("h3");
        var title = heading ? heading.textContent.trim().toLowerCase() : "";
        var link = card.querySelector("a[href]");
        var href = link ? link.getAttribute("href") : "";

        for (var i = 0; i < DATA.apps.length; i += 1) {
            var app = DATA.apps[i];
            if (title && (title === app.name.toLowerCase() || title.indexOf(app.name.toLowerCase()) === 0)) return app;
            if (app.link && app.link.url && href && href === app.link.url) return app;
        }

        // Fall back to id similarity so admin-renamed titles still resolve.
        for (var j = 0; j < DATA.apps.length; j += 1) {
            var candidate = DATA.apps[j];
            var slug = title.replace(/[^a-z]+/g, "-");
            if (slug && candidate.id.indexOf(slug.split("-")[0]) === 0) return candidate;
        }
        return null;
    }

    function upgradeCards() {
        var cards = document.querySelectorAll(".case-grid .case-card");
        Array.prototype.forEach.call(cards, function (card) {
            if (card.dataset.avMounted === "true") return;

            var app = appForCard(card);
            var visual = card.querySelector(".case-card-visual");
            if (!app || !visual) return;

            // site-render.js may already have put a real screenshot in the card.
            if (visual.querySelector("img")) { card.dataset.avMounted = "true"; return; }

            card.dataset.avMounted = "true";
            card.classList.add("av-card");
            visual.className = "case-card-visual av-card-visual";
            visual.setAttribute("data-tone", app.accent || "blue");
            visual.innerHTML = "";

            var device = buildDevice({});
            var trigger = el('<button type="button" class="av-card-trigger" ' +
                'aria-label="Explore the ' + esc(app.name) + ' prototype, ' + app.screens.length + ' screens"></button>');
            trigger.appendChild(device.node);
            visual.appendChild(trigger);

            device.show(app, 0, "next");

            trigger.addEventListener("click", function () { Explorer.open(app.id, 0); });

            var explore = el('<button type="button" class="av-card-explore">' +
                "Explore " + app.screens.length + " screens</button>");
            explore.addEventListener("click", function () { Explorer.open(app.id, 0); });

            // Keep both calls to action on one line instead of drifting apart.
            var actions = el('<div class="av-card-actions"></div>');
            actions.appendChild(explore);

            var anchor = card.querySelector(":scope > a");
            if (anchor) {
                card.insertBefore(actions, anchor);
                actions.appendChild(anchor);
            } else {
                card.appendChild(actions);
            }
        });
    }

    function watchCards() {
        var grid = document.querySelector(".case-grid");
        if (!grid) return;
        upgradeCards();

        var queued = false;
        var observer = new MutationObserver(function () {
            if (queued) return;
            queued = true;
            window.setTimeout(function () {
                queued = false;
                upgradeCards();
            }, 0);
        });
        observer.observe(grid, { childList: true });
    }

    /* ---------- embedded prototype ---------- */

    // <div data-av-showcase="snowgrid" data-av-start="live-dispatch"></div>
    function mountEmbeds() {
        var hosts = document.querySelectorAll("[data-av-showcase]");
        Array.prototype.forEach.call(hosts, function (host) {
            if (host.dataset.avMounted === "true") return;
            var app = DATA.byId(host.dataset.avShowcase);
            if (!app || !app.screens.length) return;

            host.dataset.avMounted = "true";
            host.classList.add("av-embed");
            host.setAttribute("data-tone", app.accent || "blue");

            var index = 0;
            if (host.dataset.avStart) {
                app.screens.forEach(function (screen, i) {
                    if (screen.id === host.dataset.avStart) index = i;
                });
            }

            var device = buildDevice({});
            var stage = el('<div class="av-embed-stage"></div>');
            var trigger = el('<button type="button" class="av-embed-trigger" ' +
                'aria-label="Open the ' + esc(app.name) + ' prototype"></button>');
            trigger.appendChild(device.node);
            stage.appendChild(trigger);

            var meta = el(
                '<div class="av-embed-meta">' +
                '<p class="av-embed-count" aria-live="polite"></p>' +
                '<h3 class="av-embed-name"></h3>' +
                '<p class="av-embed-caption"></p>' +
                '<div class="av-embed-controls">' +
                '<button type="button" class="av-embed-nav" data-dir="-1" aria-label="Previous screen"></button>' +
                '<button type="button" class="av-embed-nav av-next" data-dir="1" aria-label="Next screen"></button>' +
                '<button type="button" class="av-embed-open">Open full prototype</button>' +
                "</div>" +
                '<ol class="av-embed-list"></ol>' +
                "</div>"
            );

            host.appendChild(stage);
            host.appendChild(meta);

            var list = meta.querySelector(".av-embed-list");
            list.innerHTML = app.screens.map(function (screen, i) {
                return '<li><button type="button" data-index="' + i + '">' +
                    pad(i + 1) + " " + esc(screen.name) + "</button></li>";
            }).join("");

            function paint(direction) {
                var screen = app.screens[index];
                device.show(app, index, direction || "next");
                meta.querySelector(".av-embed-count").textContent =
                    pad(index + 1) + " / " + pad(app.screens.length);
                meta.querySelector(".av-embed-name").textContent = screen.name;
                meta.querySelector(".av-embed-caption").textContent = screen.caption;
                Array.prototype.forEach.call(list.querySelectorAll("button"), function (b, i) {
                    b.classList.toggle("is-on", i === index);
                    if (i === index) b.setAttribute("aria-current", "true");
                    else b.removeAttribute("aria-current");
                });
            }

            function step(delta) {
                index = (index + delta + app.screens.length) % app.screens.length;
                paint(delta > 0 ? "next" : "prev");
            }

            meta.querySelector(".av-embed-controls").addEventListener("click", function (event) {
                var nav = event.target.closest(".av-embed-nav");
                if (nav) { step(Number(nav.dataset.dir)); return; }
                if (event.target.closest(".av-embed-open")) Explorer.open(app.id, index);
            });

            list.addEventListener("click", function (event) {
                var button = event.target.closest("button[data-index]");
                if (!button) return;
                var next = Number(button.dataset.index);
                var direction = next > index ? "next" : "prev";
                index = next;
                paint(direction);
            });

            trigger.addEventListener("click", function () { Explorer.open(app.id, index); });

            host.addEventListener("keydown", function (event) {
                if (event.key === "ArrowRight") { event.preventDefault(); step(1); }
                if (event.key === "ArrowLeft") { event.preventDefault(); step(-1); }
            });

            bindParallax(trigger, device.node);
            paint("next");

            var first = device.node.querySelector("img");
            if (first) first.loading = "eager";
        });
    }

    /* ---------- deep links ---------- */

    function openFromHash() {
        var match = /^#app\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/i.exec(window.location.hash || "");
        if (!match) return;
        var app = DATA.byId(match[1]);
        if (!app) return;
        var index = 0;
        if (match[2]) {
            app.screens.forEach(function (screen, screenIndex) {
                if (screen.id === match[2]) index = screenIndex;
            });
        }
        Explorer.open(app.id, index);
    }

    // Review-harness hook (used by _review.html only; harmless in production).
    window.__AV_MOUNT = function (stage, app, screen) {
        var node = el(renderScreen(app, screen));
        guardImages(node);
        stage.appendChild(node);
    };

    /* ---------- boot ---------- */

    function boot() {
        mountHero();
        mountFlagship();
        mountEmbeds();
        watchCards();
        openFromHash();
        window.addEventListener("hashchange", openFromHash);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
