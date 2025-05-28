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

export default class UserEditInteraction extends Interaction {
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
      style: () => {
        return this.getMap().getTargetElement().style.cursor === 'pointer'
          ? null
          : defaultStyles;
      },
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
      condition: event => {
        const existingFeature = event.map
          .getFeaturesAtPixel(event.pixel)
          .find(f => {
            return f.get('layer') === this.#yioMap.editLayer;
          });
        return !!existingFeature;
      },
      style: () => {
        return this.getMap().getTargetElement().style.cursor === 'pointer'
          ? null
          : defaultStyles;
      },
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
    let sourceLayer;
    try {
      sourceLayer = getLayerForMapboxSourceLayer(
        this.#yioMap._getContentLayer(),
        this.#yioMap.editLayer,
      );
    } catch (e) {
      console.error(e);
      return;
    }
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
      this.#pointerMoveListener = this.#pointermoveCallback.bind(this);
      this.getMap()?.on('pointermove', this.#pointerMoveListener);
    } else {
      if (this.#originalStyle) {
        this.#editSourceLayer.setStyle(this.#originalStyle);
      }
      this.#editSourceLayer = null;
      this.getMap()?.un('pointermove', this.#pointerMoveListener);
    }
    this.modifyInteraction.setActive(active && this.#yioMap.editModify);
    this.drawInteraction.setActive(active && this.#yioMap.editCreate);
    this.#editLayer.getSource().clear();
    super.setActive(active);
  }

  setCreateEnabled(enabled) {
    if (!this.drawInteraction) {
      return;
    }
    this.drawInteraction.setActive(this.getActive() && enabled);
  }

  setModifyEnabled(enabled) {
    if (!this.modifyInteraction) {
      return;
    }
    this.modifyInteraction.setActive(this.getActive() && enabled);
  }

  /**
   * sets the style of the editing layer to match the existing layer of the content map.
   */
  #setStyle() {
    this.#editLayer.setStyle((feature, resolution) => {
      return this.#originalStyle(feature, resolution) || defaultStyles;
    });
  }

  #pointerMoveListener = null;

  #pointermoveCallback(e) {
    const map = this.getMap();
    if (!this.modifyInteraction.getActive()) {
      map.getTargetElement().style.cursor = '';
      return null;
    }
    const hasEligibleFeature = !!this.#getEligibleFeatureAtPixel(e.pixel);
    e.target.getTargetElement().style.cursor = hasEligibleFeature
      ? 'pointer'
      : '';
  }

  /**
   * gets the feature at the given pixel that is eligible for modification.
   * @param {import("ol/pixel.js").Pixel} pixel
   * @returns {import('ol/Feature.js').FeatureLike | null}
   */
  #getEligibleFeatureAtPixel(pixel) {
    const map = this.getMap();
    const existingFeatures = map
      .getFeaturesAtPixel(pixel)
      .filter(f => {
        return (
          f.getGeometry().getType() === 'Point' &&
          f.get('layer') === this.#yioMap.editLayer
        );
      })
      .filter(f => {
        return (
          // filter by IDs that can be modified
          this.#yioMap.editModifyIDs.length === 0 ||
          this.#yioMap.editModifyIDs.includes(f.get('id'))
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

    if (event.type === 'click') {
      const map = this.getMap();
      const existingFeatures = map.getFeaturesAtPixel(event.pixel).filter(f => {
        return (
          f.getGeometry().getType() === 'Point' &&
          f.get('layer') === this.#yioMap.editLayer
        );
      });

      // restrict to features that can be modified
      const existingFeature = existingFeatures.find(f => {
        return (
          this.#yioMap.editModifyIDs.length === 0 ||
          this.#yioMap.editModifyIDs.includes(f.get('id'))
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

    if (
      event.originalEvent instanceof PointerEvent &&
      this.drawInteraction.getActive() &&
      !this.drawInteraction.handleEvent(
        /** @type {import('ol/MapBrowserEvent.js').default<PointerEvent>} */ (
          event
        ),
      )
    ) {
      propagateEvent = false;
    }
    if (
      propagateEvent &&
      this.modifyInteraction.getActive() &&
      !this.modifyInteraction.handleEvent(event)
    ) {
      propagateEvent = false;
    }
    return propagateEvent;
  }
}
