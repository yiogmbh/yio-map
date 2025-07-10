import { fn } from '@storybook/test';
import { YioMap } from '../src/YioMap.js';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
/** @type {import('@storybook/web-components').Meta} */
const meta = {
  title: 'YioMap',
  component: 'yio-map',
  args: {
    onchange: fn(),
    onclick: fn(),
    style: 'height: 300px',
  },
};

export default meta;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
/** @type {import('@storybook/web-components').StoryObj} */
export const Default = {
  args: {},
};

/** @type {import('@storybook/web-components').StoryObj} */
export const CenterAndZoomArguments = {
  args: {
    center: [16, 48],
    zoom: 12,
  },
};

/** @type {import('@storybook/web-components').StoryObj} */
export const EnablePinning = {
  args: {
    center: [16, 48],
    zoom: 12,
    enablePinning: true,
  },
};

/** @type {import('@storybook/web-components').StoryObj} */
export const ContentMap = {
  args: {
    center: [-73.9978486645436, 40.7155],
    zoom: 15,
    contentMap: {
      version: 8,
      sources: {
        'simple-features': {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      [-74.006, 40.7128],
                      [-74.001, 40.7128],
                      [-74.001, 40.7178],
                      [-74.006, 40.7178],
                      [-74.006, 40.7128],
                    ],
                  ],
                },
                properties: { color: '#ff0000' },
              },
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [-74.003, 40.7148],
                },
                properties: { color: '#00ff00' },
              },
            ],
          },
        },
      },
      layers: [
        {
          id: 'line-layer',
          type: 'line',
          source: 'simple-features',
          paint: {
            'line-color': '#0000ff',
            'line-width': 2,
          },
        },
        {
          id: 'point-layer',
          type: 'circle',
          source: 'simple-features',
          paint: {
            'circle-radius': 6,
            'circle-color': '#00ff00',
          },
        },
      ],
    },
  },
};

/** @type {import('@storybook/web-components').StoryObj} */
export const CreateFeatures = {
  args: {
    center: [15.6, 48.4107],
    zoom: 15,
    contentMap: {
      version: 8,
      sources: {
        mockSource: {
          type: 'vector',
          minzoom: 14,
          maxzoom: 15,
          scheme: 'xyz',
          tiles: ['/tiles/14/{x}/{y}.pbf'],
        },
      },
      layers: [
        {
          id: 'sitesA',
          minzoom: 14,
          maxzoom: 15,
          type: 'circle',
          source: 'mockSource',
          'source-layer': 'layer_a',
          paint: {
            'circle-radius': 7.0,
            'circle-color': '#77DDF9',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
            'circle-opacity': 1,
          },
          layout: {},
        },
        {
          id: 'sitesB',
          minzoom: 14,
          maxzoom: 15,
          type: 'circle',
          source: 'mockSource',
          'source-layer': 'layer_b',
          paint: {
            'circle-radius': 7.0,
            'circle-color': '#7700F9',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
            'circle-opacity': 1,
          },
          layout: {},
        },
      ],
    },
  },
};

CreateFeatures.play = async ({ canvasElement }) => {
  const el = canvasElement.querySelector('yio-map');
  if (el) {
    el.setAttribute('editLayer', 'layer_a');
    // @ts-ignore
    el.editModify = false;
  }
};

/** @type {import('@storybook/web-components').StoryObj} */
export const ModifyFeatures = {
  args: {
    center: [15.6, 48.4107],
    zoom: 15,
    contentMap: {
      version: 8,
      sources: {
        mockSource: {
          type: 'vector',
          minzoom: 14,
          maxzoom: 15,
          scheme: 'xyz',
          tiles: ['/tiles/14/{x}/{y}.pbf'],
        },
      },
      layers: [
        {
          id: 'sitesA',
          minzoom: 14,
          maxzoom: 15,
          type: 'circle',
          source: 'mockSource',
          'source-layer': 'layer_a',
          paint: {
            'circle-radius': 7.0,
            'circle-color': '#77DDF9',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
            'circle-opacity': 1,
          },
          layout: {},
        },
        {
          id: 'sitesB',
          minzoom: 14,
          maxzoom: 15,
          type: 'circle',
          source: 'mockSource',
          'source-layer': 'layer_b',
          paint: {
            'circle-radius': 7.0,
            'circle-color': '#7700F9',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
            'circle-opacity': 1,
          },
          layout: {},
        },
      ],
    },
  },
};

ModifyFeatures.play = async ({ canvasElement }) => {
  const el = canvasElement.querySelector('yio-map');
  if (el) {
    el.setAttribute('editLayer', 'layer_a');
    // @ts-ignore
    el.editCreate = false;
  }
};

/** @type {import('@storybook/web-components').StoryObj} */
export const OverlayGeoJson = {
  args: {
    center: [-73.9978486645436, 40.7155],
    zoom: 15,
    contentMap: {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'line-layer',
          type: 'line',
          source: 'geojson',
          paint: {
            'line-color': '#0000ff',
            'line-width': 2,
          },
        },
        {
          id: 'point-layer',
          type: 'circle',
          source: 'geojson',
          paint: {
            'circle-radius': 6,
            'circle-color': '#00ff00',
          },
        },
      ],
    },
    overlayGeoJson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-74.006, 40.7128],
                [-74.001, 40.7128],
                [-74.001, 40.7178],
                [-74.006, 40.7178],
                [-74.006, 40.7128],
              ],
            ],
          },
          properties: { color: '#ff0000' },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-74.003, 40.7148],
          },
          properties: { color: '#00ff00' },
        },
      ],
    },
  },
};

/** @type {import('@storybook/web-components').StoryObj} */
export const OverlayGeoJsonFromUrl = {
  args: {
    center: [0, 0],
    zoom: 2,
    contentMap: {
      version: 8,
      sources: {
        'simple-background': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'background',
          type: 'raster',
          source: 'simple-background',
        },
        {
          id: 'geojson',
          type: 'line',
          source: 'geojson',
          paint: {
            'line-color': '#0000ff',
            'line-width': 2,
          },
        },
      ],
    },
    overlayGeoJson:
      'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_rivers_europe.geojson',
  },
};
