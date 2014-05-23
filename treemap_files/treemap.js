/*
 * Multivariate Density Estimator Visualization (MDEV)
 * Libraries used: jQuery v1.9.1, D3 v3.0.8
 * 
 * treemap.js: Handles rendering of treemap visualization
 *
 * The exploding treemap combines the treemap layout with 
 * a force-directed layout and toggles between them using
 * d3 transitions. The force-directed layout represents the
 * contagion pathway, while the treemap shows the market share
 * of each bank. 
 */
 
// resizing constants for the force layout
var FORCE_WIDTH = 150;
var FORCE_HEIGHT = 80;

// dimensions of the enclosing iframe
// TODO: these should be pulled from the parent instead, so that the
//       dimensions change as the iframe changes		
var w = 750;
var h = 500;
var color = d3.scale.negativeZeroPositive;
var gradientAngle = d3.scale.negativeZeroPositiveGradient;

//ColorPicker()
var entThreshold;
var entPod;

 /* when generating the layouts, the second will always override
  * arguments of the first. To preserve arguments from both, they
	* are temporarily stored in the args array until they can be 
	* re-added to the html elements. Once arguments from both 
	* layouts are in place, switching between them is done by 
	* altering elements directly based on their stored arguments.
	* This eliminates the need to recompute the layouts when 
	* switching between views, and allows the use of d3 transitions,
	* which draw smooth transitions between attributes with discernable
	* ranges, such as color or position.
	*
	* TODO: make a function to create this array dynamically, so the
	*       a variable number of data objects can be created
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

// holds the links for the force-directed layout
var links;

// indicates when the force layout is loaded and ready to view
var force_loaded = false;

// basic treemap layout
var treemap = d3.layout.treemap()
        .size([w, h])
        .children(function(d) {
						return isNaN(d.value) ? d3.entries(d.value) : null;
				})
        .value(function(d) {
						return Math.abs(d.value);
				})
        .sticky(false);

// basic force layout
var force = d3.layout.force()
								.size([w, h])
								.charge(-10000)
								.friction(.8)
								.linkDistance(300)
								.on("end", function(d) {
							
									force_loaded = true;
									// set the locations determined by the force layout
									d3.selectAll(".cell")
											.call(set_force)
								})	
								.on("start", function() {
										// runs for 2.5 sec; contagion graph is unavaible until completion
										window.setTimeout(force.stop, 500);
								})

// container for the cells
var div = d3.select("#chart").append("div")
							.style("position", "absolute")
							.style("width", w + "px")
							.style("height", h + "px")

// container for the links
var svg = d3.select("body").insert("svg","#chart")
							.attr("width",w)
							.attr("height",h)
							.style("position","absolute")

							
function toggleTreeMap() {
  if (parent.isTreemap === 0) {

				// hide the links and then move the cells back in postion
				d3.selectAll("line")
					.transition()
							.each("end", function() {
									d3.selectAll(".cell")
										.transition()
											.duration(1000)
												.call(restore_treemap)
							})
							.duration(500)
								.call(hide_links)
	
          parent.isTreemap = 1;
  } else if(force_loaded == true) {
								
					// move the cells to their exploded position and then draw links
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
    } else {
					
					// alert the user if the force layout isn't ready yet
					alert("The contagion graph is still being calculated!");
		}
}

function toggleTicker() {
		
		if(parent.isTreemap === 0) {
		
				// if links are shown, hide them, recalculate, and draw new links
				d3.selectAll("line")
					.transition()
						.each("end", function() {
								calculateForceLinks();
								
								svg.selectAll("line")
											.data(links)
										.exit().remove()
								
								svg.selectAll("line")
											.data(links)
										.enter().append("line")
											.style("stroke","#FC8D59")
											.style("stroke-width", "1.5px")
											.style("opacity",0)
								
								d3.selectAll("line")
									.transition()
										.duration(1000)
											.call(show_links)
						})
						.duration(500)
							.call(hide_links)
		} else {
		
			// if links are not shown, just recalculate
			calculateForceLinks();
		
			svg.selectAll("line")
						.data(links)
					.exit().remove()
			
			svg.selectAll("line")
						.data(links)
					.enter().append("line")
						.style("stroke","#FC8D59")
						.style("stroke-width", "1.5px")
						.style("opacity",0)
					
		}
		
		if(parent.isZoom === 1) {
			
				// change the background color and relative DDM of each cell
				div.selectAll(".cell")
                .transition()
                .duration(500)
                .style("background", function(d,i) {
									return colorPickerLvl3(i);
								})
								
				div.selectAll(".cell")
								.html(function(d,i) {
                  return "<div id=title>" + d.key + "</div>" + 
												 "<div id=body> Market Cap:" + Math.abs(d.value) + 
												 "B <br> Relative DDM:" + getDDM(i) + 
												 "<br> DDM Threshold: 0.2 </div>";
								});
		}
		
}
function reRender() {
    readDataAndRender(parent.profileListJSON);
    parent.gTreemapPageCompleted = true;
}

function readDataAndRender(json)
{
		// get rid of any existing elements
		d3.selectAll(".cell").remove()
		d3.selectAll("line").remove()
				
		// create the cells
		div.data(d3.entries(json)).selectAll("div")
				.data(treemap)
			.enter().append("div")
				.attr("class", "cell")	
		
		// the treemap creates two extra divs, mark them as empty and ignore them
		d3.selectAll(".cell").filter(function(d){return !d.children ? 0 : 1})
														.remove()	
		
		// set the treemap values
		div.selectAll(".cell")
				.call(set_treemap)
				
		// define attributes for the cells		
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

		// get the links for the force layout
		links = calculateForceLinks();
		
		// start the force layout. It will calculate final positions in the background
		force.nodes(d3.selectAll(".cell")[0])
				.links(links)
				.on("tick", tick)
				.start();

		// TODO: move the style stuff to the treemap.css
		// initialize the links
		var link = svg.selectAll("line")
									.data(links)
								.enter().append("line")
									.attr("x1", function(d) { return d.source.x; })
									.attr("y1", function(d) { return d.source.y; })
									.attr("x2", function(d) { return d.target.x; })
									.attr("y2", function(d) { return d.target.y; })
									.style("stroke","#FC8D59")
									.style("stroke-width", "1.5px")
									.style("opacity",0)
								
		// initialize the nodes
		var node = div.selectAll(".cell")
								.data(force.nodes())
								.each(function(d,i) {set_args(d,i)});
					
		// Resolves collisions between d and all other squares.
		function collide(alpha) {
			var quadtree = d3.geom.quadtree(d3.selectAll(".cell")[0]);
			return function(d) {
						nx1 = d.x - FORCE_WIDTH / 2,
						nx2 = d.x + FORCE_WIDTH / 2,
						ny1 = d.y - FORCE_HEIGHT / 2,
						ny2 = d.y + FORCE_HEIGHT / 2;
				quadtree.visit(function(quad, x1, y1, x2, y2) {
					if (quad.point && (quad.point !== d)) {
						var x = Math.abs(d.x - quad.point.x),
								y = Math.abs(d.y - quad.point.y);
						if (x < FORCE_WIDTH && y < FORCE_HEIGHT) {
							d.x = d.x < quad.point.x ? d.x - x : d.x + x;
							d.y = d.y < quad.point.y ? d.y - y : d.y + y;
							quad.point.x = d.x < quad.point.x ? quad.point.x  + x : d.x - x;
							quad.point.y = d.y < quad.point.y ? quad.point.y + y : quad.point.y - y;
						}
					}
					return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
				});
			};
		}
		
		// define tick function for the force layout
		function tick() {
		
			//TODO: keep the elements from overlapping the links
			
			// keep the elements from overlapping and keep them inside the bounds of the iframe
			node.each(collide(1))
					.attr("x", function(d) { return d.x = Math.max(FORCE_WIDTH / 2, Math.min(w - FORCE_WIDTH / 2, d.x)); })
					.attr("y", function(d) { return d.y = Math.max(FORCE_HEIGHT / 2, Math.min(h - FORCE_HEIGHT / 2, d.y)); })
					
			link.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; });
			
			
			node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		}
}				

function calculateForceLinks() {

		// hardcoded links for now, replace this when you get real data!
		links = [{source: 0, target: 1},{source: 0, target: 3},{source: 1, target: 2}];
		
		return links;
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
                  return "<div id=title>" + d.key + "</div>" + 
												 "<div id=body> Market Cap:" + Math.abs(d.value) + 
												 "B <br> Relative DDM:" + getDDM(i) + 
												 "<br> DDM Threshold: 0.2 </div>";
        });
								
        parent.isZoom = 1;
    }
}

// reforms the treemap based on saved values
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

// explodes the treemap into the force layout
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

// sets the treemap attributes
function set_treemap() {

    this
        .style("left", function(d,i) {
						d.treemapx = d.x;
						return d.treemapx + "px";
				})
        .style("top", function(d,i) {
						d.treemapy = d.y;
						return d.treemapy + "px";
				})
        .style("width", function(d,i) {
						d.treemapw = d.dx;
						return d.treemapw - 1 + "px";
				})
        .style("height", function(d,i) {
						d.treemaph = d.dy;
						return d.treemaph - 1 + "px";
				});
		
		// the force layout overrides the treemap attributes,
		// just save and restore them as needed
		this.each(function(d,i) {save_args(d,i)});
}

// sets the force attributes
function set_force() {
		
    this.each(function(d) {
				d.forcew = FORCE_WIDTH;
				d.forceh = FORCE_HEIGHT;
				d.forcex = d.x - d.forcew/2
				d.forcey = d.y - d.forceh/2
			})
}

// save the arguments so the force layout can override them
function save_args(d,i) {
		args[i].x = d.treemapx;
		args[i].y = d.treemapy;
		args[i].w = d.treemapw;
		args[i].h = d.treemaph;
		args[i].key = d.key;
		args[i].value = d.value;
}

// restore the saved arguments
function set_args(d,i) {
		d.treemapx = args[i].x
		d.treemapy = args[i].y
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

