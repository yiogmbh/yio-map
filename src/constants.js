import { Circle, Fill, RegularShape, Stroke, Style } from 'ol/style.js';

const fill = new Fill({
  color: 'rgba(255,255,255,0.4)',
});
const stroke = new Stroke({
  color: '#3399CC',
  width: 1.25,
});
export const defaultStyles = [
  new Style({
    image: new Circle({
      fill: fill,
      stroke: stroke,
      radius: 5,
    }),
    fill: fill,
    stroke: stroke,
  }),
];
export const pinStyle = new Style({
  image: new RegularShape({
    stroke: new Stroke({ color: '#e26c68', width: 2  }),
    points: 4,
    radius: 10,
    radius2: 0,
    angle: Math.PI / 4,
  }),
});