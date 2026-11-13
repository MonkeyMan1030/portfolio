// Document-anchored canvas tiles. The browser scrolls the pixels with the page;
// JavaScript only changes the drawing, never compensates for the scroll offset.
export class SketchTiles {
  constructor(first, create, tileHeight=512) {
    this.first=first;this.create=create;this.tileHeight=tileHeight;this.tiles=[];
  }
  resize(width,height,dpr) {
    const count=Math.max(1,Math.ceil(height/this.tileHeight));
    while(this.tiles.length>count)this.tiles.pop().canvas.remove();
    while(this.tiles.length<count){
      const canvas=this.tiles.length?this.create():this.first;
      canvas.classList.add('page-sketch-tile');canvas.setAttribute('aria-hidden','true');
      this.tiles.push({canvas,ctx:canvas.getContext('2d'),top:0,height:0,dirty:true});
    }
    this.tiles.forEach((tile,i)=>{
      tile.top=i*this.tileHeight;tile.height=Math.min(this.tileHeight,height-tile.top);
      const w=Math.round(width*dpr),h=Math.ceil(tile.height*dpr);
      if(tile.canvas.width!==w)tile.canvas.width=w;
      if(tile.canvas.height!==h)tile.canvas.height=h;
      Object.assign(tile.canvas.style,{top:tile.top+'px',left:'0px',width:width+'px',height:tile.height+'px'});
      tile.dirty=true;
    });
  }
  invalidate(){for(const tile of this.tiles)tile.dirty=true;}
  visible(top,height){return this.tiles.filter(t=>t.top+t.height>top-this.tileHeight&&t.top<top+height+this.tileHeight);}
}
