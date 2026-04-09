# yio-map

Web component for interactive maps built on [LitElement](https://lit.dev/) and [OpenLayers](https://openlayers.org/).

## Usage

### CDN

```html
<yio-map
  style="width: 100%; height: 500px;"
  contentMap="/path/to/style.json"
  center="[14.5, 47.5]"
  zoom="8"
></yio-map>
<script src="https://cdn.jsdelivr.net/npm/yio-map@0/dist/yio-map.iife.js"></script>
```

The IIFE bundle includes all dependencies and registers `<yio-map>` as a custom element.

### npm

```bash
npm i yio-map
```

```js
import 'yio-map';
```

When using a bundler, `ol` and `ol-mapbox-style` are expected as peer dependencies.

## Attributes

| Attribute | Type | Description |
|---|---|---|
| `contentMap` | `string` | URL to a Mapbox/MapLibre style JSON |
| `center` | `[lon, lat]` | Initial map center in EPSG:4326 |
| `zoom` | `number` | Initial zoom level (1 -- 22) |
| `enableSearch` | `boolean` | Show address search input |
| `enablePinning` | `boolean` | Allow placing markers on the map |
| `enableSelect` | `boolean` | Enable feature selection on click/hover |
| `editCreate` | `string` | Source layer name to draw new features on |
| `editModify` | `number[]` | Feature IDs enabled for editing |
| `geojsonSources` | `object\|string` | GeoJSON data or URL to overlay |
| `sourceLayerVisibility` | `object` | Toggle visibility of source layers |
| `lang` | `string` | Override UI language (defaults to `<html lang>`, then browser language, then `en`). Supported: `en`, `de` |

## Events

| Event | Detail | Description |
|---|---|---|
| `change` | `{ changedProperties }` | Map state changed (center, zoom, features) |
| `click` | PointerEvent | Click on the map (with `enableSelect`) |
| `pin` | `{ coordinate: [lon, lat] }` | Marker placed (with `enablePinning`) |

## Development

Requires a `.env` file for API proxying (copy from `.env.example`).

```bash
npm start           # Dev server with demo (index.html)
npm test            # Tests (Vitest + Playwright)
npm run test:watch  # Interactive test mode
npm run lint        # ESLint + Prettier check
npm run format      # Auto-fix lint/format
npm run build       # Production build (ES + IIFE + UMD + types)
npm run storybook   # Component stories
```

## Release

```bash
npm version patch   # or minor / major
git push --follow-tags
```

Pushing a version tag triggers CI to run tests, build, publish to npm, and create a GitHub release.