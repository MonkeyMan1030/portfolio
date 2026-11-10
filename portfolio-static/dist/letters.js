export function prepareLetters(){
 const root=document.querySelector('.notebook');
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){return /\p{L}/u.test(n.data)&&!n.parentElement.closest('script,style,svg,button,input,select,textarea,.bear-request,.food-letter,.edible')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 // A neutral inline custom element avoids inherited structural rules such as
 // `.contents span { display:block; font:... }` changing every individual letter.
 for(const node of nodes){const f=document.createDocumentFragment();for(const char of node.data){if(/\p{L}/u.test(char)){const glyph=document.createElement('letter-glyph');glyph.className='food-letter';glyph.textContent=char;f.append(glyph);}else f.append(document.createTextNode(char));}node.replaceWith(f);}
 document.querySelectorAll('.edible').forEach(e=>e.classList.add('food-letter'));
}
