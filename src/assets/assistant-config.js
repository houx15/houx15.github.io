// Public configuration only. Set to the reviewed HTTPS backend origin after deployment.
// Never put a provider key here. Empty means the local demo makes no network calls.
export const assistantOrigin = '';
// v2 agent: public URL and public Turnstile site key only.
// Backend uses verified challenges and durable, bounded spending.
export const agentOrigin = 'https://agent.kookat.icu';
export const turnstileSiteKey = '0x4AAAAAAFVve3G5FMItr1cO';
