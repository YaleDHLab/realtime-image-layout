const tsnePath = require('file-loader!./karpathy.js');
const umapPath = require('file-loader!../../node_modules/umap-js/lib/umap-js.min.js');

export class LayoutWorker {
  constructor(type, onData) {
    const self = this;
    this.type = type;
    this.worker = this.getWorker();
    this.worker.onmessage = e => onData(self.onMessage(e));
  }

  getWorker() {
    const s = this.getString();
    const blob = new Blob([s], {type: 'application/javascript'});
    return new Worker(URL.createObjectURL(blob))
  }

  getString() {
    if (this.type == 'tsne') return `
      self.onmessage = function(event) {
        // load karpathy tsne (karpathy exports to window scope)
        window = this;
        importScripts(event.data.path);

        // initialize tsne
        const tsne = new tsnejs.tSNE({});
        tsne.initDataRaw(event.data.data);

        // stream results back to parent
        const process = function* () {
          for (let i=0; i<500; i++) {
            tsne.step();
            yield tsne.getSolution();
          }
        };

        const it = process();
        let result;
        do {
          postMessage(result = it.next());
        } while(!result.done);
      };
    `;
    else if (this.type == 'umap') return `
      self.onmessage = function(event) {
        // load umap-js
        window = this;
        importScripts(event.data.path);

        // initialize umap
        const umap = new UMAP();
        const nEpochs = umap.initializeFit(event.data.data);

        // stream results back to parent
        const process = function* () {
          for (let i=0; i<nEpochs; i++) {
            umap.step();
            yield umap.getEmbedding();
          }
        };

        const it = process();
        let result;
        do {
          postMessage(result = it.next());
        } while(!result.done);
      };
    `
  }

  postMessage(data) {
    const path = window.location.href.split('/index.html')[0] + '/';
    if (this.type == 'tsne') {
      this.worker.postMessage({
        data: data,
        path: path + tsnePath,
      });
    } else if (this.type == 'umap') {
      this.worker.postMessage({
        data: data,
        path: path + umapPath,
      });
    }
  }

  onMessage(e) {
    if (!e.data.value) return;
    return e.data;
  }
}