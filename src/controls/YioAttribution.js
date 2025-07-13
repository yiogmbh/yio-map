import Attribution from 'ol/control/Attribution.js';
import YioIconPink from '../assets/yio_icon_pink.svg';

const img = document.createElement('img');
img.src = YioIconPink;
img.alt = 'yio.at';
img.style.height = '1em';

export const YioAttribution = new Attribution({
  attributions:
    '<b><span style="margin-right: 3px;">|</span><a href="https://yio.at">yio.at</b></a>',
  label: img,
});
