/*
 * Multivariate Density Estimator Visualization (MDEV)
 * Libraries used: jQuery v1.9.1, D3 v3.0.8
 * 
 * loadData.js: Handles initilization and loading of data.
 */

// Directories and files to read from
var DATA_DIR = "data";
var PROFILE_DIR = "Sample1";

var DDM_DATA_FILENAME = "ddm";
var PRICE_DATA_FILENAME = "prices";
var PROFILE_LIST_FILENAME = "clientlist.json";
var VISUALIZATION_DATA_FILENAME = "mdeSample";

var DATA_FILE_EXTENSION = "csv";


// Client Data
var DDMData;
var profileListJSON;
var priceData;
var tickerData;
var visualizationData;

var gTickerTablePageCompleted = false;
var gBulletChartPageCompleted = false;
var gTreemapPageCompleted = false;

var TREEMAP_ZOOM_LEVEL_MAX = 1;
var treemapZoomLevel = 0;
var isTreemap = 1;
var isZoom = 0;

/*
 * Read data, populate information on site, render results
 */
function initialize()
{
    DDMData = readProfileDataHelper(PROFILE_DIR, DDM_DATA_FILENAME);
    priceData = readProfileDataHelper("", PRICE_DATA_FILENAME);

    d3.json(DATA_DIR + "/" + PROFILE_LIST_FILENAME,
            function(profiles)  // Callback function after data is parsed
            {
                profileListJSON = profiles;
                initializeProfileList();
                initializeTickerList();
                onTickerSelectChange();
            }
    );
}

/*
 * Get data for visualizations and render
 */
function renderVisualizations()
{
    visualizationData = readProfileDataHelper(PROFILE_DIR, VISUALIZATION_DATA_FILENAME);

    parent.document.getElementById("TickerTable").contentWindow.reRender();
    parent.document.getElementById("BulletChart").contentWindow.reRender();
		parent.document.getElementById("TreeMap").contentWindow.reRender();
}

/*
 * Get tickers from new profile, update labels, and update ticker data
 */
function onProfileSelectChange()
{
    initializeTickerList();
    onTickerSelectChange();
}

/*
 * Get data from selected ticker, update labels and render results
 */
function onTickerSelectChange()
{
    tickerData = readProfileDataHelper($("#ProfileSelect").val(), $("#TickerSelect").val());
    parent.document.getElementById('BulletChart').contentWindow.location.reload();				// BulletChart refreshed to update visualizations. Calling reRender() does not update it.
    updateLabels();
    renderVisualizations();
}

/* 
 * Update labels on page with selected profile and ticker
 */
function updateLabels()
{
    var zoomLevelStr;

    if (treemapZoomLevel === 0) {
        zoomLevelStr = "PoD Overview of All Tickers";
    } else if (treemapZoomLevel === 1) {
        zoomLevelStr = "One Ticker DDM";
    }

    $("#CurrentProfileLabel").html("<span class=\"size14text\" id=\"CurrentProfileLabel\">Current Profile: <strong>" + $("#ProfileSelect").val() + "</strong></span>");
    $("#CurrentTickerLabel").html("<span class=\"size14text\" id=\"CurrentTickerLabel\">Current Ticker: <strong>" + $("#TickerSelect").val() + "</strong></span>");
    $("#TreeMapLabel").html("<span class=\"size14text\" id=\"TreeMapLabel\">Treemap: Zoom Level: <strong>" + zoomLevelStr + "</strong></span>");
}


/* DROP DOWN LIST FUNCTIONS */

/* 
 * Add profiles to dropdown list
 * First ticker is selected by default
 */
function initializeProfileList()
{
    var profileStrings = new Array();

    // Obtain profiles to populate with
    for (obj in profileListJSON) {
        // ignore root node
        for (profile in profileListJSON[obj]) {
            profileStrings.push(profile);
        }
    }

    populateList(profileStrings, "#ProfileSelect");
}

/* 
 * Parse list of tickers and add them to list
 * First ticker is selected by default
 */
function initializeTickerList()
{
    var profile = $("#ProfileSelect").val();
    var tickerStrings = new Array();

    // Clear list of tickers and obtain new list to populate with
    $("#TickerSelect").empty();
    for (obj in profileListJSON) {
        // ignore root node
        for (profileName in profileListJSON[obj]) {
            if (profileName === profile) {
                for (ticker in profileListJSON[obj][profile]) {
                    tickerStrings.push(ticker);
                }
            }
        }
    }

    populateList(tickerStrings, "#TickerSelect");
}

/*
 * Populate id's drop-down list with given strings
 */
function populateList(strings, id)
{
    // Load each string, ensure first one is selected
    $(id).append(new Option(strings[0], strings[0], true, true));   // Option document object takes in: displayed text, selection value, if selected by default, if selected

    for (var i = 1; i < strings.length; i++)
        $(id).append(new Option(strings[i], strings[i], false, false));
}

/* END OF DROP DOWN LIST FUNCTIONS */


/*
 * Update labels and render new treemap for new zoom level
 */
function zoomOnClick(btnID)
{
    var zoomLevelChanged = false;
    
    if (btnID === "ZoomInButton" && treemapZoomLevel < TREEMAP_ZOOM_LEVEL_MAX)    // Disable the zoomInButton if zoomLevel is at max
    {
        treemapZoomLevel++;
        zoomLevelChanged = true;
    }
    else if (btnID === "ZoomOutButton" && treemapZoomLevel > 0)   // Disable the zoomOutButton if zoomLevel is at min
    {
        treemapZoomLevel--;
        zoomLevelChanged = true;
    }
    
    if (zoomLevelChanged)
    {
        // Update treemap label
        updateLabels();

        // Reload the whole treemap with appropriate level of data
        // Rerender treemap, this should be its own function because it depends on the level of zoom
        //$("#TreeMap")[0].contentWindow.location.reload();
				$("#TreeMap")[0].contentWindow.zoom();
    }
}

/*
 * Read profile data depending on profile directory and file.
 */
function readProfileDataHelper(profileDirName, dataFileName) {
    var filePathStr;

    if (profileDirName === "")
        filePathStr = "data/" + dataFileName + "." + DATA_FILE_EXTENSION;
    else
        filePathStr = "data/" + profileDirName + "/" + dataFileName + "." + DATA_FILE_EXTENSION;

    return eval(csv2json(requestHTTP(filePathStr)));
}

/*
 * Set new threshold for a ticker
 */
function setThreshold(i, value) {
    visualizationData[i]["goal"] = value;
}

/*
 * Retrieve data from server
 */
function requestHTTP (path) {
    var csvData;
    
    $.ajax({
        type: "GET",
        url: path,
        async: false,	// Ensure data is loaded synchronous
        success: function(response) {
            csvData = response;		// Save loaded CSV data
        }
    });
    
    return csvData;
}

/*
 * Possible future feature.
 */
/*
function saveDataOnDiskOnClick () {
	var now = new Date();
	var saveDir = "\"data/saves/" + now.getFullYear() + "-" + now.getMonth() + "-" + now.getDate() + "/\"";
	//alert ("File list being saved to " + saveDir + "\n\nError: Feature currently disabled due to security issues with browser");

	/*var destinationFile = saveDir + "/test.json";
	
	var file = fopen(destinationFile, 3);
	fwrite (file, JSON.stringify(gClientList));
	
	document.getElementById("epic4thWallBreaking").innerHTML = 
	"<applet code=\"writeFileHelperApplet.class\" width=\"350\" height=\"350\"></applet>";
	
	document.getElementById("accountDataHiddenText").innerHTML = JSON.stringify(gAccountData);
}
*/
