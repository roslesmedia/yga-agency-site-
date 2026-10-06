# YGA agency website

The editable website and matching standalone `yga-preview.html` are in `yga-website-2/`.

## Deploy on Vercel

1. Import the GitHub repository `roslesmedia/yga-agency-site-`.
2. Set **Root Directory** to `yga-website-2`.
3. Choose **Framework Preset: Other** and **Node.js: 24.x** (22.x also works).
4. Use **Build Command: `npm run build`** and **Output Directory: `dist`**. Leave the install command at its default; the project has no package dependencies.
5. Deploy the `main` branch.

The project includes Vercel configuration, four direct page routes, local assets, and serverless API handlers. Deploy the project source rather than the standalone preview, so its security policy and page routes work correctly.

Application delivery is disabled by default. The site can be hosted without provider credentials. To enable real submissions, configure the server environment variables described in `yga-website-2/README.md`, using the final public origin and your own provider accounts. Never commit secret values.

## Develop

With Node.js 22 or later:

```sh
cd yga-website-2
npm run dev
```

Run `npm run check` for the automated checks and `npm run build` for the production output. Edit the source in `public/`; the build regenerates `yga-preview.html` and `dist/`.
