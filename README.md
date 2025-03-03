yio-map

A map web-component to display various geo data using OpenLayers under the hood.

## Installation

```bash
npm i yio-map
```

## Usage

### With the npm package

```html
<script type="module">
  import 'yio-map';
</script>

<yio-map></yio-map>
```

### With the standalone build

Download `yio-map.umd.cjs` from the [latest release](https://github.com/yiogmbh/yio-map/releases/latest), put it in your project directory, and add it with a `script` element:

```html
<script src="./yio-map.umd.cjs"></script>

<yio-map></yio-map>
```

## Linting and formatting

To scan the project for linting and formatting errors, run

```bash
npm run lint
```

To automatically fix linting and formatting errors, run

```bash
npm run format
```

## Testing with Web Test Runner

To execute a single test run:

```bash
npm test
```

To run the tests in interactive watch mode run:

```bash
npm run test:watch
```

## Demoing with Storybook

To run a local instance of Storybook for your component, run

```bash
npm run storybook
```

To build a production version of Storybook, run

```bash
npm run storybook:build
```

## Local Demo and Development

```bash
npm start
```

To run a local development server that serves the basic demo located in `index.html`

To be able to access yio resources, an `.env` file should be created. See `.env.example` for an explanation of available environment variables. As a starting point, copy `.env.example` to `.env`.

## Build

```bash
npm run build
```

To build the web component. In addition to the package files, a standalone script with all dependencies included will be available in `dist/yio-map.umd.cjs`.
