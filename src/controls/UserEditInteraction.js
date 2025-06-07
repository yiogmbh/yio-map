import Interaction from 'ol/interaction/Interaction.js';
import VectorLayer from 'ol/layer/Vector.js';
import RenderFeature, { toFeature } from 'ol/render/Feature.js';
import VectorSource from 'ol/source/Vector.js';
import Draw from 'ol/interaction/Draw.js';
import Modify from 'ol/interaction/Modify.js';
import { defaultStyles } from '../constants.js';
import { getLayerForMapboxSourceLayer } from '../utils.js';
import {
  addMapboxLayer,
  getLayer,
  getLayers,
  getSource,
} from 'ol-mapbox-style';
import { noModifierKeys, primaryAction } from 'ol/events/condition.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';

/**
 * @typedef {Object} Options
 * @property {import('../YioMap.js').YioMap} yioMap
 */

export default class UserEditInteraction extends Interaction {
  /**
   * @type {import('../YioMap.js').YioMap}
   */
  #yioMap = null;

  /**
   * @type {VectorLayer | null} layer for temporary features of the draw / modify interactions
   */
  #editLayer = null;

  /**
   * @type {VectorTileLayer | null} VectorTileLayer of the content map which contains the editable features.
   */
  #editableContentLayer = null;

  getEditLayer() {
    return this.#editLayer;
  }

  /**
   * clears features that were modified
   */
  clearModifiedFeatures() {
    const source = this.#editLayer.getSource();
    const featuresToRemove = source
      .getFeatures()
      .filter(feature => feature.get('id') !== undefined);
    source.removeFeatures(featuresToRemove);
    this.#modifiedFeatureIDs.clear();
  }

  /**
   * Clears features that were created
   */
  clearCreatedFeatures() {
    const source = this.#editLayer.getSource();
    const featuresToRemove = source
      .getFeatures()
      .filter(feature => feature.get('id') === undefined);
    source.removeFeatures(featuresToRemove);
  }

  /**
   * source-layer to set on created features
   * @type {string}
   */
  #editSourceLayer;

  /**
   * IDs of features that can be modified
   * @type {Array<number> | null}
   */
  #editIds = null;

  /**
   * IDs of features that were modified
   * @type {Set<number>}
   */
  #modifiedFeatureIDs = new Set();

  /**
   * @param {Options} options
   */
  constructor(options) {
    super();
    this.#yioMap = options.yioMap;
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

  #hasEligibleFeature = false;

  #addInteractions() {
    this.drawInteraction = new Draw({
      source: this.#editLayer.getSource(),
      condition: event => {
        if (!noModifierKeys(event)) {
          return false;
        }
        return this.createEnabled && !this.#hasEligibleFeature;
      },
      type: 'Point',
      style: () => {
        return this.#hasEligibleFeature ? null : defaultStyles;
      },
    });
    this.getMap().addInteraction(this.drawInteraction);
    this.drawInteraction.on('drawend', event => {
      const feature = event.feature;
      feature.set('mvt:layer', this.#editSourceLayer);
    });
    this.modifyInteraction = new Modify({
      source: this.#editLayer.getSource(),
      condition: event => {
        if (!primaryAction(event)) {
          return false;
        }
        return this.modifyEnabled;
      },
      style: () => {
        return this.#hasEligibleFeature ? null : defaultStyles;
      },
    });
    this.getMap().addInteraction(this.modifyInteraction);
  }

  #removeInteractions() {
    if (this.drawInteraction) {
      this.drawInteraction.setMap(null);
      this.drawInteraction = null;
    }
    if (this.modifyInteraction) {
      this.modifyInteraction.setMap(null);
      this.modifyInteraction = null;
    }
  }

