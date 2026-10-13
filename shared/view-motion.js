// Translate with the car immediately; ease only changes to the framing.
// Smoothing absolute world positions creates a speed-dependent lag that changes with frame time.
export class ViewMotion {
 constructor(position=null,target=null){
  this.position=position?{...position}:null;this.target=target?{...target}:null;this.anchor=null;
 }
 update(framing,anchor,dt,follow=true){
  if(!this.position){this.position={...framing.position};this.target={...framing.target};}
  else{
   if(follow&&this.anchor)for(const axis of ['x','y','z']){
    const shift=anchor[axis]-this.anchor[axis];this.position[axis]+=shift;this.target[axis]+=shift;
   }
   const blend=1-Math.exp(-Math.max(0,dt)*10);
   for(const axis of ['x','y','z']){
    this.position[axis]+=(framing.position[axis]-this.position[axis])*blend;
    this.target[axis]+=(framing.target[axis]-this.target[axis])*blend;
   }
  }
  this.anchor={...anchor};return this;
 }
}
