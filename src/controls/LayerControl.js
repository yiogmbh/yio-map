import apply from 'ol-mapbox-style';
import Control from 'ol/control/Control.js';
import TileLayer from 'ol/layer/Tile.js';
import { ImageTile } from 'ol/source.js';
import LayerGroup from 'ol/layer/Group.js';
import positronThumbnail from '../assets/positron.jpg';
import orthoThumbnail from '../assets/ortho.jpg';
import katasterThumbnail from '../assets/kataster.jpg';

/**
 * @typedef {Object} LayerItem
 * @property {string} name
 * @property {string} image
 * @property {string=} styleUrl
 * @property {TileLayer|LayerGroup} layer
 * @property {HTMLDivElement} thumbnailBox
 */

/**
 * @type {Array<LayerItem>}
 */
const baseLayers = [
  {
    name: 'positron',
    image: positronThumbnail,
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    layer: null,
    thumbnailBox: null,
  },
  {
    name: 'orthofoto',
    image: orthoThumbnail,
    layer: new TileLayer({
      visible: false,
      source: new ImageTile({
        maxZoom: 19,
        url: 'https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpg',
        attributions:
          '<a href="http://www.basemap.at">basemap.at</a> &copy; <a href="http://creativecommons.org/licenses/by/3.0/at/">CC BY 3.0 AT</a>',
      }),
    }),
    thumbnailBox: null,
    visible: false,
  },
  {
    name: 'kataster',
    image: katasterThumbnail,
    styleUrl: 'https://kataster.bev.gv.at/styles/kataster/style_basic.json',
    layer: null,
    thumbnailBox: null,
  },
].map((item, i) => {
  if (item.styleUrl) {
    item.layer = new LayerGroup({
      visible: i === 0, // only the first layer is visible
    });
    if (item.styleUrl) {
      apply(item.layer, item.styleUrl);
    }
  }

  const thumbnailBox = document.createElement('div');
  thumbnailBox.classList.add('image-box');
  if (i === 0) {
    thumbnailBox.classList.add('selected');
  }

  const img = document.createElement('img');
  img.src = item.image;
  img.alt = item.title;

  thumbnailBox.appendChild(img);
  thumbnailBox.addEventListener('click', e => {
    baseLayers.forEach(layer => {
      if (e.target === layer.thumbnailBox) {
        layer.thumbnailBox.classList.add('selected');
      } else {
        layer.thumbnailBox.classList.remove('selected');
      }
    });
    baseLayers.forEach(layer => {
      layer.layer.setVisible(layer.name === item.name);
    });
  });
  item.thumbnailBox = thumbnailBox;

  return item;
});

export default class LayerControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options) {
    const options = opt_options || {};
    const activatorButton = document.createElement('button');
    activatorButton.innerHTML = `<div class="svgContainer"><svg width="22" height="22" viewBox="0 0 22 22" fill="rgb(102, 102, 102)" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4.7 16.9 9.4 11 14.1 5.1 9.4 11 4.7ZM11 16.7 20.4 9.4 11 2.1 1.6 9.4 11 16.7M11 19.3 3.5 13.3 1.6 14.7 11 21.9 20.4 14.7 18.5 13.3 11 19.3"/>
      </svg></div>`;

    const element = document.createElement('div');
    element.className = 'layer-control ol-unselectable ol-control';
    element.appendChild(activatorButton);

    const container = document.createElement('div');
    container.classList.add('layer-selection', 'hidden');
    element.appendChild(container);

    super({
      element: element,
      target: options.target,
    });

    baseLayers.forEach(item => {
      container.appendChild(item.thumbnailBox);
    });

    this.layerControlElement = container;
    activatorButton.addEventListener(
      'click',
      this.toggleLayerSelection.bind(this),
      false,
    );
  }

  setMap(map) {
    super.setMap(map);
    this.getMap().addLayer(
      new LayerGroup({ layers: baseLayers.map(i => i.layer) }),
    );
  }

  /**
   * @type {HTMLDivElement} layer control container
   */
  layerControlElement = null;

  /**
   * @param {boolean} visible set visibility of the layer selection
   */
  set displayLayerSelection(visible) {
    if (visible) {
      //this.activatorButton.classList.add('hidden');
      this.layerControlElement.classList.remove('hidden');
      const handleGlobalClick = () => {
        // close the layer selection on click anywhere
        this.displayLayerSelection = false;
        document.body.removeEventListener('click', handleGlobalClick); // Remove listener after first trigger
      };
      setTimeout(() => {
        document.body.addEventListener('click', handleGlobalClick); // debounced
      });
      this.getMap().once('moveend', () => {
        if (this.displayLayerSelection) {
          this.displayLayerSelection = false;
          document.body.removeEventListener('click', handleGlobalClick); // Remove listener after first trigger
        }
      });
    } else {
      this.fadeOutAndHide();
    }
  }

  /**
   * @returns {boolean} true if the layer selection is displayed
   */
  get displayLayerSelection() {
    return !this.layerControlElement.classList.contains('hidden');
  }

  toggleLayerSelection() {
    this.displayLayerSelection = !this.displayLayerSelection;
  }

  /**
   * Hides the layer selection with a fade-out animation
   */
  fadeOutAndHide() {
    this.layerControlElement.classList.add('fade-out'); // Start fade-out animation

    setTimeout(() => {
      this.layerControlElement.classList.remove('fade-out'); // Remove fade-out class
      this.layerControlElement.classList.add('hidden'); // Set display: none after animation
    }, 150); // Match the transition duration (0.15s)
  }
}
