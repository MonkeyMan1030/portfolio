// Rasterize actual font ink once per layout, retaining each column's visible upper edge.
const surfaceIds=new WeakMap();let nextSurface=0;
const inkCache=new Map();
function identity(el){if(!surfaceIds.has(el))surfaceIds.set(el,nextSurface++);return surfaceIds.get(el);}
export function textSurfaces(){
 const out=[], c=document.createElement('canvas'),ctx=c.getContext('2d',{willReadFrequently:true});let id=0;
 const entries=[...document.querySelectorAll('.food-letter:not([data-eaten])')].filter(el=>!el.closest('.mast,footer,.habitat')&&el.textContent.trim()).map(el=>{const marker=document.createElement('i');marker.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';el.append(marker);return{el,marker};});
 for(const {el,marker} of entries){
  const text=el.textContent;
  const style=getComputedStyle(el),r=el.getBoundingClientRect();if(!r.width||!r.height)continue;
  const baseline=marker.getBoundingClientRect();
  const size=parseFloat(style.fontSize);c.width=Math.ceil(r.width+size*2);c.height=Math.ceil(size*3);
  const stroke=parseFloat(style.webkitTextStrokeWidth)||0,key=style.font+'|'+stroke+'|'+text;
  let ink=inkCache.get(key);if(!ink){
   ctx.font=style.font;ctx.fillStyle='#fff';ctx.textBaseline='alphabetic';ctx.fillText(text,size,size*2);
   if(stroke){ctx.strokeStyle='#fff';ctx.lineWidth=stroke;ctx.strokeText(text,size,size*2);}
   const pixels=ctx.getImageData(0,0,c.width,c.height).data,advance=ctx.measureText(text).width;ink=[];
   for(let x=0;x<c.width;x++)for(let y=0;y<c.height;y++)if(pixels[(y*c.width+x)*4+3]>96)ink.push([x-size-advance,y-size*2]);
   inkCache.set(key,ink);
  }
  let angle=0;for(let a=el;a&&a!==document.body;a=a.parentElement){const t=getComputedStyle(a).transform;if(t!=='none'){const m=new DOMMatrix(t);angle+=Math.atan2(m.b,m.a);}}
  const cos=Math.cos(angle),sin=Math.sin(angle),tops=new Map();
  // The zero-height marker identifies the rendered baseline at the end of this glyph.
  for(const [dx,dy] of ink){
   const px=Math.round(baseline.left+dx*cos-dy*sin),py=baseline.top+scrollY+dx*sin+dy*cos;
   tops.set(px,Math.min(tops.get(px)??Infinity,py));
  }
  const minX=Math.min(...tops.keys());for(const [x,y] of tops)out.push({id:'g'+identity(el)+':'+(x-minX),x,y,width:1});
 }
 for(const {marker} of entries)marker.remove();
 for(const el of document.querySelectorAll('.scrap,.habitat,.list,.work-heading')){
  const r=el.getBoundingClientRect(),style=getComputedStyle(el);if(!parseFloat(style.borderTopWidth)&&!el.classList.contains('scrap'))continue;
  let angle=0;const t=style.transform;if(t!=='none'){const m=new DOMMatrix(t);angle=Math.atan2(m.b,m.a);}
  for(let x=0;x<r.width;x+=2)out.push({id:'b'+identity(el)+':'+x,x:r.left+x,y:r.top+scrollY+(angle>=0?x:r.width-x)*Math.sin(Math.abs(angle)),width:2});
 }
 return out;
}
// Exact sampled outline shared with leafShape; includes its pencil stem and stroke.
export function leafBottom(r,a){
 const points=[];const q=(p0,p1,p2)=>{for(let i=0;i<=24;i++){const t=i/24;points.push([(1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0],(1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]]);}};
 q([-1,0],[-.7,-.8],[0,-.55]);points.push([.45,-.9],[.55,-.25],[1,0]);q([1,0],[.2,1],[-1,0]);points.push([-1.3,.3/r],[.68,0]);
 return Math.max(...points.map(([x,y])=>r*(x*Math.sin(a)+y*Math.cos(a))))+.225;
}
