(function() {

window.insertChart = function(jobs, _width, _height) {
  console.log(jobs.jobs_change);

  var baseWidth = _width || 600;
  var baseHeight = _height || 400;

  var margin = {
    top: 10,
    right: 10,
    bottom: 20,
    left: 50
  };

  var width = baseWidth - margin.left - margin.right;
  var height = baseHeight - margin.top - margin.bottom;

  var x = d3.scale.linear()
    .domain([0, 5])
    .range([0, width]);

  var y = d3.scale.linear()
    .domain([500000, 0])
    .range([0, height]);

  var xAxisGenerator = d3.svg.axis()
    .orient("bottom")
    .scale(x);
  
  var yAxisGenerator = d3.svg.axis()
    .orient("left")
    .scale(y);

  var svg = d3.select("#target").append("svg")
      .attr("height", baseHeight)
      .attr("width", baseWidth)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var xAxis = svg.append("g")
    .attr("class", "g-axis g-x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxisGenerator);

  var yAxis = svg.append("g")
    .attr("class", "g-axis a-y-axis")
    .call(yAxisGenerator);

  var line = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.jobs_change); });

  svg.append("path")
    .attr("class", "g-line")
    .attr("d", line(jobs.jobs_change));


// Styles
  d3.selectAll(".g-line")
    .style("fill", "none")
    .style("stroke", "#999")
    .style("stroke-width", "3px");

  d3.selectAll(".g-axis")
    .style("fill", "none");

  d3.selectAll(".tick")
    .style("stroke", "#999");

  d3.selectAll("text")
    .style("font-family", "arial, sans-serif")
    .style("font-size", "11px")
    .style("stroke", "none")
    .style("fill", "#333");

};

})();

