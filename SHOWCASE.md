# Interactive product showcase

The phones on the homepage are one system. It powers the hero device, the ProFix
flagship visual, the portfolio cards, and the full-screen prototype explorer.

## Files

| File | Purpose |
| --- | --- |
| `showcase-data.js` | The app catalog. **This is the only file you edit to add or change an app.** |
| `showcase.js` | Renderer, device frame, screen transitions, explorer, deep links. |
| `showcase.css` | All styling. Namespaced `av-*`; loaded after `styles.css` so it never fights the existing system. |
| `assets/screens/<app>/<screen>.jpg` | Real app screenshots, pre-sized to 600 x 1300. |
| `showcase-review.html` | Internal tool. Open it to see every screen in the catalog side by side. Not linked from the site. |

`index.html` only gains four lines in `<head>`. `styles.css` is untouched.

## Adding an app

Append an entry to `APPS` in `showcase-data.js`:

```js
{
    id: "my-app",                 // used in the deep link /#app/my-app/screen-id
    name: "My App",
    kicker: "Category line",
    tagline: "One sentence on what the product does.",
    accent: "blue",               // blue | green | amber | rose
    stack: ["Android Native", "Firebase"],
    link: { label: "Watch demo", url: "https://..." },   // optional
    screens: [ /* see below */ ]
}
```

The app appears in the explorer rail immediately. It attaches to a portfolio card
automatically when the card's title matches `name`, or when the card's link
matches `link.url`.

## Two kinds of screen

**Real screenshot** — always prefer this when a capture exists:

```js
{ id: "dashboard", name: "Dashboard", caption: "What this screen proves.",
  image: "assets/screens/my-app/dashboard.jpg" }
```

**Composed screen** — for products with no captures, built from blocks:

```js
{ id: "dispatch", name: "Dispatch", caption: "What this screen proves.",
  appBar: { title: "Dispatch", subtitle: "Tuesday, 14 January", back: false },
  blocks: [ { t: "metric", label: "Active tasks", value: "38", progress: 72 } ],
  tabs: { items: ["Jobs", "Proof", "Team", "You"], active: 0 } }
```

Block types: `metric`, `tiles`, `chips`, `list`, `steps`, `chart`, `table`,
`note`, `proof`, `profile`, `search`, `actions`. The vocabulary is documented at
the top of `showcase-data.js`. Tones: `blue`, `green`, `amber`, `rose`, `slate`.

Aim for three or four blocks. A screen ending in `actions` pins those buttons to
the bottom the way a real app does.

## Preparing screenshots

Source captures should be full-height phone screenshots. Target output is
**600 x 1300 JPEG, quality 82**. Remove the Android navigation bar, crop the side
margins to the 600:1300 aspect rather than letterboxing, and **blur any personal
data** — names, email addresses, phone numbers — before the file goes in
`assets/screens/`.

## Behaviour notes

- The hero cycles a chosen subset of one app's screens. Change `HERO` at the top
  of `showcase.js` to pick which.
- Deep links work: `/#app/snowgrid/live-dispatch` opens the explorer on that
  screen. Closing restores the previous URL.
- Keyboard: arrow keys move between screens, `Esc` closes, focus is trapped in
  the explorer and returned on close.
- `prefers-reduced-motion` removes the tilt, the auto-cycle, and all screen
  transitions.
- A missing image falls back to a labelled card instead of a broken image.
- Portfolio cards are re-rendered by `site-render.js` from admin content; the
  showcase watches for that and re-attaches itself.
