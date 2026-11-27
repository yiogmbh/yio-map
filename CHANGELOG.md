# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Breaking:** Raise the minimum peer dependency versions to `ol` `^10.11.0` and `ol-mapbox-style` `^13.9.0`. Projects that install `yio-map` via npm must upgrade both packages.
- **Breaking:** A `contentMap` style containing a layer without a `type` property no longer loads; the error is logged to the console and no content layers are shown. Add a valid `type` (e.g. `circle`, `line`, `fill`) to every style layer. This also applies to the CDN (IIFE) bundle, which now ships `ol-mapbox-style` 13.9.
