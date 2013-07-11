# Depict

## Setup

    brew install librsvg
    brew install imagemagick # Maybe not necessary anymore?

## Procedure

Write a function in `chart.js` with the following definition:
    
    void window.insertChart(data);

`insertChart` will create an svg element in the `#target` div, using the data, height and width specified in the configutation options.

Use the `depict` script to create an output `.png` image of the graphic:

    ./depict.js test.png

## Pain points

- All svg styles must be inline for the current rendering program to use them. Can some sort of utility convert css to a series of d3.selectAll().style() commands?

## Ideas

There should be a command to generate a basic index.html and chart.js in the current wrking directory.

