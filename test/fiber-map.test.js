import { it, describe, expect, vi } from 'vitest';
import { userEvent } from '@vitest/browser/context';
import '../src/index.js';

describe('YioMap', () => {
  function getInsideYioMap() {
    return document.body
      .querySelector('yio-map')
      ?.shadowRoot?.querySelector('div');
  }

  /**
   * @param {string} markup
   * @returns {Promise<import('../src/YioMap.js').YioMap>}
   */
  async function fixture(markup) {
    document.body.innerHTML = markup;
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (getInsideYioMap()) {
          clearInterval(interval);
          resolve(
            /** @type {import('../src/YioMap.js').YioMap} */ (
              document.body.querySelector('yio-map')
            ),
          );
        }
      }, 100);
    });
  }

  it('has a default center [0, 0] and zoom 2', async () => {
    /** @type {import('../src/YioMap.js').YioMap} */
    const el = await fixture('<yio-map></yio-map>');

    expect(el.center).to.eql([0, 0]);
    expect(el.zoom).to.equal(2);
  });

  it('can set center and zoom via attribute', async () => {
    /** @type {import('../src/YioMap.js').YioMap} */
    const el = await fixture('<yio-map center="[16, 48]" zoom="12"></yio-map>');

    expect(el.center[0]).to.be.closeTo(16, 0.0001);
    expect(el.center[1]).to.be.closeTo(48, 0.0001);
    expect(el.zoom).to.equal(12);
  });

  it('dispatches a change event when user interacts with the map', async () => {
    /** @type {import('../src/YioMap.js').YioMap} */
    const el = await fixture('<yio-map tabindex="0"></yio-map>');

    const onchange = vi.fn(() => true);
    el.addEventListener('change', onchange);

    await userEvent.dblClick(el);
    await new Promise(resolve => setTimeout(resolve, 500));
    expect(onchange).toHaveBeenCalled();
  });
});
