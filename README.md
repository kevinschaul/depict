# Depict

Depict aims to easily render fallback images for complex visualizations. (IE 8, I'm looking at you.)

Given a url and [css selector](http://www.w3.org/TR/selectors/#selectors), depict outputs a .png of the rendered element.

With depict, charts based on living data can be rendered into flat images at regular intervals, no human interaction required. Think jobs numbers, congressional votes, etc.

## Features

- Include an extra css file before rendering, useful for hiding UI components that don't make sense for static images
- Optionally let depict know when it's OK to take a screenshot with the
  `--call-phantom` option

## Installation

Depict requires [PhantomJS](http://phantomjs.org/download.html), which can be installed on OS X via [Homebrew](http://brew.sh/).

    brew update
    brew install phantomjs

Then, install depict from [npm](https://npmjs.org/package/depict). The global install is recommended for easy command-line access.

    npm install -g depict

## Usage

    Usage: depict URL OUT_FILE [OPTIONS]

    Options:
      -h, --help           Display help                                                  [default: false]
      -s, --selector       CSS selector                                                  [default: "body"]
      -c, --css            CSS file to include in rendering                              [default: false]
      -H, --hide-selector  Hide attributes of this selector before rendering.            [default: false]
      -w, --browser-width  Specify the desired browser width.                            [default: 1440]
      -d, --delay          Specify a delay time, in milliseconds.                        [default: 1000]
      --call-phantom       Whether to wait for the target page to call `callPhantom()`.  [default: false]

## Examples

For a specific chart:

    depict \
    http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html \
    -s '#g-chart-va' \
    va-wine.png

To render the full graphic:

    depict \
    http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html \
    -s '#main' \
    a-nation-of-wineries.png

To hide certain components, such as UI elements:

    depict \
    http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html \
    -s '.g-us-map-grid' \
    us-wine.png \
    -H '.g-us-map-slider'

To include a css file:

    depict \
    http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html \
    -s '.g-us-map-grid' \
    us-wine.png \
    -c exclude-ui.css

To wait until the target page is ready (see
[examples/callback.html](examples/callback.html) for a working example):

    // Add this piece of code on the target page when depict should take
    // the screenshot.
    if (typeof window.callPhantom === 'function') {
        window.callPhantom({ target: 'depict', status: 'ready' });
    }

    depict \
    http://0.0.0.0:8001/callback.html \
    out.png \
    --call-phantom

## Pro tips

Run a local webserver to use depict during development:

    python -m SimpleHTTPServer 1337
    depict http://0.0.0.0:1337 chart.png -s '#chart'

Add a line in your `Makefile` to run depict automatically. (You are [using make](http://bost.ocks.org/mike/make/), right?)

    fallback/chart.png: index.html
        depict http://0.0.0.0:1337 $@ -s '#chart'

Hide multiple css selectors by using commas:

    depict \
    http://www.nytimes.com/interactive/2013/07/07/business/a-nation-of-wineries.html \
    -s '.g-us-map-grid' \
    us-wine.png \
    -H '.g-us-map-slider, .g-map-legend-click'

