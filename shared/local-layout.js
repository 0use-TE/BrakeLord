export function localLayout(count){
 if(![2,3,4].includes(count))throw Error('同屏人数必须为2–4');
 const laneWidth=3.6;
 return {laneWidth,roadWidth:count*laneWidth,lanes:Array.from({length:count},(_,i)=>(i-(count-1)/2)*laneWidth)};
}

// Each camera depends only on its player. Nearby rivals share the rendered road.
export function localViewCamera(focus,roadWidth,aspect,crashed=false){
 const fov=58,zoom=Math.max(1,(roadWidth+2)/(24*Math.tan(fov*Math.PI/360)*Math.max(.1,aspect)));
 return {fov,position:crashed?{x:focus.x+5*zoom,y:focus.y+3.5*zoom,z:focus.z+10*zoom}:{x:0,y:4*zoom,z:focus.z+12*zoom},
  target:crashed?{...focus}:{x:focus.x*.3,y:.8,z:focus.z+2}};
}
