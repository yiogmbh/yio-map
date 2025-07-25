import { css, html, LitElement, unsafeCSS } from 'lit';
import style from 'ol/ol.css?inline';
import layerControlStyle from './controls/LayerControl.css?inline';

import Map from 'ol/Map.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import LayerControl from './controls/LayerControl.js';
import UserSelectInteraction from './controls/UserSelectInteraction.js';
import UserEditInteraction from './controls/UserEditInteraction.js';
import LayerGroup from 'ol/layer/Group.js';
import apply, { getSource, updateMapboxLayer, updateMapboxSource } from 'ol-mapbox-style';
import UserPinInteraction from './controls/UserPinInteraction.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import { YioAttribution } from './controls/YioAttribution.js';

export class YioMap extends LitElement {
  static styles = [
    unsafeCSS(style),
    unsafeCSS(layerControlStyle),
    css`
      :host {
        display: block;
        height: 200px;
      }

      .map {
        width: 100%;
        height: 100%;
      }

      .cursor-pointer {
        cursor: pointer;
      }

      .cursor-move {
        cursor: move;
      }

      .cursor-pointer.cursor-move {
        cursor: grab;
      }
    `,
  ];

  static properties = {
    center: { type: Array, reflect: true },
    zoom: { type: Number, reflect: true },
    contentMap: { type: String },
    editCreate: { type: String },
    editModify: { type: Array },
    enablePinning: { type: Boolean },
    enableSelect: { type: Boolean },
    geojsonSources: { type: Object },
    editFeatures: { attribute: false },
    lastClickCoordinate: { type: Array, attribute: false },
    userSelect: { attribute: false },
    sourceLayerVisibility: { type: Object },
  };

  /** @type {boolean} */
  notifyNextChange = false;

  /** @type {Map} */
  #map = null;

  /**
   * @type {string} Mapbox / MapLibre style, or URL to style
   */
  #contentMap = '';

  /** @type {LayerGroup} */
  #contentLayer = new LayerGroup();

  /**
   * @type {UserEditInteraction}
   */
  #userEditInteraction = null;

  /**
   * @type {UserSelectInteraction}
   */
  #userSelectInteraction = null;

  /**
   * @type {UserPinInteraction}
   */
  #userPinInteraction = null;

  /**
   * @type {Promise}
   */
  #contentLayerPromise = null;

  /**
   * @type {string} Source layer to create features on. If not set, feature creation is disabled.
   */
  #editCreate = null;

  /**
   * @type {Array<number>} Feature ids enabled for editing. If not set, feature modification is disabled.
   */
  #editModify = null;

  /**
   * @type {boolean} User selection is enabled.
   */
  #enableUserSelect = false;

  /**
   * @type {boolean} whether pinning is enabled
   */
  #enablePinning = false;

  /**
   * @type {Object|string} GeoJSON data or URL to overlay on the map
   */
  #geojsonSources = null;

  #sourceLayerVisibility = null;

