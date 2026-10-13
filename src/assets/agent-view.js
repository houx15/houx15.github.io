import { validateAgentBlock } from './agent-stream.js';

// Deliberately accepts only the validated v2 event vocabulary. No generated HTML.
export function createAgentTurn(document, { log, question, language = 'en', onQuestion = () => {}, restored = false, continuing = false }) {
  const zh = language === 'zh-CN';
  const make = (tag,text='',className='') => {const node=document.createElement(tag);node.textContent=text;node.className=className;return node;};
  log.querySelectorAll('button').forEach(button=>button.remove());
  const row=make('article','','comic-message comic-live-turn');
  row.append(make('p',question,'comic-visitor'));
  const progress=make('div','','comic-progress');progress.setAttribute('role','status');
  const progressText=make('span',zh?'正在连接…':'Connecting…');progress.append(progressText);row.append(progress);
  const body=make('div','','comic-live-body'), visuals=make('div','','comic-live-visuals');row.append(body,visuals);log.append(row);
  const sources=new Map(),blocks=new Map(),statuses=[];let finished=false, questionBlock;
  const toolLabels={search_content:zh?'在笔记中找线索':'Finding relevant notes',read_content:zh?'正在读原文':'Reading the source',read_profile:zh?'核对她的公开经历':'Checking her public biography',query_profile_events:zh?'整理经历的时间线':'Tracing her story',show_post_cards:zh?'挑选接下来值得读的内容':'Choosing a next read',show_visualization:zh?'整理图中的信息':'Arranging the visual',find_related_posts:zh?'寻找相关内容':'Finding related reading',suggest_questions:zh?'准备下一步问题':'Preparing a follow-up'};
  function renderBlock(block) {
    validateAgentBlock(block);
    let container=blocks.get(block.id);
    if(!container){container=make('section','','comic-agent-block');blocks.set(block.id,container);visuals.append(container);}
    container.replaceChildren();
    if(block.type==='reading_map') {
      container.classList.add('comic-reading-map');
      container.append(make('p',zh?'一起读懂这一篇':'A path through this piece','comic-visual-label'),make('h3',block.title));
      const list=make('ol');
      for(const [index,item] of block.items.entries()) {
        const step=make('li');step.append(make('span',String(index+1).padStart(2,'0'),'comic-map-number'));
        const details=make('details');if(index===0)details.open=true;
        details.append(make('summary',item.title || (zh?'开篇':'Opening')));
        details.append(make('blockquote',item.excerpt));
        const link=make('a',zh?'到原文继续读 ↗':'Continue in the source ↗');link.href=item.url;details.append(link);
        step.append(details);list.append(step);
      }
      container.append(list,make('p',zh?'按原文章节排列 · 展开查看原文摘录':'Original section order · expand for source excerpts','comic-visual-note'));return;
    }
    if(block.type==='questions') {
      // Model may suggest several; the interface chooses one next invitation.
      if(questionBlock && questionBlock!==block.id){container.remove();return;}
      questionBlock=block.id;
      const item=block.items[0];if(!item)return;
      const button=make('button',item.label+' ↗','comic-follow');button.type='button';button.disabled=true;
      button.addEventListener('click',()=>onQuestion(item.query));container.append(button);return;
    }
    if(block.type==='post_cards') {
      function addCard(item,parent) {
        const card=make('article','','comic-story-card comic-reading-card');
        card.append(make('span',zh?'接下来读':'READ NEXT','comic-card-number'));
        const heading=make('h3'),link=make('a',item.title);link.href=item.url;heading.append(link);card.append(heading,make('p',item.summary));parent.append(card);
      }
      if(block.items[0])addCard(block.items[0],container);
      if(block.items.length>1){const more=make('details','','comic-more-reading');more.append(make('summary',zh?`还有 ${block.items.length-1} 篇相关内容`:`${block.items.length-1} more related reads`));for(const item of block.items.slice(1))addCard(item,more);container.append(more);}return;
    }
    const biography=block.type==='event_timeline';
    container.append(make('p',biography?(zh?'她的经历':'Her story'):(zh?'内容发布的时间':'When these pieces were published'),'comic-visual-label'));
    let timeline=container;
    if(block.items.length>3) {
      timeline=make('details','','comic-timeline-expand');
      const label=biography?(zh?`展开 ${block.items.length} 段经历`:`Explore ${block.items.length} chapters`):(zh?`展开 ${block.items.length} 条发布记录`:`Explore ${block.items.length} publications`);
      timeline.append(make('summary',label));container.append(timeline);
    }
    const list=make('ol','','comic-life-line');
    for(const item of block.items){const li=make('li');li.append(make('span',biography?item.period:item.date),make('h3',item.title));if(biography)li.append(make('p',item.description));const a=make('a',zh?'原文 ↗':'Source ↗');a.href=biography?item.source.url:item.url;li.append(a);list.append(li);}timeline.append(list);
    container.append(make('p',biography?(zh?`依据截至 ${block.asOf} 的公开履历；时间可能重叠。`:`Public biography as of ${block.asOf}; periods may overlap.`):(zh?'这些是发布日期，不代表项目起止时间。':'Publication dates, not project start/end dates.'),'comic-visual-note'));
  }
  function end(failed, message) {
    finished=true;row.classList.toggle('is-incomplete',failed);progress.classList.remove('is-active');
    progressText.textContent=message;
    if(!failed) {
      progress.removeAttribute('role');
      if(restored){progress.replaceChildren(make('span',continuing?(zh?'已恢复对话 · AI 保留最近三轮上下文':'Conversation restored · AI retains the last three exchanges'):(zh?'上次的对话记录 · 新会话不会自动读取这段历史':'Previous conversation · new sessions do not automatically read this history')));}
      else if(!statuses.length){progress.remove();}
      else {
      const details=make('details','','comic-work-record');details.append(make('summary',zh?'查看查阅过程':'View the source-checking steps'));
      const list=make('ol');for(const step of statuses)list.append(make('li',step));details.append(list);progress.replaceChildren(details);
      }
      for(const button of row.querySelectorAll('button'))button.disabled=false;
    }
  }
  return {
    row,
    event(event) {
      if(finished)return;
      if(event.type==='status') {
        const label=event.phase==='tool_started'?(toolLabels[event.tool]||(zh?'正在查阅资料':'Checking the sources')):event.phase==='model_started'?(zh?'正在组织回答':'Preparing an answer'):null;
        if(label){progressText.textContent=label;progress.classList.add('is-active');if(statuses.at(-1)!==label)statuses.push(label);}
      } else if(event.type==='answer_delta') {
        let paragraph=body.querySelector('.comic-reply');
        if(!paragraph){paragraph=make('p','','comic-reply');body.append(paragraph);}
        paragraph.textContent+=event.text;
        progressText.textContent=zh?'正在回答…':'Writing…';progress.classList.add('is-active');
      } else if(event.type==='source')sources.set(event.source.id,event.source);
      else if(event.type==='block')renderBlock(event.block);
      else if(event.type==='answer') {
        body.replaceChildren(make('p',event.text,'comic-reply'));
        if(event.sourceIds.length){const details=make('details','','comic-evidence');details.append(make('summary',zh?'翻到原文 ↗':'See the sources ↗'));for(const id of event.sourceIds){const source=sources.get(id);if(!source)throw new Error('invalid_response');const a=make('a',source.label);a.href=source.url;details.append(a);}body.append(details);}
      } else if(event.type==='done')end(false,'');
      else if(event.type==='error')end(true,zh?'这次对话没有完成。已显示的内容还不构成完整回答。':'This turn was interrupted. The displayed material is not a complete answer.');
    },
    interrupt(message) {if(!finished)end(true,message||(zh?'连接中断了。可以重新发送，但我不会自动重复请求。':'The connection stopped. You can send again; I won’t retry automatically.'));}
  };
}
