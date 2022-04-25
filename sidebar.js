
// hide info on start
$('#modal').css('visibility','hidden');

function hideInfo(){
    $('#modal').css('visibility','hidden');
}

function showInfo(event){
    $('#modal').css('visibility','visible');
    $('#info').html(MoreInfo(event));
}

const getMagText = (geometry) => {
    let magText = '';

    let mag = geometry.magnitudeValue, magUnit = geometry.magnitudeUnit, date = geometry.date;

    switch(magUnit){
        case 'kts':
            if(imperial){ magText = `${Math.round(mag*1.15077945)} MPH winds.`; }
            else{ magText = `${mag} knot winds`; }
            break;
        case 'Mw':
            magText = `${mag}M`;
            break;
        case 'NM^2':
            magText = `${mag} square nautical miles.`;
            break;
        default: // null
            return ''
    }

    return `<li>${moment(date).format('LLL')} - ${magText}</li>`;
}

const getCategoryName = (e) => { // change the name for some
    switch(e.categories[0].id){
        case 'dustHaze':
            return 'Dust, Haze and Pollution';
        case 'volcanoes':
            return 'Volcanic Eruptions';
        case 'waterColor':
            return 'Water Pollution';
        default:
            return e.categories[0].title;

    }
}

const getWikiImage = (name, category) => {
    let href = '';
    $.getJSON(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${name}&format=json&srprop=""&formatversion=2&srlimit=1&srinfo=suggestion&origin=*`, function(data){
        try{
            console.log(data);
            let pageID = data.query.search[0].pageid;
            $("#eventIMGProgress").attr('value',1);

            $.getJSON(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&list=&pageids=${pageID}&piprop=thumbnail&pithumbsize=400&origin=*`, function(data){
                console.log(data);
                href = data.query.pages[pageID.toString()].thumbnail;
                if(href===undefined){
                    $("#eventIMG").html(`<span class="${category}">${typeClasses[category]}</span>`);
                }else{
                    $('#eventIMG').html(`<img src="${href.source}" alt="${name}">`);
                };
            });
        } catch {
            return '';
        }
    })
}

const MoreInfo = (event) => {

    let date1 = moment(event.geometry[0].date);
    
    let mags = event.geometry.map(g => getMagText(g)).join('');
    if(mags===''){ getWikiImage(event.title, event.categories[0].id);}

    return `
    <h4 style="margin:0;">${getCategoryName(event).toUpperCase()}</h4>
    <div id="title">
        <h1>${event.title}</h1>
        <button id="closeButton" onclick="hideInfo()">X</button> 
    </div>
    <div id="main">
        <i>${event.description === null ? 'No description provided.' : `${event.description}`}</i>
        ${(mags === '' ? `<div id="eventIMG"><progress id="eventIMGProgress" value="0" max="2"></progress></div>` : `<p>Event Tracker:</p>
        <ul id="eventTracker" class="list">${mags}</ul>`)}
        
        ${(event.sources && event.sources.length > 0 ? `<a style="text-align:center; margin-top:auto;" target="_blank" rel="noopener noreferrer" href="${event.sources[0].url}">View Source</a>` : '')}
        <blockquote id="eventDate">${(event.closed === null ? `Currently Active: Started ${date1.format('l')}` : `Active from ${date1.format('l')} to ${moment(event.closed).format('l')} (${moment.duration(date1.diff(moment(event.closed))).locale("en").humanize()})`)}</blockquote>
    </div>
    `
}

function clickOn(geometry, category, last) {

    // fly to the clicked feature
    map.flyTo({
        center: last,
        zoom: 8,
        essential: true
    });

    // remove path layer if it exists
    if (map.getLayer("path")) {
        map.removeLayer("path");
        map.removeSource("path");
    }

    if(geometry===null){return;}

    // add a new path source + layer
    map.addSource("path", {
        "type": "geojson",
        "data": {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "LineString",
                "coordinates": geometry
            }
        }
    });

    map.addLayer({
        "id": "path",
        "type": "line",
        "source": "path",
        "layout": {
            "line-join": "round",
            "line-cap": "round"
        },
        "paint": {
            "line-color": $('.'+category).css("color"),
            "line-width": 3
        }
    });
}

const EventBox = (event) => {   

    let category = event.categories[0].id;

    
    let coords = event.geometry.map(g => g.coordinates);

    setTimeout(()=>{
        $('#'+event.id).click(() => {  
        if(event.geometry[0].type==="Point"){
            clickOn(coords, category, event.geometry[event.geometry.length-1].coordinates);
        }else{
            var poly = turf.polygon(event.geometry[0].coordinates);
            var center = turf.centroid(poly);
            clickOn(null, category, center.geometry.coordinates);
        }
    });}, 100)
    
    return `
    <div class="eventBox" id="${event.id}">
        <span class="${category}">${typeClasses[category]}</span>
        <div>
            <h3>${event.title}</h3>
            <i class="boxDescription">${(event.description === null ? 'No description.' : event.description)}</i>
        </div>
    </div>
    `
}

// more options toggle
$('#moreFilters').hide();
$('#filter>#expand').on('click', () => {
    $('#moreFilters').slideToggle(500, function(){
    $("#filter>#expand").html(function(){
            console.log($('#moreFilters').is(':visible'))
            return $('#moreFilters').is(':visible') ? '<i class="fa-solid fa-angles-up fa-sm"></i> less' : '<i class="fa-solid fa-angles-down fa-sm"></i> more'
        })
    });
});

const hasTitle = (e) => {
    let title = e.substring(
        e.lastIndexOf('<h3>')+4,e.lastIndexOf('</h3>'))
        .toLowerCase();
    return title.includes(
            $("#eventSearch").val().toLowerCase()
        );
}

$("#eventSearch").change(function(){
    $("#eventsList").empty();
    eventBoxes.forEach(e => {
        if(hasTitle(e)){
            $("#eventsList").append(e);
        }
    })
    
    // update results text
    $('#eventResults').text(`${$('#eventsList').children().length} results:`);
});