# Depict

Depict aims to easily render fallback images of web elements for platform that do not run code.

Given a URL and optional [CSS selector](http://www.w3.org/TR/selectors/#selectors), depict outputs a screenshot of the rendered element.

With depict, charts based on living data can be rendered into flat images at regular intervals, no human interaction required. Think jobs numbers, congressional votes, etc.

## Features

- Include an extra CSS file before rendering, useful for hiding UI components that don't make sense for static images
- Wait to take the screenshot until a selector exists with `--wait-for-selector` (e.g. have your dynamic chart add a data attribute when it has rendered, and tell depict to wait for that)

## Installation

Install globally:

    npm install -g depict

Or run with npx:

    npx depict

## Usage

    Usage: depict <URL> [options]

    Options:
      -o, --output <file>          Output file (default: screenshot.png)
      -s, --selector <string>      CSS selector (default: "body")
      --width <number>             Viewport width (default: 1440)
      --height <number>            Viewport height (default: 900)
      --delay <ms>                 Wait before screenshot in milliseconds (default: 1000)
      --timeout <sec>              Timeout in seconds for page load and selector waiting (default: 30)
      --wait-for-selector <sel>    Wait for CSS selector to exist before screenshot
      --css <file>                 CSS file(s) to inject (comma-separated)
      --hide <selector>            Hide element(s) before screenshot
      --quality <number>           JPEG quality 0-100 (only for .jpg/.jpeg output, default: 90)
      --verbose                    Show detailed output
      -h, --help                   Display help

## Examples

For a specific chart:

    depict \
        http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html \
        -s '#g-chart-va' \
        -o va-wine.png

To render the full graphic:

    depict \
        http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html \
        -s '#main' \
        -o a-nation-of-wineries.png

To hide certain components, such as UI elements:

    depict \
        http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html \
        -s '.g-us-map-grid' \
        --hide '.g-us-map-slider' \
        -o us-wine.png

To include a CSS file:

    depict \
        http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html \
        -s '.g-us-map-grid' \
        --css exclude-ui.css \
        -o us-wine.png

To wait for dynamic content (e.g., chart renders after data loads):

    depict \
        https://www.washingtonpost.com/politics/interactive/2025/trump-administration-actions/ \
        -s '.ribbon-chart' \
        --wait-for-selector 'svg .chart' \
        --timeout 60 \
        -o chart.png

To capture mobile viewport:

    depict \
        https://www.washingtonpost.com/politics/interactive/2025/trump-administration-actions/ \
        -s '.ribbon-chart' \
        --wait-for-selector 'svg .chart' \
        --timeout 60 \
        --width 375 \
        -o chart.png

To output JPEG format (smaller file size):

    depict \
    http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html \
    -s '#g-chart-va' \
    -o chart.jpg \
    --quality 85

## Pro tips

Run a local webserver to use depict during development:

    python -m http.server 1337
    depict http://localhost:1337 -s '#chart' -o chart.png

Add a line in your `Makefile` to run depict automatically. (You are [using make](http://bost.ocks.org/mike/make/), right?)

    fallback/chart.png: index.html
        depict http://localhost:1337 -s '#chart' -o $@

Hide multiple CSS selectors by using commas:

    depict \
        http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html \
        -s '.g-us-map-grid' \
        --hide '.g-us-map-slider, .g-us-map-legend' \
        -o us-wine.png

Include multiple CSS files by using commas:

    depict \
        http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html \
        -s '.g-us-map-grid' \
        --css 'exclude-ui.css, touch-device.css' \
        -o us-wine.png

## Releasing

To release a new version: `./scripts/release.sh patch` (or `minor`/`major`)

