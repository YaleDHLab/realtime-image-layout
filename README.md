# Realtime Layout

Create TSNE or UMAP layouts with JavaScript in realtime

# Usage

To use this boilerplate, you can run in a terminal:

```bash
git clone https://github.com/yaledhlab/realtime-layout
yarn install
```

To handle the multiple versions of tfjs used herein, one must then run:
```bash
cd node_modules/tfjs-core-0.14.3 && yarn install && yarn build-npm && cd ../../
cd node_modules/tfjs-core-1.1.0  && yarn install && yarn build-npm && cd ../../
```

Then one can start the server:

```bash
yarn start
```

## Demos

UMAP.js: https://duhaime.s3.amazonaws.com/sketches/realtime-layout/umap/index.html

TSNE.js: https://duhaime.s3.amazonaws.com/sketches/realtime-layout/tsne/index.html

TFJS-TSNE.js: https://duhaime.s3.amazonaws.com/sketches/realtime-layout/tfjs-tsne/index.html