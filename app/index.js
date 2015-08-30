// When document has loaded
$(document).ready(function(){
    // Init vars
    var live_charts = {};
    var historical_charts = {};
    AmCharts.theme = AmCharts.themes.light;
    var map_options = {
        center: {
            lat: 40.2085,
            lng: -3.713
        },
	    zoom: 6,
	};

     var socket = io.connect("https://52.28.164.86");


    // Init Google Maps
    var map = new google.maps.Map(document.getElementById("map"), map_options);

    // Set map styles
    map.set("styles", [{"featureType":"landscape","stylers":[{"hue":"#F1FF00"},{"saturation":-27.4},{"lightness":9.4},{"gamma":1}]},{"featureType":"road.highway","stylers":[{"hue":"#0099FF"},{"saturation":-20},{"lightness":36.4},{"gamma":1}]},{"featureType":"road.arterial","stylers":[{"hue":"#00FF4F"},{"saturation":0},{"lightness":0},{"gamma":1}]},{"featureType":"road.local","stylers":[{"hue":"#FFB300"},{"saturation":-38},{"lightness":11.2},{"gamma":1}]},{"featureType":"water","stylers":[{"hue":"#00B6FF"},{"saturation":4.2},{"lightness":-63.4},{"gamma":1}]},{"featureType":"poi","stylers":[{"hue":"#9FFF00"},{"saturation":0},{"lightness":0},{"gamma":1}]}])

    // Socket.io "historical_data" handler
    socket.on("historical_data", function(response){
        var data = response.data;
	console.log(data)
        for(board of data)
        {
            var name = board.name;

            // Add maker to Google Maps
            addMarker(board.location, name, map);

            $("#charts").append('<div id="' + name + '" class="row margins"></div>');
            $("#" + name)
                .append('<h2 class="col-xs-offset-1">' + "Board: " + name + '</h2>')
                .append("<hr>")
                .append('<div id="' + name + "historical" + '" class="col-md-12 height_560"></div>');

            // Generate historical chart
	    if(board.measurements.length > 0)
            {
            	historical_charts[name] = genHistoricalChart(name, board.measurements);
	    }
	    else
            {
		historical_charts[name] = genHistoricalChart(name, [{concentration: 0, date: new Date}])	
	    }
        }
    });

    // Socket.io "live_data" handler
    socket.on("live_data", function(response){
        console.log("live")
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
                .append('<div id="' + board.name + "live" + '" class="col-md-6 height_560"></div>');

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
    var chart = new AmCharts.AmSerialChart();
    
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
    chart.valueAxes = [{title: "Concentration (ppm)"}] 

    // Graph type
    graph.type = "smoothedLine";

    // Red color for values less than 400
    graph.negativeBase = 400;
    graph.negativeLineColor = "LimeGreen";

    // Bullet options
    graph.id = "g1"
    graph.bullet = "round";
    graph.bulletSize = 5;
    graph.hideBulletsCount = 50;

    // Ballon options
    graph.lineThickness = 2;
    graph.useLineColorForBulletBorder = true;
    graph.balloonText = "<div style='margin:5px; font-size:19px;'>[[concentration]] ppm</div>"
    var balloon = new AmCharts.AmBalloon()
    balloon.borderThickness = 1;
    balloon.shadowAlpha = 0;

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
    chart.valueAxes = [{title: "Concentration (ppm)"}]
 
    var graph = new AmCharts.AmGraph();
    graph.valueField = "concentration";

    var categoryAxis = chart.categoryAxis;

    chart.addGraph(graph)

    chart.write(name + "live")

    return chart;
}

/**
 * Adds a marker to Google Maps
 * @param  {Object}   position
 * @param  {Number}   radius
 * @param  {String}   color
 * @param  {Object}   map
 * @return {undefined}
 */
var addMarker = function(position, name, map)
{
	var marker = new google.maps.Marker({
		map: map,
		position: position,
                title: name,
	});
	
	var infowindow = new google.maps.InfoWindow({
		content: '<span><a href="#' + name + '">Board ' + name + '</a></span>'
	});	
	
	marker.addListener("click", function(){
		map.setZoom(19);
		map.panTo(marker.getPosition());
		infowindow.open(map, marker);
	});
	
	infowindow.addListener("closeclick", function(){
		map.setZoom(6);
		map.panTo({
            		lat: 40.2085,
            		lng: -3.713
        	})
	});
}

