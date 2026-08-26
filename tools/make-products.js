#!/usr/bin/env node
/**
 * Generate the six food & agri category pages in src/pages/.
 *
 *   node tools/make-products.js
 *
 * The category pages share one layout, so they are written from the data
 * below rather than hand-maintained six times over. Edit this file and re-run
 * to change the structure for every category at once; edit the generated
 * src/pages/product-*.html to change one category's prose only (but note a
 * re-run overwrites it).
 */

"use strict";

const fs = require("fs");
const path = require("path");

const PAGES = path.join(__dirname, "..", "src", "pages");

/* Shared building blocks -------------------------------------------------- */

const ARROW =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const INFO =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>';

const SIDENAV = [
  ["spices", "product-spices.html", "Spices &amp; Seasonings"],
  ["grains", "product-grains.html", "Rice &amp; Food Grains"],
  ["pulses", "product-pulses.html", "Pulses &amp; Lentils"],
  ["produce", "product-produce.html", "Fresh Fruits &amp; Vegetables"],
  ["eggs", "product-eggs.html", "Eggs &amp; Poultry"],
  ["naturals", "product-naturals.html", "Oilseeds, Nuts &amp; Naturals"],
  ["chemicals", "product-chemicals.html", "Industrial Chemicals"]
];

/* Category data ----------------------------------------------------------- */

