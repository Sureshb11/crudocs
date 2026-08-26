#!/usr/bin/env node
/**
 * Crudo static site builder — zero dependencies.
 *
 * Composes src/pages/*.html into root-level HTML files using src/layout.html
 * and the shared partials, then writes sitemap.xml.
 *
 * Each page begins with a JSON front-matter block inside an HTML comment:
 *
 *   <!--meta
 *   { "title": "...", "description": "...", "path": "about.html", "nav": "about" }
 *   meta-->
 *
 * The generated HTML is committed to the repository, so the site can be served
 * by any static host (GitHub Pages included) without running this script.
 *
 *   node build.js
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const PAGES = path.join(SRC, "pages");

const SITE = "https://crudocs.com";

const read = (p) => fs.readFileSync(p, "utf8");

const layout = read(path.join(SRC, "layout.html"));
const header = read(path.join(SRC, "partials", "header.html"));
const footer = read(path.join(SRC, "partials", "footer.html"));

/* Organisation schema reused as the base for every page. */
const organisation = {
  "@type": "Organization",
  "@id": SITE + "/#organization",
  name: "Crudo",
  alternateName: "Crudocs",
  url: SITE + "/",
  logo: SITE + "/assets/img/logo.png",
  image: SITE + "/assets/img/og-image.jpg",
  description:
    "Crudo provides oil field services, tubular inspection, chemical supply and technical manpower to the upstream, midstream and downstream oil and gas industry.",
  email: "info@crudocs.com",
  telephone: "+91-70003-19611",
  address: {
    "@type": "PostalAddress",
    streetAddress: "#19, Singaravelen Street, Pallavan Nagar, Maduravoyal",
    addressLocality: "Chennai",
    addressRegion: "Tamil Nadu",
    postalCode: "600095",
    addressCountry: "IN"
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-70003-19611",
    email: "info@crudocs.com",
    contactType: "sales",
    areaServed: "Worldwide",
    availableLanguage: ["en"]
  }
};

/** Pull the JSON front-matter block off the top of a page source file. */
function parsePage(raw) {
  const match = raw.match(/^\s*<!--meta([\s\S]*?)meta-->/);
  if (!match) throw new Error("page is missing its <!--meta ... meta--> block");
  return {
    meta: JSON.parse(match[1]),
    body: raw.slice(match[0].length).trim()
  };
}

/* Service pages live under the "Services & Products" nav item. */
const SERVICE_NAVS = ["oilfield", "tubular", "chemicals", "manpower"];

/**
 * Mark the active item in the primary nav.
 * A service detail page also highlights its parent "Services & Products" item,
 * using a class rather than aria-current so only one element claims the page.
 */
function markActive(html, nav) {
  if (!nav) return html.replace(/ data-nav="[^"]*"/g, "");

  const active = new RegExp('(<a[^>]*?)\\sdata-nav="' + nav + '"', "g");
  let out = html.replace(active, '$1 aria-current="page"');

  if (SERVICE_NAVS.indexOf(nav) !== -1) {
    out = out.replace(
      /class="nav__link"( [^>]*?)?\sdata-nav="services"/,
      'class="nav__link is-section"$1 data-nav="services"'
    );
  }

  return out.replace(/ data-nav="[^"]*"/g, "");
}

/**
 * Breadcrumb schema so search engines render the page hierarchy.
 * Only inner pages declare crumbs.
 */
function breadcrumbs(meta) {
  if (!meta.crumbs || !meta.crumbs.length) return null;
  const items = [{ name: "Home", url: SITE + "/" }].concat(meta.crumbs);
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url.startsWith("http") ? c.url : SITE + "/" + c.url
    }))
  };
}

function buildJsonLd(meta) {
  const graph = [organisation];

  graph.push({
    "@type": "WebPage",
    "@id": SITE + "/" + meta.path + "#webpage",
    url: SITE + "/" + meta.path,
    name: meta.title,
    description: meta.description,
    isPartOf: { "@id": SITE + "/#website" },
    about: { "@id": SITE + "/#organization" }
  });

  graph.push({
    "@type": "WebSite",
    "@id": SITE + "/#website",
    url: SITE + "/",
    name: "Crudo",
    publisher: { "@id": SITE + "/#organization" }
  });

  const crumbs = breadcrumbs(meta);
  if (crumbs) graph.push(crumbs);

  if (meta.service) {
    graph.push({
      "@type": "Service",
      name: meta.service.name,
      description: meta.service.description,
      serviceType: meta.service.name,
      provider: { "@id": SITE + "/#organization" },
      areaServed: { "@type": "Place", name: "Worldwide" },
      url: SITE + "/" + meta.path
    });
  }

  if (meta.faq) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: meta.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a }
      }))
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

function render(meta, body) {
  const canonicalPath = meta.path === "index.html" ? "" : meta.path;

  return layout
    .replace(/{{HEADER}}/g, markActive(header, meta.nav))
    .replace(/{{FOOTER}}/g, footer)
    .replace(/{{CONTENT}}/g, body)
    .replace(/{{JSONLD}}/g, buildJsonLd(meta))
    .replace(/{{TITLE}}/g, meta.title)
    .replace(/{{OG_TITLE}}/g, meta.ogTitle || meta.title)
    .replace(/{{DESCRIPTION}}/g, meta.description)
    .replace(/{{ROBOTS}}/g, meta.robots || "index, follow")
    .replace(/{{HEAD_EXTRA}}/g, meta.headExtra || "")
    .replace(/{{PATH}}/g, canonicalPath)
    .replace(/{{SITE}}/g, SITE);
}

function writeSitemap(pages) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages
    .filter((p) => (p.meta.robots || "").indexOf("noindex") === -1)
    .sort((a, b) => (b.meta.priority || 0.6) - (a.meta.priority || 0.6))
    .map((p) => {
      const loc = SITE + "/" + (p.meta.path === "index.html" ? "" : p.meta.path);
      return [
        "  <url>",
        "    <loc>" + loc + "</loc>",
        "    <lastmod>" + today + "</lastmod>",
        "    <changefreq>" + (p.meta.changefreq || "monthly") + "</changefreq>",
        "    <priority>" + (p.meta.priority || 0.6).toFixed(1) + "</priority>",
        "  </url>"
      ].join("\n");
    })
    .join("\n");

  fs.writeFileSync(
    path.join(ROOT, "sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls +
      "\n</urlset>\n"
  );
}

function main() {
  const files = fs.readdirSync(PAGES).filter((f) => f.endsWith(".html"));
  const built = [];

  for (const file of files) {
    const raw = read(path.join(PAGES, file));
    let page;
    try {
      page = parsePage(raw);
    } catch (err) {
      console.error("✗ " + file + ": " + err.message);
      process.exitCode = 1;
      continue;
    }

    const out = render(page.meta, page.body);
    fs.writeFileSync(path.join(ROOT, page.meta.path), out);
    built.push(page);
    console.log("✓ " + page.meta.path + "  (" + (out.length / 1024).toFixed(1) + " KB)");
  }

  writeSitemap(built);
  console.log("✓ sitemap.xml (" + built.length + " pages)");
}

main();
