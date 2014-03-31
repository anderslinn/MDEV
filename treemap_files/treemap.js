/*
 * Multivariate Density Estimator Visualization (MDEV)
 * Libraries used: jQuery v1.9.1, D3 v3.0.8
 * 
 * treemap.js: Handles rendering of treemap visualization
 */
 
var args = [
						{x: 0, y: 0, w: 0, h: 0, key: 0, value: 0},
						{x: 0, y: 0, w: 0, h: 0, key: 0, value: 0},
						{x: 0, y: 0, w: 0, h: 0, key: 0, value: 0},
						{x: 0, y: 0, w: 0, h: 0, key: 0, value: 0},
						{x: 0, y: 0, w: 0, h: 0, key: 0, value: 0},
						{x: 0, y: 0, w: 0, h: 0, key: 0, value: 0},
						{x: 0, y: 0, w: 0, h: 0, key: 0, value: 0}
						];

var links;
						
var w = 750;
var h = 500;
var color = d3.scale.negativeZeroPositive;
var gradientAngle = d3.scale.negativeZeroPositiveGradient;

//ColorPicker()
var temp = 0;
var x = 0;
var y = 0;
var entThreshold;
var entPod;

var mode = 0;

var treemap = d3.layout.treemap()
        .size([w, h])
        .children(function(d) {
						return isNaN(d.value) ? d3.entries(d.value) : null;
				})
        .value(function(d) {
						return Math.abs(d.value);
				})
        .sticky(false);
				
var force = d3.layout.force()
								.size([w, h])
								.charge(-2000)
								.linkDistance(300)
								.on("end", function() {

										d3.selectAll(".cell")
											.call(set_force)
								})				

var div = d3.select("#chart").append("div")
							.style("position", "absolute")
							.style("width", w + "px")
							.style("height", h + "px")

var svg = d3.select("body").insert("svg","#chart")
							.attr("width",w)
							.attr("height",h)
							.style("position","absolute")
							
function toggleTreeMap() {
  if (parent.isTreemap === 0) {

				d3.selectAll("line")
					.transition()
							.each("end", function() {
									d3.selectAll(".cell")
										.transition()
											.duration(1000)
												.call(restore_treemap)
							})
							.duration(1000)
								.call(hide_links)
								
				
					
							
          parent.isTreemap = 1;
  }
    else {
								
					d3.selectAll(".cell")
             .transition()
							 .each("end", function() {
										d3.selectAll("line")
											.transition()
												.duration(1000)
													.call(show_links)
								})
							.duration(1000)
               .call(restore_force)

         parent.isTreemap = 0;
    }   
}

function reRender() {
    readDataAndRender(parent.profileListJSON);
    parent.gTreemapPageCompleted = true;
}

function readDataAndRender(json)
{

		d3.selectAll(".cell").remove()
				
		div.data(d3.entries(json)).selectAll("div")
				.data(treemap)
			.enter().append("div")
				.attr("class", "cell")	
				
		d3.selectAll(".cell").filter(function(d,i){return i == 0 || i == 1 ? 1 : 0})
												 .attr("class","empty")		
				
		div.selectAll(".cell")
				.call(set_treemap)
				
		// attributes 
		
		div.selectAll(".cell")
				.on("mouseover", function(d) {
						d3.select(this).classed("titlehover", true);
				})
				.on("mouseout", function(d) {
						d3.select(this).classed("titlehover", false);
				})
				.style("background", function(d,i) {
						if (parent.treemapZoomLevel === 0) { return colorPickerLvl0(i); }
						else { return colorPickerLvl3(i); }
				})
				.html(function(d,i) {
						if (parent.treemapZoomLevel === 0) {
								return "<div id=title>" + d.key + "</div>" +
												 "<div id=body> Market Cap:" + Math.abs(d.value) + 
												 "B <br> PoD Value:" + getPod(i) + 
												 "<br> PoD Threshold:" + getThreshold(i) + 
												 "</div>";
						} else {
								return "<div id=title>" + d.key + "</div>" + 
											 "<div id=body> Market Cap:" + Math.abs(d.value) + 
											 "B <br> Relative DDM:" + getDDM(i) + 
											 "<br> DDM Threshold: 0.2 </div>";
						}
				});
		
		// here is the force layout

		links = [{source: 0, target: 1},{source: 0, target: 3},{source: 1, target: 2}];
		
		force.nodes(d3.selectAll(".cell")[0])
				.links(links)
				.on("tick", tick)
				.start();

		var link = svg.selectAll("line")
									.data(force.links())
								.enter().append("line")
									.attr("x1", function(d) { return d.source.x; })
									.attr("y1", function(d) { return d.source.y; })
									.attr("x2", function(d) { return d.target.x; })
									.attr("y2", function(d) { return d.target.y; })
									.style("stroke","#FC8D59")
									.style("stroke-width", "1.5px")
									.style("opacity",0)
								
		var node = div.selectAll(".cell")
								.data(force.nodes())
								.each(function(d,i) {set_args(d,i)});
								
		function tick() {
			link
					.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; });
	
			node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		}						
}				