const CATEGORIES = [
  {
    slug: "spices",
    nav: "spices",
    name: "Spices &amp; Seasonings",
    plain: "Spices & Seasonings",
    art: "food.svg",
    alt: "Assorted food products in bowls — turmeric, chilli, eggs, pulses, lentils and peppercorns",
    title: "Indian Spices Exporter — Turmeric, Chilli, Pepper, Cumin | Crudo",
    desc:
      "Crudo sources and exports Indian spices — turmeric, red chilli, black pepper, cumin, coriander, cardamom, clove, cinnamon and blended masalas — graded to buyer specification and shipped from Chennai.",
    lede:
      "India is the largest spice producer in the world, and grade varies enormously between one supplier and the next. We buy against your specification, not against whatever is cheapest that week.",
    intro: [
      "Spices are where a buying agent earns their keep. Colour value, pungency, moisture, admixture and volatile oil content all move with the crop, the region and the drying method — and two consignments described by the same name can be entirely different goods.",
      "We agree the grade in writing before an order is placed, buy from vendors who can actually meet it, and check the goods before they are packed."
    ],
    pills: ["Whole &amp; ground", "Steam sterilised on request", "Bulk or retail packing", "Private label"],
    tables: [
      {
        head: "Core spice range",
        cols: ["Product", "Forms available", "Typical grading points"],
        rows: [
          ["Turmeric", "Fingers, bulbs, powder", "Curcumin %, colour, moisture"],
          ["Red chilli", "Whole, stemless, powder, crushed", "ASTA colour, pungency (SHU), size"],
          ["Black pepper", "Whole, ground", "Bulk density (g/l), light berries %"],
          ["Cumin seed", "Whole, ground", "Purity %, admixture, moisture"],
          ["Coriander seed", "Whole, split, ground", "Purity %, colour, oil content"],
          ["Cardamom", "Green, whole", "Size (mm), colour, moisture"],
          ["Clove &amp; cinnamon", "Whole, ground", "Oil content, moisture"],
          ["Fenugreek, mustard, fennel", "Seed", "Purity %, moisture"],
          ["Dry ginger &amp; tamarind", "Whole, sliced, paste", "Moisture, fibre, seed content"],
          ["Curry leaf &amp; blended masalas", "Dried, ground, packed", "To recipe and buyer brief"]
        ]
      }
    ],
    notes: [
      {
        h: "Sterilisation &amp; treatment",
        p: "Steam sterilisation and cleaning to reduce microbial load can be arranged where the destination market or your own customer requires it. Confirm the requirement with the enquiry so it is priced in from the start."
      },
      {
        h: "Packing",
        p: "Jute or PP bags for bulk, multi-wall paper sacks for ground spices, and cartoned retail packs for private-label orders. Net weights and marks are set to your instruction."
      }
    ],
    season:
      "Turmeric and chilli are harvested through the first quarter of the year; cumin and coriander through the spring. Pricing and availability move with those cycles, and we will tell you where in the cycle you are buying."
  },

  {
    slug: "grains",
    nav: "grains",
    name: "Rice &amp; Food Grains",
    plain: "Rice & Food Grains",
    art: "food.svg",
    alt: "Assorted food products in bowls including grains and pulses",
    title: "Rice & Food Grain Exporter — Basmati, Non-Basmati, Millets | Crudo",
    desc:
      "Crudo exports rice and food grains from India — basmati and non-basmati rice, parboiled and raw, broken grades, wheat, maize and millets — graded, packed and documented to buyer specification.",
    lede:
      "Rice is sold on a specification, not a name. Length, broken percentage, moisture and polish decide the price, and we quote against the exact grade you need.",
    intro: [
      "Rice and grain buyers get caught out by two things: a grade that drifts between sample and shipment, and paperwork that does not satisfy the destination. Both are avoidable.",
      "We fix the specification in writing, draw samples from the actual lot rather than a showroom bag, and prepare the documentation for your customs authority before the vessel sails."
    ],
    pills: ["Raw &amp; parboiled", "Sortex cleaned", "25 / 50 kg or jumbo bags", "Private label"],
    tables: [
      {
        head: "Rice",
        cols: ["Type", "Common grades", "Typical grading points"],
        rows: [
          ["Basmati", "1121, 1509, Pusa, traditional", "Average grain length, elongation, aroma"],
          ["Non-basmati long grain", "Raw, parboiled, steam", "Length, broken %, moisture"],
          ["Sona Masoori", "Raw, steam", "Broken %, polish, moisture"],
          ["Ponni &amp; IR varieties", "Raw, parboiled", "Broken %, chalk, admixture"],
          ["Broken rice", "5%, 25%, 100%", "Broken size, purity"]
        ]
      },
      {
        head: "Other grains",
        cols: ["Product", "Forms available", "Typical use"],
        rows: [
          ["Wheat", "Whole grain, flour", "Milling and food grades"],
          ["Maize / corn", "Whole, broken", "Feed and food grades"],
          ["Sorghum (jowar)", "Whole, flour", "Food and feed"],
          ["Pearl millet (bajra)", "Whole, flour", "Food and feed"],
          ["Finger millet (ragi)", "Whole, flour", "Food"],
          ["Foxtail, kodo, little millet", "Whole, polished", "Health foods, retail packing"]
        ]
      }
    ],
    notes: [
      {
        h: "Cleaning &amp; sorting",
        p: "Sortex colour sorting, de-stoning and grading are standard on export lots. Where you need a tighter broken percentage or a specific polish, say so at enquiry stage and it is quoted in."
      },
      {
        h: "Packing",
        p: "25 kg and 50 kg PP or jute bags, jumbo bags for bulk, and printed retail packs for branded orders. Container stuffing is planned to the weight limit of your route."
      }
    ],
    season:
      "The kharif rice harvest runs from autumn, with the rabi crop following in spring. Millets and maize follow their own cycles. Availability and price are quoted against the current crop, and we will say which crop the goods come from."
  },

  {
    slug: "pulses",
    nav: "pulses",
    name: "Pulses &amp; Lentils",
    plain: "Pulses & Lentils",
    art: "food.svg",
    alt: "Assorted food products in bowls including lentils and pulses",
    title: "Pulses & Lentils Exporter — Toor, Urad, Moong, Chana | Crudo",
    desc:
      "Crudo sources and exports Indian pulses and lentils — toor, urad, moong, masoor and chana dal, chickpeas and kidney beans — whole and split, machine cleaned and graded to specification.",
    lede:
      "Pulses trade on purity, size and colour. We buy to the grade you specify and show you the goods before they ship.",
    intro: [
      "Pulses are a volume business with thin margins, which is exactly why grade discipline matters — a couple of percent of admixture or a shade off on colour changes what the cargo is worth at your end.",
      "Every lot is bought against a written specification, machine cleaned, and inspected before packing."
    ],
    pills: ["Whole &amp; split", "Machine cleaned", "Polished on request", "25 / 50 kg bags"],
    tables: [
      {
        head: "Pulses and lentils",
        cols: ["Product", "Forms available", "Typical grading points"],
        rows: [
          ["Toor / pigeon pea", "Whole, split (dal)", "Purity %, size, colour"],
          ["Urad / black gram", "Whole, split, husked", "Purity %, moisture"],
          ["Moong / green gram", "Whole, split, husked", "Size (count), colour, purity"],
          ["Masoor / red lentil", "Whole, split", "Size, colour, broken %"],
          ["Chana / bengal gram", "Whole, split (dal)", "Size (count/oz), purity"],
          ["Chickpeas (kabuli)", "Whole", "Size (mm), colour, defects"],
          ["Kidney beans (rajma)", "Whole", "Size, colour, defects"],
          ["Cowpea &amp; horse gram", "Whole", "Purity %, moisture"]
        ]
      }
    ],
    notes: [
      {
        h: "Cleaning &amp; polishing",
        p: "Standard export lots are machine cleaned and de-stoned. Oil, water or nylon polish can be applied to dals where your market expects it — tell us which, because it changes both appearance and price."
      },
      {
        h: "Packing",
        p: "25 kg and 50 kg PP bags as standard, jute where required, jumbo bags for bulk movements, and printed retail packs for branded orders."
      }
    ],
    season:
      "Most pulses follow the rabi cycle, arriving from late winter into spring, with imports filling gaps in the Indian market at other times. We will tell you plainly whether goods are current crop."
  },

  {
    slug: "produce",
    nav: "produce",
    name: "Fresh Fruits &amp; Vegetables",
    plain: "Fresh Fruits & Vegetables",
    art: "food.svg",
    alt: "Assorted fresh food products",
    title: "Fresh Fruit & Vegetable Exporter — Onions, Bananas, Mangoes | Crudo",
    desc:
      "Crudo exports fresh fruits and vegetables from India — onions, potatoes, green chilli, drumstick, bananas, mangoes, pomegranates and coconut — graded, packed and moved by reefer or air.",
    lede:
      "Fresh cargo is unforgiving. Grade, cold chain and transit time have to be planned together, or the consignment arrives worth less than it cost.",
    intro: [
      "Fresh produce is the least forgiving thing we ship. A day lost at the port, a reefer set to the wrong temperature, or fruit picked at the wrong maturity, and the cargo loses its value before it reaches you.",
      "We plan the grade, the packing, the temperature regime and the routing as one decision, and we are honest about what will and will not travel to your market."
    ],
    pills: ["Reefer &amp; air freight", "Size graded", "Carton or mesh packed", "Seasonal"],
    tables: [
      {
        head: "Vegetables",
        cols: ["Product", "Packing", "Typical grading points"],
        rows: [
          ["Onions (red, pink)", "Mesh bags, cartons", "Diameter (mm), skin, dryness"],
          ["Potatoes", "Mesh bags, cartons", "Size, defects, variety"],
          ["Green chilli", "Ventilated cartons", "Length, colour, firmness"],
          ["Drumstick (moringa pods)", "Cartons", "Length, straightness, freshness"],
          ["Okra &amp; gourds", "Ventilated cartons", "Size, tenderness"],
          ["Ginger &amp; garlic", "Mesh bags, cartons", "Size, dryness, defects"]
        ]
      },
      {
        head: "Fruits",
        cols: ["Product", "Packing", "Notes"],
        rows: [
          ["Bananas", "Cartons, reefer", "Cavendish and regional varieties"],
          ["Mangoes", "Cartons, reefer or air", "Variety and maturity confirmed per order"],
          ["Pomegranates", "Cartons, reefer", "Size count, colour"],
          ["Grapes", "Punnets, cartons, reefer", "Seasonal; variety per order"],
          ["Coconut", "Bulk, mesh, cartons", "Fresh, semi-husked, husked"]
        ]
      }
    ],
    notes: [
      {
        h: "Cold chain",
        p: "Reefer containers are set to the regime for the specific commodity and pre-cooled where required. Air freight is used for high-value or short-shelf-life cargo. Both are quoted with realistic transit times, not best-case ones."
      },
      {
        h: "Phytosanitary requirements",
        p: "Fresh produce needs a phytosanitary certificate and, for some markets, treatment or an approved-orchard registration. Tell us the destination early — some of these take time to arrange and cannot be added at the last minute."
      }
    ],
    season:
      "Fresh produce is entirely seasonal. Mango, pomegranate and grape windows are narrow, and onion availability and price swing hard through the year. We will give you the realistic window rather than promise year-round supply."
  },

  {
    slug: "eggs",
    nav: "eggs",
    name: "Eggs &amp; Poultry Products",
    plain: "Eggs & Poultry Products",
    art: "food.svg",
    alt: "Assorted food products including a tray of eggs",
    title: "Egg Exporter from India — Table Eggs, Hatching Eggs, Egg Powder | Crudo",
    desc:
      "Crudo exports eggs and poultry products from India — white and brown table eggs, hatching eggs and egg powder — with reefer capacity, careful handling and veterinary health certification arranged as part of the order.",
    lede:
      "Eggs are time-sensitive, fragile and heavily regulated at the border. All three have to be handled together or not at all.",
    intro: [
      "Egg export is a logistics problem as much as a sourcing one. Shell strength, age at loading, temperature through transit and the veterinary certificate all determine whether a consignment arrives saleable.",
      "We arrange the reefer capacity, the handling and the health certification as part of the order rather than leaving the buyer to coordinate three parties across a time zone."
    ],
    pills: ["Reefer capacity", "Veterinary certified", "Trays &amp; cartons", "Size graded"],
    tables: [
      {
        head: "Egg products",
        cols: ["Product", "Forms available", "Typical grading points"],
        rows: [
          ["Table eggs — white shell", "Trays, cartons, master boxes", "Weight grade (g), shell quality, age"],
          ["Table eggs — brown shell", "Trays, cartons, master boxes", "Weight grade (g), shell quality, age"],
          ["Hatching eggs", "Setter trays, specialist packing", "Breed, fertility, handling regime"],
          ["Whole egg powder", "Sacks, drums", "Moisture, solubility, microbiology"],
          ["Egg albumen powder", "Sacks, drums", "Protein %, moisture, foaming"],
          ["Egg yolk powder", "Sacks, drums", "Fat %, moisture, colour"]
        ]
      }
    ],
    notes: [
      {
        h: "Handling &amp; transit",
        p: "Shell eggs are loaded as fresh as the schedule allows, packed to limit movement in transit, and carried under a temperature regime agreed for the route. Transit time is planned against shelf life, not the other way round."
      },
      {
        h: "Health certification",
        p: "Shell eggs and egg products require veterinary health certification, and many destinations impose additional conditions on poultry products. Confirm the destination at enquiry stage so the correct certification is arranged before loading."
      }
    ],
    season:
      "Egg supply and price move with feed cost and with demand peaks through the year. Long-term contracts can be arranged where you need continuity of supply rather than spot purchases."
  },

  {
    slug: "naturals",
    nav: "naturals",
    name: "Oilseeds, Nuts &amp; Naturals",
    plain: "Oilseeds, Nuts & Naturals",
    art: "food.svg",
    alt: "Assorted natural food products in bowls",
    title: "Oilseeds, Nuts & Natural Products Exporter — Sesame, Groundnut, Honey | Crudo",
    desc:
      "Crudo exports oilseeds, nuts and natural products from India — sesame seed, groundnut, coconut products, jaggery, natural honey, tea and coffee — graded and documented to buyer specification.",
    lede:
      "The long tail of Indian food export: oilseeds, coconut, sweeteners and beverages, sourced against the same grade discipline as the headline commodities.",
    intro: [
      "These are the products buyers most often ask for after the main order is settled — a container of sesame alongside the rice, or honey and jaggery to round out a retail range.",
      "The category is broad and the list below is not exhaustive. If you need something in this space that is not shown, ask."
    ],
    pills: ["Bulk &amp; retail", "Food grade", "Private label", "Sourced to order"],
    tables: [
      {
        head: "Oilseeds &amp; nuts",
        cols: ["Product", "Forms available", "Typical grading points"],
        rows: [
          ["Sesame seed", "Natural, hulled, black", "Purity %, oil content, moisture"],
          ["Groundnut / peanut", "Bold, java, blanched, split", "Count per oz, moisture, aflatoxin"],
          ["Cashew kernels", "Grades W180 to W450, pieces", "Grade, colour, defects"],
          ["Niger &amp; mustard seed", "Whole", "Purity %, oil content"],
          ["Castor seed", "Whole", "Oil content, moisture"]
        ]
      },
      {
        head: "Coconut, sweeteners &amp; beverages",
        cols: ["Product", "Forms available", "Notes"],
        rows: [
          ["Desiccated coconut", "Fine, medium, coarse", "Fat %, moisture"],
          ["Coconut oil", "Crude, refined", "Food and cosmetic grades"],
          ["Coir &amp; coconut shell products", "Various", "Non-food; sourced on request"],
          ["Jaggery", "Blocks, cubes, powder", "Colour, moisture, purity"],
          ["Natural honey", "Drums, retail jars", "Moisture, HMF, source"],
          ["Tea", "CTC, orthodox, dust grades", "Grade, garden, liquor"],
          ["Coffee", "Green beans, arabica &amp; robusta", "Screen size, defects, region"]
        ]
      }
    ],
    notes: [
      {
        h: "Testing",
        p: "Aflatoxin, pesticide residue and heavy metal testing can be arranged where the destination market requires it. Groundnut in particular is routinely tested for aflatoxin — confirm the limit your market applies."
      },
      {
        h: "Packing",
        p: "Bulk bags and drums for commodity movements, and cartoned retail or private-label packing where the goods go straight to shelf."
      }
    ],
    season:
      "Sesame and groundnut follow their harvest cycles; coconut products and honey are available more evenly through the year. Tea and coffee vary by garden and estate season."
  }
];

