import * as THREE from 'three';

export default class Lights {
  constructor() {
    var group = new THREE.Group();

    this.point = new THREE.PointLight(0xffffff, 1.0, 17);
    group.add(this.point);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.4);
    group.add(this.ambient);

    this.hemisphere = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    group.add(this.hemisphere);

    this.mesh = group;
  }
}
