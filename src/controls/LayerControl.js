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

    this.baseLayers.forEach(item => {
      container.appendChild(item.thumbnailBox);
    });

    this.layerControlElement = container;
    activatorButton.addEventListener(
      'click',
      this.toggleLayerSelection.bind(this),
      false,
    );
  }

  baseLayers = [
    {
      name: 'positron',
      image: positronThumbnail,
      styleUrl: 'https://tiles.openfreemap.org/styles/positron',
    },
    {
      name: 'orthofoto',
      image: orthoThumbnail,
      layer: new TileLayer({
        visible: false,
        source: new ImageTile({
          maxZoom: 19,
          url: 'https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpg',
          attributions: '<a href="https://basemap.at">© basemap.at</a>',
        }),
      }),
      visible: false,
    },
    {
      name: 'kataster',
      image: katasterThumbnail,
      styleUrl: 'https://kataster.bev.gv.at/styles/kataster/style_basic.json',
    },
  ].map(
    /**
     * @param {Partial<LayerItem>} item
     * @param {number} i
     * @returns {LayerItem}
     */
    (item, i) => {
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
      img.alt = item.name;

      thumbnailBox.appendChild(img);
      thumbnailBox.addEventListener('click', e => {
        this.baseLayers.forEach(layer => {
          if (e.target === layer.thumbnailBox) {
            layer.thumbnailBox.classList.add('selected');
          } else {
            layer.thumbnailBox.classList.remove('selected');
          }
        });
        this.baseLayers.forEach(layer => {
          layer.layer.setVisible(layer.name === item.name);
        });
      });
      item.thumbnailBox = thumbnailBox;

      return /** @type {LayerItem} */ (item);
    },
  );

  /**
   * @type {LayerGroup} layer group containing all base layers
   */
  baseLayerGroup;

  setMap(map) {
    if (this.getMap()) {
      this.getMap().removeLayer(this.baseLayerGroup);
    }
    if (map) {
      this.baseLayerGroup = new LayerGroup({
        layers: this.baseLayers.map(i => i.layer),
      });
      map.addLayer(this.baseLayerGroup);
    }
    super.setMap(map);
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
      this.layerControlElement.classList.remove('hidden');
      const handleGlobalClick = () => {
        // close the layer selection on click anywhere
        this.displayLayerSelection = false;
        this.getMap()
          .getTargetElement()
          .removeEventListener('click', handleGlobalClick); // Remove listener after first trigger
      };
      setTimeout(() => {
        this.getMap()
          .getTargetElement()
          .addEventListener('click', handleGlobalClick); // escape the ongoing click event
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
