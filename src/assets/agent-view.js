import { validateAgentBlock } from './agent-stream.js';

// Use only local, reviewed copy; never expose raw provider errors to visitors.
export function agentFailureMessage(code, language = 'en', {partial = false, resetsAt} = {}) {
  const zh = language === 'zh-CN';
  let message;
  if(code === 'rate_limited') message=zh?'请求较频繁，或本次会话已达到聊天上限。请稍后再试；文章仍可直接阅读。':'Requests are too frequent, or this session has reached its chat limit. Try later; the articles remain available.';
  else if(['daily_budget_exhausted','monthly_budget_exhausted'].includes(code)) {
    const daily=code==='daily_budget_exhausted';
    message=zh?(daily?'今日的 AI 额度暂时不足。':'本月的 AI 预算暂时不足。'):(daily?'Today’s AI allowance is temporarily insufficient.':'This month’s AI budget is temporarily insufficient.');
    if(Number.isSafeInteger(resetsAt) && resetsAt>=0 && resetsAt<=8640000000000000) {
      const time=new Intl.DateTimeFormat(zh?'zh-CN':'en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}).format(new Date(resetsAt));
      message+=zh?` 下次重置：${time}。`:` Next reset: ${time}.`;
    }
    message+=zh?' 文章仍可阅读，我不会自动重试。':' You can still read the articles; I won’t retry automatically.';
  }
  else if(code === 'budget_exhausted') message=zh?'本站的 AI 额度暂时用完了。现在可以继续阅读文章；反复发送不会恢复额度。':'The site’s AI allowance is currently exhausted. You can keep reading; repeated submissions will not restore the allowance.';
  else if(['challenge_failed','challenge_timeout','challenge_expired','challenge_unavailable','invalid_challenge'].includes(code)) message=zh?'访客验证没有完成，可以重新发送再试一次。':'Visitor verification did not complete. Send again to retry.';
  else if(code === 'invalid_session') message=zh?'这次会话已过期。重新发送后，我会建立新的会话。':'This session expired. Sending again will start a new session.';
  else if(code === 'stopped') message=zh?'已停止。':'Stopped.';
  else message=zh?'这次回答没有完成。可以重新发送；我不会自动重复请求。':'This answer did not complete. You can send again; I won’t retry automatically.';
  return message+(partial?(zh?' 已显示的内容保留在这里，但不是完整回答。':' The displayed material remains here, but is not a complete answer.'):'');
}

// Deliberately accepts only the validated v2 event vocabulary. No generated HTML.
export function createAgentTurn(document, { log, question, language = 'en', onQuestion = () => {}, restored = false, retry }) {
  const zh = language === 'zh-CN';
  const make = (tag,text='',className='') => {const node=document.createElement(tag);node.textContent=text;node.className=className;return node;};
  // Only collapse an immediately repeated, empty failure. Preserve partial work.
  if(retry?.canReplace && retry.question === question && log.lastElementChild === retry.row) retry.row.remove();
  log.querySelectorAll('button').forEach(button=>button.remove());
  const row=make('article','','comic-message comic-live-turn');
  row.append(make('p',question,'comic-visitor'));
  const progress=make('div','','comic-progress');progress.setAttribute('role','status');
  const progressText=make('span',zh?'正在连接…':'Connecting…');progress.append(progressText);row.append(progress);
  const body=make('div','','comic-live-body');log.append(row);
  let bodyShown=false;
  const showBody=()=>{if(bodyShown)return false;bodyShown=true;row.append(body);return true;};
  const sources=new Map(),blocks=new Map(),statuses=[];let finished=false, failedTurn=false, questionBlock;
  const toolLabels={recall_conversation:zh?'回顾前面的对话':'Revisiting an earlier exchange',search_content:zh?'在笔记中找线索':'Finding relevant notes',read_content:zh?'正在读原文':'Reading the source',read_profile:zh?'核对她的公开经历':'Checking her public biography',query_profile_events:zh?'核对经历与时间':'Checking experience and dates',show_profile_timeline:zh?'整理经历的时间线':'Tracing her story',show_post_cards:zh?'挑选接下来值得读的内容':'Choosing a next read',show_concept_flow:zh?'画出理解这件事的步骤':'Drawing the explanation',show_visualization:zh?'整理图中的信息':'Arranging the visual',find_related_posts:zh?'寻找相关内容':'Finding related reading',suggest_questions:zh?'准备下一步问题':'Preparing a follow-up'};
  function renderBlock(block) {
    validateAgentBlock(block);
    let container=blocks.get(block.id);
    if(!container){container=make('section','','comic-agent-block');blocks.set(block.id,container);row.append(container);}
    container.replaceChildren();
    if(block.type==='concept_flow') {
      container.classList.add('comic-concept-flow');
      container.append(make('h3',block.title));
      container.append(make('p',zh?'AI 根据原文整理的解释示意，非作者原图。逐步展开查看依据。':'An AI interpretation of the sources, not an author’s diagram. Unfold a step to check its basis.','comic-visual-note'));
      const list=make('ol');
      for(const [index,item] of block.items.entries()) {
        const step=make('li'),details=make('details');details.setAttribute('name',`concept-${block.id}`);if(index===0)details.open=true;
        const summary=make('summary');summary.append(make('span',String(index+1).padStart(2,'0'),'comic-concept-number'),make('span',item.title));
        details.append(summary,make('p',item.description));
        const source=make('a',zh?'核对这一步的原文 ↗':'Check this step in the source ↗');source.href=item.source.url;details.append(source);step.append(details);list.append(step);
      }
      container.append(list);return;
    }
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
  function end(failed, message, code) {
    finished=true;failedTurn=failed;row.classList.toggle('is-incomplete',failed);progress.classList.remove('is-active');
    progressText.textContent=message;
    if(failed && ['daily_budget_exhausted','monthly_budget_exhausted','budget_exhausted'].includes(code)) {
      const link=make('a',zh?'先读学习笔记 ↗':'Explore the learning notes ↗','comic-recovery-link');
      link.href=zh?'/zh/notes/':'/notes/';progress.append(link);
    }
    if(!failed) {
      progress.removeAttribute('role');
      if(restored){progress.remove();}
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
    get question() {return question;},
    get canReplace() {return finished && failedTurn && !body.children.length && !blocks.size;},
    event(event) {
      if(finished)return;
      if(event.type==='status') {
        const label=event.phase==='tool_started'?(toolLabels[event.tool]||(zh?'正在查阅资料':'Checking the sources')):event.phase==='model_started'?(zh?'正在组织回答':'Preparing an answer'):null;
        if(label){progressText.textContent=label;progress.classList.add('is-active');if(statuses.at(-1)!==label)statuses.push(label);}
      } else if(event.type==='answer_delta') {
        let paragraph=body.querySelector('.comic-reply');
        if(!paragraph){showBody();paragraph=make('p','','comic-reply');body.append(paragraph);}
        paragraph.textContent+=event.text;
        progressText.textContent=zh?'正在回答…':'Writing…';progress.classList.add('is-active');
      } else if(event.type==='source')sources.set(event.source.id,event.source);
      else if(event.type==='block') {
        const fresh=!blocks.has(event.block.id);
        renderBlock(event.block);
        if(fresh)return blocks.get(event.block.id);
      }
      else if(event.type==='answer') {
        const fresh=showBody();
        body.replaceChildren(make('p',event.text,'comic-reply'));
        if(event.sourceIds.length){const details=make('details','','comic-evidence');details.append(make('summary',zh?'翻到原文 ↗':'See the sources ↗'));for(const id of event.sourceIds){const source=sources.get(id);if(!source)throw new Error('invalid_response');const a=make('a',source.label);a.href=source.url;details.append(a);}body.append(details);}
        if(fresh)return body;
      } else if(event.type==='done')end(false,'');
      else if(event.type==='error')end(true,agentFailureMessage(event.code,language,{partial:event.partial || body.children.length>0 || blocks.size>0,resetsAt:event.resetsAt}),event.code);
    },
    interrupt(message,{code}={}) {if(!finished)end(true,message||(zh?'连接中断了。可以重新发送，但我不会自动重复请求。':'The connection stopped. You can send again; I won’t retry automatically.'),code);}
  };
}
