//Callback function contrains all javascript code within the ready()
console.log("hello world!")
$(document).ready(function() {
    


//create basemap imported from leaflet
	var mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		mbUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoia2RuZWVseSIsImEiOiJjamhtZXhuZ2UzYXg0M2Rtd21kcXpxMHl5In0.xd6CKvI06pW5OlWM5omkaw';

	var grayscale   = L.tileLayer(mbUrl, {id: 'mapbox/light-v9', tileSize: 512, zoomOffset: -1, attribution: mbAttr}),
		streets  = L.tileLayer(mbUrl, {id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, attribution: mbAttr}),
		terrain  = L.tileLayer(mbUrl, {id: 'mapbox/terrain-v2', tileSize: 512, zoomOffset: -1, attribution: mbAttr});


	var map = L.map('map', {
		center: [39.8, -96],
		zoom: 5,
		layers: grayscale
	});

	var baseLayers = {
		"Grayscale": grayscale,
		"Streets": streets,
        "Terrain": terrain
	};
    

  //add additional attribution from data pulled for project  
    
   map.attributionControl.addAttribution('Mass Shootings DB &copy; <a href="https://www.theviolenceproject.org/">The Violence Project</a>');
    
   
    
    var cities;
    //Load the geojson using the getJSON function of mass shooting data. 
    $.getJSON("data/massShootingsKills.geojson")
        .done(function(data){
            //confirm that geoJSON  is loaded correctly
            console.log(data)
            //Create processData function to take the data variable holding geoJSON as a parameter, return derived information as key value pairs in Javascript object.
            var info = processData(data);
            console.log(info)
            createPropSymbols(info.timestamps, data);
            createLegend(info.min,info.max);
            createSliderUI(info.timestamps);
            
        })
    .fail(function(){alert("There has been a problem loading the data.")});
    //Call function and create key value pairs
    function processData(data){
        var timestamps = [];
        var min = Infinity;
        var max = -Infinity;
        //Utilize nested looping structure to determine values for the local variables.
        for (var feature in data.features){
            var properties = data.features[feature].properties;
            console.log(properties)
            for (var attribute in properties){
                if (attribute != 'ID' &&
                   attribute != 'City' &&
                   attribute != 'Lat' &&
                   attribute != 'Lon'){
                    if ($.inArray(attribute, timestamps) === -1) {                        
                        timestamps.push(attribute);
                    }
                                        
                    if (properties[attribute] < min) {
                        min = properties[attribute];
                    }
                    
                    if (properties [attribute] > max) {
                        max = properties[attribute];
                    }
                }
            }
        }
        return {
            timestamps : timestamps,
            min : min,
            max : max
        }
    
    }
    //Function to create proportional symbols
    function createPropSymbols(timestamps, data){
        var geojasonMarkerOptions = {
                    fillColor: "#708598",
                    color: "#537898",
                    weight: 1,
                    fillOpacity: 1
        };
        cities = L.geoJSON(data, {
            pointToLayer : function(feature, latlng) {
                return L.circleMarker(latlng, geojasonMarkerOptions)
                    .on({
                    
                        mouseover: function (e) {
                            this.openPopup();
                            this.setStyle({color: 'yellow'});
                        },
                        mouseout: function(e){
                            this.closePopup();
                            this.setStyle({color: '#537898'});
                        }
                });
            }
        }).addTo(map);
        
        updatePropSymbols(timestamps[0]);
    }
    
    function updatePropSymbols(timestamp) {
        
        cities.eachLayer(function(layer){
            var props = layer.feature.properties;
            var radius = calcPropRadius(props[timestamp]);
            var popupContent = "<b>" + String(props[timestamp]) +
                                " shooting victims<b><br>" +
                                "<i> killed in </i>" +
                                "<i>" + props.City +
                                "</i> in </i>" +
                                timestamp + "</i>"+
                                "</i></i>";
                layer.setRadius(radius);
                layer.bindPopup(popupContent, {offset: new L.Point(0, -radius) });
        });
    }
	function calcPropRadius(attributeValue) {
       
		var scaleFactor = 40;
		var area = attributeValue * scaleFactor;
		return Math.sqrt(area/Math.PI);
    }
    
    function createLegend(min, max) {
		 
		if (min < 10) {	
			min = 10; 
		}

	function roundNumber(inNumber) {

				return (Math.round(inNumber/10) * 10);  
		}

		var legend = L.control( { position: 'bottomright' } );
        
		legend.onAdd = function(map) {

		var legendContainer = L.DomUtil.create("div", "legend");  
		var symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
		var classes = [roundNumber(min), roundNumber((max-min)/2), roundNumber(max)]; 
		var legendCircle;  
		var lastRadius = 0;
		var currentRadius;
		var margin;
        L.DomEvent.disableClickPropagation(legendContainer);
        
    

		$(legendContainer).append("<h2 id='legendTitle'>Victims Killed</h2>");
		
		for (var i = 0; i <= classes.length-1; i++) {  

			legendCircle = L.DomUtil.create("div", "legendCircle");  
			
			currentRadius = calcPropRadius(classes[i]);
			
			margin = -currentRadius - lastRadius - 2;

			$(legendCircle).attr("style", "width: " + currentRadius*2 + 
				"px; height: " + currentRadius*2 + 
				"px; margin-left: " + margin + "px" );				
			$(legendCircle).append("<span class='legendValue'>"+classes[i]+"</span>");

			$(symbolsContainer).append(legendCircle);

			lastRadius = currentRadius;

		}

		$(legendContainer).append(symbolsContainer); 

		return legendContainer; 

		};

		legend.addTo(map);  

	} // end createLegend();
    
    var testText = L.control({ position: 'bottomleft'} );;

	testText.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'info');
		this.update();
		return this._div;
	};

	testText.update = function (props) {
		this._div.innerHTML = '<h4>Mass Shootings Victims by Year</h4>' +  (props ?
			'<b>'  + ' per / 100k people'
			: 'Drag the slider to change years');
	};

	testText.addTo(map);

    
    
    
    //create clider for prop symbols data
    
    function createSliderUI(timestamps) {
	
        var sliderControl = L.control({ position: 'bottomleft'} );

		sliderControl.onAdd = function(map) {

			var slider = L.DomUtil.create('input', 'range-slider');
	       
            L.DomEvent.disableClickPropagation(slider);



			$(slider)
				.attr({'type':'range', 
					'max': 2019,                      
					'min': timestamps[0], 
					'step': 1,
                      'value': String(timestamps[0])})
		  		.on('input change', function() {
		  		updatePropSymbols($(this).val().toString());
                    $(".temporal-legend").text(this.value);

		  	});
			return slider;
		}

		sliderControl.addTo(map)
        createTemporalLegend(timestamps[0]);
	}
	function createTemporalLegend(startTimestamp) {

		var temporalLegend = L.control({ position: 'bottomleft' }); 

		temporalLegend.onAdd = function(map) { 
			var output = L.DomUtil.create("output", "temporal-legend");
 			$(output).text(startTimestamp)
            L.DomEvent.disableClickPropagation(output);
			return output; 
		}

		temporalLegend.addTo(map); 
	}
    
    var info = L.control();

	info.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'info');
		this.update();
		return this._div;
	};

	info.update = function (props) {
		this._div.innerHTML = '<h4>FBI NICS Background Checks</h4>' +  (props ?
			'<b>' + props.name + '</b><br />' + props.backgroundChecks + ' NICS checks per / 100,000 people'
			: 'Hover over a state');
	};

	info.addTo(map);

    //set buckets and colors for the states visualization
	// get color depending on population NICS background check per 100k ppl
	function getColor(d) {
		return d > 20000 ? '#800026' :
				d > 10000  ? '#BD0026' :
				d > 8000  ? '#E31A1C' :
				d > 7000  ? '#FC4E2A' :
				d > 5000   ? '#FD8D3C' :
				d > 2000   ? '#FEB24C' :
				d > 800   ? '#FED976' :
							'#FFEDA0';
	}

	function style(feature) {
		return {
			weight: 2,
			opacity: 0.2,
			color: 'white',
			dashArray: '3',
			fillOpacity: 0.7,
			fillColor: getColor(feature.properties.backgroundChecks)
		};
	}

	//set states outline color
    function highlightFeature(e) {
		var layer = e.target;

		layer.setStyle({
			weight: 5,
			color: '#666',
			dashArray: '',
			fillOpacity: 0.2
		});

		if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
			layer.bringToFront();
		}

		info.update(layer.feature.properties);
	}

	var geojson;

	function resetHighlight(e) {
		geojson.resetStyle(e.target);
		info.update();
	}

	function zoomToFeature(e) {
		map.fitBounds(e.target.getBounds());
	}

	function onEachFeature(feature, layer) {
		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlight,
			click: zoomToFeature
		});
	}

	geojson = L.geoJson(statesData, {
		style: style,
		onEachFeature: onEachFeature
	}).addTo(map);
    
    
	var overlays = {
		"States": geojson
	};

    
 
    
    //create legend for states data
    var statesLegend = L.control({position: 'topright'});

	statesLegend.onAdd = function (map) {

		var statesLegendContainer = L.DomUtil.create('div', 'info statesLegend'),
            statesLegendTitle = L.DomUtil.create('div', 'statesLegendTitle'),
			grades = [0, 800, 2000, 5000, 7000, 8000, 10000, 20000],
			labels = [],
			from, to;
            L.DomEvent.disableClickPropagation(statesLegendContainer);
        
    

		$(statesLegendContainer).append("<h2 id='statesLegendTitle'>NICS Background Checks</h2>");
        
		for (var i = 0; i < grades.length; i++) {
			from = grades[i];
			to = grades[i + 1];

			labels.push(
				'<i style="background:' + getColor(from + 1) + '"></i> ' +
				from + (to ? '&ndash;' + to : '+'));
		}

		statesLegendContainer.innerHTML = labels.join('<br>');
		return statesLegendContainer;
	};

	statesLegend.addTo(map);
    
 	L.control.layers(baseLayers, overlays).addTo(map);


});
