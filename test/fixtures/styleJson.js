export default {
  version: 8,
  name: 'Test Style',
  sources: {
    dummy: {
      type: 'vector',
      tiles: ['https://example.com/tiles/{z}/{x}/{y}.pbf'],
    },
  },
  layers: [
    {
      id: 'dummy-layer',
      type: 'circle',
      source: 'dummy',
      'source-layer': 'points',
      paint: {
        'circle-radius': 5,
        'circle-color': '#ff0000',
      },
    },
  ],
};
