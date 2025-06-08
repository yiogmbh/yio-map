import Interaction from 'ol/interaction/Interaction.js';
import VectorLayer from 'ol/layer/Vector.js';
import RenderFeature, { toFeature } from 'ol/render/Feature.js';
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
    const source = this.#layer.getSource();
    source.addEventListener('change', e => {
      this.#yioMap.userSelect = source
        .getFeatures()
        .map(feature => feature.getProperties());
    });
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
    if (features.length) {
      map.getTargetElement().classList.add('cursor-pointer');
    } else {
      map.getTargetElement().classList.remove('cursor-pointer');
    }
  }

  /**
   * @param {import('ol/MapBrowserEvent.js').default} event
   * @returns {boolean} Propageate the event further
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
        /** @param {import('ol/render/Feature.js').default} featureOrRenderFeature */
        featureOrRenderFeature =>
          featureOrRenderFeature instanceof RenderFeature
            ? toFeature(featureOrRenderFeature)
            : featureOrRenderFeature,
      ),
    );
    this.#yioMap.notifyNextChange = true;
    this.#yioMap._handleClick(event.originalEvent);
    return features.length === 0; // Propagate the event if no features were clicked
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
      return this.#handleClick(event);
    }
    return true;
  }

  setActive(active) {
    super.setActive(active);
    if (!active) {
      this.#layer.getSource().clear();
      if (this.#yioMap) {
        this.#yioMap.userSelect.length = 0;
      }
    }
  }
}
