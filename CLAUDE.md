# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`yio-map` is a single web component (`<yio-map>`) built with Lit 3 and OpenLayers 10, published to npm. Content is driven by a Mapbox/MapLibre style JSON applied via `ol-mapbox-style`. Plain JavaScript (ESM) type-checked with JSDoc through `tsc` (`checkJs`, non-strict). Public attributes/events are documented in `README.md`; keep that table in sync when changing the public API.

## Commands

```bash
npm start                 # Vite dev server serving index.html (demo page)
npm test                  # pretest runs `tsc --noEmit` + installs chromium-headless-shell, then vitest run
npx vitest run test/address-search.test.js        # single test file
npx vitest run test/fiber-map.test.js -t "zoom"   # single test by name
npm run lint              # ESLint + Prettier check
npm run format            # auto-fix
npm run build             # ES bundle (peer deps external) + IIFE/UMD bundles (all deps inlined) + .d.ts
npm run storybook
```

- Tests run in a real headless Chromium via `@vitest/browser-playwright` (`vitest.config.js`), not jsdom; use `vitest/browser` (`page`, `userEvent`). `npx vitest` skips the `pretest` type-check — run `npx tsc --noEmit` separately when touching types/JSDoc.
- The dev server optionally proxies `/api/` to `API_TARGET` with a session `COOKIE` from `.env` (see `.env.example`, `vite.config.js`); rewrites absolute API URLs in JSON responses to `/`.
- Prettier: single quotes, `arrowParens: avoid`. Husky + lint-staged run eslint/prettier on commit.
- TypeScript 7: the build's declaration step runs `tsc --ignoreConfig … --rootDir src` so `.d.ts` files land at `dist/*.d.ts` (matching `exports.types`); don't drop either flag.
- `tsconfig` uses `module: NodeNext`: JSON imports need `with { type: 'json' }` (see `YioAttribution.js`); relative imports need the `.js` extension.

## Release

`npm version patch|minor|major && git push --follow-tags`. A `v*` tag triggers `.github/workflows/release.yml`: test, build, verify tag is on `main`, GitHub release (attaches `dist/yio-map.iife.js`), `npm publish`. CI on PRs to `main` runs test + build.

## Architecture

- `src/YioMap.js` — the `LitElement`; registers `yio-map` on import. Most public properties use getter/setters backed by `#private` fields so setting a property immediately toggles the corresponding OL interaction/control. The OL `Map` is created in `firstUpdated`, so setters must tolerate `#map` being null.
- **Content map lifecycle**: setting `contentMap` calls `apply()` from `ol-mapbox-style` into a single `LayerGroup` (`#contentLayer`) and stores the result in `#contentLayerPromise`. Everything depending on the style (`geojsonSources` → `updateMapboxSource`, `sourceLayerVisibility` → `updateMapboxLayer` layout visibility, edit layers) awaits this promise. `updated()` re-applies these only when `contentMap` didn't change in the same cycle (otherwise `#applyContentMap` handles it). GeoJSON source names must already exist in the style.
- **Change notification**: `center`/`zoom` are reflected. Programmatic changes animate the view; user moves set `notifyNextChange = true` before updating properties, and `updated()` then dispatches a `change` CustomEvent instead of animating. Interactions use the same flag (e.g. selection). The first `moveend` is ignored.
- **Interactions** (`src/controls/User*Interaction.js`) are OL `Interaction` subclasses constructed with `{ yioMap }` and talk back through the component's "package-private" `_getContentLayer()`, `_getContentLayerPromise()`, `_handleClick()` methods:
  - `UserSelectInteraction` — hit-tests content layers, writes `yioMap.userSelect`, highlights in its own vector layer.
  - `UserPinInteraction` — single pin marker, fires `pin` with `[lon, lat]`; `setPin()` is public.
  - `UserEditInteraction` — adds an `edits` GeoJSON source/layers to the content style via `addMapboxLayer`, uses OL `Draw` (on `editCreate` source-layer) and `Modify` (feature IDs in `editModify`); hides originals of modified features by wrapping the last `VectorTileLayer`'s style. `yioMap.editFeatures` serializes the edit layer to GeoJSON (EPSG:4326).
- **Controls**: `LayerControl` (basemap switcher: positron/orthofoto/kataster, thumbnails from `src/assets`), `YioAttribution` (singleton Attribution showing package version), `AddressSearchControl` wrapping the `<yio-address-search>` Lit element (`AddressSearch.js`, queries the DORIS Solr search service, debounced, emits `select`).
- CSS is imported with `?inline` and injected into shadow DOM via `unsafeCSS` (including `ol/ol.css`).
- **i18n**: `src/i18n.js` holds a `TRANSLATIONS` table per namespace (`en`, `de`). Language resolution: `lang` property → `<html lang>` → `navigator.language` → `en`. Add new strings to both languages.
- Coordinates: public API is EPSG:4326 `[lon, lat]`; the map view is EPSG:3857 (`fromLonLat`/`toLonLat` at the boundary).
- `test/fixtures/styleJson.js` + `public/tiles/` provide a local vector-tile style for tests.
