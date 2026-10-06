# YGA — Young Growth Agency

A complete creator-partnership agency website with an original YGA identity, a custom condensed display font, a draggable WebGL scene, four pages, an interactive process and custom-product explorer, a nine-question FAQ, and an application flow.

## Motion edition — version 3

The established design is preserved, with a substantially expanded experience:

- **Four page views:** Home, Our approach, Custom products and The studio. The hosted build includes direct URLs at `/`, `/approach/`, `/products/` and `/studio/`. The downloadable HTML uses equivalent hash routes, so all four views work within one file.
- **Page transitions:** native View Transitions where supported, with a yellow YGA curtain fallback. Browser Back/Forward, per-page titles, direct entry, focus movement and page scroll positions are handled by the router.
- **A three-act scroll story:** audience questions become an original product, then a launch. The dimensional device rotates, its feed scrolls, product layers enter and the surrounding graphics move with scroll. The same native-scroll sequence runs on phones, with smaller dimensional elements and explicit chapter controls. Reduced-motion users get manual chapters.
- **New pop-ups:** three bespoke-product concepts with behind-the-scenes chapters, six process-detail dialogs, and a three-question product-direction explorer. The explorer does not collect, store or submit personal data.
- **More motion throughout:** word-by-word pop-forward headlines with perspective and overshoot, staggered text and panels, alternating side entrances, kinetic type bands, dimensional pointer reactions, stacked studio principles, animated FAQ expansion and dialog exits. All primary entrances run on phones; touch and scrolling drive the mobile experience.
- **Control:** a site-wide motion pause, operating-system reduced-motion support, native scrolling, a visible skip-story link and keyboard-operable controls.

The business positioning is **complete custom product creation**. YGA researches, writes, structures, designs and builds the whole product behind the scenes, including its contents. Everything is shaped around the individual creator's content, brand and niche. The product examples explain that process; they are not a catalogue of templates or ready-made products.

## Open the website

**No installation:** open `yga-preview.html` in a current desktop browser. It contains the fonts, logo, styling, original 3D renderer and interactions. Download the file first if your file viewer blocks JavaScript. This file is an offline preview; it cannot deliver applications.

**Edit and run the project:** install Node.js 22 or later, open this folder in a terminal and run:

```sh
npm run dev
```

Open the local address printed in the terminal. No `npm install` is required: the project has no package dependencies.

```sh
npm run check
npm run build
```

The build writes static assets to `dist/` and recreates `yga-preview.html`. Edit files in `public/`, not the generated preview or `dist/`.

## What is included

- White, electric yellow, cobalt and chrome art direction; original vector logo and YGA Signal display alphabet.
- Original WebGL architecture, laptop, phone, product artwork, floating questions and lighting. Drag the scene or focus it and use Left/Right/Home. Scene buttons select audience, product or launch. Scrolling on desktop and phones changes the camera; the pause button stops ambient motion.
- Five expandable services, six process stages, three audience-question examples and three custom-product directions.
- Partnership terms, responsibilities, creator fit, nine FAQ answers, mid-page and final calls to action.
- Inline application and native application dialog with keyboard focus handling and field errors.
- Responsive CSS, a WebGL fallback, reduced-motion support and offscreen rendering suspension.
- Server-side validation, Cloudflare Turnstile verification, Upstash rate limiting and Resend application notification, all behind `/api/apply`.

All product artwork is illustrative. No client results, endorsements, revenue guarantees or revenue-share percentages are invented. The copy describes no upfront agency fee and an agreed revenue share; external costs must be discussed before commitment.

## Enable applications

Applications are deliberately **disabled by default**. A preview never shows a false success message. No real application was sent while building or testing this project.

Before opening applications, provide the values in `.env.example` as server environment variables. For local development, copy the example to `.env`, fill in your values and run:

```sh
node --env-file=.env server.mjs
```

| Variable | Required value |
| --- | --- |
| `APPLICATIONS_ENABLED` | `true` only when the configuration is ready |
| `APPLICATION_ORIGIN` | Exact public origin, including `https://`, with no trailing slash or path |
| `APPLICATION_TO` | YGA's receiving email address |
| `APPLICATION_FROM` | A sender on your verified Resend domain, such as `YGA <forms@your-domain>` |
| `APPLICATION_PRIVACY_NOTICE` | Your complete application privacy notice as one string, at least 60 characters |
| `RESEND_API_KEY` | Server-only Resend key with email sending permission |
| `TURNSTILE_SITE_KEY` | Public Turnstile site key for the site hostname |
| `TURNSTILE_SECRET_KEY` | Server-only Turnstile secret |
| `UPSTASH_REDIS_REST_URL` | Your HTTPS `*.upstash.io` Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Server-only Redis REST token |
| `RATE_LIMIT_SALT` | A randomly generated secret of at least 32 characters |

