// Return along the shortest orbit, using the scene's existing frame loop.
export function createViewReturn(from,start,duration=950){
 const target={azimuth:.65,elevation:.18,zoom:1};
 const delta=Math.atan2(Math.sin(target.azimuth-from.azimuth),Math.cos(target.azimuth-from.azimuth));
 return time=>{
  const t=duration<=0?1:Math.min(1,Math.max(0,(time-start)/duration));
  const eased=t*t*t*(t*(t*6-15)+10);
  return {
   azimuth:from.azimuth+delta*eased,
   elevation:from.elevation+(target.elevation-from.elevation)*eased,
   zoom:from.zoom+(target.zoom-from.zoom)*eased,
   done:t===1
  };
 };
}
