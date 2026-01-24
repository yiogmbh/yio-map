import Control from 'ol/control/Control.js';
import { toLonLat } from 'ol/proj.js';
import { AddressSearch } from './AddressSearch.js';

export default class AddressSearchControl extends Control {
  /** @type {AddressSearch} */
  searchElement;

  constructor(options = {}) {
    const element = /** @type {AddressSearch} */ (
      document.createElement('yio-address-search')
    );
    element.className = 'ol-address-search ol-unselectable ol-control';

    super({ element, target: options.target });

    this.searchElement = element;

    if (options.onSelect) {
      element.addEventListener('select', options.onSelect);
    }
  }

  setMap(map) {
    super.setMap(map);
    if (map) {
      const view = map.getView();
      const center = view.getCenter();
      if (center) {
        this.searchElement.mapCenter = toLonLat(center);
      }
      view.on('change:center', () => {
        this.searchElement.mapCenter = view.getCenter();
      });
    }
  }
}
