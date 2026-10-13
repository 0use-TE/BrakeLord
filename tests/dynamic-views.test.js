import test from 'node:test';
import assert from 'node:assert/strict';
import {DynamicViews,dynamicRects,groupCamera} from '../shared/dynamic-views.js';
const ids=['P1','P2','P3','P4'];
const players=positions=>positions.map((z,i)=>({id:ids[i],z,crashed:false}));
test('一起起步，远离大部队的人单独显示；两对车辆可分别共享',()=>{
 const views=new DynamicViews(ids);assert.deepEqual(views.update(players([0,0,0,0]),1),[ids]);
 assert.deepEqual(views.update(players([0,2,4,100]),.2),[ids]);
 assert.deepEqual(views.update(players([0,2,4,100]),.2),[['P1','P2','P3'],['P4']]);
 assert.deepEqual(views.update(players([0,1,100,101]),.4),[['P1','P2'],['P3'],['P4']]);
 assert.deepEqual(new DynamicViews(ids).update(players([0,1,100,101]),.4),[['P1','P2'],['P3','P4']]);
});
test('分屏有时间缓冲，靠近或交错后也保持独立，下一局恢复共享',()=>{
 const views=new DynamicViews(ids.slice(0,2));
 views.update(players([0,40]),.2);assert.equal(views.groups.length,1);
 views.update(players([0,28]),.2);assert.equal(views.groups.length,1);
 views.update(players([0,40]),.4);assert.equal(views.groups.length,2);
 for(const positions of [[0,28],[0,19],[0,0],[10,0]]){views.update(players(positions),1);assert.equal(views.groups.length,2);}
 assert.equal(new DynamicViews(ids.slice(0,2)).update(players([0,0]),1).length,1);
 const pairs=new DynamicViews(ids);pairs.update(players([0,1,100,101]),1);
 assert.deepEqual(pairs.update(players([0,2,1,3]),1),[['P1','P2'],['P3','P4']]);
});
test('翻车立即独立，健康玩家的分组不被翻车位置拉开；全部结束也保留画面',()=>{
 const views=new DynamicViews(ids),p=players([0,0,0,0]);p[0].crashed=true;
 assert.deepEqual(views.update(p,.016),[['P1'],['P2','P3','P4']]);
 p[0].z=-2000;assert.deepEqual(views.update(p,1),[['P1'],['P2','P3','P4']]);
 p.forEach(p=>p.crashed=true);assert.equal(views.update(p,.016).length,4);
});
test('组内整体距离受限，不能用中间车把很远的车串成一组',()=>{
 const views=new DynamicViews(ids);const p=players([0,25,50,75]);const groups=views.update(p,1);
 assert.equal(groups.length,2);for(const group of groups){const z=group.map(id=>p.find(p=>p.id===id).z);assert.ok(Math.max(...z)-Math.min(...z)<=32);}
});
test('1–4 个视角完整覆盖横屏/竖屏/奇数尺寸，三组不留空格',()=>{
 for(const [width,height] of [[901,701],[701,901]])for(const groups of [[ids],[ids.slice(0,3),['P4']],[['P1'],['P2','P3'],['P4']],ids.map(id=>[id])]){
  const rects=dynamicRects(groups,width,height);assert.equal(rects.length,groups.length);assert.equal(rects.reduce((sum,r)=>sum+r.width*r.height,0),width*height);
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);}
 }
});
test('共享镜头仅按本组车辆取景，窄画面和组内纵向差距都会扩大取景',()=>{
 const points=[{x:-5.4,z:0},{x:5.4,z:0}],base=groupCamera(points,1.6);
 assert.ok(groupCamera(points,.4).position.y>base.position.y);
 assert.ok(groupCamera([points[0],{x:5.4,z:30}],1.6).position.y>base.position.y);
});
