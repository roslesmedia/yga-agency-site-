export const routeInfo = {
  home:{title:'YGA — Young Growth Agency',label:'Home',description:'YGA creates complete custom digital products for creators. Research, writing, structure, design and delivery, tailored to your content, brand and niche.'},
  approach:{title:'Our approach — YGA',label:'Our approach',description:'How YGA researches, writes, designs and builds a complete digital product around your content, your brand and your audience.'},
  products:{title:'Custom products — YGA',label:'Custom products',description:'Explore custom ebooks, creator-led courses and workbooks. Every product is researched, written and designed from the ground up for its creator.'},
  studio:{title:'The studio — YGA',label:'The studio',description:'A behind-the-scenes product partner for creators. Your content, brand and niche guide every part of the product we create.'}
};

export function parseRoute(pathname='/',hash='') {
  const match=hash.match(/^#\/(home|approach|products|studio)(?:\/([a-z0-9-]+))?$/);
  if(match)return {page:match[1],section:match[2]||''};
  const page=pathname.replace(/^\/+|\/+$/g,'').replace(/\/index\.html$/,'');
  const section=/^#[a-z][a-z0-9-]*$/.test(hash)?hash.slice(1):'';
  return {page:Object.hasOwn(routeInfo,page)?page:'home',section};
}
export function routeHref(page,section='',offline=false) {
  if(!Object.hasOwn(routeInfo,page))page='home';
  const safeSection=/^[a-z][a-z0-9-]*$/.test(section)?section:'';
  return offline?`#/${page}${safeSection?'/'+safeSection:''}`:`${page==='home'?'/':'/'+page+'/'}${safeSection?'#'+safeSection:''}`;
}
export function storyState(progress) {
  const p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));
  return {progress:p,chapter:p<.34?0:p<.72?1:2,product:Math.max(0,Math.min(1,(p-.2)/.19)),launch:Math.max(0,Math.min(1,(p-.66)/.19))};
}
export const productConcepts=[
  {format:'Custom guide / photography',cover:'Find your light.',title:'Your knowledge. A complete original guide.',description:'For a photography creator, we could research the audience’s recurring questions, write the explanations, structure the learning journey and design the complete ebook in that creator’s visual language.',glyph:'↗',pages:[['Start with the real question.','Audience research defines the problem this particular guide should solve. The creator’s existing content helps us identify their distinctive approach.'],['Write it in their world.','We develop the original chapters, examples and explanations around that approach. The creator reviews technical accuracy and voice.'],['Design the finished product.','We create the cover, typography, layouts and final reading experience to fit the creator’s brand, then prepare delivery.']]},
  {format:'Custom course / creator expertise',cover:'Show them your way.',title:'An original course. Built around you.',description:'We develop the complete course concept, curriculum, lesson scripts, supporting content and visual identity behind the scenes. When video is part of the product, the real creator brings their voice and expertise to the recording.',glyph:'▷',pages:[['Build the learning journey.','We research what the audience needs to understand and create a course structure suited to the niche, subject and creator.'],['Develop every lesson.','We write the lesson content, scripts and supporting material. The creator checks accuracy and records their teaching where video is needed.'],['Create the complete experience.','We handle the agreed editing, graphics, product pages and delivery setup. The course feels like an extension of the creator’s brand.']]},
  {format:'Custom workbook / productivity',cover:'Make room for progress.',title:'A practical product. Entirely their own.',description:'For a productivity creator, we could turn their method into a complete original workbook: researched exercises, written guidance, a clear progression and a custom visual system.',glyph:'◎',pages:[['Understand their method.','We study how the creator explains the problem and how their audience currently tries to solve it. That evidence sets the direction.'],['Create the content.','We write the prompts, exercises, explanations and examples from the ground up around the creator’s approach.'],['Bring the brand into every page.','We design the cover, page structure and interactive or printable experience around the creator’s style, then prepare the finished files.']]}
];
export const quizQuestions=[
  {title:'What do people come to you for?',choices:['Learning a specific skill','Following my approach or method','Understanding a subject more deeply']},
  {title:'What comes up in your audience?',choices:['The same questions, again and again','Requests for a deeper explanation','I’m still learning what they need']},
  {title:'What do you want help with?',choices:['Creating the entire product','Turning my content into a clear offer','Finding the right product opportunity']}
];
export function getFitResult(answers) {
  if(answers.length!==3||answers.some(v=>!Number.isInteger(v)||v<0||v>2))return null;
  if(answers[1]===2||answers[2]===2)return {title:'Start with audience research.',copy:'The first step is finding the problem your audience wants solved. We can explore your content and niche, then shape a custom product around the evidence.'};
  if(answers[0]===0)return {title:'Your expertise could become a course.',copy:'We could research the audience need, create the full curriculum and lesson content, and design the finished product around your brand. The right format still needs validation.'};
  if(answers[0]===1)return {title:'Your method could become a workbook.',copy:'We could develop a complete original workbook around your approach—from the written guidance and exercises to every page of the design. Audience research comes first.'};
  return {title:'Your perspective could become a guide.',copy:'We could research, write, structure and design an original guide that goes deeper into what your audience comes to you for. It would be custom to your content, brand and niche.'};
}
