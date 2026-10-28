const asset=path=>new URL(path,import.meta.url).href;
import {bindHoldRotation} from './mustang-rotation.js';
import {createViewReturn} from './mustang-view.js';
import {fitCalipers} from './mustang-calipers.js?v=calipers13';
import {addHingeMechanisms} from './mustang-hinges.js?v=detail8';
import {doorPose,introPose,INTRO_DURATION} from './mustang-motion.js?v=detail8';
import * as THREE from './three/three.module.min.js';
import {GLTFLoader} from './three/GLTFLoader.js';
import {DRACOLoader} from './three/DRACOLoader.js';
export async function mountMustang(host,options={}){
 const status=host.querySelector('[data-status]'),poster=host.querySelector('.stage-poster');let renderer,disposed=false,frame=0,visible=true,drag=null,sceneReady=false,presented=!options.deferReveal;
 delete host.dataset.error;
 const show=t=>{if(status&&presented)status.textContent=t};
 const lifetime=new AbortController(),listen=(target,type,fn)=>target?.addEventListener(type,fn,{signal:lifetime.signal});
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.05,50);let azimuth=.65,elevation=.18,distance=6.7,zoom=1,doorAmount=0,doorTarget=0,lastTime=0,doorMotion=null;const hinges=[],doorWindows=[],hingeLinks=[];let updateMechanisms=()=>{},applyIntro=()=>{},zoomMotion=null,introTransition=null,holdRotation=null,viewReturn=null;
 const setDoorPose=()=>{for(const h of hinges){const p=doorPose(doorAmount,h.userData.side);h.position.x=p.x;h.rotation.set(p.lift,p.swing,0,'XYZ')}for(const w of doorWindows){w.visible=true;w.position.y=w.userData.restY-.012*THREE.MathUtils.smoothstep(doorAmount,0,.08)}for(const link of hingeLinks){const extension=.18*THREE.MathUtils.smoothstep(doorAmount,0,.3);link.scale.y=Math.max(.001,extension);link.position.x=link.userData.side*(.86+extension/2);link.visible=doorAmount>.025;}updateMechanisms(doorAmount);};
 const target=new THREE.Vector3(0,.65,.15),group=new THREE.Group();scene.add(group);
 const draw=(now,force=false)=>{frame=0;if((!presented&&!force)||disposed||(!force&&(!visible||document.hidden))||!sceneReady)return;if(holdRotation?.update(now))requestDraw();if(viewReturn){const p=viewReturn(now);azimuth=p.azimuth;elevation=p.elevation;zoom=p.zoom;if(p.done)viewReturn=null;else requestDraw();}if(zoomMotion){const t=THREE.MathUtils.clamp((now-zoomMotion.start)/420,0,1);zoom=THREE.MathUtils.lerp(zoomMotion.from,zoomMotion.to,THREE.MathUtils.smootherstep(t,0,1));if(t<1)requestDraw();else zoomMotion=null;}if(introTransition){const t=THREE.MathUtils.clamp((now-introTransition.start)/1600,0,1),e=THREE.MathUtils.smootherstep(t,0,1),p={};for(const key of Object.keys(introTransition.from))p[key]=THREE.MathUtils.lerp(introTransition.from[key],introTransition.to[key],e);applyIntro(p);if(t<1)requestDraw();else{const done=introTransition.done;introTransition=null;done();}}if(doorMotion){const t=THREE.MathUtils.clamp((now-doorMotion.start)/doorMotion.duration,0,1);const eased=THREE.MathUtils.smootherstep(t,0,1);doorAmount=THREE.MathUtils.lerp(doorMotion.from,doorTarget,eased);setDoorPose();if(t<1)requestDraw();else doorMotion=null;}lastTime=now;const fit=1+doorAmount*.1;target.y=.65+.28*doorAmount;camera.position.set(Math.sin(azimuth)*Math.cos(elevation)*distance*fit/zoom,Math.sin(elevation)*distance*fit/zoom+.55,Math.cos(azimuth)*Math.cos(elevation)*distance*fit/zoom);camera.lookAt(target);renderer.render(scene,camera);host.dataset.frames=String(Number(host.dataset.frames||0)+1);host.dataset.drawCalls=String(renderer.info.render.calls);};
 const requestDraw=()=>{if(!frame&&!disposed)frame=requestAnimationFrame(draw)};
 const cleanup=()=>{viewReturn=null;holdRotation?.stop();disposed=true;lifetime.abort();cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pagehide);renderer?.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}});environment?.dispose();textures.forEach(t=>t.dispose());decoder.dispose();};
 let environment;const textures=[];const decoder=new DRACOLoader().setDecoderPath(asset('three/draco/')).setWorkerLimit(1);decoder.preload();decoder.decoderPending?.catch(()=>{});
 const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)requestDraw();else {viewReturn=null;holdRotation?.stop();cancelAnimationFrame(frame);frame=0}},{threshold:.01});
 const resize=new ResizeObserver(()=>{const r=host.getBoundingClientRect();if(!r.width||!r.height||!renderer)return;renderer.setSize(r.width,r.height,false);renderer.setPixelRatio(options.record?(options.recordPixelRatio||1):Math.min(devicePixelRatio,innerWidth<700?1.25:1.5));camera.aspect=r.width/r.height;const compactPoster=options.compactFrame??(innerWidth<=1000),posterAspect=compactPoster?800/660:16/9;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(16))*Math.max(1,posterAspect/camera.aspect)));camera.updateProjectionMatrix();distance=compactPoster?9.8/(800/660):6.7;requestDraw()});
 const pagehide=e=>{viewReturn=null;holdRotation?.stop();if(!e.persisted)cleanup()};
 const visibility=()=>{if(!document.hidden)requestDraw();else{viewReturn=null;holdRotation?.stop();cancelAnimationFrame(frame);frame=0}};
 try{
 renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:!!options.record||new URLSearchParams(location.search).has('capture')});renderer.setClearColor(0x1c2630,1);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=THREE.SRGBColorSpace;
 const canvas=renderer.domElement;canvas.setAttribute('aria-label','3D-модель Mustang. Для поворота используйте стрелки или перетаскивание.');canvas.tabIndex=0;canvas.setAttribute('role','img');if(!presented){canvas.setAttribute('aria-hidden','true');canvas.tabIndex=-1;}host.prepend(canvas);
 const studio=new THREE.Scene();studio.background=new THREE.Color(.08,.09,.10);const geo=new THREE.PlaneGeometry(1,1);const mats=[];
 function softbox(x,y,z,w,h,power){const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(1,1,1).multiplyScalar(power),side:THREE.DoubleSide});mats.push(mat);const box=new THREE.Mesh(geo,mat);box.position.set(x,y,z);box.scale.set(w,h,1);box.lookAt(0,.6,0);studio.add(box)}
 softbox(-3,5,1,2,7,4);softbox(4,3,-2,1,7,3);softbox(1,5,-5,5,1.5,3);softbox(0,1,6,5,2,1.1);
 const pmrem=new THREE.PMREMGenerator(renderer);environment=pmrem.fromScene(studio,.025);scene.environment=environment.texture;pmrem.dispose();geo.dispose();mats.forEach(m=>m.dispose());
 scene.add(new THREE.HemisphereLight(0xeaf3ff,0x293039,1));const key=new THREE.DirectionalLight(0xfff4e7,3);key.position.set(-3,7,4);scene.add(key);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=256;const ctx=shadowCanvas.getContext('2d');ctx.setTransform(64,0,0,128,64,128);const gradient=ctx.createRadialGradient(0,0,.05,0,0,1);gradient.addColorStop(0,'rgba(0,0,0,.8)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(-1,-1,2,2);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);textures.push(shadowTexture);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.2,6),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.012;scene.add(shadow);
 const loader=new GLTFLoader().setDRACOLoader(decoder);show('Загрузка модели…');
 const supplied=options.modelPromise?await options.modelPromise:null;
 const compact=supplied?.compact??options.compactModel??(matchMedia('(max-width:700px)').matches||navigator.connection?.saveData);host.dataset.quality=compact?'compact':'full';
 let bytes=supplied?.bytes??options.modelBytes;
 if(!bytes){const path=asset(compact?'models/mustang-mobile.glb':'models/mustang.glb'),compressed='DecompressionStream'in window;const response=await fetch((compressed?path+'.gz':path)+'?v=detail11');if(!response.ok)throw new Error('model-network');const payload=await response.arrayBuffer(),signature=new Uint8Array(payload,0,Math.min(2,payload.byteLength));bytes=compressed&&signature[0]===31&&signature[1]===139?await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():payload;}
 const model=await loader.parseAsync(bytes,asset('models/'));if(disposed)return;model.scene.updateMatrixWorld(true);fitCalipers(model.scene);
 const textureLoader=new THREE.TextureLoader();
 const [sill,jamb,decal,emblem,wheelEmblem,horseTexture]=await Promise.all(['images/shelby-stripe.svg','images/jamb-monogram.svg','images/akra-lettering.svg','images/emblem-cyan.svg?v=detail8','images/wheel-emblem.svg?v=detail8','images/mustang-horse.svg?v=detail8'].map(path=>textureLoader.loadAsync(asset(path))));
 textures.push(sill,jamb,decal,emblem,wheelEmblem,horseTexture);
 for(const texture of [sill,jamb,decal,emblem,wheelEmblem,horseTexture])texture.colorSpace=THREE.SRGBColorSpace;
 sill.anisotropy=4;jamb.wrapS=jamb.wrapT=THREE.RepeatWrapping;jamb.anisotropy=4;decal.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
 model.scene.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(m.name==='AKRA_paint'){
 const rest=o.geometry.attributes.position.clone(),restNormal=o.geometry.attributes.normal.clone();rest.applyMatrix4(o.matrixWorld);restNormal.applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(o.matrixWorld));o.geometry.setAttribute('akraRest',rest);o.geometry.setAttribute('akraRestNormal',restNormal);
 const replacement=new THREE.MeshPhysicalMaterial({color:m.color,metalness:.14,roughness:.24,clearcoat:1,clearcoatRoughness:.16});replacement.name=m.name;
 replacement.onBeforeCompile=shader=>{shader.uniforms.akraDecal={value:decal};shader.uniforms.akraSill={value:sill};shader.uniforms.akraJamb={value:jamb};shader.vertexShader='attribute vec3 akraRest;attribute vec3 akraRestNormal;attribute vec2 _akra_surface;varying vec2 vSurface;varying vec3 vAkra; varying vec3 vAkraNormal;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAkra=akraRest;vAkraNormal=akraRestNormal;vSurface=_akra_surface;');shader.fragmentShader='varying vec2 vSurface;uniform sampler2D akraJamb;varying vec3 vAkra; varying vec3 vAkraNormal;uniform sampler2D akraDecal;uniform sampler2D akraSill;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float ax=abs(vAkra.x); float stripe=step(.035,ax)*(1.0-step(.28,ax));
 if(stripe>.5)diffuseColor.rgb=vec3(.007,.009,.012);
 if(vAkra.y>1.285 && vAkra.z>-.94 && vAkra.z<.2)diffuseColor.rgb=vec3(.008,.011,.014);
 vec2 duv=vec2((vAkra.z+.72)/1.75,(vAkra.y-.34)/.51);if(vAkra.x>0.0)duv.x=1.0-duv.x;
 if(vSurface.x>.99 && ax>.79 && duv.x>0.0&&duv.x<1.0&&duv.y>0.0&&duv.y<1.0){vec4 d=texture2D(akraDecal,duv);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.006,.009,.011),d.a);}
 vec2 suv=vec2((vAkra.z+.78)/1.82,(vAkra.y-.28)/.105);if(vAkra.x>0.0)suv.x=1.0-suv.x;
 if(vSurface.x>.99&&ax>.8&&suv.x>0.0&&suv.x<1.0&&suv.y>0.0&&suv.y<1.0){diffuseColor.rgb=texture2D(akraSill,suv).rgb;}
 if(vSurface.y>.99){vec3 an=abs(vAkraNormal);vec2 juv=an.x>an.y&&an.x>an.z?vAkra.zy:(an.y>an.z?vAkra.xz:vAkra.xy);diffuseColor.rgb=texture2D(akraJamb,juv*5.8).rgb;}
 `)};o.material=replacement;m.dispose();}
 if(o.material.name==='AKRA_wheel_badge'){o.material.map=wheelEmblem;o.material.needsUpdate=true;}
 if(o.material.name==='AKRA_cyan_LED'){const original=o.material;o.material=new THREE.MeshBasicMaterial({color:0x4bcee9,toneMapped:false});o.material.name=original.name;}if(o.material.transparent)o.renderOrder=2;
 });
 group.add(model.scene);
 for(const side of ['L','R']){const door=model.scene.getObjectByName('AKRA_DOOR_'+side);if(!door)continue;const sign=side==='L'?1:-1;const pivot=new THREE.Group();pivot.position.set(sign*.86,.64,.765);pivot.userData.side=sign;model.scene.add(pivot);pivot.add(door);door.position.sub(pivot.position);hinges.push(pivot);door.traverse(o=>{if(o.material?.name==='AKRA_glass'){o.userData.restY=o.position.y;doorWindows.push(o)}})}
 updateMechanisms=addHingeMechanisms(scene,hinges);
 for(const side of [-1,1]){const mark=new THREE.Mesh(new THREE.PlaneGeometry(.078,.078),new THREE.MeshBasicMaterial({map:emblem,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));mark.position.set(side*.727,.705,2.058);mark.rotation.y=side*.82;scene.add(mark)}
 const wheels=[{x:.9885,y:.3519,z:1.4511},{x:-.9824,y:.3576,z:1.4510},{x:.9672,y:.3487,z:-1.2967},{x:-.9717,y:.3548,z:-1.2942}];
 const rimTextCanvas=document.createElement('canvas');rimTextCanvas.width=256;rimTextCanvas.height=64;const rc=rimTextCanvas.getContext('2d');rc.font='bold 36px Arial';rc.fillStyle='#6cdbf3';rc.textAlign='center';rc.fillText('AKRAPRO',128,43);const rimText=new THREE.CanvasTexture(rimTextCanvas);rimText.colorSpace=THREE.SRGBColorSpace;textures.push(rimText);
 for(const w of wheels){const side=Math.sign(w.x);const label=new THREE.Mesh(new THREE.PlaneGeometry(.085,.021),new THREE.MeshBasicMaterial({map:rimText,transparent:true,depthWrite:false}));label.rotation.y=side*Math.PI/2;label.position.set(w.x+side*.002,w.y-.282,w.z);scene.add(label);}
 model.scene.traverse(o=>{if(o.material?.name==='AKRA_rear_emblem'){o.material.dispose();o.material=new THREE.MeshBasicMaterial({map:horseTexture,transparent:true,depthWrite:false});}});
 const labels=document.createElement('canvas');labels.width=1024;labels.height=128;const lc=labels.getContext('2d');lc.font='500 78px Arial';lc.textAlign='center';lc.strokeStyle='#10252e';lc.lineWidth=2;lc.strokeText('WWW.AKRAPRO.RU',512,91);const quarterMap=new THREE.CanvasTexture(labels);quarterMap.colorSpace=THREE.SRGBColorSpace;textures.push(quarterMap);
 for(const side of[-1,1]){const label=new THREE.Mesh(new THREE.PlaneGeometry(.62,.072),new THREE.MeshBasicMaterial({map:quarterMap,transparent:true,depthWrite:false,side:THREE.DoubleSide}));label.position.set(side*.977,.84,-1.25);label.rotation.y=side*Math.PI/2;scene.add(label);}
 // A small emissive floor wash gives continuous underbody lighting without bloom or live shadows.
 const glowCanvas=document.createElement('canvas');glowCanvas.width=256;glowCanvas.height=512;const gc=glowCanvas.getContext('2d');gc.strokeStyle='#00bfff';gc.shadowColor='#00bdff';gc.shadowBlur=28;gc.shadowOffsetX=-512;gc.lineWidth=4;gc.beginPath();gc.roundRect(580,76,120,360,26);gc.stroke();gc.shadowBlur=36;gc.lineWidth=7;gc.stroke();
 const glowTexture=new THREE.CanvasTexture(glowCanvas);glowTexture.colorSpace=THREE.SRGBColorSpace;textures.push(glowTexture);const glow=new THREE.Mesh(new THREE.PlaneGeometry(2.9,5.5),new THREE.MeshBasicMaterial({map:glowTexture,transparent:true,opacity:.6,toneMapped:false,depthWrite:false,blending:THREE.AdditiveBlending}));glow.rotation.x=-Math.PI/2;glow.position.y=-.005;scene.add(glow);
 const plateCanvas=document.createElement('canvas');plateCanvas.width=1024;plateCanvas.height=208;const pc=plateCanvas.getContext('2d');pc.fillStyle='#10171c';pc.fillRect(0,0,1024,208);pc.strokeStyle='#6f8792';pc.lineWidth=4;pc.strokeRect(8,8,1008,192);pc.fillStyle='#e8f4fa';pc.font='600 110px Arial';pc.textAlign='center';pc.fillText('AKRA PRO',512,145);const plateTexture=new THREE.CanvasTexture(plateCanvas);textures.push(plateTexture);plateTexture.colorSpace=THREE.SRGBColorSpace;model.scene.traverse(o=>{if(o.material?.name==='AKRA_display_plate'){o.material.map=plateTexture;o.material.needsUpdate=true;}});
 listen(host.querySelector('[data-doors]'),'click',e=>{doorTarget=doorTarget?0:1;doorMotion={from:doorAmount,start:performance.now(),duration:Math.max(450,1900*Math.abs(doorTarget-doorAmount))};if(matchMedia('(prefers-reduced-motion:reduce)').matches){doorAmount=doorTarget;doorMotion=null;setDoorPose()}e.currentTarget.setAttribute('aria-pressed',String(!!doorTarget));e.currentTarget.textContent=doorTarget?'Закрыть двери':'Открыть двери';requestDraw()});
 listen(host.querySelector('[data-neon]'),'click',e=>{glow.visible=!glow.visible;glow.material.opacity=.6;setHeadlights(glow.visible?1:0);e.currentTarget.setAttribute('aria-pressed',String(glow.visible));requestDraw()});
 sceneReady=true;
 listen(canvas,'pointerdown',e=>{cancelViewReturn();holdRotation?.stop();drag={x:e.clientX,y:e.clientY,a:azimuth,e:elevation};canvas.setPointerCapture(e.pointerId)});listen(canvas,'pointermove',e=>{if(!drag)return;azimuth=drag.a-(e.clientX-drag.x)*.008;elevation=THREE.MathUtils.clamp(drag.e+(e.clientY-drag.y)*.004,.05,.72);requestDraw()});const end=()=>drag=null;listen(canvas,'pointerup',end);listen(canvas,'pointercancel',end);listen(canvas,'lostpointercapture',end);
 listen(canvas,'keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){resetView();return;}cancelViewReturn();if(e.key==='ArrowLeft')azimuth-=.15;if(e.key==='ArrowRight')azimuth+=.15;if(e.key==='ArrowUp')elevation=Math.min(.72,elevation+.08);if(e.key==='ArrowDown')elevation=Math.max(.05,elevation-.08);requestDraw()});
 const rotateButtons=host.querySelectorAll('[data-rotate]');
 rotateButtons.forEach(button=>listen(button,'pointerdown',e=>{if(e.button===0&&e.isPrimary!==false)cancelViewReturn();}));
 holdRotation=bindHoldRotation(rotateButtons,{turn:amount=>{cancelViewReturn();azimuth+=amount},requestDraw,isInteractive:()=>presented&&sceneReady&&!disposed&&visible&&!document.hidden&&!introTransition,signal:lifetime.signal});
 const zoomButton=host.querySelector('[data-zoom]');
 function syncZoom(to){zoomButton?.setAttribute('aria-pressed',String(to>1));zoomButton?.setAttribute('aria-label',to>1?'Вернуть масштаб':'Увеличить модель');}
 function cancelViewReturn(){if(viewReturn){viewReturn=null;syncZoom(zoom);}}
 function setZoom(to){cancelViewReturn();zoomMotion={from:zoom,to,start:performance.now()};if(matchMedia('(prefers-reduced-motion:reduce)').matches){zoom=to;zoomMotion=null;}syncZoom(to);requestDraw();}
 function resetView(){
  if(!presented||!sceneReady||disposed||introTransition)return;
  holdRotation?.stop();drag=null;zoomMotion=null;
  viewReturn=createViewReturn({azimuth,elevation,zoom},performance.now(),matchMedia('(prefers-reduced-motion:reduce)').matches?0:950);
  syncZoom(1);requestDraw();
 }
 listen(zoomButton,'click',()=>setZoom((zoomMotion?.to??zoom)>1?1:innerWidth<700?1.25:1.35));
 listen(host.querySelector('[data-reset]'),'click',resetView);
 listen(canvas,'webglcontextlost',e=>{e.preventDefault();viewReturn=null;holdRotation?.stop();sceneReady=false;canvas.hidden=true;host.classList.remove('model-visible');poster?.removeAttribute('hidden');show('3D недоступна. Остаётся изображение автомобиля.');host.dataset.ready='false';host.querySelector('.stage-controls')?.setAttribute('hidden','')});
 observer.observe(host);resize.observe(host);document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',pagehide);const shotMaterials=[];model.scene.traverse(o=>{if(o.material?.name==='AKRA_cyan_LED'||o.material?.name==='AKRA_white_running_LED'){if(!shotMaterials.includes(o.material))shotMaterials.push(o.material)}});
 const setHeadlights=amount=>{for(const m of shotMaterials){if(m.emissive)m.emissiveIntensity=amount;else m.color.setHex(0x4bcee9).multiplyScalar(.13+.87*amount);}};
 applyIntro=p=>{viewReturn=null;azimuth=p.azimuth;elevation=p.elevation;doorAmount=p.door;doorTarget=p.door>.5?1:0;doorMotion=null;glow.visible=p.neon>.01;glow.material.opacity=.6*p.neon;setHeadlights(p.lights);setDoorPose();};
 const renderIntro=time=>{applyIntro(introPose(time));draw(performance.now(),true)};
 // Compile and upload once behind the film; no ongoing hidden render loop.
 const syncControls=()=>{host.querySelector('[data-neon]')?.setAttribute('aria-pressed',String(glow.visible));const b=host.querySelector('[data-doors]');if(b){b.setAttribute('aria-pressed',String(doorTarget>.5));b.textContent=doorTarget>.5?'Закрыть двери':'Открыть двери';}};
 const activate=async(time=INTRO_DURATION,{interactive=true}={})=>{
  if(disposed||!sceneReady||renderer.getContext().isContextLost())throw new Error('scene-unavailable');
  await new Promise(resolve=>requestAnimationFrame(()=>{presented=true;canvas.hidden=false;renderIntro(time);resolve()}));
  if(interactive){canvas.removeAttribute('aria-hidden');canvas.tabIndex=0;}host.dataset.ready='true';host.classList.add('model-visible');syncControls();show('Поверните автомобиль · стрелки или перетаскивание');
 };
 await renderer.compileAsync(scene,camera);
 await new Promise(resolve=>requestAnimationFrame(()=>{renderIntro(Number.isFinite(options.introTime)?options.introTime:INTRO_DURATION);resolve()}));
 if(!options.deferReveal)await activate(Number.isFinite(options.introTime)?options.introTime:INTRO_DURATION);
 else{host.dataset.prepared='true';show('Mustang / проект AKRA PRO');}
 const rewindIntro=async()=>{holdRotation?.stop();await activate(INTRO_DURATION,{interactive:false});const from=introPose(INTRO_DURATION),to=introPose(0);to.azimuth=from.azimuth;await new Promise(done=>{introTransition={from,to,start:performance.now(),done};requestDraw();});};
 const hide=()=>{viewReturn=null;holdRotation?.stop();presented=false;canvas.setAttribute('aria-hidden','true');canvas.tabIndex=-1;host.classList.remove('model-visible');};
 return {cleanup,renderIntro,activate,rewindIntro,hide,canvas};
 }catch(error){show('Модель не загрузилась. Можно повторить попытку.');host.dataset.error='true';host.classList.remove('model-visible');renderer?.domElement.remove();poster?.removeAttribute('hidden');cleanup();throw error}
}
