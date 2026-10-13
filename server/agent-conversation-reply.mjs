// These are conversational acts, not model-authored claims about the owner.
// No arbitrary text, URLs or personal details are accepted from the model.
export const conversationReasons = ['greeting','thanks','identity','private_information','out_of_scope','uncertain'];
const replies = {
  'zh-CN': {
    greeting:'嗨，我在。想从煜欣的哪一面聊起？',
    thanks:'不客气，我在这儿。读到想讨论的地方，随时找我。',
    identity:'我是 monkey 煜欣的 AI 分身，不是她本人。可以陪你聊她的公开经历、作品和学习笔记；她没说过的观点，我不能替她说。',
    private_information:'私人信息我不能提供。如果想联系煜欣，可以看看网站公开的联系方式。',
    out_of_scope:'这题超出我的范围了。我主要陪你了解煜欣，以及一起读她的作品和学习笔记。',
    uncertain:'仅凭这次查阅的公开资料，我还不能确认这一点，也不能替煜欣下结论。'
  },
  en: {
    greeting:'Hi, I’m here. What would you like to know about Yuxin?',
    thanks:'You’re welcome. If something in a reading catches your attention, we can talk about it.',
    identity:'I’m monkey Yuxin’s AI companion, not Yuxin herself. We can discuss her public experience, work and learning notes. I can’t speak for views she hasn’t expressed.',
    private_information:'I can’t provide private information. To reach Yuxin, use the contact details she has made public on this website.',
    out_of_scope:'That’s outside my scope. I’m here to help you get to know Yuxin and explore her published work and learning notes.',
    uncertain:'The public material checked in this conversation does not give me enough to confirm that. I can’t draw that conclusion on Yuxin’s behalf.'
  }
};
export function conversationReply(reason, language) {
  if(!conversationReasons.includes(reason) || !replies[language])throw new Error('Invalid conversation reply');
  return replies[language][reason];
}
