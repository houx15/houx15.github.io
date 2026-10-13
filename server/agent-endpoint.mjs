export function modelEndpoint(provider,baseURL) {
  if(provider==='deepseek' && !baseURL)return 'https://api.deepseek.com/chat/completions';
  if(provider!=='bailian' || !baseURL)throw new Error('Invalid provider configuration');
  const url=new URL(baseURL.replace(/\/$/,''));
  const legacy=['dashscope.aliyuncs.com','dashscope-intl.aliyuncs.com','dashscope-us.aliyuncs.com'];
  const workspace=/^[a-z0-9-]+\.(cn-beijing|us-east-1|ap-southeast-1|ap-northeast-1)\.maas\.aliyuncs\.com$/i;
  if(url.protocol!=='https:' || url.username || url.password || url.port || url.search || url.hash || url.pathname!=='/compatible-mode/v1' || (!legacy.includes(url.hostname) && !workspace.test(url.hostname)))throw new Error('Invalid provider endpoint');
  return url.href+'/chat/completions';
}
