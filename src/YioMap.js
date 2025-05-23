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
import apply from 'ol-mapbox-style';
import { getLayerForMapboxSourceLayer } from './utils.js';
import UserPinInteraction from './controls/UserPinInteraction.js';

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
    `,
  ];

  static properties = {
    center: { type: Array, reflect: true },
    zoom: { type: Number, reflect: true },
    contentMap: { type: String },
    editLayer: { type: String },
    userSelect: { attribute: false },
    lastClickCoordinate: { type: Array, attribute: false },
    enablePinning: { type: Boolean },
  };

  /** @type {boolean} */
  notifyNextChange = false;

  /** @type {Map} */
  #map = null;

  /**
   * @type {string} Mapbox / MapLibre style, or URL to style
   */
  #contentMap = '';

  /**
   * @type {string} Mapbox / Maplibre source layer name
   */
  #editLayer = null;

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

  #enablePinning = false;

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
   * @param {Event} event
   */
  _handleClick(event) {
    if (event instanceof PointerEvent) {
      this.lastClickCoordinate = toLonLat(this.#map.getEventCoordinate(event));
    }
    this.dispatchEvent(new PointerEvent('click', event));
  }

  set contentMap(value) {
    this.#contentMap = value;
    this.#applyContentMap();
  }

  get contentMap() {
    return this.#contentMap;
  }

  set editLayer(value) {
    const oldValue = this.#editLayer;
    this.#editLayer = value;
    if (!value && oldValue) {
      // when the editlayer-attribute is removed, the edit source is cleared.
      // re-fetch all tiles, the new changes are supposed to be ready on the server.
      const hadEdits = this.#userEditInteraction.clearEditSource();
      if (hadEdits) {
        getLayerForMapboxSourceLayer(this._getContentLayer(), oldValue);
      }
    }
    this.#handleEditLayerChange();
  }

  get editLayer() {
    return this.#editLayer;
  }

  get enablePinning() {
    return this.#enablePinning;
  }

  set enablePinning(value) {
    this.#enablePinning = value;
    this.#userPinInteraction.setActive(!this.editLayer && this.#enablePinning);
  }

  async #handleEditLayerChange() {
    await this.#contentLayerPromise;
    this.#userSelectInteraction.setActive(!this.editLayer);
    this.#userPinInteraction.setActive(!this.editLayer && this.#enablePinning);
    this.#userEditInteraction.setActive(!!this.editLayer);
  }

  get editFeatures() {
    const features = this.#userEditInteraction
      .getEditLayer()
      .getSource()
      .getFeatures();
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
        this.#contentLayerPromise = apply(
          this.#contentLayer,
          this.contentMap,
        ).catch(error => {
          console.error(error);
        });
      }
    }
  }

  /**
   * creates the map instance and essential layers and interactions
   */
  #createMap() {
    this.#map = new Map();
    this.#map.addControl(new LayerControl({ map: this.#map }));

    this.#map.addLayer(this.#contentLayer);

    this.#map.addInteraction(this.#userEditInteraction);
    this.#map.addInteraction(this.#userSelectInteraction);
    this.#map.addInteraction(this.#userPinInteraction);

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
