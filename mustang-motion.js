export const INTRO_DURATION = 12;
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
export function doorPose(amount,side){const spread=smooth(amount/.3),lift=smooth((amount-.3)/.7);return {x:side*(.86+.18*spread),lift:lift*1.13,swing:-side*.26*spread,spread};}
export function introPose(seconds){
 const t=clamp(seconds/INTRO_DURATION)*INTRO_DURATION;
 // One complete orbit, with gentle acceleration/deceleration and a final hold.
 const u=clamp((t-.4)/(INTRO_DURATION-1)),ramp=.15;
 const turn=(u<ramp?u*u/(2*ramp):u>1-ramp?1-ramp-(1-u)*(1-u)/(2*ramp):u-ramp/2)/(1-ramp);
 return {azimuth:.65+Math.PI*2*turn,elevation:.18,door:smooth((t-1.8)/2.8),neon:smooth((t-4.1)/1.3),lights:smooth((t-3.6)/.8)};
}

export function hingeAnchors(side){return {fixed:[side*.875,.64,.644],local:[side*.02,0,-.117]};}
