# Depict

Depict aims to easily render fallback images for d3 visualizations. (IE 8, I'm looking at you.)

If this could happen automagically, charts based on living data could be rendered into flat images at regular intervals, no human interaction required. Think jobs numbers, congressional votes, etc.

There are many directions this project could go in, so please [open up an issue](https://github.com/kevinschaul/depict/issues) to start a conversation.

## Installation

Only tested on OS X

    brew install casperjs
    npm install -g depict # Global install is necessary for command-line access

## Procedure

`depict-init` will create an example project in the current directory.

    depict-init

Write a function in `chart.js` with the following definition:
    
    void window.insertChart(data);

`insertChart` will create an svg element in the `#target` div, using the data, height and width specified in the configutation options.

Use the `depict` script to create an output `.png` image of the graphic:

    depict chart.png

## Pain points

- All svg styles must be inline for the current rendering program to use them. Can some sort of utility convert css to a series of d3.selectAll().style() commands?
- Paths for `depict-init` probably only work on npm installations with default settings.
- Installation. Without librsvg, `depict` with throw cryptic errors.

