import Control from 'ol/control/Control.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';

export default class LayerControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = 'N';

    const element = document.createElement('div');
    element.className = 'layer-control ol-unselectable ol-control';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.showLayerSelection.bind(this), false);
  }

  showLayerSelection() {
    console.log('show layer selection');
  }
}
