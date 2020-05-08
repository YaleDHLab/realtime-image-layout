import 'babel-polyfill';
import './assets/styles/style';
import * as THREE from 'three';
import * as tf from '@tensorflow/tfjs-core';
import * as tsne from '@tensorflow/tfjs-tsne';
import { App } from './app';
import Lights from './lights/Lights';
import Points from './meshes/Points';
import { LayoutWorker } from './lib/worker';
import { getData } from './lib/data';

const development = window.location.href.includes('localhost');
if (!development) {
  console.warn = () => {}
  console.log = () => {}
}

/**
* Initialize app
**/

export const app = new App('#gl');
app.render();

/**
* Initialize state
**/

const state = {
  method: 'tsne-cpu',
  n: 1000,
}

/**
* Initialize the points
**/

const { data, positions, translations, color, n } = getData(state);
app.add('points', new Points(positions, translations, color));

/**
* Helpers
**/

const updatePositionBuffer = l => {
  app.points.geometry.attributes.translation.array = l;
  app.points.geometry.attributes.translation.needsUpdate = true;
}

const flatten = l => {
  let arr = [], n = 0;
  for (let i=0; i<l.length; i++) {
    for (let j=0; j<l[i].length; j++) arr[n++] = l[i][j];
  }
  return arr;
}

/**
* CPU TSNE
**/

export const cpuTsne = data => {
  if (state.method != 'tsne-cpu') return;
  const onData = data => {
    if (data) updatePositionBuffer(new Float32Array(flatten(data.value)));
  }
  const worker = new LayoutWorker('tsne', onData);
  worker.postMessage(data);
}

/**
* GPGPU TSNE
**/

export const gpuTsne = data => {
  if (state.method != 'tsne-gpu') return;
   async function iterativeTsne() {
    const tsneModel = tsne.tsne(tf.tensor(data));
    await tsneModel.iterateKnn(tsneModel.knnIterations());
    for (let i=0; i<1000; ++i) {
      await tsneModel.iterate(1);
      updatePositionBuffer(new Float32Array(await tsneModel.coordinates().data()));
    }
  }
  iterativeTsne();
}

/**
* UMAP
**/

export const umap = data => {
  if (state.method != 'umap') return;
  const onData = data => {
    if (data) updatePositionBuffer(new Float32Array(flatten(data.value)));
  }
  const worker = new LayoutWorker('umap', onData);
  worker.postMessage(data);
}

/**
* Development
**/

if (development) {
  window.data = data;
  window.scene = app.scene;
  window.tsne = tsne;
  window.tf = tf;
}