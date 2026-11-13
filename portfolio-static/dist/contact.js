// Rasterize actual font ink once per layout, retaining each column's visible upper edge.
const surfaceIds=new WeakMap();let nextSurface=0;
const inkCache=new Map();
let surfaceCache=[];
function identity(el){if(!surfaceIds.has(el))surfaceIds.set(el,nextSurface++);return surfaceIds.get(el);}
export function textSurfaces({reuseLayout=false}={}){
 if(reuseLayout&&surfaceCache.length)return surfaceCache.filter(({el})=>el.isConnected&&!el.hasAttribute('data-eaten')).flatMap(({ledges})=>ledges);
 surfaceCache=[];const angles=new WeakMap();
 const out=[], c=document.createElement('canvas'),ctx=c.getContext('2d',{willReadFrequently:true});let id=0;
 const entries=[...document.querySelectorAll('.food-letter')].filter(el=>!el.closest('.mast,footer,.habitat')&&el.textContent.trim()).map(el=>{const marker=document.createElement('i');marker.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';el.append(marker);return{el,marker};});
 for(const {el,marker} of entries){
  const text=el.textContent;
  const style=getComputedStyle(el),r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
  const baseline=marker.getBoundingClientRect();
  const size=parseFloat(style.fontSize);
  const stroke=parseFloat(style.webkitTextStrokeWidth)||0,key=style.font+'|'+stroke+'|'+text;
  let ink=inkCache.get(key);if(!ink){
   c.width=Math.ceil(r.width+size*2);c.height=Math.ceil(size*3);
   ctx.font=style.font;ctx.fillStyle='#fff';ctx.textBaseline='alphabetic';ctx.fillText(text,size,size*2);
   if(stroke){ctx.strokeStyle='#fff';ctx.lineWidth=stroke;ctx.strokeText(text,size,size*2);}
   const pixels=ctx.getImageData(0,0,c.width,c.height).data,advance=ctx.measureText(text).width;ink=[];
   // Retain the full ink sample so rotated lettering keeps its exact contact edge.
   for(let x=0;x<c.width;x++)for(let y=0;y<c.height;y++)if(pixels[(y*c.width+x)*4+3]>96)ink.push([x-size-advance,y-size*2]);
   inkCache.set(key,ink);
  }
  let angle=0;for(let a=el;a&&a!==document.body;a=a.parentElement){if(!angles.has(a)){const t=getComputedStyle(a).transform;angles.set(a,t==='none'?0:(()=>{const m=new DOMMatrix(t);return Math.atan2(m.b,m.a);})());}angle+=angles.get(a);}
  const cos=Math.cos(angle),sin=Math.sin(angle),tops=new Map();
  // The zero-height marker identifies the rendered baseline at the end of this glyph.
  for(const [dx,dy] of ink){
   const px=Math.round(baseline.left+dx*cos-dy*sin),py=baseline.top+scrollY+dx*sin+dy*cos;
   tops.set(px,Math.min(tops.get(px)??Infinity,py));
  }
  const minX=Math.min(...tops.keys()),ledges=[];for(const [x,y] of tops)ledges.push({id:'g'+identity(el)+':'+(x-minX),x,y,width:1});
  surfaceCache.push({el,ledges});if(!el.hasAttribute('data-eaten'))out.push(...ledges);
 }
 for(const {marker} of entries)marker.remove();
 for(const el of document.querySelectorAll('.scrap,.habitat,.list,.work-heading')){
  const r=el.getBoundingClientRect(),style=getComputedStyle(el);if(!parseFloat(style.borderTopWidth)&&!el.classList.contains('scrap'))continue;
  let angle=0;const t=style.transform;if(t!=='none'){const m=new DOMMatrix(t);angle=Math.atan2(m.b,m.a);}
  const ledges=[];for(let x=0;x<r.width;x+=2)ledges.push({id:'b'+identity(el)+':'+x,x:r.left+x,y:r.top+scrollY+(angle>=0?x:r.width-x)*Math.sin(Math.abs(angle)),width:2});
  surfaceCache.push({el,ledges});out.push(...ledges);
 }
 return out;
}
// Sample the same outline once, rather than allocate 50 points for every collision.
const outline=[];
function quadratic(p0,p1,p2){for(let i=0;i<=24;i++){const t=i/24;outline.push([(1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0],(1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]]);}}
quadratic([-1,0],[-.7,-.8],[0,-.55]);outline.push([.45,-.9],[.55,-.25],[1,0]);quadratic([1,0],[.2,1],[-1,0]);outline.push([.68,0]);
export function leafBottom(r,a){
 const sin=Math.sin(a),cos=Math.cos(a);let bottom=r*(-1.3*sin+.3/r*cos);
 for(const [x,y] of outline)bottom=Math.max(bottom,r*(x*sin+y*cos));
 return bottom+.225;
}
