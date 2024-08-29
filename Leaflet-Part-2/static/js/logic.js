document.addEventListener('DOMContentLoaded', function () {
    // Initialize the map
    var map = L.map('map').setView([37.7749, -122.4194], 5); // Center on the US with an appropriate zoom level

    // Define base maps
    var baseMaps = {
        "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        "Stamen Toner": L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://maps.stamen.com">Stamen Design</a>'
        }),
        "Stamen Terrain": L.tileLayer('http://tile.stamen.com/terrain/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://maps.stamen.com">Stamen Design</a>'
        })
    };

    // Add default base map
    baseMaps["OpenStreetMap"].addTo(map);

    // Define URLs for earthquake and tectonic plates data
    var earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
    var tectonicPlatesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

    // Create overlay layers
    var earthquakeMarkers = L.markerClusterGroup();
    var tectonicPlatesLayer = L.geoJson(null, {
        style: function (feature) {
            return {
                color: "#ff7800",
                weight: 2
            };
        },
        onEachFeature: function (feature, layer) {
            layer.bindPopup('<b>Tectonic Plate:</b> ' + (feature.properties ? feature.properties.name : 'Unknown'));
        }
    });

    // Fetch earthquake data
    d3.json(earthquakeUrl).then(function (data) {
        var features = data.features;
        var depths = features.map(function (feature) {
            return feature.geometry.coordinates[2];
        });

        // Define a color scale for depth using Viridis
        var depthColorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([0, 500]); // Adjust domain based on depth range

        features.forEach(function (feature) {
            var coordinates = feature.geometry.coordinates;
            var latitude = coordinates[1];
            var longitude = coordinates[0];
            var depth = coordinates[2];
            var magnitude = feature.properties.mag;
            var place = feature.properties.place;
            var time = new Date(feature.properties.time);

            var size = magnitude * 5; // Adjust size based on magnitude
            var color = depthColorScale(depth);

            var marker = L.circleMarker([latitude, longitude], {
                radius: size,
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });

            marker.bindPopup(
                '<div class="popup-content">' +
                '<b>Location:</b> ' + place + '<br>' +
                '<b>Magnitude:</b> ' + magnitude + '<br>' +
                '<b>Depth:</b> ' + depth + ' km<br>' +
                '<b>Time:</b> ' + time.toUTCString() +
                '</div>'
            );

            earthquakeMarkers.addLayer(marker);
        });

        // Add the earthquake markers to the overlay layer
        var overlays = {
            "Earthquakes": earthquakeMarkers,
            "Tectonic Plates": tectonicPlatesLayer
        };

        // Add layer control to map
        L.control.layers(baseMaps, overlays).addTo(map);

        // Add the earthquake layer to the map initially
        map.addLayer(earthquakeMarkers);

        // Add a legend
        var legend = L.control({position: 'bottomright'});

        legend.onAdd = function () {
            var div = L.DomUtil.create('div', 'info legend');
            var depths = [0, 100, 200, 300, 400, 500];
            var labels = [];

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

    // Fetch tectonic plates data
    d3.json(tectonicPlatesUrl).then(function (data) {
        tectonicPlatesLayer.addData(data);
    }).catch(function (error) {
        console.error("Error fetching tectonic plates data:", error);
    });
});
