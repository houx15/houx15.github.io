let nextJourney=0;
// Progressive enhancement: the complete chronology remains readable without JS.
export function setupJourneys(root) {
  for(const journey of root.querySelectorAll('[data-journey]:not([data-ready])')) {
    const buttons=[...journey.querySelectorAll('[data-stop]')];
    const entries=[...journey.querySelectorAll('[data-milestone]')];
    const panel=journey.querySelector('.journey-detail');
    if(!buttons.length || entries.length!==buttons.length) continue;
    panel.id=`journey-detail-${++nextJourney}`;
    function select(index) {
      if(buttons[index].getAttribute('aria-pressed')==='true') return;
      buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
      panel.replaceChildren(...[...entries[index].children].map(element=>element.cloneNode(true)));
    }
    buttons.forEach((button,index)=>{
      button.setAttribute('aria-controls',panel.id);
      button.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse') select(index);});
      button.addEventListener('focus',()=>select(index));
      button.addEventListener('click',()=>select(index));
      button.addEventListener('keydown',event=>{
        const offsets={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1};
        let target;
        if(event.key==='Home') target=0;
        else if(event.key==='End') target=buttons.length-1;
        else if(Object.hasOwn(offsets,event.key)) target=(index+offsets[event.key]+buttons.length)%buttons.length;
        else return;
        event.preventDefault();buttons[target].focus();
      });
    });
    select(1);
    journey.querySelector('.journey-fallback').hidden=true;
    for(const selector of ['.journey-map','.journey-hint','.journey-detail']) journey.querySelector(selector).hidden=false;
    journey.dataset.ready='true';
  }
}