Generate a salt locally with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The privacy notice should identify the responsible business, contact address, purpose, service providers, retention period and applicable rights. The production notice replaces the preview notice when configuration is complete. No mailing-list signup or marketing consent is implied by an application.

The endpoint emails the application to the configured YGA address. It does not expose an application list or maintain a separate application database. Delivery and verification providers may retain their own records. Redis stores salted identifiers and temporary counters. Limits are 3 attempts per email per hour, 5 per IP per 15 minutes, and 120 globally per hour. Invalid or failed challenge attempts consume the rate-limit allowance. Configure additional provider or hosting abuse controls as traffic requires.

An email-provider acceptance receipt is required before success is returned; that receipt does not guarantee inbox placement. A request ID is retained across retries to support the provider's idempotency window. With service outages, the endpoint fails closed and asks the user to retry.

Provider documentation:

- [Cloudflare server-side verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Cloudflare client-side rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
- [Upstash Redis REST API](https://upstash.com/docs/redis/features/restapi)
- [Resend email API](https://resend.com/docs/api-reference/emails/send-email)

## Hosting and editable source

The Sites build is a public static preview. Its `/source/yga.html.txt` exposes the complete readable HTML, CSS and JavaScript, and `/source/yga-source.zip` contains the editable project. See `LOVABLE-HANDOFF.md` for the public URLs and an editing prompt. Source access does not grant another app write access to the deployment. Application delivery remains disabled on this static preview.

 `vercel.json` is included for a future Vercel project: framework preset **Other**, build command `npm run build`, output directory `dist`. The `api/` functions and `lib/` must remain in the project root. A static-only host can display the site but cannot run the application endpoint. Do not upload `.env` or put private keys in `public/`.

For another Node host, run `server.mjs` behind your HTTPS reverse proxy. The included server listens on loopback for local use. IP limiting uses the socket address locally and Vercel's forwarded IP header on Vercel. Configure trusted proxy handling explicitly for a different host.

## Validation and limits

The 26 automated tests cover application validation, origin checks, secret exposure, rate limits, challenge failures, delivery failures, idempotency, matrix transformations, geometry integrity, live/offline routes, direct-page rendering, bounded scroll progression and complete quiz answers. The build and JavaScript syntax checks pass. HTML references and embedded preview assets were checked separately.

**This environment did not provide the required browser tooling.** The finished site has not been visually checked in a browser, on a real phone, or against live delivery services. Performance and accessibility are implemented intentions, not a measured Lighthouse score or completed audit. Before opening applications, verify desktop and mobile layouts, keyboard navigation, reduced motion, the WebGL fallback and a real test submission with your configured services. Older browsers may show static equivalents of scroll-linked CSS effects.

## File map

| Path | Purpose |
| --- | --- |
| `public/index.html` | Full page content, dialogs and form template |
| `public/styles.css` | Identity, layout, responsive styles and motion |
| `public/app.js` | Navigation, explorers, dialogs, field validation and application flow |
| `public/experience.css` | Added page layouts, scroll story, pop-ups and transition styles |
| `public/experience.js` | Scroll effects, product and process pop-ups, quiz and global motion control |
| `public/experience-data.js` | Route metadata, bespoke-product descriptions and quiz logic |
| `public/router.js` | Live/offline navigation, page transitions, history and focus |
| `public/pop-reveals.js` | Perspective text and section entrances on desktop and mobile |
| `public/scene.js` | Original WebGL geometry, materials, camera and interaction |
| `public/logo.svg`, `public/favicon.svg` | Original vector brand artwork |
| `public/fonts/` | Original YGA Signal font, shipped locally |
| `lib/application.js` | Validated application and delivery pipeline |
| `lib/render-page.js` | Direct-page HTML and metadata for the four static routes |
| `api/` | Serverless handlers |
| `server.mjs` | Dependency-free local server |
| `tests/` | Automated checks with mocked services |
| `scripts/build.mjs` | Static build and single-file preview |
| `scripts/export-source.mjs` | Public readable HTML and editable ZIP, without runtime secrets |
| `LOVABLE-HANDOFF.md` | Source links and instructions for continuing in Lovable |
| `scripts/make-font.py` | Optional font source; requires Python fontTools to rebuild |

The font has a compact Latin display alphabet, digits and selected punctuation. Use the system body-font stack for long text or other scripts. The shipped font is sufficient to run and build the website; Python is not required.
