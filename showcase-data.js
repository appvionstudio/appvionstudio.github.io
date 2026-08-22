/* ============================================================
   AppVion Studio - Product Showcase Data
   Declarative app catalog. Adding a new app = adding one entry
   here. No component code needs to change.

   Screen block vocabulary (rendered by showcase.js):
     metric  { label, value, delta, progress }
     tiles   { items:[{ label, value, tone }] }
     chips   { items:[..], active }
     list    { title, items:[{ initials|dot, title, meta, pill:{text,tone} }] }
     steps   { items:[{ title, meta, state:'done'|'active'|'todo' }] }
     chart   { title, bars:[{ label, value }] }
     table   { head:[..], rows:[[..]], tones:[..] }
     note    { kicker, title, body }
     proof   { items:[{ label, tone }] }
     profile { initials, name, role, rows:[{ label, value }] }
     search  { placeholder }
     actions { items:[{ label, kind:'primary'|'ghost' }] }

   Tones: blue | green | amber | rose | slate
   ============================================================ */
(function () {
    "use strict";

    var APPS = [
        {
            id: "profix",
            name: "ProFix",
            kicker: "Field service platform",
            tagline: "A maintenance command layer that keeps dispatch, proof, and approval in one loop.",
            accent: "blue",
            stack: ["Kotlin Multiplatform", "Compose", "Supabase", "Realtime"],
            link: { label: "Watch demo", url: "https://www.youtube.com/shorts/xUjasnRtmkQ" },
            screens: [
                {
                    id: "dispatch",
                    name: "Dispatch",
                    caption: "Every open job ranked by SLA risk, with the right contractor already matched.",
                    appBar: { title: "Dispatch", subtitle: "Tuesday, 14 January" },
                    blocks: [
                        { t: "metric", label: "Active tasks", value: "38", delta: "+6 today", progress: 72 },
                        { t: "chips", items: ["All", "Urgent", "Unassigned"], active: 1 },
                        {
                            t: "list",
                            items: [
                                { initials: "HV", title: "HVAC unit down", meta: "Block C · SLA 2h", pill: { text: "Urgent", tone: "rose" } },
                                { initials: "PL", title: "Leak in riser 4", meta: "Tower A · SLA 6h", pill: { text: "Assigned", tone: "blue" } },
                                { initials: "EL", title: "Corridor lighting", meta: "Block B · SLA 1d", pill: { text: "Queued", tone: "slate" } }
                            ]
                        },
                        { t: "tiles", items: [{ label: "Unassigned", value: "4", tone: "amber" }, { label: "Breaching", value: "1", tone: "rose" }] }
                    ],
                    tabs: { items: ["Jobs", "Proof", "Team", "You"], active: 0 }
                },
                {
                    id: "job",
                    name: "Job detail",
                    caption: "One screen holds the scope, the site history, and the contractor already on the way.",
                    appBar: { back: true, title: "HVAC unit down", subtitle: "Job #4821 · Block C" },
                    blocks: [
                        { t: "note", kicker: "Reported 08:12", title: "No cooling on floors 3-5", body: "Tenant reported warm air across the east wing. Compressor suspected." },
                        { t: "tiles", items: [{ label: "Priority", value: "P1", tone: "rose" }, { label: "SLA left", value: "1h 42m", tone: "amber" }] },
                        {
                            t: "list",
                            title: "Assigned",
                            items: [
                                { initials: "RK", title: "Rehan Khalid", meta: "HVAC certified · 12 min away", pill: { text: "En route", tone: "green" } }
                            ]
                        },
                        {
                            t: "list",
                            title: "Site history",
                            items: [
                                { dot: "slate", title: "Filter replaced", meta: "12 Nov · Closed same day" },
                                { dot: "slate", title: "Thermostat recalibrated", meta: "04 Sep · Closed in 2 days" }
                            ]
                        },
                        { t: "actions", items: [{ label: "Start job", kind: "primary" }, { label: "Reassign", kind: "ghost" }] }
                    ],
                    tabs: { items: ["Jobs", "Proof", "Team", "You"], active: 0 }
                },
                {
                    id: "proof",
                    name: "Proof of work",
                    caption: "Before and after evidence is captured on site, so approvals stop depending on phone calls.",
                    appBar: { back: true, title: "Proof of work", subtitle: "Job #4821" },
                    blocks: [
                        { t: "proof", items: [{ label: "Before", tone: "slate" }, { label: "After", tone: "green" }] },
                        { t: "note", kicker: "Technician note", title: "Compressor relay replaced", body: "Unit tested for 20 minutes. Output temperature back within range." },
                        {
                            t: "steps",
                            items: [
                                { title: "Photos attached", meta: "2 files · 08:54", state: "done" },
                                { title: "Parts logged", meta: "1 relay unit", state: "done" },
                                { title: "Submit for approval", meta: "Sends to site manager", state: "active" }
                            ]
                        }
                    ],
                    tabs: { items: ["Jobs", "Proof", "Team", "You"], active: 1 }
                },
                {
                    id: "approval",
                    name: "Approval",
                    caption: "Managers approve remotely with the full record in front of them - no site visit required.",
                    appBar: { title: "Approvals", subtitle: "3 waiting on you" },
                    blocks: [
                        { t: "tiles", items: [{ label: "Waiting", value: "3", tone: "amber" }, { label: "Closed today", value: "11", tone: "green" }] },
                        {
                            t: "list",
                            items: [
                                { initials: "48", title: "Job #4821 · HVAC", meta: "Proof complete · 09:02", pill: { text: "Review", tone: "amber" } },
                                { initials: "47", title: "Job #4790 · Plumbing", meta: "Proof complete · 08:31", pill: { text: "Review", tone: "amber" } },
                                { initials: "46", title: "Job #4776 · Lighting", meta: "Approved · 07:58", pill: { text: "Closed", tone: "green" } }
                            ]
                        },
                        { t: "actions", items: [{ label: "Approve & close", kind: "primary" }, { label: "Request changes", kind: "ghost" }] }
                    ],
                    tabs: { items: ["Jobs", "Proof", "Team", "You"], active: 1 }
                },
                {
                    id: "insight",
                    name: "Operations",
                    caption: "The numbers owners actually ask for: throughput, first-time fix rate, and where time is lost.",
                    appBar: { title: "Operations", subtitle: "Last 6 weeks" },
                    blocks: [
                        { t: "tiles", items: [{ label: "First-time fix", value: "91%", tone: "green" }, { label: "Avg close", value: "4.2h", tone: "blue" }] },
                        {
                            t: "chart",
                            title: "Jobs closed per week",
                            bars: [
                                { label: "W1", value: 54 }, { label: "W2", value: 68 },
                                { label: "W3", value: 47 }, { label: "W4", value: 82 },
                                { label: "W5", value: 74 }, { label: "W6", value: 96 }
                            ]
                        },
                        { t: "metric", label: "SLA compliance", value: "97.4%", delta: "+3.1 pts", progress: 97 },
                        {
                            t: "list",
                            title: "Slowest sites",
                            items: [
                                { dot: "rose", title: "Tower A", meta: "Avg close 7.8h" },
                                { dot: "amber", title: "Block C", meta: "Avg close 5.1h" }
                            ]
                        }
                    ],
                    tabs: { items: ["Jobs", "Proof", "Team", "You"], active: 3 }
                }
            ]
        },

        {
            id: "snowgrid",
            name: "SnowGrid",
            kicker: "Enterprise operations",
            tagline: "Snow removal run as a live network: property owners, dispatch, contractors, and drivers on one grid.",
            accent: "blue",
            stack: ["Android Native", "Mapbox", "Live dispatch", "Escrow payouts"],
            screens: [
                {
                    id: "fleet-intelligence",
                    name: "Fleet intelligence",
                    caption: "The operator opens to daily revenue, active operations, and escrow balance - the three numbers that decide the day.",
                    image: "assets/screens/snowgrid/fleet-intelligence.jpg"
                },
                {
                    id: "live-dispatch",
                    name: "Live dispatch",
                    caption: "Crews and properties on one live map, so assignment is a decision rather than a phone call.",
                    image: "assets/screens/snowgrid/live-dispatch.jpg"
                },
                {
                    id: "fleet-operations",
                    name: "Fleet operations",
                    caption: "Every job carries its own approval state and payout, pending through approved, with nothing tracked off-system.",
                    image: "assets/screens/snowgrid/fleet-operations.jpg"
                },
                {
                    id: "pricing-engine",
                    name: "Pricing engine",
                    caption: "Snow depth, surface area, and priority resolve into a quoted price the customer can authorise on the spot.",
                    image: "assets/screens/snowgrid/pricing-engine.jpg"
                },
                {
                    id: "service-request",
                    name: "Customer request",
                    caption: "The property owner side stays deliberately small: pick the site, see the price, authorise the work.",
                    image: "assets/screens/snowgrid/service-request.jpg"
                },
                {
                    id: "site-measurement",
                    name: "Site measurement",
                    caption: "Owners trace their own lot on the map and the app returns area and perimeter that the pricing engine then uses.",
                    image: "assets/screens/snowgrid/site-measurement.jpg"
                },
                {
                    id: "driver-portal",
                    name: "Driver portal",
                    caption: "Drivers get tasks, photo evidence, and payout history in a portal built for gloves and bad weather.",
                    image: "assets/screens/snowgrid/driver-portal.jpg"
                }
            ]
        },

        {
            id: "gmasspulse",
            name: "GMassPulse",
            kicker: "Outreach infrastructure",
            tagline: "Cold email operations on mobile: import, compose, follow up, and stay inside deliverability limits.",
            accent: "green",
            stack: ["Android Native", "Google OAuth", "Sheets sync", "Supabase"],
            screens: [
                {
                    id: "pulse-dashboard",
                    name: "Pulse dashboard",
                    caption: "Lifetime sends and opens first, campaign list underneath - the operator sees performance before controls.",
                    image: "assets/screens/gmasspulse/pulse-dashboard.jpg"
                },
                {
                    id: "import-leads",
                    name: "Import leads",
                    caption: "Leads pull straight from a Google Sheet and get validated before a single email is queued.",
                    image: "assets/screens/gmasspulse/import-leads.jpg"
                },
                {
                    id: "campaign-editor",
                    name: "Campaign editor",
                    caption: "Subject, body, and merge fields composed on a phone without the layout fighting the keyboard.",
                    image: "assets/screens/gmasspulse/campaign-editor.jpg"
                },
                {
                    id: "auto-followups",
                    name: "Auto follow-ups",
                    caption: "Follow-up steps are scheduled with timezone-aware sending, because reply rate lives in the sequence.",
                    image: "assets/screens/gmasspulse/auto-followups.jpg"
                },
                {
                    id: "deliverability",
                    name: "Deliverability engine",
                    caption: "Daily limits and throttling are enforced in the product, so a campaign cannot quietly burn the domain.",
                    image: "assets/screens/gmasspulse/deliverability.jpg"
                }
            ]
        },

        {
            id: "wum-connect",
            name: "WUM Connect",
            kicker: "University product",
            tagline: "Role-aware campus communication that still works when the network does not.",
            accent: "green",
            stack: ["Android Native", "Firebase", "Offline-first", "Role access"],
            link: { label: "Watch demo", url: "https://youtu.be/9I1OX1Z4w-Q" },
            screens: [
                {
                    id: "feed",
                    name: "Campus feed",
                    caption: "Students, faculty, and admin each open the same app and see only what applies to them.",
                    appBar: { title: "Campus", subtitle: "Spring semester" },
                    blocks: [
                        { t: "chips", items: ["All", "Academics", "Events"], active: 0 },
                        {
                            t: "list",
                            items: [
                                { dot: "rose", title: "Exam schedule updated", meta: "Admin · 10 min ago", pill: { text: "New", tone: "rose" } },
                                { dot: "blue", title: "Lab session moved to 2pm", meta: "Faculty · 1 hour ago" },
                                { dot: "green", title: "Library hours extended", meta: "Admin · Yesterday" }
                            ]
                        },
                        { t: "note", kicker: "Reaching", title: "4 active roles", body: "One broadcast fans out to students, faculty, staff, and admin with separate read receipts." }
                    ],
                    tabs: { items: ["Feed", "Courses", "Alerts", "You"], active: 0 }
                },
                {
                    id: "announcement",
                    name: "Announcement",
                    caption: "Delivery is measurable - the admin sees exactly who has read a notice and who has not.",
                    appBar: { back: true, title: "Exam schedule updated", subtitle: "Posted by Registrar" },
                    blocks: [
                        { t: "note", kicker: "Effective 20 January", title: "Midterm week shifts forward", body: "All midterm papers move one week earlier. Revised timetable is attached to your course page." },
                        { t: "tiles", items: [{ label: "Delivered", value: "2,418", tone: "blue" }, { label: "Read", value: "86%", tone: "green" }] },
                        {
                            t: "list",
                            title: "Attached",
                            items: [
                                { dot: "blue", title: "Midterm timetable", meta: "PDF · 240 KB" },
                                { dot: "slate", title: "Seating plan", meta: "PDF · 96 KB" }
                            ]
                        },
                        { t: "actions", items: [{ label: "Open timetable", kind: "primary" }, { label: "Save offline", kind: "ghost" }] }
                    ],
                    tabs: { items: ["Feed", "Courses", "Alerts", "You"], active: 0 }
                },
                {
                    id: "roles",
                    name: "Roles",
                    caption: "Access is structural, not cosmetic - permissions are enforced at the data layer.",
                    appBar: { title: "Roles & access", subtitle: "Admin console" },
                    blocks: [
                        {
                            t: "list",
                            items: [
                                { initials: "ST", title: "Students", meta: "2,140 accounts", pill: { text: "Read", tone: "slate" } },
                                { initials: "FA", title: "Faculty", meta: "184 accounts", pill: { text: "Post", tone: "blue" } },
                                { initials: "AD", title: "Admin", meta: "12 accounts", pill: { text: "Full", tone: "green" } }
                            ]
                        },
                        { t: "search", placeholder: "Search a person or department" },
                        { t: "tiles", items: [{ label: "Broadcasts", value: "128", tone: "blue" }, { label: "Read rate", value: "86%", tone: "green" }] }
                    ],
                    tabs: { items: ["Feed", "Courses", "Alerts", "You"], active: 1 }
                },
                {
                    id: "offline",
                    name: "Offline sync",
                    caption: "Campus wifi drops constantly. The app queues writes locally and reconciles on reconnect.",
                    appBar: { title: "Sync", subtitle: "Offline mode active" },
                    blocks: [
                        { t: "metric", label: "Cached for offline", value: "312 items", delta: "Updated 4 min ago", progress: 88 },
                        {
                            t: "steps",
                            items: [
                                { title: "Announcements cached", meta: "Last 30 days", state: "done" },
                                { title: "Course material cached", meta: "Enrolled courses only", state: "done" },
                                { title: "Pending uploads", meta: "2 queued · retry on reconnect", state: "active" }
                            ]
                        },
                        { t: "tiles", items: [{ label: "On device", value: "42 MB", tone: "slate" }, { label: "Last sync", value: "4 min", tone: "blue" }] }
                    ],
                    tabs: { items: ["Feed", "Courses", "Alerts", "You"], active: 2 }
                },
                {
                    id: "profile",
                    name: "Profile",
                    caption: "Identity, enrolment, and notification control in one predictable place.",
                    appBar: { title: "You", subtitle: "Student account" },
                    blocks: [
                        {
                            t: "profile", initials: "AH", name: "Ayesha Hassan", role: "BS Computer Science · Semester 6",
                            rows: [
                                { label: "Roll number", value: "CS-2021-118" },
                                { label: "Department", value: "Computer Science" },
                                { label: "Enrolled courses", value: "6" },
                                { label: "Attendance", value: "92%" },
                                { label: "Notifications", value: "All roles" }
                            ]
                        },
                        { t: "actions", items: [{ label: "Edit preferences", kind: "ghost" }] }
                    ],
                    tabs: { items: ["Feed", "Courses", "Alerts", "You"], active: 3 }
                }
            ]
        },

        {
            id: "attendance-management",
            name: "Attendance Suite",
            kicker: "Data-heavy utility",
            tagline: "Thousands of records, browsed smoothly, with the exception cases surfaced first.",
            accent: "amber",
            stack: ["Android Native", "Paging 3", "Room", "Export"],
            link: { label: "Watch demo", url: "https://youtu.be/NnlCmr_C4Cw" },
            screens: [
                {
                    id: "sessions",
                    name: "Sessions",
                    caption: "Today's sessions with live capture status, so nothing is marked twice or missed.",
                    appBar: { title: "Sessions", subtitle: "Today · 14 January" },
                    blocks: [
                        { t: "tiles", items: [{ label: "Present", value: "98%", tone: "green" }, { label: "Flagged", value: "7", tone: "amber" }] },
                        {
                            t: "list",
                            items: [
                                { initials: "DS", title: "Data Structures", meta: "08:30 · Room 204", pill: { text: "Live", tone: "green" } },
                                { initials: "OS", title: "Operating Systems", meta: "10:00 · Room 118", pill: { text: "Closed", tone: "slate" } },
                                { initials: "DB", title: "Database Systems", meta: "13:15 · Lab 2", pill: { text: "Upcoming", tone: "blue" } }
                            ]
                        },
                        { t: "note", kicker: "Flagged", title: "7 records need review", body: "Late marks and duplicate scans are grouped so a coordinator clears them in one pass." }
                    ],
                    tabs: { items: ["Today", "Records", "Reports", "You"], active: 0 }
                },
                {
                    id: "roster",
                    name: "Live roster",
                    caption: "Paging 3 keeps a 4,000-row roster scrolling at 60fps on mid-range hardware.",
                    appBar: { back: true, title: "Data Structures", subtitle: "62 enrolled · 08:30" },
                    blocks: [
                        { t: "search", placeholder: "Search roll number" },
                        {
                            t: "table",
                            head: ["ID", "Status", "Time"],
                            rows: [
                                ["CS-21", "Present", "08:55"],
                                ["CS-22", "Late", "09:08"],
                                ["CS-23", "Present", "08:51"],
                                ["CS-24", "Absent", "—"],
                                ["CS-25", "Present", "08:49"],
                                ["CS-26", "Present", "08:57"],
                                ["CS-27", "Late", "09:12"],
                                ["CS-28", "Present", "08:53"]
                            ],
                            tones: ["green", "amber", "green", "rose", "green", "green", "amber", "green"]
                        },
                        { t: "tiles", items: [{ label: "Marked", value: "58 / 62", tone: "blue" }, { label: "Scrolled", value: "4,120 rows", tone: "slate" }] }
                    ],
                    tabs: { items: ["Today", "Records", "Reports", "You"], active: 1 }
                },
                {
                    id: "record",
                    name: "Student record",
                    caption: "One student, one history - the view a department head opens before a decision.",
                    appBar: { back: true, title: "CS-22", subtitle: "Bilal Ahmed" },
                    blocks: [
                        { t: "metric", label: "Attendance", value: "78%", delta: "Below 80% threshold", progress: 78 },
                        {
                            t: "chart",
                            title: "Weekly presence",
                            bars: [
                                { label: "M", value: 90 }, { label: "T", value: 60 },
                                { label: "W", value: 100 }, { label: "T", value: 45 },
                                { label: "F", value: 85 }
                            ]
                        },
                        { t: "actions", items: [{ label: "Export record", kind: "primary" }] }
                    ],
                    tabs: { items: ["Today", "Records", "Reports", "You"], active: 1 }
                },
                {
                    id: "reports",
                    name: "Reports",
                    caption: "Institutional reporting without a spreadsheet export step in the middle.",
                    appBar: { title: "Reports", subtitle: "Semester to date" },
                    blocks: [
                        { t: "chips", items: ["Semester", "Month", "Week"], active: 0 },
                        {
                            t: "chart",
                            title: "Attendance by department",
                            bars: [
                                { label: "CS", value: 92 }, { label: "EE", value: 78 },
                                { label: "ME", value: 84 }, { label: "BBA", value: 66 },
                                { label: "MAT", value: 88 }
                            ]
                        },
                        { t: "tiles", items: [{ label: "Records", value: "41,208", tone: "blue" }, { label: "Below 75%", value: "134", tone: "rose" }] }
                    ],
                    tabs: { items: ["Today", "Records", "Reports", "You"], active: 2 }
                }
            ]
        },

        {
            id: "sports-society-events",
            name: "Sports Society",
            kicker: "Events platform",
            tagline: "Event coordination that survives contact with 120 signups and three filter changes.",
            accent: "rose",
            stack: ["Android Native", "Firebase", "Filtering", "Push"],
            link: { label: "Watch demo", url: "https://youtube.com/shorts/1dSV-00hZr4" },
            screens: [
                {
                    id: "events",
                    name: "Events",
                    caption: "What is open, what is closing, and what already filled - readable in one glance.",
                    appBar: { title: "Events", subtitle: "Spring season" },
                    blocks: [
                        { t: "chips", items: ["All", "Open", "This week"], active: 1 },
                        {
                            t: "list",
                            items: [
                                { dot: "green", title: "Cricket trials", meta: "18 Jan · Main ground", pill: { text: "Open", tone: "green" } },
                                { dot: "amber", title: "Football 7-a-side", meta: "21 Jan · Turf B", pill: { text: "3 left", tone: "amber" } },
                                { dot: "slate", title: "Table tennis cup", meta: "24 Jan · Sports hall", pill: { text: "Full", tone: "slate" } }
                            ]
                        },
                        { t: "note", kicker: "This week", title: "3 events close on Friday", body: "Entries lock automatically once a slot limit is reached, so organisers stop managing a waitlist by hand." }
                    ],
                    tabs: { items: ["Events", "Teams", "Alerts", "You"], active: 0 }
                },
                {
                    id: "filters",
                    name: "Filters",
                    caption: "Filters combine instead of replacing each other - the detail that decides whether people use it.",
                    appBar: { back: true, title: "Filter events", subtitle: "3 active" },
                    blocks: [
                        { t: "chips", title: "Sport", items: ["Cricket", "Football", "Athletics", "Table tennis"], active: 0 },
                        { t: "chips", title: "When", items: ["This week", "This month", "Season"], active: 0 },
                        { t: "chips", title: "Availability", items: ["Open only", "Free entry", "Team events"], active: 1 },
                        { t: "note", kicker: "Combined", title: "3 filters active", body: "Filters stack rather than replace each other, so a narrowed list stays narrowed." },
                        { t: "actions", items: [{ label: "Show 14 events", kind: "primary" }, { label: "Reset", kind: "ghost" }] }
                    ],
                    tabs: { items: ["Events", "Teams", "Alerts", "You"], active: 0 }
                },
                {
                    id: "detail",
                    name: "Event detail",
                    caption: "Everything a participant needs before committing, without a second screen.",
                    appBar: { back: true, title: "Cricket trials", subtitle: "18 January · 07:00" },
                    blocks: [
                        { t: "note", kicker: "Main ground", title: "Open trials, all departments", body: "Bring your own kit. Selection announced the same evening on the campus feed." },
                        { t: "tiles", items: [{ label: "Signups", value: "120", tone: "blue" }, { label: "Slots left", value: "30", tone: "green" }] },
                        { t: "actions", items: [{ label: "Register", kind: "primary" }, { label: "Add to calendar", kind: "ghost" }] }
                    ],
                    tabs: { items: ["Events", "Teams", "Alerts", "You"], active: 0 }
                },
                {
                    id: "register",
                    name: "Registration",
                    caption: "Three fields, one confirmation. Drop-off happens where forms get greedy.",
                    appBar: { back: true, title: "Register", subtitle: "Cricket trials" },
                    blocks: [
                        { t: "note", kicker: "30 slots left", title: "Cricket trials", body: "18 January · 07:00 · Main ground. Entry closes once the slot limit is reached." },
                        {
                            t: "steps",
                            items: [
                                { title: "Details confirmed", meta: "Pulled from your profile", state: "done" },
                                { title: "Position preference", meta: "All-rounder", state: "done" },
                                { title: "Confirm entry", meta: "Sends your slot request", state: "active" }
                            ]
                        },
                        { t: "actions", items: [{ label: "Confirm entry", kind: "primary" }] }
                    ],
                    tabs: { items: ["Events", "Teams", "Alerts", "You"], active: 0 }
                },
                {
                    id: "ticket",
                    name: "My entry",
                    caption: "The confirmation lives in the app, works offline, and is scannable at the gate.",
                    appBar: { title: "My entry", subtitle: "Confirmed" },
                    blocks: [
                        { t: "note", kicker: "Entry #A-118", title: "Cricket trials", body: "18 January · 07:00 · Main ground. Show this screen at the registration desk." },
                        { t: "proof", items: [{ label: "Entry code", tone: "blue" }] },
                        { t: "tiles", items: [{ label: "Status", value: "Confirmed", tone: "green" }, { label: "Reminder", value: "1 day", tone: "slate" }] },
                        {
                            t: "list",
                            items: [
                                { dot: "blue", title: "Selection results", meta: "Posted the same evening" }
                            ]
                        }
                    ],
                    tabs: { items: ["Events", "Teams", "Alerts", "You"], active: 3 }
                }
            ]
        }
    ];

    window.APPVION_SHOWCASE = {
        apps: APPS,
        byId: function (id) {
            for (var i = 0; i < APPS.length; i += 1) {
                if (APPS[i].id === id) return APPS[i];
            }
            return null;
        }
    };
})();
