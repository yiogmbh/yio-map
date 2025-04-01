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
