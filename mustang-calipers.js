import * as THREE from './three/three.module.min.js';
// Approved placement: preserve every material, normal, UV and index.
// Translate the four existing calipers along the wheel axles, in world space.
export function fitCalipers(scene){
 scene.updateMatrixWorld(true);
 scene.traverse(mesh=>{
  if(mesh.material?.name!=='AKRA_caliper_paint')return;
  const geometry=mesh.geometry.clone(),positions=geometry.attributes.position;
  const world=new THREE.Vector3(),inverse=mesh.matrixWorld.clone().invert();
  for(let i=0;i<positions.count;i++){
   world.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
   world.x+=Math.sign(world.x)*(world.z>0?.085:.10);
   world.applyMatrix4(inverse);positions.setXYZ(i,world.x,world.y,world.z);
  }
  positions.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();mesh.geometry=geometry;
 });
}
