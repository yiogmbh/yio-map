import Attribution from 'ol/control/Attribution.js';
import YioIconPink from '../assets/yio_icon_pink.svg';

const img = document.createElement('img');
img.src = YioIconPink;
img.alt = 'yio.at';
img.style.height = '1em';

export const YioAttribution = new Attribution({
  label: img,
});

const originalRender = YioAttribution.render;
YioAttribution.render = function (mapEvent) {
  originalRender.call(this, mapEvent);

  const container = this.element;
  const list = container.querySelectorAll('.ol-attribution ul')[0];
  if (list) {
    const customHtml = `<a href="https://yio.at">yio gmbh</a><span style="margin-left: 4px; margin-right: 2px;">|</span>`;

    // Remove existing custom entry if it exists
    const existing = list.querySelector('li#yiomap-attribution');
    if (existing) existing.remove();

    // Add at the beginning
    const li = document.createElement('li');
    li.setAttribute('id', 'yiomap-attribution');
    li.innerHTML = customHtml;
    list.insertBefore(li, list.firstChild);
  }
};
