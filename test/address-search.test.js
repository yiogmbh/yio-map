import { it, describe, expect, afterEach } from 'vitest';
import '../src/index.js';

describe('AddressSearch i18n', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.lang = '';
  });

  async function fixture(markup) {
    document.body.innerHTML = markup;
    await new Promise(r => setTimeout(r, 100));
    return /** @type {import('../src/controls/AddressSearch.js').AddressSearch} */ (
      document.body.querySelector('yio-address-search')
    );
  }

  function getInput(el) {
    return el.shadowRoot.querySelector('input.search-input');
  }

  it('shows English placeholder by default', async () => {
    const el = await fixture('<yio-address-search></yio-address-search>');
    expect(getInput(el).placeholder).to.equal('Search Address');
  });

  it('shows German placeholder when lang="de"', async () => {
    const el = await fixture(
      '<yio-address-search lang="de"></yio-address-search>',
    );
    expect(getInput(el).placeholder).to.equal('Adresse suchen');
  });

  it('reads lang from <html> element', async () => {
    document.documentElement.lang = 'de';
    const el = await fixture('<yio-address-search></yio-address-search>');
    expect(getInput(el).placeholder).to.equal('Adresse suchen');
  });

  it('lang attribute overrides <html> lang', async () => {
    document.documentElement.lang = 'de';
    const el = await fixture(
      '<yio-address-search lang="en"></yio-address-search>',
    );
    expect(getInput(el).placeholder).to.equal('Search Address');
  });

  it('strips region subtag (de-AT → de)', async () => {
    const el = await fixture(
      '<yio-address-search lang="de-AT"></yio-address-search>',
    );
    expect(getInput(el).placeholder).to.equal('Adresse suchen');
  });

  it('falls back to English for unknown language', async () => {
    const el = await fixture(
      '<yio-address-search lang="fr"></yio-address-search>',
    );
    expect(getInput(el).placeholder).to.equal('Search Address');
  });

  it('YioMap lang attribute propagates to address search', async () => {
    document.body.innerHTML = '<yio-map lang="de" enableSearch></yio-map>';
    await new Promise(r => setTimeout(r, 300));
    const yioMap = document.body.querySelector('yio-map');
    const searchEl = yioMap.shadowRoot.querySelector('yio-address-search');
    expect(searchEl).to.exist;
    expect(getInput(searchEl).placeholder).to.equal('Adresse suchen');
  });
});
