/*
 * Multivariate Density Estimator Visualization (MDEV)
 * Libraries used: jQuery v1.9.1, D3 v3.0.8
 * 
 * bullet.js: Handles rendering of bullet chart visualization
 */

var w = 818,
    h = 21,
    m = [2, 547, 0, 50]; // top right bottom left

var chart = d3.chart.bullet()
    .width(w - m[1] - m[3])
    .height(h - m[0] - m[2]);

function reRender () {
	chart.duration(1000);
	readDataAndRender(parent.visualizationData);
	parent.gBulletChartPageCompleted = true;

}

function readDataAndRender(data) {

  var vis = d3.select("#chart").selectAll("svg")
      .data(data)
    .enter().append("svg:svg")
      .attr("class", "bullet")
      .on("mouseover", function(d) {
        d3.select(this).classed("titlehover", true); })
      .on("mouseout" , function(d) {
        d3.select(this).classed("titlehover", false);})
      .attr("name", function(d) { return d.year; })
      .attr("width", w)
      .attr("height", h)
      //.on("click", function(d,i) { hl = return d.year; alert(hl); })
    .append("svg:g")
      .attr("transform", "translate(" + m[3] + "," + m[0] + ")")
      .call(chart);

  var title = vis.append("svg:g")
      .attr("text-anchor", "end")
      .attr("transform", "translate(-6," + (h - m[0] - m[2] + 8) / 2 + ")");

  title.append("svg:text")
      .attr("class", "title")
      .text(function(d) { return d.year; });

 /* title.append("svg:text")
      .attr("class", "subtitle")
      .attr("dy", "1em")
      .text(function(d) { return d.subtitle; }); */

  window.transition = function() {
    vis.call(chart);
	parent.gBulletChartPageCompleted = true;
  };
}

// Only render on refresh if page was initially loaded
if (parent.gBulletChartPageCompleted)
    reRender();