import Interaction from 'ol/interaction/Interaction.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Feature } from 'ol';
import { Point } from 'ol/geom.js';
import { toLonLat } from 'ol/proj.js';
import { pinStyle } from '../constants.js';

/**
 * @typedef {Object} Options
 * @property {import('../YioMap.js').YioMap} yioMap
 */

export default class UserPinInteraction extends Interaction {
  /** @type {import('../YioMap.js').YioMap} */
  #yioMap = null;

  #layer = new VectorLayer({
    source: new VectorSource(),
  });

  /**
   * @param {Options} options
   */
  constructor(options) {
    super();
    this.#yioMap = options.yioMap;
    this.setActive(false);
  }

  setMap(map) {
    const currentMap = this.getMap();
    if (currentMap) {
      currentMap.removeLayer(this.#layer);
    }
    if (!map) {
      return;
    }
    map.addLayer(this.#layer);
    super.setMap(map);
  }

  /**
   * @param {Array<number>} coordinate - coordinate in EPSG:3857
   */
  #placePin(coordinate) {
    const source = this.#layer.getSource();
    source.clear();
    const feature = new Feature(new Point(coordinate));
    feature.setStyle(pinStyle);
    source.addFeature(feature);

    this.#yioMap.dispatchEvent(
      new CustomEvent('pin', {
        composed: true,
        bubbles: true,
        detail: { coordinate: toLonLat(coordinate) },
      }),
    );
  }

  /**
   * @param {import('ol').MapBrowserEvent} event
   */
  #handleClick(event) {
    const map = this.getMap();
    const contentLayer = this.#yioMap._getContentLayer();
    const features = map.getFeaturesAtPixel(event.pixel, {
      layerFilter: layer => contentLayer.getLayers().getArray().includes(layer),
    });

    // If no content feature was selected -> set the pin
    if (features.length === 0) {
      this.#placePin(event.coordinate);
    }
  }

  setActive(active) {
    if (!active) {
      this.#layer.getSource().clear();
    }
    super.setActive(active);
  }

  /**
   * Set the pin to a specific location.
   * @param {Array<number>} coordinate - coordinate in EPSG:3857
   */
  setPin(coordinate) {
    this.#placePin(coordinate);
  }

  /**
   * @param {import('ol/MapBrowserEvent.js').default} event
   * @returns {boolean}
   */
  handleEvent(event) {
    if (event.type === 'click') {
      this.#handleClick(event);
    }
    return true;
  }
}
