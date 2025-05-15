import Interaction from 'ol/interaction/Interaction.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Feature } from 'ol';
import { Point } from 'ol/geom.js';
import { RegularShape, Stroke, Style } from 'ol/style.js';
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
   * @param {import('ol').MapBrowserEvent} event
   */
  #handleClick(event) {
    const map = this.getMap();
    const contentLayer = this.#yioMap._getContentLayer();
    const source = this.#layer.getSource();
    const features = map.getFeaturesAtPixel(event.pixel, {
      layerFilter: layer => contentLayer.getLayers().getArray().includes(layer),
    });

    source.clear();

    // If no content feature was selected -> set the pin
    if (features.length === 0) {
      const feature = new Feature(new Point(event.coordinate));
      feature.setStyle(pinStyle);
      source.addFeature(feature);
    }
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
