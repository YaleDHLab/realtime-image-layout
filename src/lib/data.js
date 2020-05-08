import * as THREE from 'three';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { PCA }  from 'ml-pca';
import { app, cpuTsne } from '../index';

const setStatus = s => {
  var div = document.createElement('div');
  div.textContent = s;
  var elem = document.querySelector('#status');
  if (elem.childElementCount > 9) {
    elem.removeChild(elem.childNodes[0]);
  }
  elem.appendChild(div);
  elem.scrollTop = elem.scrollHeight - elem.clientHeight
}

export const getData = state => {
  setStatus(' * initializing scene')
  for (var d=[], c=[], i=0; i<state.n; i++) {
    const color = [Math.random(), Math.random(), Math.random()];
    c = c.concat(color);
    d[i] = color;
  }
  let t = new Float32Array(state.n * 2);
  t = t.map(i => i + 0.5);
  return {
    data: d,
    positions: new Float32Array(state.n * 3),
    translations: t,
    color: new Float32Array(c),
    n: state.n,
  }
}

/**
* Load images and vectorize
**/

const cellSize = 128;
const maxImages = 1000;
const canvasSize = 4096;
const defaultManifest = 'https://portail.biblissima.fr/iiif/manifest/ark:/43093/desc46a049ef1a1cfed3c4a9c932503ea8497b6ae21f';

const load = async () => {
  const url = defaultManifest;
  const manifest = await fetch(url).then(response => response.json())

  let urls = manifest.sequences[0].canvases.map(c => {
    return c.images[0].resource['@id'].replace('/full/full/', '/full/100,/')
  });
  urls = urls.slice(0, maxImages);

  const images = [];
  urls.map(async url => {
    let img = document.createElement('img');
    img.crossOrigin = 'anonymous'; // tfjs-tsne needs crossorigin statement
    img.onload = async () => {
      const w = img.width;
      const h = img.height;
      // resize the image
      const s = cellSize / h;
      img.width = w * s;
      img.height = h * s;
      // vectorize the image
      images.push(img);
      setStatus(` * loaded ${images.length} of ${urls.length}`);
      if (images.length == urls.length) vectorize(images);
    }
    img.src = url;
  })
}

const vectorize = async images => {
  setStatus(' * loading mobilenet');
  const model = await mobilenet.load();
  setStatus(' * vectorizing images');
  const vecs = await Promise.all(images.map(image => model.infer(image).data()));

  // run preliminary dimension reduction with PCA
  console.log(' * running PCA');
  const pca = new PCA(vecs);
  const data = pca.predict(vecs, {nComponents: Math.min(50, vecs.length)}).data;

  // render the images in the webgl scene
  setStatus(' * creating canvas');
  var canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  const ctx = canvas.getContext('2d');
  ctx.rect(0, 0, 2048, 2048);
  ctx.fillStyle = 'black';
  ctx.fill();

  let x = 0; // canvas offsets
  let y = 0;
  let dx = []; // texture offsets
  let dy = [];
  for (let i=0; i<images.length; i++) {
    let image = images[i];
    if (x + image.width > canvas.width) {
      x = 0;
      y += cellSize;
    }
    let padX = Math.floor((cellSize-image.width)/2);
    let padY = Math.floor((cellSize-image.height)/2);
    ctx.drawImage(image, x+padX, y+padY, image.width, image.height);
    dx.push(x);
    dy.push(y);
    x += cellSize;
  }
  document.body.appendChild(canvas);

  var tex = new THREE.Texture(canvas);
  tex.needsUpdate = true;
  tex.flipY = false;

  app.points.geometry.attributes.dx.array = new Float32Array(dx);
  app.points.geometry.attributes.dy.array = new Float32Array(dy);
  app.points.material.uniforms.texture.value = tex;
  app.points.geometry.attributes.dx.needsUpdate = true;
  app.points.geometry.attributes.dy.needsUpdate = true;
  app.points.material.needsUpdate = true;

  // run the tsne layout
  console.log(' * running TSNE');
  cpuTsne(data);
}

load();