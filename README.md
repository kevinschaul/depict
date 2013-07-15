# Depict

Depict aims to easily render fallback images for complex visualizations. (IE 8, I'm looking at you.)

Given a url and css selector, depict outputs a .png of the rendered element.

With depict, charts based on living data can be rendered into flat images at regular intervals, no human interaction required. Think jobs numbers, congressional votes, etc.

## Installation

Depict requires [CasperJS](http://docs.casperjs.org/en/latest/installation.html), which can be installed on OS X via [Homebrew](http://brew.sh/).

    brew install casperjs

Then, install depict from [npm](https://npmjs.org/package/depict). The global install is recommended for easy command-line access.

    npm install -g depict

## Usage

    Usage: depict URL OUT_FILE [-s SELECTOR]

    Options:
      -h, --help      Display help  [default: false]
      -s, --selector  CSS selector  [default: "body"]

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

