/*
 * Multivariate Density Estimator Visualization (MDEV)
 * Libraries used: jQuery v1.9.1, D3 v3.0.8
 * 
 * treemap.js: Handles rendering of treemap visualization
 */
 
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
        .sticky(true);
				
var treemap2 = d3.layout.treemap()
        .size([h,w])
        .children(function(d) {
    return isNaN(d.value) ? d3.entries(d.value) : null;
})
        .value(function(d) {
    return Math.abs(d.value);
})
        .sticky(true);
				
//var force = d3.layout.

var tree = d3.layout.tree()
				.size([w, h])
        .children(function(d) {
    //document.writeln("d.value " + d.value + " - ");
    return isNaN(d.value) ? d3.entries(d.value) : null;
})
        .value(function(d) {
    return Math.abs(d.value);
})

var div = d3.select("#chart").append("div")
							.style("position", "relative")
							.style("width", w + "px")
							.style("height", h + "px");

function toggleTreeMap() {
  if (parent.isTreemap === 0) {
       // d3.selectAll("div")
         // .transition()
           // .style("background","red")

           d3.selectAll(".cell")
             .transition()
							.duration(1000)
              .call(restore_treemap)

					// div.selectAll(".cell")
							// .data(treemap2.nodes)
							// .transition()
								// .call(exploded_cell)
							
          parent.isTreemap = 1;
  }
    else {
       // d3.selectAll("div")
         // .transition()
           // .style("background","green")
        
           d3.selectAll(".cell")
             .transition()
							.duration(1000)
               .call(exploded_cell)
							 
					// d3.selectAll(".cell")
							// .data(treemap)
							// .transition()
									 

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
		
		console.log(parent.treemapZoomLevel)
		console.log(d3.entries(json))

		d3.selectAll(".cell").remove()
		
    if (parent.treemapZoomLevel === 0) {

        div.data(d3.entries(json)).selectAll("div")
						.data(treemap.nodes)
          .enter().append("div")
            .attr("class", "cell")
						
						
				div.selectAll(".cell")	
						.on("mouseover", function(d) {
            d3.select(this).classed("titlehover", true);
        })
            .on("mouseout", function(d) {
            d3.select(this).classed("titlehover", false);
        })
            .style("background", function(d) {
                  return !d.children ? colorPickerLvl0(temp) : null;
        })			

				div.selectAll(".cell")
						.call(set_treemap)
				
				div.selectAll(".cell")
						.html(function(d) {
            var tempString = d.children ? null :
                    ("<div id=title>" + d.key + "</div><div id=body> Market Cap:" + Math.abs(d.value) + "B <br> PoD Value:" + getPod(x) + "<br> PoD Threshold:" + getThreshold(y) + "</div>");
            return tempString;
        });
            
    }
    else {
        div.data(d3.entries(json))
								.selectAll("div")
                .data(treemap)
                .enter().append("div")
                .attr("class", "cell")
                .on("mouseover", function(d) {
            d3.select(this).classed("titlehover", true);
        })
                .on("mouseout", function(d) {
            d3.select(this).classed("titlehover", false);
        })
                .style("background", function(d) {
                  return !d.children ? colorPickerLvl3(temp) : null;
        })
                .call(set_treemap)
                .html(function(d) {
            var tempString = d.children ? null :
                    ("<div id=title>" + d.key + "</div><div id=body> Market Cap:" + Math.abs(d.value) + "B <br> Relative DDM:" + getDDM(x) + "<br> DDM Threshold: 0.2 </div>");
            return tempString;
        });
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
            .style("left", function(d) {
						d.treemapx = d.x;
        return d.treemapx + "px";
    })
            .style("top", function(d) {
						d.treemapy = d.y;
        return d.treemapy + "px";
    })
            .style("width", function(d) {
						d.treemapw = d.dx;
        return d.treemapw - 1 + "px";
    })
            .style("height", function(d) {
						d.treemaph = d.dy;
        return d.treemaph - 1 + "px";
    });
}

function exploded_cell() {
    this
            .style("left", function(d) {
						d.x = 2*d.x;
        return d.x + "px";
    })
            .style("top", function(d) {
						d.y = 2*d.y
        return -400 + d.y + "px";
    })
            .style("width", function(d) {
						d.dx = d.dx/3;
        return d.dx - 1 + "px";
    })
            .style("height", function(d) {
						d.dy = d.dy/3
        return d.dy - 1 + "px";
    });
}
//reRender();