  constructor() {
    super();
    this.center = [0, 0];
    this.zoom = 2;
    this.userSelect = [];
    this.#userEditInteraction = new UserEditInteraction({
      yioMap: this,
    });
    this.#userSelectInteraction = new UserSelectInteraction({
      yioMap: this,
    });
    this.#userPinInteraction = new UserPinInteraction({
      yioMap: this,
    });
  }

  /**
   * @returns {LayerGroup}
   */
  _getContentLayer() {
    return this.#contentLayer;
  }

  /**
   * @returns {Promise<LayerGroup>}
   */
  _getContentLayerPromise() {
    return this.#contentLayerPromise;
  }

  /**
   * @param {Event} event
   */
  _handleClick(event) {
    if (event instanceof PointerEvent) {
      this.lastClickCoordinate = toLonLat(this.#map.getEventCoordinate(event));
    }
    this.dispatchEvent(new PointerEvent('click', event));
  }

  get contentMap() {
    return this.#contentMap;
  }

  set contentMap(value) {
    this.#contentMap = value;
    this.#applyContentMap();
  }

  get editCreate() {
    return this.#editCreate;
  }

  set editCreate(value) {
    this.#editCreate = value;
    this.#userEditInteraction.setCreateEnabled(value);
  }

  set editModify(value) {
    this.#editModify = value;
    this.#userEditInteraction.setModifyEnabled(value);
  }

  get editModify() {
    return this.#editModify;
  }

  get enableSelect() {
    return this.#enableUserSelect;
  }

  set enableSelect(value) {
    this.#enableUserSelect = value;
    this.#userSelectInteraction.setActive(!!this.#enableUserSelect);
  }

  get enablePinning() {
    return this.#enablePinning;
  }

  set enablePinning(value) {
    this.#enablePinning = value;
    this.#userPinInteraction.setActive(!!this.#enablePinning);
  }

  get geojsonSources() {
    return this.#geojsonSources;
  }

  set geojsonSources(value) {
    this.#geojsonSources = value;
  }

  get sourceLayerVisibility() {
    return this.#sourceLayerVisibility;
  }

  set sourceLayerVisibility(value) {
    this.#sourceLayerVisibility = value;
  }

  get editFeatures() {
    const features = this.#userEditInteraction
      .getEditLayer()
      ?.getSource()
      ?.getFeatures();
    if (!features) {
      return null;
    }
    const geojsonFormat = new GeoJSON();

    return geojsonFormat.writeFeaturesObject(features, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });
  }

  async #applyContentMap() {
    await this.#contentLayerPromise;
    this.#contentLayer.getLayers().clear();
    this.#contentLayerPromise = null;
    if (this.contentMap) {
      this.#contentLayerPromise = apply(
        this.#contentLayer,
        this.contentMap,
      ).catch(error => {
        console.error('Error applying content to yiomap:', error);
      });
      await this.#contentLayerPromise
      await this.#updateSourceLayerVisibility();
      await this.#updateGeojsonSources();
    }
  }

  async #updateGeojsonSources() {
    if (!this.#geojsonSources) {
      return;
    }
    const layer = await this.#contentLayerPromise;
    if (!layer) {
      return;
    }
    const sources = Object.keys(this.#geojsonSources);

    try {
      await Promise.all(
        sources.map(source => {
          const data = this.#geojsonSources[source];
          // Test if source exists
          if (!getSource(layer, source)) {
            throw new Error("Geojson source '" + source + "' does not exist.");
          }
          return updateMapboxSource(layer, source, {
            type: 'geojson',
            data: data,
          });
        }),
      );
    } catch (error) {
      console.error('Error updating GeoJSON sources:', error);
    }
  }

  async #updateSourceLayerVisibility() {
    if (!this.#sourceLayerVisibility) {
      return;
    }

    const layer = await this.#contentLayerPromise;
    if (!layer) {
      return;
    }

    const style = layer.get("mapbox-style");
    const layerIds = Object.keys(style.layers);
    try {
      await Promise.all(
        layerIds.map(layerId => {
          const mapboxLayer = style.layers[layerId];
          const sourceLayer = mapboxLayer["source-layer"];
          if (!sourceLayer || !(sourceLayer in this.#sourceLayerVisibility)) {
            return;
          }
          const visibility = this.#sourceLayerVisibility[sourceLayer] ? 'visible' : 'none';
          updateMapboxLayer(layer, {...mapboxLayer, layout: {...mapboxLayer.layout, visibility} })
        }),
      );
    } catch (error) {
      console.error('Error updating source layer visibility:', error);
    }
  }

  /**
   * creates the map instance and essential layers and interactions
   */
  #createMap() {
    this.#map = new Map({
      controls: defaultControls({ attribution: false }),
    });
    this.#map.addControl(YioAttribution);
    this.#map.addControl(new LayerControl({ map: this.#map }));

    this.#map.addLayer(this.#contentLayer);

    this.#map.addInteraction(this.#userSelectInteraction);
    this.#userSelectInteraction.setActive(this.#enableUserSelect);
    this.#map.addInteraction(this.#userPinInteraction);
    this.#userPinInteraction.setActive(this.#enablePinning);
    this.#map.addInteraction(this.#userEditInteraction);
    this.#userEditInteraction.setActive(!!this.editCreate || !!this.editModify);

    let firstMove = true;

    this.#map.on('moveend', () => {
      if (firstMove) {
        firstMove = false;
        return;
      }
      const view = this.#map.getView();
      this.notifyNextChange = true;
      this.center = toLonLat(view.getCenter());
      this.zoom = view.getZoom();
    });
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this.#createMap();
    const target = /** @type {HTMLElement} */ (
      this.shadowRoot.querySelector('.map')
    );
    this.shadowRoot.addEventListener('click', event => event.stopPropagation());
    this.#map.setTarget(target);
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has("sourceLayerVisibility") && !changedProperties.has("contentMap") && this.#contentLayerPromise) {
      this.#updateSourceLayerVisibility();
    }

    if (changedProperties.has("geojsonSources") && !changedProperties.has("contentMap") && this.#contentLayerPromise) {
      this.#updateGeojsonSources();
    }

    if (
      !this.notifyNextChange &&
      (changedProperties.has('center') || changedProperties.has('zoom'))
    ) {
      this.#map.getView().animate({
        center: fromLonLat(this.center),
        zoom: this.zoom,
        duration: 500,
      });
    }
    if (!this.notifyNextChange) {
      return;
    }
    this.notifyNextChange = false;
    this.dispatchEvent(
      new CustomEvent('change', {
        composed: true,
        bubbles: true,
        detail: { changedProperties },
      }),
    );
  }

  render() {
    return html` <div class="map"></div> `;
  }
}

window.customElements.define('yio-map', YioMap);
