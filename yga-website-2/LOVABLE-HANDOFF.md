# YGA editable website handoff

This site uses readable HTML, CSS, JavaScript and original WebGL code. Nothing is obfuscated. No platform account or secret is required to read its public source.

Public preview: https://yga-young-growth-agency.amirrostamiiii.chatgpt.site/

Complete single-file HTML source:
https://yga-young-growth-agency.amirrostamiiii.chatgpt.site/source/yga.html.txt

Full editable project:
https://yga-young-growth-agency.amirrostamiiii.chatgpt.site/source/yga-source.zip

## Prompt to paste into Lovable

Use the YGA preview and complete HTML source linked above as the existing design and implementation. Read the source before changing the website. If URL import is unavailable, I can upload the downloaded source ZIP or paste the HTML. Preserve the established YGA branding, original YGA Signal font, logo, colors, all four pages, full content, forms, FAQ, product explorer, process dialogs, quick-fit quiz and interactive 3D.

Continue improving the animations without redesigning the site. Keep the strong word-by-word pop-forward text entrances, dimensional cards, scroll-controlled audience-to-product-to-launch story, page transitions and animated dialogs. Make every primary effect work with native scrolling and touch on phones as well as on desktop. Keep content readable, preserve keyboard focus and motion controls, and honor prefers-reduced-motion. Use existing animation hooks in public/pop-reveals.js, public/experience.js, public/experience.css, public/router.js and public/scene.js. Avoid applying competing transforms to the same element. Use installed design, animation, 3D, accessibility and performance skills relevant to the task; do not claim to use skills that are unavailable.

YGA creates the entire original product behind the scenes: research, writing, content, curriculum where relevant, structure, branding, design and finished production. Each product is tailored to the creator's content, brand and niche. Never change this into selling template packs or ready-made courses. Preserve the no-upfront-agency-fee and agreed revenue-share positioning. Do not invent testimonials, revenue figures or guarantees.

The public version is a static preview. The project includes backend application handlers, but delivery remains disabled until the real service configuration and receiving email are supplied. Do not show a false submission success.

## Files to edit

- public/index.html: content for all four views and dialogs.
- public/pop-reveals.js: scroll-triggered text, panel, card and sculpture entrances; phone distances and stagger timing.
- public/experience.js: scroll story, quiz, dialogs, global motion pause and tilt.
- public/experience.css: dimensional elements, page transitions and responsive motion layouts.
- public/router.js: live/offline routes, page transitions, history and focus.
- public/scene.js: procedural 3D, touch dragging, camera and scroll progression.
- public/styles.css: original brand styling and responsive layout.

Run npm run check, then npm run build. No package installation is needed. Edit the source files, then rebuild; generated dist files and yga-preview.html will be replaced by the build.

The standalone HTML uses hash navigation to keep all four pages in one file. The normal hosted build has separate page paths. The source ZIP contains the full frontend, original font and logo, backend handlers, tests and build scripts. It excludes credentials and hosting identity.

Read access lets Lovable inspect or copy the code; it does not give Lovable write access to this deployment. Changes made in Lovable need to be published from Lovable or returned to this project.