  async setActive(active) {
    if (active === this.getActive()) {
      return;
    }
    const map = this.getMap();
    if (!map) {
      return;
    }
    if (active) {
      const layerGroup = await this.#yioMap._getContentLayerPromise();
      const layers = getLayers(layerGroup, 'edits');
      if (!layers.length) {
        console.warn(
          'No edits source found in content layer. Please add a source with key "edits" and at least one layer that uses it.',
        );
        const mapboxStyle = layerGroup.get('mapbox-style');
        mapboxStyle.sources.edits = {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        };
        await addMapboxLayer(layerGroup, {
          id: 'all-edits',
          source: 'edits',
          type: 'circle',
          paint: {
            'circle-radius': 5,
            'circle-color': '#ff0000',
            'circle-stroke-width': 1,
          },
        });
      }
      this.#editLayer = /** @type {import('ol/layer/Vector.js').default} */ (
        getLayers(layerGroup, 'edits')[0]
      );
      this.#editableContentLayer = this.#yioMap
        ._getContentLayer()
        .getLayers()
        .getArray()
        .filter(l => l instanceof VectorTileLayer)
        .pop();
      this.#setStyle();

      if (!this.#originalStyle) {
        this.#originalStyle = this.#editableContentLayer.getStyle();
        this.#editableContentLayer.setStyle((feature, resolution) => {
          if (this.#modifiedFeatureIDs.has(feature.get('id'))) {
            return;
          }
          return this.#originalStyle(feature, resolution);
        });
      }
      if (!this.#pointerMoveListener) {
        this.#pointerMoveListener = e => {
          if (!this.modifyEnabled) {
            map.getTargetElement().style.cursor = '';
            this.#hasEligibleFeature = false;
            return null;
          }
          this.#hasEligibleFeature = !!this.#getEligibleFeatureAtPixel(e.pixel);
          e.target.getTargetElement().style.cursor = this.#hasEligibleFeature
            ? 'pointer'
            : '';
        };
        map.on('pointermove', this.#pointerMoveListener);
      }
      this.#addInteractions();
    } else {
      if (this.#originalStyle) {
        this.#editableContentLayer.setStyle(this.#originalStyle);
        this.#originalStyle = null;
      }
      this.#editSourceLayer = null;
      if (this.#pointerMoveListener) {
        map.un('pointermove', this.#pointerMoveListener);
        this.#pointerMoveListener = null;
      }
      this.#removeInteractions();
    }
    super.setActive(active);
  }

  get createEnabled() {
    return !!this.#editSourceLayer;
  }

  async setCreateEnabled(value) {
    this.#editSourceLayer = value || undefined;
    if (!value) {
      this.clearCreatedFeatures();
      this.#editableContentLayer.getSource().refresh();
    }
    await this.setActive(!!value || !!this.#editIds);
    if (this.drawInteraction) {
      this.drawInteraction.setMap(!!value ? this.getMap() : null);
    }
  }

  get modifyEnabled() {
    return !!this.#editIds;
  }

  async setModifyEnabled(ids) {
    if (ids && ids.length === 0) {
      ids = null;
    }
    if (!ids) {
      this.clearModifiedFeatures();
      this.#editableContentLayer.getSource().refresh();
    }
    this.#editIds = ids;
    await this.setActive(!!ids || !!this.#editSourceLayer);
    if (this.modifyInteraction) {
      this.modifyInteraction.setMap(!!ids ? this.getMap() : null);
    }
  }

  /**
   * sets the style of the editing layer to match the existing layer of the content map.
   */
  #setStyle() {
    this.#editLayer.setStyle((feature, resolution) => {
      return this.#originalStyle
        ? this.#originalStyle(feature, resolution) || defaultStyles
        : defaultStyles;
    });
  }

  #pointerMoveListener = null;

  /**
   * gets the feature at the given pixel that is eligible for modification.
   * @param {import("ol/pixel.js").Pixel} pixel
   * @returns {import('ol/Feature.js').FeatureLike | null}
   */
  #getEligibleFeatureAtPixel(pixel) {
    if (!this.#editIds) {
      return null;
    }
    const map = this.getMap();
    const existingFeatures = map
      .getFeaturesAtPixel(pixel, {
        layerFilter: l =>
          l === this.#editLayer || l == this.#editableContentLayer,
      })
      .filter(f => {
        return (
          f.getGeometry().getType() === 'Point' &&
          (this.#editIds.includes(f.get('id')) ||
            this.#editLayer.getSource().hasFeature(f))
        );
      });
    return existingFeatures.length ? existingFeatures[0] : null;
  }

  /**
   * @param {import('ol/MapBrowserEvent.js').default} event
   * @returns {boolean}
   */
  handleEvent(event) {
    let propagateEvent = true;

    if (event.type === 'pointerdown') {
      const existingFeature = this.#getEligibleFeatureAtPixel(event.pixel);
      if (
        existingFeature &&
        existingFeature instanceof RenderFeature &&
        this.modifyEnabled
      ) {
        const existingFeatureId = existingFeature.get('id');
        if (!this.#modifiedFeatureIDs.has(existingFeatureId)) {
          this.#modifiedFeatureIDs.add(existingFeatureId);
        }
        this.#editableContentLayer.changed();
        const newFeature = toFeature(existingFeature);
        this.#editLayer.getSource().addFeature(newFeature);
      }
    }

    if (propagateEvent && this.modifyEnabled) {
      propagateEvent = this.modifyInteraction.handleEvent(event);
    }
    if (propagateEvent && this.createEnabled) {
      propagateEvent = this.drawInteraction.handleEvent(event);
    }

    if (propagateEvent && event.type === 'click') {
      this.#handleClick(event);
    }

    return propagateEvent;
  }
}
