mapboxgl.accessToken = 'pk.eyJ1IjoiaHVza3lucCIsImEiOiJjbDJjMWFiZnAwNmJhM2pzYXNrdmczaDltIn0.tRO2X4f-IzwU8VmC_XIcpA';

const typeClasses = {
    'drought': '<i class="fa-solid fa-hand-holding-droplet fa-2xl"></i>',
    'dustHaze': '<i class="fa-solid fa-smog fa-2xl"></i>',
    'earthquakes': '<i class="fa-solid fa-house-crack fa-2xl"></i>',
    'floods': '<i class="fa-solid fa-house-flood-water fa-2xl"></i>',
    'landslides': '<i class="fa-solid fa-hill-rockslide fa-2xl"></i>',
    'manmade': '<i class="fa-solid fa-person-burst fa-2xl"></i>',
    'seaLakeIce': '<i class="fa-solid fa-icicles fa-2xl"></i>',
    'severeStorms': '<i class="fa-solid fa-cloud-showers-water fa-2xl storm"></i>',
    'snow': '<i class="fa-solid fa-snowflake fa-2xl"></i>',
    'tempExtremes': '<i class="fa-solid fa-temperature-arrow-up fa-2xl"></i>',
    'volcanoes': '<i class="fa-solid fa-volcano fa-2xl"></i>',
    'waterColor': '<i class="fa-solid fa-droplet-slash fa-2xl"></i>',
    'wildfires': '<i class="fa-solid fa-fire fa-2xl"></i>',
}

let imperial = true;

let markers = [], layers=[];
let eventBoxes = [];

const polyColor = (eventType) => {
    switch(eventType){
        case 'drought':
            return '#ffe4c4';
        case 'dustHaze':
            return '#aaa08d';
        case 'floods':
            return '#3a63d7';
        case 'wildfires':
            return 'orange';
        case 'landslides':
            return 'rgb(88,13,13)';
        case 'seaLakeIce':
            return 'lightsteelblue';
        case 'severeStorms':
            return 'lightblue';
        case 'snow':
            return '#ffffff';
        case 'tempExtremes':
            return 'lightsalmon';
        case 'waterColor':
            return 'turquoise';
        default:
            return '#1e1e1e';
    }
}

const eventPopup = (event) => {

    let categoryText = event.categories.map(c => c.title).join(', ').toUpperCase()

    return `
        <b>${categoryText}</b>
        <h2>${event.title}</h2>
        <i>${event.description === null ? 'No description provided.' : `${event.description}`}</i>
        <p>Active ${moment(event.geometry[0].date).format('l')} - ${event.closed === null? 'Now' : moment(event.closed).format('l')}.</p>
        
        <a href="javascript:;" onClick='showInfo(${JSON.stringify(event)})'>More Info</a>
        `
}

function addMarker(event){
    const marker = document.createElement('div');
    const eventType = event.categories[0].id;

    marker.className = eventType;
    marker.innerHTML = typeClasses[eventType];

    let coordinates = event.geometry[event.geometry.length - 1].coordinates;
    
    if(event.geometry[0].type === "Polygon"){ // Polygon, use GeoJSON data
        map.addSource(event.id, {
            type: 'geojson',
            data: {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: event.geometry[0].coordinates
                }
            }
        })
        .addLayer({
            id: event.id,
            type: 'fill',
            source: event.id,
            layout: {},
            paint: {
                'fill-color': polyColor(eventType),
                'fill-opacity': 0.6
            }

        })
        .addLayer({
            id: event.id + '-outline',
            type: 'line',
            source: event.id,
            layout: {},
            paint: {
                'line-color': polyColor(eventType),
                'line-width': 2
        }})
        .on('click', event.id, (e) => {
            new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(eventPopup(event))
                .addTo(map);
        })

        layers.push(event.id);
    } else { // Point, draw a marker
        let markerObj = new mapboxgl.Marker(marker)
        .setLngLat(coordinates)
        .setPopup(
            new mapboxgl.Popup({ offset: 25 })
            .setHTML(eventPopup(event))
        )
        .addTo(map)

        markers.push(markerObj);
    }
}

const map = new mapboxgl.Map({
    container: 'map',
    projection:'mercator',
    style:'mapbox://styles/huskynp/cl2c1wde9000j14v8nxvbf42j',
    center: [45, 0], // starting position [lng, lat]
    zoom: 3 // starting zoom
})

map.addControl(new mapboxgl.NavigationControl());

function showEvents(data) {

    data.events.forEach(event => {
        addMarker(event); // markers & layers
        eventBoxes.push(EventBox(event)); // sidebar boxes
    });

    $('#eventsList').append(eventBoxes);
    $('#eventResults').text(`${data.events.length} results:`);

}

const defaultData = {
    'category': ['drought', 'seaLakeIce'].join(','),
    'status': 'all',
    'limit': 100
}

console.log(defaultData);

$.getJSON('https://eonet.gsfc.nasa.gov/api/v3/events', defaultData, showEvents)

$('#filter').submit(function(e){
    e.preventDefault();

    $('#eventResults').text(`Loading...`);
    
    let data = {
        'category': '',
        'status': 'all',
        'limit': 100
    }
    
    let categories = $("input[name='category[]']:checked").map(function(i, d){ return $(d).val(); });
    data.category = categories.get().join(',');

    // remove all stuff
    for(let i = 0; i < markers.length; i++){
        markers[i].remove();
    }

    for(let i = 0; i < layers.length; i++){
        map.removeLayer(layers[i]);
        map.removeLayer(layers[i] + '-outline');
        map.removeSource(layers[i]);
    }

    $("#eventsList").empty();
    eventBoxes = [];

    data.limit = $('#limit').val();
    data.status = $('#status').val();

    markers = [];
    layers = [];

    console.log(data);
    $.getJSON('https://eonet.gsfc.nasa.gov/api/v3/events', data, showEvents);
    
    
})