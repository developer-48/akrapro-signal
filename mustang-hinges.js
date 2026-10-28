import * as T from './three/three.module.min.js';
import {hingeAnchors} from './mustang-motion.js?v=detail8';
// Both anchors are behind the wing's trailing edge. The moving anchor is on
// the actual inner front edge of the door, expressed in pivot-local space.
export function addHingeMechanisms(scene,doorPivots){
 const metal=new T.MeshStandardMaterial({color:0x6c7479,metalness:.68,roughness:.4});
 const fastener=new T.MeshStandardMaterial({color:0xb0b6bb,metalness:.75,roughness:.32});
 const units=doorPivots.map(pivot=>{
  const side=pivot.userData.side,root=new T.Group();root.name='AKRA_concealed_hinge';scene.add(root);
  const anchors=hingeAnchors(side),fixed=new T.Vector3(...anchors.fixed),local=new T.Vector3(...anchors.local);
  const base=new T.Mesh(new T.BoxGeometry(.06,.105,.014),metal);base.position.copy(fixed);root.add(base);
  const leaf=new T.Group();root.add(leaf);leaf.add(new T.Mesh(new T.BoxGeometry(.06,.09,.012),metal));
  const link=new T.Mesh(new T.BoxGeometry(1,.046,.016),metal);root.add(link);
  const fixedPin=new T.Mesh(new T.CylinderGeometry(.022,.022,.025,24),fastener);fixedPin.rotation.z=Math.PI/2;fixedPin.position.copy(fixed);root.add(fixedPin);
  const movingPin=new T.Mesh(new T.CylinderGeometry(.021,.021,.025,24),fastener);movingPin.rotation.z=Math.PI/2;leaf.add(movingPin);
  for(const dy of[-.038,.038]){const bolt=new T.Mesh(new T.CylinderGeometry(.006,.006,.018,6),fastener);bolt.rotation.z=Math.PI/2;bolt.position.copy(fixed).add(new T.Vector3(side*.004,dy,0));root.add(bolt);}
  return{pivot,root,fixed,local,leaf,link};
 });
 const direction=new T.Vector3(),moving=new T.Vector3(),xAxis=new T.Vector3(1,0,0);
 return amount=>{for(const u of units){u.root.visible=amount>.015;moving.copy(u.local);u.pivot.localToWorld(moving);u.leaf.position.copy(moving);u.pivot.getWorldQuaternion(u.leaf.quaternion);direction.copy(moving).sub(u.fixed);u.link.position.copy(u.fixed).add(moving).multiplyScalar(.5);u.link.scale.x=direction.length();u.link.quaternion.setFromUnitVectors(xAxis,direction.normalize());}};
}
