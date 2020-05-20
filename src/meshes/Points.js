import * as THREE from 'three';

export default class Points {
  constructor(positions, translations, colors) {
    this.vert = `
    #version 100
    precision highp float;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float transitionPercent;
    uniform vec3 cameraPosition;
    uniform float pointScale;
    uniform float minPointScale;

    attribute vec3 position;
    attribute vec2 translation;
    attribute vec3 color;
    attribute vec2 uv;
    attribute float dx;
    attribute float dy;

    varying float vDx;
    varying float vDy;

    void main() {
      float x = position.x - 0.5; // center
      float y = position.y - 0.5;
      vec3 pos = vec3(x, y, 0.0) + vec3(translation, 0.0);
      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPos;
      gl_PointSize = (pointScale / -mvPos.z);
      gl_PointSize = max(gl_PointSize, minPointScale);
      vDx = dx;
      vDy = dy;
    }
    `

    this.frag = `
    #version 100
    precision highp float;

    uniform sampler2D texture;

    varying vec2 vUv;
    varying float vDx;
    varying float vDy;

    void main() {
      float dx = vDx + (gl_PointCoord.x * 128.0);
      float dy = vDy + (gl_PointCoord.y * 128.0);
      vec2 uv = vec2(dx/4096.0, dy/4096.0);
      gl_FragColor = texture2D(texture, uv);
      // discard entirely black pixels
      if (gl_FragColor.r == 0.0) discard;
    }
    `

    var dx = new THREE.BufferAttribute(new Float32Array(positions.length/3), 1);
    var dy = new THREE.BufferAttribute(new Float32Array(positions.length/3), 1);
    dx.usage = THREE.DynamicDrawUsage;
    dy.usage = THREE.DynamicDrawUsage;

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position',
      new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('translation',
      new THREE.BufferAttribute(translations, 2));
    this.geometry.setAttribute('color',
      new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('dx', dx);
    this.geometry.setAttribute('dy', dy);

    var texture = document.createElement('canvas');
    texture.width = 2048;
    texture.height = 2048;

    var ctx = texture.getContext('2d');
    ctx.rect(0, 0, 2048, 2048);
    ctx.fillStyle = 'black';
    ctx.fill();
    document.body.appendChild(texture);

    var tex = new THREE.Texture(texture);
    tex.needsUpdate = true;

    this.material = new THREE.RawShaderMaterial({
      vertexShader: this.vert,
      fragmentShader: this.frag,
      uniforms: {
        pointScale: {
          type: 'f',
          value: (window.devicePixelRatio / 2) * 400,
        },
        minPointScale: {
          type: 'f',
          value: 5.0,
        },
        texture: {
          type: 't',
          value: tex,
        }
      }
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false;
  }
}