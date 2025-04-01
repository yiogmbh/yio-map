import { html, css, LitElement, unsafeCSS } from 'lit';
import style from 'ol/ol.css?inline';
import layerControlStyle from './controls/LayerControl.css?inline';

import Map from 'ol/Map.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import LayerControl from './controls/LayerControl.js';
import UserSelectInteraction from './controls/UserSelectInteraction.js';
import LayerGroup from 'ol/layer/Group.js';
import apply from 'ol-mapbox-style';

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

  constructor() {
    super();
    this.center = [0, 0];
    this.zoom = 2;
    this.userSelect = [];
  }

  /**
   * @returns {LayerGroup}
   */
  _getContentLayer() {
    return this.#contentLayer;
  }

  set contentMap(value) {
    this.#contentMap = value;
    this.#applyContentMap();
  }

  get contentMap() {
    return this.#contentMap;
  }

  #applyContentMap() {
    if (this.#map && this.#contentLayer) {
      apply(this.#contentLayer, this.contentMap).catch(error => {
        console.error(error);
      });
    }
  }

  #createMap() {
    this.#map = new Map();
    this.#map.addControl(new LayerControl({ map: this.#map }));

    if (this.contentMap) {
      this.#applyContentMap();
    }
    this.#map.addLayer(this.#contentLayer);
    this.#map.addInteraction(
      new UserSelectInteraction({
        yioMap: this,
      }),
    );

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
