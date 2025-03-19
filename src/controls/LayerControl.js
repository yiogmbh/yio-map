import { applyStyle } from 'ol-mapbox-style';
import Control from 'ol/control/Control.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';

const baseLayers = [
  {
    name: 'positron',
    image: 'positron.png',
    styleUrl: 'https://tiles.openfreemap.org/styles/positron',
  },
  {
    name: 'orthofoto',
    image: 'bright.png',
    styleUrl: 'https://tiles.openfreemap.org/styles/bright',
  },
  {
    name: 'kataster',
    image: 'kataster.png',
    styleUrl: 'https://kataster.bev.gv.at/styles/kataster/style_basic.json',
  },
].map((item, i) => {
  item.layer = new VectorTileLayer({
    declutter: true,
    visible: i === 0, // only the first layer is visible
  });
  if (item.styleUrl) {
    applyStyle(item.layer, item.styleUrl);
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
    activatorButton.innerHTML = `<div style="width: 22px; height: 22px; scale: 0.8"><svg width="22" height="22" viewBox="0 0 22 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4.7 16.9 9.4 11 14.1 5.1 9.4 11 4.7ZM11 16.7 20.4 9.4 11 2.1 1.6 9.4 11 16.7M11 19.3 3.5 13.3 1.6 14.7 11 21.9 20.4 14.7 18.5 13.3 11 19.3"/>
      </svg></div>`;

    const element = document.createElement('div');
    element.className = 'layer-control ol-unselectable ol-control';
    element.appendChild(activatorButton);

    const container = document.createElement('div');
    container.classList.add('layer-selection', 'hidden');
    element.appendChild(container);
    baseLayers.forEach(item => {
      container.appendChild(item.thumbnailBox);
      options.map.addLayer(item.layer);
    });

    super({
      element: element,
      target: options.target,
    });

    this.layerControlElement = container;
    activatorButton.addEventListener(
      'click',
      this.toggleLayerSelection.bind(this),
      false,
    );
    this.activatorButton = activatorButton;
    this.map = options.map;
  }

  /**
   * @type {HTMLButtonElement} activator button, containing the layer selection icon
   */
  static activatorButton = null;

  static map = null;

  /**
   * @type {HTMLDivElement} layer control container
   */
  static layerControlElement = null;

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
      this.map.once('moveend', () => {
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

  fadeOutAndHide() {
    this.layerControlElement.classList.add('fade-out'); // Start fade-out animation

    setTimeout(() => {
      this.layerControlElement.classList.remove('fade-out'); // Remove fade-out class
      this.layerControlElement.classList.add('hidden'); // Set display: none after animation
    }, 150); // Match the transition duration (0.5s)
  }
}
