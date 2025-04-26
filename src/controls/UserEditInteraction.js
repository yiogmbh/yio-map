import Interaction from 'ol/interaction/Interaction.js';
import VectorLayer from 'ol/layer/Vector.js';
import RenderFeature, { toFeature } from 'ol/render/Feature.js';
import VectorSource from 'ol/source/Vector.js';
import Draw from 'ol/interaction/Draw.js';
import Modify from 'ol/interaction/Modify.js';
import { defaultStyles } from '../constants.js';
import { getLayerForMapboxSourceLayer } from '../utils.js';

/**
 * @typedef {Object} Options
 * @property {import('../YioMap.js').YioMap} yioMap
 */

export default class UserSelectInteraction extends Interaction {
  /** @type {import('../YioMap.js').YioMap} */
  #yioMap = null;

  /**
   * @type {VectorLayer} layer for temporary features of the draw / modify interactions
   */
  #editLayer = null;

  getEditLayer() {
    return this.#editLayer;
  }

  /**
   * clears the source of the edit layer, containing newly drawn and modified features
   * @returns {boolean} true if features were cleared
   */
  clearEditSource() {
    const source = this.#editLayer.getSource();
    if (source.getFeatures().length) {
      this.#editLayer.getSource().clear();
      return true;
    }
    return false;
  }

  /**
   * ol layer connected associated with the given mapbox `source-layer` (editLayer)
   * @type {VectorLayer | import("ol/layer/VectorTile.js").default}
   */
  #editSourceLayer;

  /**
   * IDs of features that were modified
   * @type {Array<string | number>}
   */
  #modifiedFeatureIDs = [];

  /**
   * @param {Options} options
   */
  constructor(options) {
    super();
    this.#yioMap = options.yioMap;

    this.#editLayer = new VectorLayer({
      source: new VectorSource({
        features: [],
      }),
    });

    this.drawInteraction = new Draw({
      source: this.#editLayer.getSource(),
      condition: event => {
        const existingFeature = event.map
          .getFeaturesAtPixel(event.pixel)
          .find(f => {
            return f.get('layer') === this.#yioMap.editLayer;
          });
        return !existingFeature;
      },
      type: 'Point',
    });
    this.drawInteraction.on('drawend', event => {
      const feature = event.feature;
      feature.set('layer', this.#yioMap.editLayer);
      this.#editLayer.getSource().once('addfeature', () => {
        this.#handleClick(event);
      });
    });
    this.modifyInteraction = new Modify({
      source: this.#editLayer.getSource(),
    });

    this.modifyInteraction.on('modifystart', event => {
      const modifiedFeatureIds = event.features
        .getArray()
        .map(feature => feature.get('id'))
        .filter(id => !!id);
      if (modifiedFeatureIds.length) {
        for (let i = 0, ii = modifiedFeatureIds.length; i < ii; i++) {
          const modifiedFeatureId = modifiedFeatureIds[i];
          if (!this.#modifiedFeatureIDs.includes(modifiedFeatureId)) {
            this.#modifiedFeatureIDs.push(modifiedFeatureId);
          }
        }
        this.#editSourceLayer.changed();
      }
    });
    this.modifyInteraction.on('modifyend', event => {
      this.#handleClick(event);
    });
    this.drawInteraction.setActive(false);
    this.modifyInteraction.setActive(false);
  }

  setMap(map) {
    const currentMap = this.getMap();
    if (currentMap) {
      currentMap.removeLayer(this.#editLayer);
    }
    if (!map) {
      return;
    }
    this.#editLayer.setMap(map);
    super.setMap(map);
    this.modifyInteraction.setMap(map);
    this.drawInteraction.setMap(map);
  }

  drawInteraction;

  modifyInteraction;

  /**
   * @param {import('ol/MapBrowserEvent.js').default} event
   */
  #handleClick(event) {
    this.#yioMap._handleClick(event.originalEvent);
  }

  /**
   * original style of the content layer
   */
  #originalStyle = null;

  setActive(active) {
    if (!this.modifyInteraction || !this.drawInteraction) {
      return;
    }
    const sourceLayer = getLayerForMapboxSourceLayer(
      this.#yioMap._getContentLayer(),
      this.#yioMap.editLayer,
    );
    if (active) {
      this.#editSourceLayer = sourceLayer;
      this.#originalStyle = sourceLayer?.getStyle();
      sourceLayer.setStyle((feature, resolution) => {
        if (this.#modifiedFeatureIDs.includes(feature.get('id'))) {
          return;
        }
        return this.#originalStyle(feature, resolution);
      });
      this.#setStyle();
    } else {
      if (this.#originalStyle) {
        this.#editSourceLayer.setStyle(this.#originalStyle);
      }
      this.#editSourceLayer = null;
    }
    this.modifyInteraction.setActive(active);
    this.drawInteraction.setActive(active);
    this.#editLayer.getSource().clear();
    super.setActive(active);
  }

  /**
   * sets the style of the editing layer to match the existing layer of the content map.
   */
  #setStyle() {
    this.#editLayer.setStyle((feature, resolution) => {
      return this.#originalStyle(feature, resolution) || defaultStyles;
    });
  }

  /**
   * @param {import('ol/MapBrowserEvent.js').default} event
   * @returns {boolean}
   */
  handleEvent(event) {
    let propagateEvent = true;

    if (event.type === 'click') {
      const map = this.getMap();
      const existingFeature = map.getFeaturesAtPixel(event.pixel).find(f => {
        return (
          f.getGeometry().getType() === 'Point' &&
          f.get('layer') === this.#yioMap.editLayer
        );
      });

      if (existingFeature) {
        const existingFeatureId = existingFeature.get('id');
        if (!this.#modifiedFeatureIDs.includes(existingFeatureId)) {
          this.#modifiedFeatureIDs.push(existingFeatureId);
        }
        this.#editSourceLayer.changed();
        let newFeature;
        if (existingFeature instanceof RenderFeature) {
          newFeature = toFeature(existingFeature);
        } else {
          newFeature = existingFeature.clone();
        }
        this.#editLayer.getSource().addFeature(newFeature);
        this.#handleClick(event);
        return false;
      }
    }

    if (!this.drawInteraction.handleEvent(event)) {
      propagateEvent = false;
    }
    if (propagateEvent && !this.modifyInteraction.handleEvent(event)) {
      propagateEvent = false;
    }
    return propagateEvent;
  }
}