function colorPickerLvl0(t) {
    entThreshold = parent.visualizationData[t].goal;
    entPod = parent.visualizationData[t].holdings;
    if (entThreshold <= entPod) {
        return "#FC8D59";
    }
    else {
        return "#91BFDB";
    }
}

function colorPickerLvl3(t) {
    var tempEntity = $("#TickerSelect", window.parent.document).val();
    entDDM = parent.DDMData[t][tempEntity];
    if (entDDM <= 0.2) {
        return "#91BFDB";
    }
    else if (entDDM == 1) { // Not strict equality entDDM is a string
        return "grey";
    }
    else {
        return "#FC8D59";
    }
}

function getDDM(t) {
    var tempEntity = $("#TickerSelect", window.parent.document).val();
    return parent.DDMData[t][tempEntity];
}

function getPod(t) {
    return parent.visualizationData[t].holdings;
}

function getThreshold(t) {
    return parent.visualizationData[t].goal;
}

function zoom() {
		
    if (parent.isZoom === 1)
    {
        div.selectAll(".cell")
                .transition()
									.duration(500)
								.style("background", function(d,i) {
									return colorPickerLvl0(i);
								})
								
				div.selectAll(".cell")
								.html(function(d,i) {
									console.log("item " + i)
									console.log("key " + d.key)
									console.log("value " + d.value)
                  return "<div id=title>" + d.key + "</div>" +
												 "<div id=body> Market Cap:" + Math.abs(d.value) + 
												 "B <br> PoD Value:" + getPod(i) + 
												 "<br> PoD Threshold:" + getThreshold(i) + 
												 "</div>";
        });

        parent.isZoom = 0;
    } else if (parent.isZoom === 0) {

        div.selectAll(".cell")
                .transition()
                .duration(500)
                .style("background", function(d,i) {
									return colorPickerLvl3(i);
								})
								
				div.selectAll(".cell")
								.html(function(d,i) {
									console.log("item " + i)
									console.log("key " + d.key)
									console.log("value " + d.value)
                  return "<div id=title>" + d.key + "</div>" + 
												 "<div id=body> Market Cap:" + Math.abs(d.value) + 
												 "B <br> Relative DDM:" + getDDM(i) + 
												 "<br> DDM Threshold: 0.2 </div>";
        });
								
        parent.isZoom = 1;
    }
}

function restore_treemap() {
    this
            .style("left", function(d) {
        return d.treemapx + "px";
    })
            .style("top", function(d) {
        return d.treemapy + "px";
    })
            .style("width", function(d) {
        return d.treemapw - 1 + "px";
    })
            .style("height", function(d) {
        return d.treemaph - 1 + "px";
    });
}

function restore_force() {
		this
            .style("left", function(d) {
        return d.forcex + "px";
    })
            .style("top", function(d) {
        return d.forcey + "px";
    })
            .style("width", function(d) {
        return d.forcew - 1 + "px";
    })
            .style("height", function(d) {
        return d.forceh - 1 + "px";
    });
}

function set_treemap() {
		
    this
            .style("left", function(d,i) {
						d.treemapx = d.x;
						args[i].x = d.treemapx;
						args[i].key = d.key;
						args[i].value = d.value;
        return d.treemapx + "px";
    })
            .style("top", function(d,i) {
						d.treemapy = d.y;
						args[i].y = d.treemapy;
        return d.treemapy + "px";
    })
            .style("width", function(d,i) {
						d.treemapw = d.dx;
						args[i].w = d.treemapw
        return d.treemapw - 1 + "px";
    })
            .style("height", function(d,i) {
						d.treemaph = d.dy;
						args[i].h = d.treemaph
        return d.treemaph - 1 + "px";
    });
}

function set_force() {
		
    this  
            .style("width", function(d,i) {

						d.forcew = 150;
        return d.treemapw - 1 + "px";
    })
            .style("height", function(d,i) {
						
						d.forceh = 80;
        return d.treemaph - 1 + "px";
    })
		.style("left", function(d,i) {
						
						d.forcex = d.x - d.forcew/2
        return d.treemapx + "px";
    })
            .style("top", function(d,i) {
						
						d.forcey = d.y - d.forceh/2
        return d.treemapy + "px";
    })
}

function set_args(d,i) {
		
				d.treemapy = args[i].y
				d.treemapx = args[i].x
				d.treemapw = args[i].w
				d.treemaph = args[i].h
				d.key = args[i].key
				d.value = args[i].value

}


function show_links() {
	
		this.style("opacity",100)
		
}

function hide_links() {

		this.style("opacity",0)
		
}

