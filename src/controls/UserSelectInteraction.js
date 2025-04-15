import Interaction from 'ol/interaction/Interaction.js';
import VectorLayer from 'ol/layer/Vector.js';
import { toFeature } from 'ol/render/Feature.js';
import VectorSource from 'ol/source/Vector.js';

/**
 * @typedef {Object} Options
 * @property {import('../YioMap.js').YioMap} yioMap
 */

export default class UserSelectInteraction extends Interaction {
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
   * @param {import('ol/MapBrowserEvent.js').default} event
   */
  #handlePointerMove(event) {
    const map = this.getMap();
    const contentLayer = this.#yioMap._getContentLayer();
    const features = map
      .getFeaturesAtPixel(event.pixel, {
        layerFilter: layer =>
          contentLayer.getLayers().getArray().includes(layer),
      })
      .filter(feature => feature.get('id') !== undefined);
    map.getTargetElement().style.cursor = features.length ? 'pointer' : '';
  }

  /**
   * @param {import('ol/MapBrowserEvent.js').default} event
   */
  #handleClick(event) {
    const map = this.getMap();
    const contentLayer = this.#yioMap._getContentLayer();
    const userSelectSource = this.#layer.getSource();
    const features = map
      .getFeaturesAtPixel(event.pixel, {
        layerFilter: layer =>
          contentLayer.getLayers().getArray().includes(layer),
      })
      .filter(feature => feature.get('id') !== undefined);
    userSelectSource.clear();
    userSelectSource.addFeatures(
      features.map(
        /** @param {import('ol/render/Feature.js').default} renderFeature */
        renderFeature => toFeature(renderFeature),
      ),
    );
    this.#yioMap.notifyNextChange = true;
    this.#yioMap.userSelect = features.map(feature => feature.getProperties());
    this.#yioMap.dispatchEvent(new PointerEvent('click', event.originalEvent));
  }

  /**
   * @param {import('ol/MapBrowserEvent.js').default} event
   * @returns {boolean}
   */
  handleEvent(event) {
    if (event.type === 'pointermove') {
      this.#handlePointerMove(event);
    }
    if (event.type === 'click') {
      this.#handleClick(event);
    }
    return true;
  }
}
