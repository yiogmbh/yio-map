import Attribution from 'ol/control/Attribution.js';
import YioIconPink from '../assets/yio_icon_pink.svg';

const img = document.createElement('img');
img.src = YioIconPink;
img.alt = 'yio.at';
img.style.height = '1em';

export const YioAttribution = new Attribution({
  label: img,

  render: function (mapEvent) {
    // @ts-ignore
    const container = this.element;
    if (!container || !mapEvent.frameState) return;

    // Collect dynamic layer attributions
    const dynamicAttributions =
      // @ts-ignore
      this.collectSourceAttributions_(mapEvent.frameState) ?? [];

    const entries = [];

    // Custom Attribution for yio-maps
    entries.push(`
      <a href="https://yio.at" target="_blank" rel="noopener">
        <b>yio gmbh</b>
      </a>
    `);

    for (const attr of dynamicAttributions) {
      entries.push(attr);
    }

    // HTML with separators
    const html = entries
      .map((entry, index) => {
        if (index === 0) return `<li>${entry}</li>`;
        return `<li><span style="margin: 0 4px 0 2px;">|</span>${entry}</li>`;
      })
      .join('');

    // Reload the list with new entries
    let list = container.querySelector('ul');
    if (!list) {
      list = document.createElement('ul');
      container.appendChild(list);
    }
    list.innerHTML = html;
  },
});
