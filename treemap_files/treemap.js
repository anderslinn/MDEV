/*
 * Multivariate Density Estimator Visualization (MDEV)
 * Libraries used: jQuery v1.9.1, D3 v3.0.8
 * 
 * treemap.js: Handles rendering of treemap visualization
 */
 
var args = [
						{x: 0, y: 0, w: 0, h: 0},
						{x: 0, y: 0, w: 0, h: 0},
						{x: 0, y: 0, w: 0, h: 0},
						{x: 0, y: 0, w: 0, h: 0},
						{x: 0, y: 0, w: 0, h: 0},
						{x: 0, y: 0, w: 0, h: 0},
						{x: 0, y: 0, w: 0, h: 0}
						];
 
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
								.on("end", function() {

										d3.selectAll(".cell")
											.call(set_force)
								})				

var div = d3.select("#chart").append("div")
							.style("position", "relative")
							.style("width", w + "px")
							.style("height", h + "px")
					
							
function toggleTreeMap() {
  if (parent.isTreemap === 0) {

				d3.selectAll(".cell")
					.transition()
						.duration(1000)
							.call(restore_treemap)
							
          parent.isTreemap = 1;
  }
    else {
        
           d3.selectAll(".cell")
             .transition()
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
    temp = 0;
    x = 0;
    y = 0;

		d3.selectAll(".cell").remove()
				
		div.data(d3.entries(json)).selectAll("div")
				.data(treemap)
			.enter().append("div")
				.attr("class", "cell")	
				
		d3.selectAll(".cell").filter(function(d,i){return i == 0 || i == 1 ? 1 : 0}).attr("class","empty")		
				
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
				.style("background", function(d) {
						if (parent.treemapZoomLevel === 0) { return !d.children ? colorPickerLvl0(temp) : null;}
						else { return !d.children ? colorPickerLvl3(temp) : null;}
							return !d.children ? colorPickerLvl0(temp) : null;
		})
				.html(function(d) {
				if (parent.treemapZoomLevel === 0) {
					var tempString = d.children ? null :
								("<div id=title>" + d.key + "</div><div id=body> Market Cap:" + Math.abs(d.value) + "B <br> PoD Value:" + getPod(x) + "<br> PoD Threshold:" + getThreshold(y) + "</div>");
				} else {
				var tempString = d.children ? null :
                ("<div id=title>" + d.key + "</div><div id=body> Market Cap:" + Math.abs(d.value) + "B <br> Relative DDM:" + getDDM(x) + "<br> DDM Threshold: 0.2 </div>");
				}
				
				return tempString;
				
		});
		
		// here is the force layout

		var links = [
			{source: "Microsoft", target: "Amazon"},
			{source: "Microsoft", target: "HTC"},
			{source: "Samsung", target: "Apple"},
			{source: "Motorola", target: "Apple"},
			{source: "Nokia", target: "Apple"},
		];

		var nodes = {};

		// Compute the distinct nodes from the links.
		links.forEach(
				function(link)
				{
						link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
						link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
				});

		var nodes2 = {};
		var links2 = [];
		var dt = d3.values(parent.profileListJSON)[0].Sample1;
		
		nodes2["AIG"] = {name: "AIG", value: dt["AIG"]};
		nodes2["BAC"] = {name: "BAC", value: dt["BAC"]};
		nodes2["JPM"] = {name: "JPM", value: dt["JPM"]};
		nodes2["MS"] = {name: "MS", value: dt["MS"]};
		nodes2["GS"] = {name: "GS", value: dt["GS"]};
	
		force.nodes(d3.selectAll(".cell")[0])
				.links([])
				.on("tick", tick)
				.start();

		var link = div.selectAll(".link")
								.data(force.links())
								.enter().append("line")
								.attr("class", "link");		
				
		var node = div.selectAll(".cell")
								.data(force.nodes())
								
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
        temp++;
        return "#FC8D59";
    }
    else {
        temp++;
        return "#91BFDB";
    }
}

function colorPickerLvl3(t) {
    var tempEntity = $("#TickerSelect", window.parent.document).val();
    entDDM = parent.DDMData[t][tempEntity];
    if (entDDM <= 0.2) {
        temp++;
        return "#91BFDB";
    }
    else if (entDDM == 1) { // Not strict equality entDDM is a string
        temp++;
        return "grey";
    }
    else {
        temp++;
        return "#FC8D59";
    }
}

function getDDM(t) {
    x++;
    var tempEntity = $("#TickerSelect", window.parent.document).val();
    return parent.DDMData[t][tempEntity];
}

function getPod(t) {
    x++;
    return parent.visualizationData[t].holdings;
}

function getThreshold(t) {
    y++;
    return parent.visualizationData[t].goal;
}

function zoom() {
		temp = 0;
		x = 0;
		y = 0;
		
    if (parent.isZoom === 1)
    {
        div.selectAll(".cell")
                .transition()
									.duration(500)
								.style("background", function(d,i) {
									return !d.children ? colorPickerLvl0(temp) : null;
								})
								
				div.selectAll(".cell")
								.html(function(d) {
            var tempString = d.children ? null :
                    ("<div id=title>" + d.key + "</div><div id=body> Market Cap:" + Math.abs(d.value) + "B <br> PoD Value:" + getPod(x) + "<br> PoD Threshold:" + getThreshold(y) + "</div>");
            return tempString;
        });

        parent.isZoom = 0;
    } else if (parent.isZoom === 0) {

        div.selectAll(".cell")
                .transition()
                .duration(500)
                .style("background", function(d,i) {
									return !d.children ? colorPickerLvl3(temp) : null;
								})
								
				div.selectAll(".cell")
								.html(function(d) {
            var tempString = d.children ? null :
                    ("<div id=title>" + d.key + "</div><div id=body> Market Cap:" + Math.abs(d.value) + "B <br> Relative DDM:" + getDDM(x) + "<br> DDM Threshold: 0.2 </div>");
            return tempString;
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

function zero() {
    this
            .style("left", function(d) {
        return d.treemapx + "px";
    })
            .style("top", function(d) {
        return d.treemapy + "px";
    })
            .style("width", function(d) {
        return 0 + "px";
    })
            .style("height", function(d) {
        return 0 + "px";
    });
}

function set_treemap() {
		
    this
            .style("left", function(d,i) {
						d.treemapx = d.x;
						args[i].x = d.treemapx;
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
						d.treemapw = args[i].w
						d.forcew = 150;
        return d.treemapw - 1 + "px";
    })
            .style("height", function(d,i) {
						d.treemaph = args[i].h
						d.forceh = 80;
        return d.treemaph - 1 + "px";
    })
		.style("left", function(d,i) {
						d.treemapx = args[i].x
						d.forcex = d.x - d.forcew/2
        return d.treemapx + "px";
    })
            .style("top", function(d,i) {
						d.treemapy = args[i].y
						d.forcey = d.y - d.forceh/2
        return d.treemapy + "px";
    })
}

