import { html, css, LitElement, unsafeCSS } from 'lit';
import style from 'ol/ol.css?inline';
import layerControlStyle from './controls/LayerControl.css?inline';

import Map from 'ol/Map.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import LayerControl from './controls/LayerControl.js';

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
    onMapmove: { type: Function },
  };

  /** @type {Map} */
  #map = null;

  /** @type {boolean} */
  #skipNextMapmoveEvent = false;

  /** @type {boolean} */
  #mapmove = false;

  constructor() {
    super();
    this.center = [0, 0];
    this.zoom = 2;
  }

  __createMap() {
    this.#map = new Map({
      controls: defaultControls(),
      layers: [],
    });
    this.#map.addControl(new LayerControl({ map: this.#map }));
    this.#map.on('moveend', () => {
      this.#mapmove = true;
      const view = this.#map.getView();
      this.center = toLonLat(view.getCenter());
      this.zoom = view.getZoom();
      if (this.#skipNextMapmoveEvent) {
        this.#skipNextMapmoveEvent = false;
        return;
      }
      this.dispatchEvent(
        new Event('change', {
          composed: true,
          bubbles: true,
        }),
      );
    });
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this.__createMap();
    this.#map.setTarget(
      /** @type {HTMLElement} */ (this.shadowRoot.querySelector('.map')),
    );
  }

  updated(changedProperties) {
    if (this.#mapmove) {
      this.#mapmove = false;
      return;
    }
    this.#skipNextMapmoveEvent = true;
    super.updated(changedProperties);
    if (changedProperties.has('center') || changedProperties.has('zoom')) {
      this.#map.getView().animate(
        {
          center: fromLonLat(this.center),
          zoom: this.zoom,
          duration: 500,
        },
        () => {
          this.#skipNextMapmoveEvent = true;
        },
      );
    }
  }

  render() {
    return html` <div class="map"></div> `;
  }
}

window.customElements.define('yio-map', YioMap);
