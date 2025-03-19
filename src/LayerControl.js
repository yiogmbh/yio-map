import Control from 'ol/control/Control.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';

const baseLayers = [
  {
    name: 'positron',
    title: 'Standard',
    image: 'positron.png',
    layer: new TileLayer({
      source: new OSM(),
    }),
  },
  {
    name: 'orthofoto',
    title: 'Orthofoto',
    image: 'bright.png',
    layer: new TileLayer({
      source: new OSM(),
    }),
  },
  {
    name: 'kataster',
    title: 'Kataster',
    image: 'kataster.png',
    layer: new TileLayer({
      source: new OSM(),
    }),
  },
];

export default class LayerControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = `<div style="width: 22px; height: 22px; scale: 0.8"><svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4.7 16.9 9.4 11 14.1 5.1 9.4 11 4.7ZM11 16.7 20.4 9.4 11 2.1 1.6 9.4 11 16.7M11 19.3 3.5 13.3 1.6 14.7 11 21.9 20.4 14.7 18.5 13.3 11 19.3"/>
      </svg></div>`;

    const element = document.createElement('div');
    element.className = 'layer-control ol-unselectable ol-control';
    element.appendChild(button);

    const container = document.createElement('div');
    container.classList.add('layer-selection', 'hidden');
    element.appendChild(container);
    baseLayers.forEach(item => {
      const div = document.createElement('div');
      div.classList.add('image-box');

      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.title;

      const caption = document.createElement('p');
      caption.textContent = item.tile;

      div.appendChild(img);
      div.appendChild(caption);
      container.appendChild(div);
    });

    super({
      element: element,
      target: options.target,
    });

    this.layerControlElement = container;
    button.addEventListener(
      'click',
      this.toggleLayerSelection.bind(this),
      false,
    );
  }

  static layerControlElement = null;

  set displayLayerSelection(value) {
    if (value) {
      this.layerControlElement.classList.remove('hidden');
    } else {
      this.layerControlElement.classList.add('hidden');
    }
  }

  get displayLayerSelection() {
    return !this.layerControlElement.classList.contains('hidden');
  }

  static currentlySelectedLayer = 'positron';

  toggleLayerSelection() {
    this.displayLayerSelection = !this.displayLayerSelection;
  }
}