/* Rendering --------------------------------------------------------------- */

function table(t) {
  return [
    "      <h3>" + t.head + "</h3>",
    '      <div class="table-wrap">',
    "        <table>",
    "          <thead>",
    "            <tr>" + t.cols.map((c) => '<th scope="col">' + c + "</th>").join("") + "</tr>",
    "          </thead>",
    "          <tbody>",
    ...t.rows.map((r) => "            <tr>" + r.map((c) => "<td>" + c + "</td>").join("") + "</tr>"),
    "          </tbody>",
    "        </table>",
    "      </div>"
  ].join("\n");
}

function sidenav(active) {
  return SIDENAV.map(([slug, href, label]) => {
    const cur = slug === active ? ' aria-current="page"' : "";
    return '          <li><a href="' + href + '"' + cur + ">" + label + "</a></li>";
  }).join("\n");
}

function page(c) {
  const enq = "contact.html?service=" + encodeURIComponent(c.plain.replace(/&amp;/g, "&"));

  const meta = {
    title: c.title,
    ogTitle: c.plain + " — Crudo",
    description: c.desc,
    path: "product-" + c.slug + ".html",
    nav: c.nav,
    priority: 0.8,
    crumbs: [
      { name: "Products", url: "products.html" },
      { name: c.plain, url: "product-" + c.slug + ".html" }
    ],
    service: {
      name: c.plain + " Export",
      description: c.desc
    }
  };

  return `<!--meta
${JSON.stringify(meta, null, 2)}
meta-->

<section class="pagehero">
  <div class="container">
    <ol class="crumbs">
      <li><a href="index.html">Home</a></li>
      <li><a href="products.html">Products</a></li>
      <li><span aria-current="page">${c.name}</span></li>
    </ol>
    <h1>${c.name}</h1>
    <p>${c.lede}</p>
  </div>
</section>

<section class="section">
  <div class="container layout-aside">
    <div class="prose">
      <img src="assets/img/art/${c.art}" alt="${c.alt}" width="900" height="560" style="border-radius:var(--radius-xl);margin-bottom:2rem;box-shadow:var(--shadow-md);" loading="lazy" decoding="async">

      <ul class="pills">
${c.pills.map((p) => "        <li>" + p + "</li>").join("\n")}
      </ul>

${c.intro.map((p) => "      <p>" + p + "</p>").join("\n")}

      <h2>What we supply</h2>
${c.tables.map(table).join("\n\n")}

      <div class="callout">
        ${INFO}
        <p>
          <strong>Not listed?</strong> This is what buyers ask us for most often, not a
          fixed catalogue. If you need something in this category that is not shown,
          <a href="${enq}">send the specification</a> and we will find a vendor.
        </p>
      </div>

      <h2>Notes on this category</h2>
${c.notes.map((n) => "      <h3>" + n.h + "</h3>\n      <p>" + n.p + "</p>").join("\n")}

      <h3>Seasonality</h3>
      <p>${c.season}</p>

      <h2>What to send with your enquiry</h2>
      <ul class="checklist checklist--2">
        <li>Product and grade or specification</li>
        <li>Quantity and packing preference</li>
        <li>Destination port and country</li>
        <li>Incoterm you want quoted</li>
        <li>Any testing or certification required</li>
        <li>Timing or shipment window</li>
      </ul>
    </div>

    <aside class="sidebar">
      <div class="sidecard">
        <h3>Product catalogue</h3>
        <ul class="sidenav">
${sidenav(c.nav)}
        </ul>
      </div>

      <div class="sidecard sidecard--ink">
        <h3>Request a quotation</h3>
        <p>Send the grade, quantity and destination port. We will come back with a vendor, a price and a lead time.</p>
        <div class="btn-row" style="margin-top:1.2rem;">
          <a class="btn btn--primary" href="${enq}">Send requirement</a>
        </div>
        <p style="margin-top:1rem;font-size:var(--fs-xs);">
          Or WhatsApp <a href="https://wa.me/917000319611" style="color:var(--gold-400);" target="_blank" rel="noopener">+91 70003 19611</a>
        </p>
      </div>

      <div class="sidecard">
        <h3>Are you a vendor?</h3>
        <p>
          Growers, mills, processors and packers who can supply export orders are welcome to
          send a product list and capacity to
          <a href="mailto:info@crudocs.com?subject=Vendor%20registration">info@crudocs.com</a>.
        </p>
      </div>
    </aside>
  </div>
</section>

<section class="cta-band">
  <div class="container reveal">
    <h2>Name the grade, we will find it</h2>
    <p>Tell us what you need and where it is going. You will get a straight answer on price and timing.</p>
    <div class="btn-row">
      <a class="btn btn--primary" href="${enq}">Request a quotation ${ARROW}</a>
      <a class="btn btn--outline-light" href="products.html">Full catalogue</a>
    </div>
  </div>
</section>
`;
}

let n = 0;
for (const c of CATEGORIES) {
  const file = path.join(PAGES, "product-" + c.slug + ".html");
  fs.writeFileSync(file, page(c));
  console.log("✓ src/pages/product-" + c.slug + ".html");
  n++;
}
console.log(n + " category pages written — now run: node build.js");
