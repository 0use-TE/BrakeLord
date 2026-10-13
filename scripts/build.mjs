import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),out=path.join(root,'dist');
const entries=['index.html','client.js','local.js','style.css','assets','shared'];
await fs.rm(out,{recursive:true,force:true});
await fs.mkdir(out,{recursive:true});
for(const entry of entries)await fs.cp(path.join(root,entry),path.join(out,entry),{recursive:true});
await fs.writeFile(path.join(out,'.nojekyll'),'');
async function verify(directory){
 for(const entry of await fs.readdir(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);
  if(entry.isDirectory()){await verify(file);continue;}
  if(!/\.(html|js|css)$/.test(file))continue;
  const source=await fs.readFile(file,'utf8');
  const pattern=entry.name.endsWith('.html')?/\b(?:src|href)="([^"]+)"/g:/\bfrom\s*['"]([^'"]+)['"]/g;
  for(const [,ref] of source.matchAll(pattern)){
   if(/^(?:data:|https?:|#)/.test(ref))continue;
   if(!ref.startsWith('./')&&!ref.startsWith('../'))throw Error('资源必须使用相对路径：'+ref);
   const target=path.resolve(path.dirname(file),ref);
   if(!target.startsWith(out+path.sep))throw Error('资源超出构建目录：'+ref);
   await fs.access(target);
  }
 }
}
await verify(out);
console.log('构建完成：dist/（纯静态，可部署到 GitHub Pages）');
