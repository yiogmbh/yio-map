import { getLayer } from 'ol-mapbox-style';
import { Point } from 'ol/geom.js';
import RenderFeature from 'ol/render/Feature.js';

/**
 * gets the ol layer for a given mapbox source-layer
 * @param {import("ol/layer/Group.js").default} contentLayer
 * @param {string} mapboxSourceLayer mapbox source layer id
 * @returns {import("ol/layer/Vector.js").default | import("ol/layer/VectorTile.js").default}
 */
export function getLayerForMapboxSourceLayer(contentLayer, mapboxSourceLayer) {
  if (!mapboxSourceLayer) {
    return;
  }
  const styleDocument = contentLayer.get('mapbox-style');
  if (!styleDocument) {
    return;
  }

  const mapboxLayer = styleDocument.layers.find(l => {
    return l['source-layer'] === mapboxSourceLayer;
  });

  if (!mapboxLayer) {
    throw new Error(
      `<yio-map>: Invalid value for "editLayer". Could not find "${mapboxSourceLayer}" as source-layer in the content map.`,
    );
  }
  return /** @type {import("ol/layer/Vector.js").default | import("ol/layer/VectorTile.js").default} */ (
    getLayer(contentLayer, mapboxLayer.id)
  );
}
