export default class {
  data() { return { permalink: '/build-info.json', eleventyExcludeFromCollections: true }; }
  render() { return JSON.stringify({ revision: process.env.GITHUB_SHA || 'local' }) + '\n'; }
}
