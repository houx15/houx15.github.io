import fs from 'node:fs/promises';
// Unpublished abstracts are local review material, never part of a release build.
export default async () => {
  if(process.env.SITE_DRAFTS!=='1')return {};
  try{return JSON.parse(await fs.readFile('.verification/profile-review/working-abstracts.json','utf8'));}
  catch(error){if(error.code==='ENOENT')return {};throw error;}
};
