const article=document.querySelector('.reading-page main article');
if(article){
  const prose=article.querySelector('.prose'),progress=article.querySelector('progress');
  const label=article.querySelector('[data-progress-label]');
  const links=[...article.querySelectorAll('.toc a')];
  const headings=links.map(link=>document.getElementById(decodeURIComponent(link.hash.slice(1))));
  article.querySelector('.reading-progress').hidden=false;
  let scheduled=false, previousActive=-2;
  const toc=article.querySelector('.reading-rail .toc');
  const update=()=>{
    scheduled=false;
    const box=prose.getBoundingClientRect();
    const fraction=box.height<=innerHeight? (innerHeight-box.top)/box.height : (80-box.top)/(box.height-innerHeight+80);
    const percent=Math.round(Math.max(0,Math.min(1,fraction))*100);
    progress.value=percent;progress.textContent=label.textContent=`${percent}%`;
    let active=-1;headings.forEach((heading,i)=>{if(heading && heading.getBoundingClientRect().top<=150)active=i;});
    links.forEach((link,i)=>{if(i===active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    if(active!==previousActive && toc?.open && matchMedia('(min-width:1200px)').matches){
      if(active<0)toc.scrollTop=0;
      else {const item=links[active].getBoundingClientRect(),box=toc.getBoundingClientRect();
        if(item.top<box.top)toc.scrollTop+=item.top-box.top-8;
        else if(item.bottom>box.bottom)toc.scrollTop+=item.bottom-box.bottom+8;
      }
    }
    previousActive=active;
  };
  const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
  new ResizeObserver(schedule).observe(prose);update();
  const motion=article.querySelector('[data-reading-motion]'),zh=document.documentElement.lang==='zh-CN';
  motion.hidden=false;
  let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{paused ||= localStorage.getItem('reading-sprites-paused')==='true';}catch{}
  const setMotion=()=>{article.classList.toggle('sprites-paused',paused);motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?(zh?'播放动画':'Play animation'):(zh?'暂停动画':'Pause animation');};
  motion.addEventListener('click',()=>{paused=!paused;setMotion();try{localStorage.setItem('reading-sprites-paused',String(paused));}catch{}});setMotion();
}
