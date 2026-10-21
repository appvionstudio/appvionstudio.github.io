"""SEO regression checks for appvionstudio.com. Run from the repo root: python .github/scripts/seo_check.py

Fails (exit 1) on: broken internal links, links via index.html or missing trailing slash,
sitemap pages that are missing, noindexed, lack a self-canonical or have no title/description,
invalid JSON-LD, images without alt, llms-full.txt URLs outside the sitemap, and facts that
contradict the agreed ones. Long titles and descriptions are reported as warnings.
"""
import html, json, os, posixpath, re, subprocess, sys

SITE = "https://appvionstudio.com"
SKIP_PREFIX = ("Demos/",)
NOINDEX_OK = {"404.html", "appvion-control.html", "showcase-review.html", "case-study.html",
              "momna-shah.html", "tayyab-sajjad.html"}
FACT_BANS = {  # text that must not come back on public pages
    "ProFix": "product name is PropFix",
    "Founder and Android App Developer": "founder title is Founder & CEO",
    "Founder | Android App Developer": "founder title is Founder & CEO",
    "three people": "the team is four people",
    "Six products": "there are seven case studies",
    "Twenty-seven questions": "the FAQ has 28 questions",
    "downloadable APK": "no APK is published",
    "World-class": "unsupported superlative",
    "Elite mobile products": "unsupported superlative",
}

errors, warnings = [], []

def err(msg):
    errors.append(msg)

def html_files():
    out = subprocess.check_output(["git", "ls-files", "*.html"], text=True).split()
    return [f for f in out if not f.startswith(SKIP_PREFIX)]

def page_file(path):
    rel = path.lstrip("/")
    return rel + "index.html" if rel == "" or rel.endswith("/") else rel

def page_url(rel):
    return "/" + (rel[: -len("index.html")] if rel.endswith("index.html") else rel)

def strip_scripts(t):
    return re.sub(r"<script\b.*?</script>", "", t, flags=re.S)

files = html_files()
texts = {f: open(f, encoding="utf-8").read() for f in files}
sitemap = re.findall(r"<loc>([^<]+)</loc>", open("sitemap.xml", encoding="utf-8").read())
sitemap_paths = [u.replace(SITE, "") or "/" for u in sitemap]

# Sitemap pages: exist, indexable, self-canonical, title and description
for path in sitemap_paths:
    f = page_file(path)
    if f not in texts:
        err(f"sitemap: {path} has no file {f}")
        continue
    t = texts[f]
    if re.search(r'<meta name="robots" content="[^"]*noindex', t):
        err(f"sitemap: {path} is noindex")
    canon = re.search(r'<link rel="canonical" href="([^"]+)"', t)
    if not canon or canon.group(1) != SITE + path:
        err(f"canonical: {path} -> {canon.group(1) if canon else 'missing'}")
    title = re.search(r"<title>(.*?)</title>", t, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', t)
    if not title or not desc:
        err(f"meta: {path} missing title or description")
        continue
    tl, dl = len(html.unescape(title.group(1).strip())), len(html.unescape(desc.group(1)))
    if tl > 60 and not path.startswith(("/snowgrid/", "/propfix/", "/d-delivery/")):
        warnings.append(f"title {tl} chars: {path}")
    if dl > 160:
        warnings.append(f"description {dl} chars: {path}")

# Unexpected noindex outside the allowed list
for f, t in texts.items():
    if f in NOINDEX_OK or f.startswith("propfix/billing/"):
        continue
    if re.search(r'<meta name="robots" content="[^"]*noindex', t) and page_url(f) in sitemap_paths:
        err(f"noindex on sitemap page {f}")

# Internal links: resolve, canonical form
for f, t in texts.items():
    if f in ("appvion-control.html", "showcase-review.html"):
        continue  # admin and review tools, noindex
    src = page_url(f)
    for href in re.findall(r'<a\b[^>]*\bhref="([^"]+)"', strip_scripts(t)):
        h = href.split("#")[0].split("?")[0]
        if h.startswith(SITE):
            h = h[len(SITE):] or "/"
        if not h or re.match(r"^(https?:|mailto:|tel:|javascript:)", h):
            continue
        if re.search(r"(^|/)index\.html$", h):
            err(f"link via index.html: {f} -> {href}")
        if not h.startswith("/"):
            base = src if src.endswith("/") else posixpath.dirname(src).rstrip("/") + "/"
            h = posixpath.normpath(posixpath.join(base, h)) + ("/" if h.endswith("/") else "")
        target = h.lstrip("/")
        if os.path.isdir(target) and not h.endswith("/"):
            err(f"link without trailing slash: {f} -> {href}")
        if not (os.path.isfile(target) or os.path.isfile(os.path.join(target, "index.html"))):
            err(f"broken link: {f} -> {href}")

# JSON-LD parses; images have alt
for f, t in texts.items():
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', t, re.S):
        try:
            json.loads(block)
        except ValueError as e:
            err(f"JSON-LD: {f}: {e}")
    for img in re.findall(r"<img\b[^>]*>", strip_scripts(t)):
        if "alt=" not in img:
            err(f"img without alt: {f}: {img[:80]}")

# llms-full.txt points only at sitemap URLs
for url in re.findall(r"^URL: (\S+)", open("llms-full.txt", encoding="utf-8").read(), re.M):
    if url not in sitemap:
        err(f"llms-full.txt URL not in sitemap: {url}")

# Agreed facts stay agreed
public = [f for f in texts if f not in NOINDEX_OK]
for f in public + ["llms.txt", "company.json"]:
    t = texts.get(f) or open(f, encoding="utf-8").read()
    for bad, why in FACT_BANS.items():
        if bad in t:
            err(f"fact: {f} contains '{bad}' ({why})")

robots = open("robots.txt", encoding="utf-8").read()
if re.search(r"(?m)^Disallow:\s*/\s*$", robots):
    err("robots.txt disallows the whole site")

for w in warnings:
    print("WARN ", w)
for e in errors:
    print("ERROR", e)
print(f"\n{len(sitemap)} sitemap URLs, {len(files)} HTML files: {len(errors)} errors, {len(warnings)} warnings")
sys.exit(1 if errors else 0)
