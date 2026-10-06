import {routeInfo} from '../public/experience-data.js';

export function renderPage(html,page='home') {
  if(!Object.hasOwn(routeInfo,page))page='home';
  const info=routeInfo[page];
  return html
    .replace(/<div data-page="(home|approach|products|studio)" id="page-\1"(?: hidden)?>/g,(_,name)=>`<div data-page="${name}" id="page-${name}"${name===page?'':' hidden'}>`)
    .replace(/<title>[^<]*<\/title>/,`<title>${info.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(">)/,`$1${info.description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/,`$1${info.title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(">)/,`$1${info.description}$2`)
    .replace('<body>',`<body data-route="${page}">`);
}
