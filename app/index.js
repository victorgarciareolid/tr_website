// When document has loaded
$(document).ready(function(){
    // Init vars
    var live_charts = {};
    var historical_charts = {};
    var map_options = {
        center: {
            lat: 41.358889,
            lng: 2.099167
        },
	    zoom: 14
	};

    // Connecting to Socket.io to ":80"
     var socket = io.connect();


    // Init Google Maps
	var map = new google.maps.Map(document.getElementById("map"), map_options);

    // Socket.io "historical_data" handler
    socket.on("historical_data", function(response){
        var data = response.data;

        for(board of data)
        {
            var name = board.name;

            // Add circle to Google Maps
            addCircle(board.location, 100000, "#925", map);

            $("#charts").append('<div id="' + name + '" class="row margins"></div>');
            $("#" + name)
                .append('<h2 class="col-xs-offset-1">' + "Board: " + name + '</h2>')
                .append("<hr>")
                .append('<div id="' + name + "historical" + '" class="col-md-12 height_460"></div>');

            // Generate historical chart
            historical_charts[name] = genHistoricalChart(name, board.measurements);
        }
    });

    // Socket.io "live_data" handler
    socket.on("live_data", function(response){
        var board = response.data;

        var point = {
            "concentration": board.concentration,
            "date": ""
        };

        // Check if a historical or live chart has been loaded
        if(live_charts[board.name] === undefined && historical_charts[board.name] !== undefined)
        {
            // Historical chart goes full width to middle with
            $("#" + board.name + "historical")
                .removeClass("col-md-12")
                .addClass("col-md-6");

            // Live chart div
            $("#" + board.name)
                .append('<div id="' + board.name + "live" + '" class="col-md-6 height_460"></div>');

            // Generate live data chart
            live_charts[board.name]= genLiveChart(board.name, point)

        }
        else if(live_charts[board.name] !== undefined)
        {
            // Add live data to the chart
            live_charts[board.name].dataProvider.push(point)

            // Refresh chart
            live_charts[board.name].validateData();
        }
  });

});

/**
 * Generates new historical chart
 * @param  {String} name
 * @param  {Array}  data
 * @return {Object} chart
 */
var genHistoricalChart = function(name, data)
{
    // Base class to make a Chart
    var chart = new AmCharts.AmSerialChart(AmCharts.themes.light);

    // Data source
    chart.dataProvider = data;

    // X Axis
    chart.categoryField = "date";

    // Chart type
    chart.type = "serial"

    // Set graph type
    var graph = new AmCharts.AmGraph();

    // Y Axis
    graph.valueField = "concentration";

    // Graph type
    graph.type = "smoothedLine"

    // Bullet options
    graph.id = "g1"
    graph.bullet = "round";
    graph.bulletSize = 5;
    graph.hideBulletsCount = 50;

    // Ballon options
    graph.lineThickness = 2;
    graph.useLineColorForBulletBorder = true;
    graph.balloonText = "<div style='margin:5px; font-size:19px;'><span style='font-size:13px;'>[[category]]</span><br>[[concentration]]</div>"

    // Create a ScrollBar
    var scrollBar = new AmCharts.ChartScrollbar();
    scrollBar.graph = "g1"
    scrollBar.oppositeAxis = false;
    scrollBar.offset = 30
    scrollBar.autoGridCount = true;
    scrollBar.scrollbarHeight = 80;

    // X Axis options
    var categoryAxis = chart.categoryAxis;
    categoryAxis.parseDates = true;

    // Min date period: minutes
    categoryAxis.minPeriod = "mm";

    // Cursor Options
    var chartCursor = new AmCharts.ChartCursor();
    chartCursor.pan = true;
    chartCursor.valueLineEnabled = true;
    chartCursor.valueLineBalloonEnabled = true;
    chartCursor.cursorAlpha = 0;
    chartCursor.valueLineAlpha = 0.2;

    // Ballon options
    var balloon = new AmCharts.AmBalloon()
    balloon.borderThickness = 1;
    balloon.shadowAlpha = 0;

    // Add configuration to chart
    chart.addChartCursor(chartCursor);
    chart.addChartScrollbar(scrollBar);
    chart.addGraph(graph);

    // Draw Chart
    chart.write(name + "historical");

    return chart;
}

/**
 * Generates new live chart
 * @param  {String} name
 * @param  {Array}  data
 * @return {Object} chart
 */
var genLiveChart = function(name, data)
{
    var chart = new AmCharts.AmSerialChart(AmCharts.themes.light);
    chart.dataProvider = [data];
    chart.categoryField = "date";
    chart.type = "serial"

    var graph = new AmCharts.AmGraph();
    graph.valueField = "concentration";

    var categoryAxis = chart.categoryAxis;

    chart.addGraph(graph)

    chart.write(name + "live")

    return chart;
}

/**
 * Adds a circle to Google Maps
 * @param  {Object}   center
 * @param  {Number}   radius
 * @param  {String}   color
 * @param  {Object}   map
 * @return {undefined}
 */
var addCircle = function(center, radius, color, map)
{
	var circle = new google.maps.Circle({
		strokeWeight: 0,
		fillColor: color,
		fillOpacity: 0.35,
		map: map,
		center: center,
		radius: radius
	});
}

