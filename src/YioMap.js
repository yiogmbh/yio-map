import { html, css, LitElement, unsafeCSS } from 'lit';
import style from 'ol/ol.css?inline';
import layerControlStyle from './controls/LayerControl.css?inline';

import Map from 'ol/Map.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import LayerControl from './controls/LayerControl.js';
import UserSelectInteraction from './controls/UserSelectInteraction.js';
import UserEditInteraction from './controls/UserEditInteraction.js';
import LayerGroup from 'ol/layer/Group.js';
import apply, { updateMapboxSource } from 'ol-mapbox-style';
import UserPinInteraction from './controls/UserPinInteraction.js';
import { emptyGeojson } from './constants.js';

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
    `,
  ];

  static properties = {
    center: { type: Array, reflect: true },
    zoom: { type: Number, reflect: true },
    contentMap: { type: Object },
    editCreate: { type: String },
    editModify: { type: Array },
    enablePinning: { type: Boolean },
    enableSelect: { type: Boolean },
    overlayGeoJson: { type: Object },
    editFeatures: { attribute: false },
    lastClickCoordinate: { type: Array, attribute: false },
    userSelect: { attribute: false },
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
  #overlayGeoJson = null;

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

  get overlayGeoJson() {
    return this.#overlayGeoJson;
  }

  set overlayGeoJson(value) {
    this.#overlayGeoJson = value;
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

  #applyContentMap() {
    if (this.#contentLayer) {
      this.#contentLayer.getLayers().clear();
      this.#contentLayerPromise = null;
      if (this.contentMap) {
        this.#contentLayerPromise = new Promise(async () => {
          const contentMapObj = await this.#getAsObjectOrFetch(this.contentMap);
          contentMapObj['sources'] ??= {};
          // Ensure the 'geojson' source is always present

          const geoJsonObj = await this.#getAsObjectOrFetch(
            this.overlayGeoJson,
          );

          contentMapObj['sources']['geojson'] = {
            type: 'geojson',
            data: geoJsonObj ?? emptyGeojson,
          };

          await apply(this.#contentLayer, this.contentMap);
        }).catch(error => {
          console.error(error);
        });
      }
    }
  }

  /**
   * Fetches jso from url
   * If the input is an object, it is returned as is.
   */
  async #getAsObjectOrFetch(url) {
    if (typeof url === 'object') {
      return url;
    }
    if (typeof url === 'string') {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }
      return await response.json();
    }
    return {};
  }

  async #applyOverlayGeoJson() {
    const layer = await this.#contentLayerPromise;

    if (!this.#overlayGeoJson) {
      updateMapboxSource(layer, 'geojson', {
        type: 'geojson',
        data: emptyGeojson,
      });
      return;
    }

    try {
      const geoJsonData = this.#getAsObjectOrFetch(this.#overlayGeoJson);
      updateMapboxSource(layer, 'geojson', {
        type: 'geojson',
        data: geoJsonData,
      });
    } catch (error) {
      console.error('Failed to apply overlay GeoJSON:', error);
    }
  }

  /**
   * creates the map instance and essential layers and interactions
   */
  #createMap() {
    this.#map = new Map();
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
