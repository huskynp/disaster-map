
// hide info on start
$('#modal').css('visibility','hidden');

function hideInfo(){
    $('#modal').css('visibility','hidden');
}

function showInfo(event){
    $('#modal').css('visibility','visible');
    $('#info').html(MoreInfo(event));
}

const getMagText = (mag, unit) => {
    switch(unit){
        case 'kts':
            if(imperial){ return `A storm with ${Math.round(mag*1.15077945)} MPH winds (at the end).`; }
            else{ return `${mag} knot winds`; }
        case 'Mw':
            return `A ${mag} Scale earthquake.`;
        case 'NM^2':
            return `An iceberg with an area of ${mag} square nautical miles.`;
    }
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


const MoreInfo = (event) => {
    console.log(event)
    let date1 = moment(event.geometry[0].date);

    return `
    <h4 style="margin:0;">${getCategoryName(event).toUpperCase()}</h4>
    <div id="title">
        <h1>${event.title}</h1>
        <button id="closeButton" onclick="hideInfo()">X</button> 
    </div>
    <div id="main">
        <i>${event.description === null ? 'No description provided.' : `${event.description}`}</i>
        ${magUnit===null ? '' : `<p>${getMagText(magnitude, magUnit)}</p>`}
        
        ${(event.sources && event.sources.length > 0 ? `<a style="text-align:center; margin-top:auto;" target="_blank" rel="noopener noreferrer" href="${event.sources[0].url}">View Source</a>` : '')}
        <blockquote id="eventDate">${(event.closed === null ? `Currently Active: Started ${date1.format('l')}` : `Active from ${date1.format('l')} to ${moment(event.closed).format('l')} (${moment.duration(date1.diff(moment(event.closed))).locale("en").humanize()})`)}</blockquote>
    </div>
    `
}