/* YGA's small, dependency-free WebGL scene. Original geometry and artwork. */
const I = () => [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function mul(a,b){const o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
function transform(p=[0,0,0],r=[0,0,0],s=[1,1,1]){const [x,y,z]=r,cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);const rx=[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1],ry=[cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1],rz=[cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1];const out=mul(mul(ry,rx),rz);for(let c=0;c<3;c++)for(let row=0;row<3;row++)out[c*4+row]*=s[c];out[12]=p[0];out[13]=p[1];out[14]=p[2];return out;}
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);};
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
function lookAt(eye,target){const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function perspective(fov,aspect,near=.1,far=100){const f=1/Math.tan(fov/2);return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];}
function normalMatrix(m){const a=[m[0],m[1],m[2]],b=[m[4],m[5],m[6]],c=[m[8],m[9],m[10]];const bc=cross(b,c),ca=cross(c,a),ab=cross(a,b),d=dot(a,bc)||1;return [...bc.map(v=>v/d),...ca.map(v=>v/d),...ab.map(v=>v/d)];}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function chamferBox(){
  const verts=[],normals=[],uvs=[];const ring=(s,z)=>[[-s+.07,-s,z],[s-.07,-s,z],[s,-s+.07,z],[s,s-.07,z],[s-.07,s,z],[-s+.07,s,z],[-s,s-.07,z],[-s,-s+.07,z]];
  const rings=[ring(.46,-.5),ring(.5,-.46),ring(.5,.46),ring(.46,.5)];
  function tri(a,b,c,n){n=n||norm(cross(sub(b,a),sub(c,a)));[a,b,c].forEach(v=>{verts.push(...v);normals.push(...n);uvs.push(v[0]+.5,v[1]+.5);});}
  for(let j=0;j<3;j++)for(let k=0;k<8;k++){const q=(k+1)%8,a=rings[j][k],b=rings[j][q],c=rings[j+1][q],d=rings[j+1][k];tri(a,b,c);tri(a,c,d);}
  for(let k=0;k<8;k++){let q=(k+1)%8;tri([0,0,-.5],rings[0][q],rings[0][k],[0,0,-1]);tri([0,0,.5],rings[3][k],rings[3][q],[0,0,1]);}
  return {verts,normals,uvs};
}
function cylinder(){const verts=[],normals=[],uvs=[];const add=(p,n)=>{verts.push(...p);normals.push(...n);uvs.push(p[0]+.5,p[2]+.5);};for(let i=0;i<40;i++){const a=i*Math.PI/20,b=(i+1)*Math.PI/20,pa=[Math.cos(a)*.5,Math.sin(a)*.5],pb=[Math.cos(b)*.5,Math.sin(b)*.5];for(const [p,n] of [[[pa[0],-.5,pa[1]],[pa[0]*2,0,pa[1]*2]],[[pb[0],-.5,pb[1]],[pb[0]*2,0,pb[1]*2]],[[pb[0],.5,pb[1]],[pb[0]*2,0,pb[1]*2]],[[pa[0],-.5,pa[1]],[pa[0]*2,0,pa[1]*2]],[[pb[0],.5,pb[1]],[pb[0]*2,0,pb[1]*2]],[[pa[0],.5,pa[1]],[pa[0]*2,0,pa[1]*2]]])add(p,n);add([0,.5,0],[0,1,0]);add([pa[0],.5,pa[1]],[0,1,0]);add([pb[0],.5,pb[1]],[0,1,0]);add([0,-.5,0],[0,-1,0]);add([pb[0],-.5,pb[1]],[0,-1,0]);add([pa[0],-.5,pa[1]],[0,-1,0]);}return{verts,normals,uvs};}

