document.addEventListener('DOMContentLoaded', function () {
    // Initialize the map
    var map = L.map('map').setView([37.7749, -122.4194], 5); // Center on the US with an appropriate zoom level

    // Add a tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Define URL for earthquake data
    var url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

    // Function to calculate marker size based on magnitude
    function getMarkerSize(magnitude) {
        return magnitude * 5; // Adjust this factor as needed
    }

    // Fetch the earthquake data
    d3.json(url).then(function (data) {
        var features = data.features;

        // Create a marker cluster group
        var markers = L.markerClusterGroup();

        // Define a color scale for depth using Viridis
        var depthColorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([0, 500]); // Adjust domain based on depth range

        // Process and add markers
        features.forEach(function (feature) {
            var coordinates = feature.geometry.coordinates;
            var latitude = coordinates[1];
            var longitude = coordinates[0];
            var depth = coordinates[2];
            var magnitude = feature.properties.mag;
            var place = feature.properties.place; // Additional information: location of the earthquake
            var time = new Date(feature.properties.time); // Additional information: time of the earthquake

            // Determine marker size
            var size = getMarkerSize(magnitude);

            // Determine marker color based on depth using Viridis
            var color = depthColorScale(depth);

            // Create a circle marker
            var marker = L.circleMarker([latitude, longitude], {
                radius: size, // Use the updated size
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });

            // Bind a popup with earthquake details
            marker.bindPopup(
                '<div class="popup-content">' +
                '<b>Location:</b> ' + place + '<br>' +
                '<b>Magnitude:</b> ' + magnitude + '<br>' +
                '<b>Depth:</b> ' + depth + ' km<br>' +
                '<b>Time:</b> ' + time.toUTCString() +
                '</div>'
            );

            markers.addLayer(marker);
        });

        // Add the marker cluster group to the map
        map.addLayer(markers);

        // Update marker sizes on zoom change
        map.on('zoomend', function() {
            var zoomLevel = map.getZoom();

            markers.eachLayer(function(layer) {
                if (layer instanceof L.CircleMarker) {
                    var newSize = getMarkerSize(layer.options.radius / 5); // Adjust size based on zoom level
                    layer.setRadius(newSize); // Apply new size
                }
            });
        });

        // Add a legend
        var legend = L.control({position: 'bottomright'});

        legend.onAdd = function () {
            var div = L.DomUtil.create('div', 'info legend');
            var depths = [0, 100, 200, 300, 400, 500]; // Define depth ranges for legend
            var labels = [];

            // Add color swatches and labels
            for (var i = 0; i < depths.length; i++) {
                var color = depthColorScale(depths[i]);
                labels.push(
                    '<i style="background:' + color + '"></i> ' +
                    (depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] : '+'))
                );
            }

            div.innerHTML = '<h4>Earthquake Depth</h4>' + labels.join('<br>');
            return div;
        };

        legend.addTo(map);
    }).catch(function (error) {
        console.error("Error fetching earthquake data:", error);
    });
});


