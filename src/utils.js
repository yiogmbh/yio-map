import { getLayer, getLayers } from 'ol-mapbox-style';
import { Point } from 'ol/geom.js';
import RenderFeature from 'ol/render/Feature.js';

/**
 * gets the first ol layer for a given mapbox source-layer
 * @param {import("ol/layer/Group.js").default} contentLayer
 * @param {string} mapboxSourceLayer mapbox source layer id
 * @returns {import("ol/layer/Vector.js").default | import("ol/layer/VectorTile.js").default|null}
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
    return null;
  }
  return /** @type {import("ol/layer/Vector.js").default | import("ol/layer/VectorTile.js").default} */ (
    getLayer(contentLayer, mapboxLayer.id)
  );
}
