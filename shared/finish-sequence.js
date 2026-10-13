// 收场动画使用真实渲染时间，不再推进已经判定的比赛物理或分数。
export const CRASH_SECONDS=5.5, STOP_SECONDS=1.8;
export class FinishSequence {
 constructor(){this.age=0;this.kind=null;}
 advance(dt,result){if(!result)return;this.kind=result.success?'stopped':'crashed';this.age+=Math.max(0,dt);}
 get complete(){return this.kind!==null&&this.age>=(this.kind==='crashed'?CRASH_SECONDS:STOP_SECONDS);}
 get physicsScale(){return this.age<1.6?.28:Math.min(1,.28+(this.age-1.6)*.8);}
}
