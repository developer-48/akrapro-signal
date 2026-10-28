// Hold handling feeds the scene's existing on-demand frame loop.
export function bindHoldRotation(buttons,{turn,requestDraw,isInteractive,signal,
 now=()=>performance.now(),delay=setTimeout,cancelDelay=clearTimeout,
 windowTarget=window,documentTarget=document}){
 const suppressedClicks=new WeakSet();
 let press=null;
 const listen=(target,type,handler)=>target.addEventListener(type,handler,{signal});
 function stop(cancelClick=true){
  if(!press)return;
  const previous=press;press=null;
  cancelDelay(previous.timer);
  if(cancelClick||previous.held)suppressedClicks.add(previous.button);
  delete previous.button.dataset.holding;
  if(previous.button.hasPointerCapture?.(previous.id))previous.button.releasePointerCapture(previous.id);
 }
 for(const button of buttons){
  const direction=Number(button.dataset.rotate);
  listen(button,'pointerdown',event=>{
   if(event.button!==0||event.isPrimary===false||!isInteractive())return;
   stop();suppressedClicks.delete(button);
   const current={button,id:event.pointerId,direction,held:false,timer:null,last:0};
   press=current;
   // A short tap keeps the original 0.3-radian step. A hold starts smoothly.
   current.timer=delay(()=>{
    if(press!==current)return;
    if(!isInteractive()){stop();return;}
    current.held=true;current.last=now();button.dataset.holding='true';
    suppressedClicks.add(button);requestDraw();
   },180);
   try{button.setPointerCapture(event.pointerId);}catch{/* Window release remains a fallback. */}
  });
  listen(button,'lostpointercapture',event=>{if(press?.button===button&&press.id===event.pointerId)stop();});
  listen(button,'blur',()=>{if(press?.button===button)stop();});
  listen(button,'contextmenu',event=>event.preventDefault());
  listen(button,'click',event=>{
   // Ignore the native click after a hold, but retain keyboard/AT activation.
   const suppressed=suppressedClicks.delete(button);
   if((suppressed&&event.detail!==0)||!isInteractive())return;
   turn(direction*.3);requestDraw();
  });
 }
 listen(windowTarget,'pointerup',event=>{if(press?.id===event.pointerId)stop(false);});
 listen(windowTarget,'pointercancel',event=>{if(press?.id===event.pointerId)stop();});
 listen(windowTarget,'blur',()=>stop());
 listen(windowTarget,'pagehide',()=>stop());
 listen(documentTarget,'visibilitychange',()=>{if(documentTarget.hidden)stop();});
 signal.addEventListener('abort',()=>stop(),{once:true});
 return {
  stop,
  update(time){
   if(!press?.held)return false;
   if(!isInteractive()){stop();return false;}
   const elapsed=Math.min(.05,Math.max(0,(time-press.last)/1000));
   press.last=time;turn(press.direction*.9*elapsed);
   return true;
  }
 };
}
