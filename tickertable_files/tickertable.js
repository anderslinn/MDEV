/*
 * Multivariate Density Estimator Visualization (MDEV)
 * Libraries used: jQuery v1.9.1, D3 v3.0.8
 * 
 * tickertable.js: Handles rendering of ticker table
 */

// <related to the table or shared>
var i = 0;
var index = 0;
var yearIndex = 0;
var columnIndex = 0;
var numColumn = 3;
var cellName;

/*
 * Update table field on change and update visualizations
 */
function tableFieldOnChange(name) {
    var tempElement = document.getElementById(name.toString());
    changeColor(tempElement);

    if (isNaN(tempElement.value) || (parseInt(tempElement.value) < 0 || (parseInt(tempElement.value) > 1))) {
        alert("This value must be a number between 0 and 1.");
    } else {
        // update the data
        var fieldType = name.substr(0, name.indexOf("%%"));
        var year = name.substr(fieldType.length + 2);

        if (fieldType === "goal") {
            parent.setThreshold(parseInt(year), tempElement.value);
        }

        if (parent.document.getElementById("doesAutoUpdate").checked) {
            updateVisualizations();
        }
    }
}

/*
 * Update bullet chart and treemap visualizations
 */
function updateVisualizations()
{
    // update the bulletChart
    parent.gBulletChartPageCompleted = false;
    parent.document.getElementById('BulletChart').contentWindow.transition();

    // update the treeMap
    //parent.document.getElementById('TreeMap').contentWindow.location.reload();
		parent.document.getElementById('TreeMap').contentWindow.reRender();
}

function changeColor(tempElement)
{
    tempElement.style.backgroundColor = "#EE0000";
    tempElement.style.color = "#CCCCCC";

}

function jsonKeyValueToArray(k, v) {
    return [k, v];
}

function jsonToArray(jsonData) {
    var j = 0;
    var ret = new Array();
    var key;
    for (key in jsonData) {

        // takes only the first 3 columns of the table
        if (j < 3) {
            if (jsonData.hasOwnProperty(key)) {
                ret.push(jsonKeyValueToArray(key, jsonData[key]));
            }
        }
        j++;
    }
    return ret;
}

var headerStr = new Array("Ticker", "Threshold", "PoD Value");

// </related to the table or shared>

function reRender() {
    i = 0;
    yearIndex = 0;
    columnIndex = 0;
    index = 0;

    readDataAndRender(parent.visualizationData);
    parent.gTickerTablePageCompleted = true;
}

function readDataAndRender(data) {
    d3.select("tbody").selectAll("tr").remove();

    // Header
    var th = d3.select("thead").selectAll("th")
            .data(headerStr)
            .enter().append("th")
            .html(function(d) {
                return "<span class=\"size14text\" style=\"width: 100px;\"><b>" + d + "</b></span>";
            });

    // Rows
    var tr = d3.select("tbody").selectAll("tr")
            .data(data)
            .enter().append("tr");

    // Cells
    var td = tr.selectAll("td")
            .data(function(d) {
                return jsonToArray(d);
            })
            .enter().append("td")
            .html(function(d) {
                var fieldValue = d[1]; // MDEV: MODIFY THIS TO THE RIGHT COLUMN!

                if (columnIndex === 0) {
                    cellName = "year%%" + (yearIndex + parseInt(parent.gStartYear));
                }
                else if (columnIndex === 1) {
                    /*
                    cellName = "goal%%" + (yearIndex + parseInt(parent.gStartYear));
                    if ((yearIndex + parseInt(parent.gStartYear)) > parent.gEndYear) {
                    fieldValue = "N/A";
                     */
                    //MDEV
                    cellName = "goal%%" + index;
                    index++;
                }
                else if (columnIndex === 2) {
                    cellName = "holdings%%" + (yearIndex + parseInt(parent.gStartYear));
                    if ((yearIndex + parseInt(parent.gStartYear)) > parent.gEndYear) {
                        fieldValue = "N/A";
                    }
                    yearIndex++;
                }

                columnIndex = (columnIndex + 1) % numColumn;

                return ("<input type=\"text\" style=\"width: 80px;\" maxlength=\"12\" id=\"" + cellName + "\" value=\"" + fieldValue + "\"" + " onChange=\"tableFieldOnChange(\'" + cellName + "\')\" " +
                (((cellName.indexOf("year") !== -1) || fieldValue === "N/A") ? "disabled=\"\"" : "") +
                (((cellName.indexOf("holdings") !== -1) || fieldValue === "N/A") ? "disabled=\"\"" : "") +
                " />");
            });

}