export function createScene(canvas){
  let gl;try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power',premultipliedAlpha:false});}catch{return null;}if(!gl)return null;
  const vs=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUv;uniform mat4 uModel;uniform mat4 uViewProjection;uniform mat3 uNormal;varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUv;void main(){vec4 p=uModel*vec4(aPosition,1.);vPosition=p.xyz;vNormal=normalize(uNormal*aNormal);vUv=aUv;gl_Position=uViewProjection*p;}`;
  const fs=`precision mediump float;uniform vec3 uColor;uniform vec3 uEye;uniform float uMetal;uniform float uGround;uniform float uUseTexture;uniform float uScroll;uniform sampler2D uTexture;varying vec3 vPosition;varying vec3 vNormal;varying vec2 vUv;void main(){vec3 n=normalize(vNormal),viewDir=normalize(uEye-vPosition);vec3 l=normalize(vec3(-.4,.9,.7));float diff=max(dot(n,l),0.);float fill=max(dot(n,normalize(vec3(.7,.2,-.6))),0.);float spec=pow(max(dot(n,normalize(l+viewDir)),0.),mix(34.,100.,uMetal));float rim=pow(1.-max(dot(n,viewDir),0.),3.);vec3 base=mix(uColor,texture2D(uTexture,vec2(vUv.x,clamp(vUv.y+uScroll,0.,1.))).rgb,uUseTexture);vec3 col=base*(.54+diff*.58+fill*.2)+vec3(spec)*mix(.28,.8,uMetal)+rim*.12;if(uGround>.5){float shadow=exp(-((vPosition.x*vPosition.x)/14.+(vPosition.z*vPosition.z)/7.));col=vec3(1.-shadow*.1);}gl_FragColor=vec4(col,1.);}`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('WebGL shader unavailable');}return s;}
  let program;try{program=gl.createProgram();const v=shader(gl.VERTEX_SHADER,vs),f=shader(gl.FRAGMENT_SHADER,fs);gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('WebGL link unavailable');}catch{return null;}
  gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(1,1,1,0);
  const u={};for(const key of ['Model','ViewProjection','Normal','Color','Eye','Metal','Ground','UseTexture','Texture','Scroll'])u[key]=gl.getUniformLocation(program,'u'+key);
  const attrib=['Position','Normal','Uv'].map(x=>gl.getAttribLocation(program,'a'+x));
  const allBuffers=[],allTextures=[];
  function mesh(data){const buffers=[data.verts,data.normals,data.uvs].map(a=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(a),gl.STATIC_DRAW);allBuffers.push(b);return b;});return {buffers,count:data.verts.length/3};}
  const cube=mesh(chamferBox()),cyl=mesh(cylinder()),plane=mesh({verts:[-.5,-.5,0,.5,-.5,0,.5,.5,0,-.5,-.5,0,.5,.5,0,-.5,.5,0],normals:Array(6).fill([0,0,1]).flat(),uvs:[0,0,1,0,1,1,0,0,1,1,0,1]});
  function texture(draw,w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw(ctx,w,h);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);allTextures.push(t);return t;}
  const white=texture((c,w,h)=>{c.fillStyle='#fff';c.fillRect(0,0,w,h);},2,2);
  const cover=texture((c,w,h)=>{c.fillStyle='#e8ff00';c.fillRect(0,0,w,h);c.fillStyle='#111';c.font='900 63px Arial';c.fillText('YGA',36,80);c.font='900 78px Impact, Arial Narrow, sans-serif';['YOUR NEXT','BIG THING.'].forEach((s,i)=>c.fillText(s,36,205+i*85));c.font='20px Arial';c.fillText('Created entirely for you.',36,335);c.fillStyle='#2453ff';c.font='bold 220px Arial';c.fillText('↗',245,485);c.fillStyle='#111';c.font='15px Arial';c.fillText('CREATOR EDITION / 01',36,470);});
  const feed=texture((c,w,h)=>{c.fillStyle='#fff';c.fillRect(0,0,w,h);c.fillStyle='#111';c.font='bold 31px Arial';c.fillText('Your creator world',25,58);c.fillStyle='#2453ff';c.fillRect(25,85,w-50,270);c.fillStyle='#e8ff00';c.font='bold 82px Arial';c.fillText('YOU',75,225);c.font='20px Arial';c.fillStyle='#fff';c.fillText('Your content. Your brand.',45,320);c.fillStyle='#111';c.font='23px Arial';c.fillText('What should I make next?',25,400);c.fillStyle='#e8ff00';c.fillRect(25,430,w-50,88);c.fillStyle='#111';c.font='20px Arial';c.fillText('Can you go deeper?',42,480);c.fillStyle='#f0f2f6';c.fillRect(25,545,w-50,90);c.fillStyle='#111';c.fillText('Where should I start?',42,595);c.fillStyle='#2453ff';c.fillRect(25,670,w-50,8);},512,768);
  const shop=texture((c,w,h)=>{c.fillStyle='#f6f7fa';c.fillRect(0,0,w,h);c.fillStyle='#111';c.font='bold 33px Arial';c.fillText('YGA',30,50);c.fillStyle='#e8ff00';c.fillRect(30,83,200,235);c.fillStyle='#111';c.font='bold 34px Impact, Arial Narrow, sans-serif';c.fillText('YOUR NEXT',45,150);c.fillText('BIG THING.',45,192);c.fillStyle='#2453ff';c.font='bold 100px Arial';c.fillText('↗',95,292);c.fillStyle='#111';c.font='bold 29px Arial';c.fillText('Built for',267,124);c.fillText('your audience.',267,163);c.fillStyle='#737983';for(let i=0;i<4;i++)c.fillRect(269,194+i*18,160-i*8,5);c.fillStyle='#2453ff';c.fillRect(266,285,195,39);c.fillStyle='#fff';c.font='17px Arial';c.fillText('Explore the product',283,310);},512,360);
  const question=texture((c,w,h)=>{c.fillStyle='#fff';c.fillRect(0,0,w,h);c.fillStyle='#2453ff';c.beginPath();c.arc(35,48,17,0,Math.PI*2);c.fill();c.fillStyle='#111';c.font='24px Arial';c.fillText('Can you go deeper?',67,56);},512,96);
  const question2=texture((c,w,h)=>{c.fillStyle='#e8ff00';c.fillRect(0,0,w,h);c.fillStyle='#111';c.font='25px Arial';c.fillText('Where should I start?',29,58);},512,96);
  const colors={yellow:[.91,1,0],blue:[.08,.22,.93],dark:[.025,.029,.035],chrome:[.65,.7,.76],light:[.93,.95,.98],white:[1,1,1]};
  let visible=true,disposed=false,paused=false,frame=0,t=0,last=0,mode=0,modeValue=0,progress=0,targetProgress=0,dragging=false,startX=0,startYaw=0,yaw=-.18,targetYaw=-.18,pitch=0,targetPitch=0,width=1,height=1;
  const media=matchMedia('(prefers-reduced-motion: reduce)');let reduced=media.matches;
  function draw(shape,m,color,metal=0,tex=null,ground=0){for(let i=0;i<3;i++){gl.bindBuffer(gl.ARRAY_BUFFER,shape.buffers[i]);gl.enableVertexAttribArray(attrib[i]);gl.vertexAttribPointer(attrib[i],i===2?2:3,gl.FLOAT,false,0,0);}gl.uniformMatrix4fv(u.Model,false,m);gl.uniformMatrix3fv(u.Normal,false,normalMatrix(m));gl.uniform3fv(u.Color,colors[color]||color);gl.uniform1f(u.Metal,metal);gl.uniform1f(u.Ground,ground);gl.uniform1f(u.UseTexture,tex?1:0);gl.uniform1f(u.Scroll,tex===feed?progress*.18:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex||white);gl.uniform1i(u.Texture,0);gl.drawArrays(gl.TRIANGLES,0,shape.count);}
  const part=(parent,p,s,color,r=[0,0,0],metal=0)=>draw(cube,mul(parent,transform(p,r,s)),color,metal);
  const face=(parent,p,s,tex)=>draw(plane,mul(parent,transform(p,[0,0,0],[s[0],s[1],1])),'white',0,tex);
  function letter(parent,x,y,type){const L=mul(parent,transform([x,y,.96],[0,0,0],[.7,.7,.7]));if(type==='Y'){part(L,[-.38,.3,0],[.38,1.12,.36],'dark',[0,0,.55]);part(L,[.38,.3,0],[.38,1.12,.36],'dark',[0,0,-.55]);part(L,[0,-.47,0],[.39,.9,.36],'dark');}if(type==='G'){part(L,[-.58,0,0],[.35,1.75,.36],'dark');part(L,[0,.7,0],[1.3,.35,.36],'dark');part(L,[0,-.7,0],[1.3,.35,.36],'dark');part(L,[.5,-.32,0],[.35,.9,.36],'dark');part(L,[.33,.06,0],[.65,.33,.36],'dark');}if(type==='A'){part(L,[-.38,0,0],[.37,1.9,.36],'dark',[0,0,-.32]);part(L,[.38,0,0],[.37,1.9,.36],'dark',[0,0,.32]);part(L,[0,-.18,0],[.8,.3,.36],'dark');}}
  function render(now=0){frame=0;if(disposed||!visible||document.hidden)return;const dt=Math.min((now-last)/1000,.04)||.016;last=now;if(!paused&&!reduced)t+=dt;const smoothing=(paused||reduced)?1:1-Math.exp(-dt*7);yaw+=(targetYaw-yaw)*smoothing;pitch+=(targetPitch-pitch)*smoothing;modeValue+=(mode-modeValue)*smoothing;progress+=(targetProgress-progress)*smoothing;
    gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const mobile=width<650;const travel=reduced||paused?0:Math.sin(progress*Math.PI);const focus=Math.sin(modeValue*Math.PI/2);const eye=[7.8-focus*2.3-travel*.5,4.3-focus*1.0,(mobile?14.6:12.3)-focus*2.4-travel*.7];const projection=perspective(.58,width/height);const view=lookAt(eye,[0,.6,0]);gl.uniformMatrix4fv(u.ViewProjection,false,mul(projection,view));gl.uniform3fv(u.Eye,eye);
    const root=transform([0,-.1,0],[pitch,yaw,0]);draw(cube,transform([0,-2.13,0],[0,0,0],[14,.05,10]),'white',0,null,1);
    // Sculptural yellow arch with cobalt inner lining and chrome base.
    part(root,[-3.12,.18,-.65],[.86,4.45,1.55],'yellow',[0,0,-.04]);part(root,[3.12,.18,-.65],[.86,4.45,1.55],'yellow',[0,0,.04]);part(root,[0,2.62,-.65],[7.12,1.25,1.55],'yellow');
    part(root,[-2.61,.12,-.62],[.14,3.85,1.35],'blue');part(root,[2.61,.12,-.62],[.14,3.85,1.35],'blue');part(root,[0,1.94,-.62],[5.22,.15,1.35],'blue');
    part(root,[0,-1.96,0],[7.45,.23,4.35],'chrome',[0,0,0],1);part(root,[0,-1.78,-.85],[5.28,.14,2.32],'blue');part(root,[0,-.02,-1.46],[5.15,3.9,.15],'blue');
    letter(root,-1.45,2.6,'Y');letter(root,0,2.6,'G');letter(root,1.52,2.6,'A');
    // Fine ribs reinforce the architectural form without heavy geometry.
    for(let i=0;i<7;i++)part(root,[-2.15+i*.71,-1.61,-.7],[.025,.018,1.75],'chrome',[0,0,0],.7);
    const bob=(paused||reduced)?0:Math.sin(t*.8)*.055;const bookLift=Math.sin(modeValue*Math.PI/2)*.5;
    // Laptop: hinged screen, keyboard, trackpad and custom product-page texture.
    const laptop=mul(root,transform([-.35,-1.64,1.05],[0,-.13,0]));part(laptop,[0,0,0],[3.1,.13,1.85],'chrome',[0,0,0],.9);part(laptop,[0,.081,-.17],[2.5,.015,.92],'dark');for(let j=0;j<4;j++)for(let i=0;i<10;i++)part(laptop,[-1.1+i*.245,.096,-.49+j*.21],[.18,.01,.13],'chrome',[0,0,0],.4);part(laptop,[0,.082,.51],[.7,.014,.39],'chrome',[0,0,0],.8);
    const hinge=mul(laptop,transform([0,.08,-.79],[-.13-.09*Math.sin(modeValue),0,0]));part(hinge,[0,.99,0],[3.1,1.95,.115],'chrome',[0,0,0],1);part(hinge,[0,1,.072],[2.94,1.8,.02],'dark');face(hinge,[0,1,.09],[2.82,1.67],shop);
    // Phone comes forward for the audience view.
    const phone=mul(root,transform([2.04,.06+bob,.85+(.7-Math.min(modeValue,.7))],[.07,-.28,.13]));part(phone,[0,0,0],[1.21,2.49,.15],'chrome',[0,0,0],1);part(phone,[0,0,.09],[1.12,2.4,.04],'dark');face(phone,[0,0,.12],[1.03,2.21],feed);part(phone,[0,1.05,.134],[.37,.055,.016],'dark');
    // Physical workbook moves into the foreground in the product view.
    const book=mul(root,transform([-2.1+modeValue*.18,-.2+bookLift+bob,1.12+Math.sin(modeValue*Math.PI/2)*.8],[.04,.22+modeValue*.16,-.13+modeValue*.12]));part(book,[0,0,0],[1.7,2.3,.2],'yellow');part(book,[.035,0,.112],[1.57,2.23,.032],'light');face(book,[0,0,.146],[1.68,2.3],cover);part(book,[-.815,0,.125],[.05,2.3,.04],'yellow');
    // Audience questions gather around the scene.
    const qRoot=mul(root,transform([0,.1,0],[0,0,0]));for(let i=0;i<2;i++){const q=mul(qRoot,transform([i?1.1:-1.15,1.37+(i?.3:0)+bob*.8,1.0+modeValue*.12],[0,-.14,i?-.08:.06]));part(q,[0,0,0],[2.15,.43,.07],i?'yellow':'white');face(q,[0,0,.05],[2.06,.386],i?question2:question);}
    // Cobalt disc and yellow growth steps give the scene a recognizable base.
    draw(cyl,mul(root,transform([3.5,-1.68,1.5],[0,0,0],[1.55,.36,1.55])),'blue',.35);
    const steps=mul(root,transform([3.4,-1.28,1.53],[0,-.1,0]));for(let i=0;i<3;i++)part(steps,[-.48+i*.42,i*.2,0],[.38,.3+i*.4,.6],'yellow');
    const settled=Math.abs(yaw-targetYaw)+Math.abs(pitch-targetPitch)+Math.abs(mode-modeValue)+Math.abs(progress-targetProgress)<.002;
    if(!reduced&&!paused||!settled)frame=requestAnimationFrame(render);
  }
  function schedule(){if(!frame&&!disposed&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
  function resize(){width=Math.max(1,canvas.clientWidth);height=Math.max(1,canvas.clientHeight);const dpr=Math.min(devicePixelRatio||1,width<650?1.35:1.65);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);schedule();}
  const ro=new ResizeObserver(resize);ro.observe(canvas);
  const io=new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(visible){last=performance.now();schedule();}else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'60px'});io.observe(canvas);
  function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=performance.now();schedule();}}
  function move(e){if(dragging){targetYaw=clamp(startYaw+(e.clientX-startX)*.005,-.95,.7);}else if(e.pointerType==='mouse'){const box=canvas.getBoundingClientRect();targetYaw=-.18+((e.clientX-box.left)/box.width-.5)*.22;targetPitch=((e.clientY-box.top)/box.height-.5)*.06;}schedule();}
  function down(e){if(e.button&&e.button!==0)return;dragging=true;startX=e.clientX;startYaw=targetYaw;canvas.setPointerCapture?.(e.pointerId);}
  function up(){dragging=false;}
  function key(e){if(['ArrowLeft','ArrowRight','Home'].includes(e.key)){e.preventDefault();targetYaw=e.key==='Home'?-.18:clamp(targetYaw+(e.key==='ArrowLeft'?-.12:.12),-.95,.7);schedule();}}
  function changeMotion(e){reduced=e.matches;schedule();}
  function contextLost(e){e.preventDefault();canvas.parentElement.classList.remove('webgl-ready');cancelAnimationFrame(frame);frame=0;}
  canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('keydown',key);canvas.addEventListener('webglcontextlost',contextLost);document.addEventListener('visibilitychange',visibility);media.addEventListener('change',changeMotion);
  resize();canvas.parentElement.classList.add('webgl-ready');schedule();
  return {setMode(v){mode=clamp(v,0,2);schedule();},setProgress(v){targetProgress=clamp(v,0,1);mode=targetProgress*2;schedule();},setPaused(v){paused=v;schedule();},dispose(){disposed=true;cancelAnimationFrame(frame);ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',changeMotion);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('keydown',key);canvas.removeEventListener('webglcontextlost',contextLost);allBuffers.forEach(b=>gl.deleteBuffer(b));allTextures.forEach(t=>gl.deleteTexture(t));gl.deleteProgram(program);}};
}
