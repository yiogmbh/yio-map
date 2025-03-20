import { html, css, LitElement, unsafeCSS } from 'lit';
import style from 'ol/ol.css?inline';
import layerControlStyle from './controls/LayerControl.css?inline';

import Map from 'ol/Map.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import { defaults as defaultControls } from 'ol/control/defaults.js';
import LayerControl from './controls/LayerControl.js';
import VectorSource from 'ol/source/Vector.js';
import VectorLayer from 'ol/layer/Vector.js';
import { toFeature } from 'ol/render/Feature.js';

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
    userSelect: { attribute: false },
  };

  /** @type {Map} */
  #map = null;

  #userSelectSource = new VectorSource();

  /** @type {boolean} */
  #skipNextMapmoveEvent = false;

  /** @type {boolean} */
  #mapmove = false;

  constructor() {
    super();
    this.center = [0, 0];
    this.zoom = 2;
    this.userSelect = [];
  }

  __createMap() {
    this.#map = new Map({
      controls: defaultControls(),
      layers: [
        new VectorLayer({
          source: this.#userSelectSource,
        }),
      ],
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
    this.#map.on('pointermove', event => {
      const features = this.#map.getFeaturesAtPixel(event.pixel, {
        layerFilter: layer => yio.getLayers().getArray().includes(layer),
      });
      this.#map.getTargetElement().style.cursor = features.length
        ? 'pointer'
        : '';
    });
    this.#map.on('click', event => {
      const features = this.#map.getFeaturesAtPixel(event.pixel, {
        layerFilter: layer => yio.getLayers().getArray().includes(layer),
      });
      this.#userSelectSource.clear();
      this.#userSelectSource.addFeatures(
        features.map(
          /** @param {import('ol/render/Feature.js').default} renderFeature */
          renderFeature => toFeature(renderFeature),
        ),
      );
      this.userSelect = features.map(feature => feature.getProperties());
    });
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this.__createMap();
    const target = /** @type {HTMLElement} */ (
      this.shadowRoot.querySelector('.map')
    );
    this.#map.setTarget(target);
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
