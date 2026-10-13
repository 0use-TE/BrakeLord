// Small contiguous partitions (at most four cars) keep every group within view.
export const VIEW_LIMITS={split:32,settle:.35};
const key=groups=>groups.map(g=>g.join(',')).join('|');
export class DynamicViews{
 constructor(ids){this.order=new Map(ids.map((id,i)=>[id,i]));this.groups=[ids.slice()];this.pending=null;this.pendingTime=0;}
 update(players,dt){
  const previous=new Map(this.groups.flatMap((g,i)=>g.map(id=>[id,i])));
  const crashed=players.filter(p=>p.crashed),running=players.filter(p=>!p.crashed).sort((a,b)=>previous.get(a.id)-previous.get(b.id)||a.z-b.z);
  let best=null;
  for(let cuts=0;cuts<2**Math.max(0,running.length-1);cuts++){
   const groups=[];for(let i=0;i<running.length;i++){if(i===0||(cuts&(1<<(i-1))))groups.push([]);groups.at(-1).push(running[i]);}
   // A new pane may subdivide an existing group, but never reunites separate panes.
   if(groups.some(g=>!g.every(p=>previous.get(p.id)===previous.get(g[0].id))||g.at(-1).z-g[0].z>VIEW_LIMITS.split))continue;
   const stable=groups.reduce((sum,g)=>sum+g.reduce((n,p,i)=>n+g.slice(i+1).filter(q=>previous.get(q.id)===previous.get(p.id)).length,0),0);
   const separation=groups.slice(1).reduce((sum,g,i)=>sum+g[0].z-groups[i].at(-1).z,0);
   if(!best||groups.length<best.groups.length||groups.length===best.groups.length&&(stable>best.stable||stable===best.stable&&separation>best.separation))best={groups,stable,separation};
  }
  const candidate=[...(best?.groups||[]).map(g=>g.map(p=>p.id)),...crashed.map(p=>[p.id])].map(g=>g.sort((a,b)=>this.order.get(a)-this.order.get(b))).sort((a,b)=>this.order.get(a[0])-this.order.get(b[0]));
  if(key(candidate)===key(this.groups)){this.pending=null;this.pendingTime=0;return this.groups;}
  const unsafe=crashed.some(p=>this.groups.some(g=>g.includes(p.id)&&g.length>1));
  if(unsafe){this.groups=candidate;this.pending=null;this.pendingTime=0;return this.groups;}
  if(key(candidate)!==this.pending){this.pending=key(candidate);this.pendingTime=0;}
  this.pendingTime+=Math.max(0,dt);
  if(this.pendingTime>=VIEW_LIMITS.settle){this.groups=candidate;this.pending=null;this.pendingTime=0;}
  return this.groups;
 }
}

// Three groups use the whole screen; there is no empty fourth quadrant.
export function dynamicRects(groups,width,height){
 const count=groups.length;if(count<1||count>4)throw Error('动态视角数量必须为1–4');
 let boxes;
 if(count===1)boxes=[[0,0,width,height]];
 else if(count===2){
  const ratio=Math.max(.35,Math.min(.65,Math.sqrt(groups[0].length)/(Math.sqrt(groups[0].length)+Math.sqrt(groups[1].length))));
  if(width>=height){const cut=Math.floor(width*ratio);boxes=[[0,0,cut,height],[cut,0,width-cut,height]];}
  else{const cut=Math.floor(height*ratio);boxes=[[0,0,width,cut],[0,cut,width,height-cut]];}
 }else if(count===3){
  const major=groups.reduce((best,g,i)=>g.length>groups[best].length?i:best,0),others=[0,1,2].filter(i=>i!==major);boxes=[];
  if(width>=height){const cut=Math.floor(width*.6),half=Math.floor(height/2);boxes[major]=[0,0,cut,height];boxes[others[0]]=[cut,0,width-cut,half];boxes[others[1]]=[cut,half,width-cut,height-half];}
  else{const cut=Math.floor(height*.55),half=Math.floor(width/2);boxes[major]=[0,0,width,cut];boxes[others[0]]=[0,cut,half,height-cut];boxes[others[1]]=[half,cut,width-half,height-cut];}
 }else{const left=Math.floor(width/2),top=Math.floor(height/2);boxes=[[0,0,left,top],[left,0,width-left,top],[0,top,left,height-top],[left,top,width-left,height-top]];}
 return boxes.map(([x,y,width,height],index)=>({index,ids:groups[index],x,y,width,height}));
}

export function groupCamera(points,aspect){
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minZ=Math.min(...points.map(p=>p.z)),maxZ=Math.max(...points.map(p=>p.z));
 const x=(minX+maxX)/2,z=(minZ+maxZ)/2,fov=58,tan=Math.tan(fov*Math.PI/360);
 const distance=Math.max(18,(maxX-minX+8)/(2*tan*Math.max(.1,aspect)),(maxZ-minZ+12)/(2*tan));
 return{fov,position:{x,y:distance*.65,z:z+distance*.85},target:{x,y:.8,z:z+2}};
}
