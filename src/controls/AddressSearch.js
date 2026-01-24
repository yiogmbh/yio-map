import { css, html, LitElement, unsafeCSS } from 'lit';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import style from './AddressSearch.css?inline';

const DORIS_API_BASE = 'https://srv.doris.at/solr/searchservice/search/all2';
const DEBOUNCE_MS = 250;

export class AddressSearch extends LitElement {
  static styles = [
    unsafeCSS(style),
    css`
      :host {
        display: block;
      }
    `,
  ];

  static properties = {
    placeholder: { type: String },
    resultCount: { type: Number },
    sortByDistance: { type: Boolean },
    minSearchLength: { type: Number },
    mapCenter: { type: Array },
    _query: { state: true },
    _results: { state: true },
    _loading: { state: true },
    _showResults: { state: true },
    _error: { state: true },
    _totalResults: { state: true },
  };

  #debounceTimer = null;
  #abortController = null;

  constructor() {
    super();
    this.placeholder = 'Search Address...';
    this.resultCount = 5;
    this.sortByDistance = false;
    this.minSearchLength = 3;
    this.mapCenter = null;
    this._query = '';
    this._results = [];
    this._loading = false;
    this._showResults = false;
    this._error = null;
    this._totalResults = 0;
  }

  #debounce(fn, delay) {
    clearTimeout(this.#debounceTimer);
    this.#debounceTimer = setTimeout(fn, delay);
  }

  #handleInput(e) {
    this._query = e.target.value;
    this.#debounce(() => this.#search(), DEBOUNCE_MS);
  }

  async #search() {
    if (this._query.length < this.minSearchLength) {
      this._results = [];
      this._showResults = false;
      return;
    }

    this.#abortController?.abort();
    this.#abortController = new AbortController();

    this._loading = true;
    this._showResults = true;
    this._error = null;

    try {
      this._results = await this.#fetchResults(this._query);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Search error:', err);
        this._results = [];
        this._error = 'Search failed. Please try again.';
      }
    } finally {
      this._loading = false;
    }
  }

  async #fetchResults(query) {
    const params = new URLSearchParams({
      q: query,
      wt: 'json2',
      rows: String(this.resultCount),
    });

    let url = `${DORIS_API_BASE}/?${params}`;

    if (this.sortByDistance && this.mapCenter) {
      const [lon, lat] = this.mapCenter;
      params.set('pt', `${lat},${lon}`);
      url = `${DORIS_API_BASE}/geo/?${params}`;
    }

    const response = await fetch(url, {
      signal: this.#abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    this._totalResults = data?.response?.numFound || 0;
    return this.#parseResults(data);
  }

  #parseResults(data) {
    const docs = data?.response?.docs || [];
    return docs.map(doc => {
      const isSpecial = doc.type !== 'adr';
      const coords = this.#parseCoordinates(doc);
      return {
        type: doc['type'] === 'GeonamAT' ? 'special' : 'address',
        title: doc['textsuggest'],
        subtitle: doc['subtext'],
        distance: doc['_dist_'] ? this.#formatDistance(doc['_dist_']) : null,
        coordinates: coords,
        raw: doc,
      };
    });
  }

  #parseCoordinates(doc) {
    if (doc.x && doc.y) {
      return [parseFloat(doc.x), parseFloat(doc.y)];
    }
    if (Array.isArray(doc.geo)) {
      const match = doc.geo[0].match(/POINT\s*\(\s*([\d.]+)\s+([\d.]+)\s*\)/i);
      if (match) {
        return [parseFloat(match[1]), parseFloat(match[2])];
      }
    }
    if (doc.geo instanceof String) {
      const match = doc.geo.match(/POINT\s*\(\s*([\d.]+)\s+([\d.]+)\s*\)/i);
      if (match) {
        return [parseFloat(match[1]), parseFloat(match[2])];
      }
    }
    return null;
  }

  #formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  #handleResultClick(result) {
    if (!result.coordinates) return;

    // @ts-ignore
    (document.activeElement)?.blur();
    this._query = result.title;

    this.dispatchEvent(
      new CustomEvent('select', {
        detail: {
          coordinates: result.coordinates,
          result,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #handleSortToggle(e) {
    this.sortByDistance = e.target.checked;
    if (this._query.length >= this.minSearchLength) {
      this.#search();
    }
  }

  #handleResultCountInput(e) {
    const value = parseInt(e.target.value, 10);
    if (!value || value < 1) return;
    this.resultCount = Math.min(value, 100);
    this.#debounce(() => {
      if (this._query.length >= this.minSearchLength) {
        this.#search();
      }
    }, DEBOUNCE_MS);
  }

  #renderSearchIcon() {
    return html`
      <svg
        class="search-icon"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 3a7 7 0 1 0 4.9 12l4.35 4.35a1 1 0 0 0 1.4-1.4L16.35 13.6A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"
        />
      </svg>
    `;
  }

  #renderAddressIcon() {
    return html`
      <svg
        class="result-icon"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
        />
      </svg>
    `;
  }

  #renderSpecialIcon() {
    return html`
      <svg
        class="result-icon special"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2Z"
        />
      </svg>
    `;
  }

  #renderFooter() {
    return html`
      <div class="results-footer">
        <span class="result-count-display">
          Showing
          <input
            type="number"
            class="result-count-input"
            .value=${String(this.resultCount)}
            @input=${this.#handleResultCountInput}
            min="1"
            max="100"
          />
          of ${this._totalResults} results
        </span>
        <label class="prefer-close-label">
          <input
            type="checkbox"
            .checked=${this.sortByDistance}
            @change=${this.#handleSortToggle}
          />
          Prefer nearby
        </label>
      </div>
    `;
  }

  #renderResults() {
    if (!this._showResults) return null;

    return html`
      <div class="results-dropdown">
        <ul class="results-list">
          ${this._error ? html`<div class="no-results error">${this._error}</div>` : null}
          ${this._results.length === 0 && !this._error ?html`<div class="no-results">No results</div>` : null}
          ${this._results.map(
            result => html`
              <li
                class="result-item"
                @click=${() => this.#handleResultClick(result)}
              >
                ${result.type === 'special'
                  ? this.#renderSpecialIcon()
                  : this.#renderAddressIcon()}
                <div class="result-content">
                  <div class="result-title">${result.title}</div>
                  ${result.subtitle
                    ? html`<div class="result-subtitle">
                        ${result.subtitle}
                      </div>`
                    : null}
                </div>
                ${result.distance
                  ? html`<span class="result-distance"
                      >${result.distance}</span
                    >`
                  : null}
              </li>
            `,
          )}
        </ul>
        ${this.#renderFooter()}
      </div>
    `;
  }

  render() {
    return html`
      <div class="address-search">
        <div class="search-container" tabindex="1">
          <div class="search-input-wrapper">
            ${this.#renderSearchIcon()}
            <input
              type="text"
              class="search-input"
              .placeholder=${this.placeholder}
              .value=${this._query}
              @input=${this.#handleInput}
            />
            ${this._loading
              ? html`<div class="loading-indicator"></div>`
              : null}
          </div>
          ${this.#renderResults()}
        </div>
      </div>
    `;
  }
}

customElements.define('yio-address-search', AddressSearch);
