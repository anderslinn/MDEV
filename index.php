<!DOCTYPE HTML>
<html>
    <head>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
        <title>MDEV</title>
        <style type="text/css">
            @import url("index.css");
        </style>

        <script type="text/javascript" src="libs/jquery-1.9.1.js"></script>
        <script type="text/javascript" src="libs/d3.v3.js"></script>
        <script type="text/javascript" src="libs/d3.csv.extended.js"></script>
        <script type="text/javascript" src="loadData.js"></script>
    </head>

    <body style="background-color:#eeeeee;">
        <?php
        $filename = $_SERVER['DOCUMENT_ROOT'] . 'MDEV/data/sample1/ddm.csv';
        
        if (file_exists($filename)) {
            print"";
        } else {
            // execute R script from shell
            // this will save a plot at temp.png to the filesystem
            exec("Rscript code.r");

            // return image tag
            $nocache = rand();
            echo("<file src='ddm.csv?$nocache' />");
            echo("<file src='pod1.txt?$nocache' />");
        }
        ?>

        <div>
            <button id="ResetVisualization" class="longbutton">(Re)Load Data</button>
            <button id="UpdateVisualization" class="longbutton">Update Visualization</button>
            <button id="ContagionView" class="longbutton">Contagion View</button>
            <!--    Button disabled for future development
            <button id="SaveDataOnDisk" class="longbutton">Save Data on Disk</button>
            -->
        </div>

        <br />

        <div>
            <div id="col">
                <table border="0" cellpadding="0" cellspacing="0">
                    <thead>
                        <tr>
                            <th scope="col" class="size14head">Profile</th>
                            <th scope="col" class="size14head">Ticker</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <select name="Profiles" id="ProfileSelect" size="4" width="100"></select>
                            </td>
                            <td>
                                <select name="Tickers" id="TickerSelect" size="4" width="100"></select>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div id="col">
                <br />
                <input src="images/ZoomInButton.png" alt="Zoom In" type="image" id="ZoomInButton" class="zoomButton"/>
                <input src="images/ZoomOutButton.png" alt="Zoom Out" type="image" id="ZoomOutButton" class="zoomButton"/>
            </div>
            <div id="col">
                <div><input type="checkbox" name="doesAutoUpdate" id="doesAutoUpdate" checked><span class="size14text">Update Visualizations Automatically?</span></div>
                <div><span class="size14text" id="CurrentProfileLabel"><strong>Current Profile: Uninitialized!</strong></span></div>
                <div><span class="size14text" id="CurrentTickerLabel"><strong>Current Ticker: Uninitialized!</strong></span></div>
                <div><span class="size14text" id="TreeMapLabel"><strong>Treemap: Zoom Level Uninitialized!</strong></span></div>
            </div>
            <div id="col">
                <div><span class="size14text" id="Assumptions"><strong>Assumptions</strong></div>
                <div>
                    <span class="size14text">Recovery Rate:
                        <br>Distribution:
                        <br>DDM Threshold:
                    </span>
                </div>
            </div>
            <div id="col">
                <br />
                <input id="assumpRecoveryRate" type="text" disabled="" value="5%" maxlength="12" style="width: 80px;">
                <br />
                <input id="assumpDistribution" type="text" disabled="" value="Gaussian" maxlength="12" style="width: 80px;">
                <br />
                <input id="assumpDDMThreshold" type="text" disabled="" value="0.20" maxlength="12" style="width: 80px;">
            </div>
        </div>

        <br />

        <div>
            <div id="col">
                <iframe frameborder="0" width="800" height="800" longdesc="treemap.html" id="TreeMap" scrolling="no" src="treemap.html"></iframe>
                <iframe frameborder="0" width="280" height="800" longdesc="tickertable.html" id="TickerTable" scrolling="no" src="tickertable.html"></iframe>
                <iframe frameborder="0" width="280" height="800" longdesc="bulletchart.html" id="BulletChart" scrolling="no" src="bulletchart.html"></iframe>
            </div>
        </div>
        
        <script type="text/javascript">
				
            $(window).load(function() {
                $("#ProfileSelect").change(function() {
                    onProfileSelectChange();
                });

                $("#TickerSelect").change(function() {
                    onTickerSelectChange();
                });

                $("#ResetVisualization").click(function() {
                    location.reload(true);
                });

                $("#UpdateVisualization").click(function() {
                    $("#TickerTable")[0].contentWindow.updateVisualizations();
                });
								
                $("#ContagionView").click(function() {
                  $("#TreeMap")[0].contentWindow.toggleTreeMap();
                });
								
                /*  Button is disabled until future development
                $("#SaveDataOnDisk").click(function() {
                    saveDataOnDiskOnClick();
                });
                */

                $(".zoomButton").click(function() {
                    zoomOnClick(this.id);
                });
                initialize();   // The function that starts the whole thing
            });
        </script>
    </body>
</html>
