var dataProd;
var dataReserve;

var symblNameMap = {};
var hhiProductionMulti = {};
var hhiReserveMulti = {};

var global_analysis_year = "2023";
var global_analysis_element = null;
var global_analysis_type = "prod";

const RARE_EARTH_ELE = ["Sc", "Y", "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu"];
const PLATINUM_GROUP_METALS = ["Pt", "Pd", "Os", "Rh", "Ru", "Ir"];


$(function () {
    $('a.page-scroll').bind('click', function (event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

// Highlight the top nav as scrolling occurs
$('body').scrollspy({
    target: '.navbar-fixed-top'
})

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function () {
    $('.navbar-toggle:visible').click();
});

//loading production data
Papa.parse('/data/HHI_production_long.csv', {
    delimiter: ",",	// auto-detect
    newline: "",	// auto-detect
    quoteChar: '"',
    escapeChar: '"',
    header: true,
    download: true,
    skipEmptyLines: true,
    complete: function (results) {
        dataProd = results.data;
    }
});

// data for reserve data
Papa.parse('/data/HHI_reserve_long.csv', {
    delimiter: ",",
    newline: "",
    quoteChar: '"',
    escapeChar: '"',
    header: true,
    download: true,
    skipEmptyLines: true,
    complete: function (results) {
        dataReserve = results.data
    }
});

//adding and removing elements from the selection
$(".element").click(function () {

    let elm = $(this).children()[1].textContent;
    let elmName = $(this).children()[2].textContent;

    //rare earth materials are handled as a group
    if (RARE_EARTH_ELE.includes(elm)) {
        elm = "Rare_Earths";
        elmName = "Rare Earth";
        for (let el of RARE_EARTH_ELE) {
            elmDiv = $("#" + el + "_ele").children()[1];
            const currentColor = $(elmDiv).css('color');
            if (currentColor === 'rgb(0, 0, 0)') {
                $(elmDiv).css('color', 'rgb(241, 11, 30)');
            } else {
                $(elmDiv).css('color', 'rgb(0, 0, 0)');
            }
        }
    } else {
        let elmDiv = $(this).children()[1];
        const currentColor = $(elmDiv).css('color');
        if (currentColor === 'rgb(0, 0, 0)') {
            $(elmDiv).css('color', 'rgb(241, 11, 30)');
        } else {
            $(elmDiv).css('color', 'rgb(0, 0, 0)');
        }
    }
    updateSelections(elm.trim(), elmName.trim());
});

var getMarketShareData = function (element, year) {
    var elementData = dataProd.filter(function (r) {
        return r.element.trim() === element && r.year.trim() === year.toString();
    });

    let countries = elementData.map(a => a.country.trim());
    let mktShare = elementData.map(a => parseFloat(a.market_share).toFixed(3));
    let tons = elementData.map(a => parseFloat(a.tons));

    return [countries, mktShare,tons];
}

var getMarketShareResData = function (element, year) {

    //if element is in PLATINUM_GROUP_METALS then get data for PGM
    var elementDataRes = dataReserve.filter(function (r) {
        if(PLATINUM_GROUP_METALS.includes(element)){
            return r.element.trim() == "PGM" && r.year.trim() === year.toString();
        }else{
            return r.element.trim() === element && r.year.trim() === year.toString();
        }
        
    });

    let countriesRes = elementDataRes.map(a => a.country.trim());
    let mktShareRes = elementDataRes.map(a => parseFloat(a.market_share).toFixed(3));
    let tons = elementDataRes.map(a => parseFloat(a.tons));

    return [countriesRes, mktShareRes, tons];
}


var getMarketShareDataViz = function (element, year) {
    if (element) {
        var _mktSharedata = getMarketShareData(element, year);
        var _mktShareResdata = getMarketShareResData(element, year);

        // Create a set of unique countries from both production and reserve data
        let allCountries = new Set([..._mktSharedata[0], ..._mktShareResdata[0]]);

        // Create a map for easy lookup of production and reserve data
        let prodMap = new Map();
        _mktSharedata[0].forEach((country, index) => {
            prodMap.set(country, {
                market_share: _mktSharedata[1][index],
                tons: _mktSharedata[2][index]
            });
        });

        let resMap = new Map();
        _mktShareResdata[0].forEach((country, index) => {
            resMap.set(country, {
                market_share: _mktShareResdata[1][index],
                tons: _mktShareResdata[2][index]
            });
        });

        // Create unified data arrays with default values for missing entries
        let unifiedData = Array.from(allCountries).map(country => {
            return {
                country: country,
                prod_market_share: prodMap.has(country) ? prodMap.get(country).market_share : "0.000",
                prod_tons: prodMap.has(country) ? prodMap.get(country).tons : 0,
                res_market_share: resMap.has(country) ? resMap.get(country).market_share : "0.000",
                res_tons: resMap.has(country) ? resMap.get(country).tons : 0
            };
        });

        // Sort the unified data by country in alphabetical order
        unifiedData.sort((a, b) => a.country.localeCompare(b.country));

        const eleProdShare = {
            x: unifiedData.map(data => data.country),
            y: unifiedData.map(data => data.prod_market_share),
            type: 'bar',
            name: 'Prod',
            text: unifiedData.map(data => data.prod_tons + ' tons'),
            textposition: 'none',
            marker: {
                color: 'rgba(44,127,184,1)'
            }
        };

        const eleReserveShare = {
            x: unifiedData.map(data => data.country),
            y: unifiedData.map(data => data.res_market_share),
            type: 'bar',
            name: 'Res',
            text: unifiedData.map(data => data.res_tons + ' tons'),
            textposition: 'none',
            marker: {
                color: 'rgba(127,205,187,1)'
            }
        };

        return [eleProdShare, eleReserveShare];
    } else {
        return [[], []];
    }
}


/// Earlier code

// var getMarketShareDataViz = function (element, year) {

//     if (element) {

//         var _mktSharedata = getMarketShareData(element, year);
//         var _mktShareResdata = getMarketShareResData(element, year);

//         const eleProdShare = {
//             x: _mktSharedata[0],
//             y: _mktSharedata[1],
//             type: 'bar',
//             name: 'Prod',
//             text: _mktSharedata[2].map(function (num, idx) {
//                 return num +' tons';}),
//             textposition: 'none',
//             marker: {
//                 // color: 'rgba(199, 202, 255, 1)'
//                 //color: 'rgba(207,103, 253, 1)'
//                 color: 'rgba(208, 47, 164, 1)'


//             }
//         };

//         const eleReserveShare = {
//             x: _mktShareResdata[0],
//             y: _mktShareResdata[1],
//             type: 'bar',
//             name: 'Res',
//             text: _mktShareResdata[2].map(function (num, idx) {
//                 return num +' tons';}),
//             textposition: 'none',
//             marker: {
//                 // color: 'rgba(193, 235, 192, 1 )'
//                 //color: 'rgba(153, 255, 156, 1 )'
//                 color: 'rgba(47, 208, 91, 1)'

//             }
//         };
//         return [eleProdShare, eleReserveShare]
//     } else {
//         return [[], []]
//     }
// }

// Function to create a new tab
var createTab = function (element, elementName, elementContent) {
    // Create tab element
    var tab = document.createElement('div');
    tab.id = element + '_tab';
    tab.className = 'tab';
    tab.textContent = element;

    // Create remove button
    var removeBtn = document.createElement('div');
    removeBtn.id = element + '_tab_remove';
    removeBtn.className = 'remove-btn';

    // Create corresponding content element
    var content = document.createElement('div');
    content.className = 'tab-content';
    content.id = element + '_content';
    content.innerHTML = 'This is the content of ' + elementName + ' tab.';

    // Append remove button to the tab
    //TODO: currently removing is not added.

    // Append tab and content to their respective containers
    document.getElementById('tabs').appendChild(tab);
    document.getElementById('tabContents').appendChild(content);

    // Add click event listener to the tab for switching content
    tab.addEventListener('click', function () {
        // Hide all contents
        var contents = document.getElementsByClassName('tab-content');
        for (var i = 0; i < contents.length; i++) {
            contents[i].style.display = 'none';
        }

        // Remove 'active' class from all tabs
        var tabs = document.getElementsByClassName('tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.remove('active');
        }

        // Add 'active' class to the clicked tab
        tab.classList.add('active');
        global_analysis_element = element;
        update_worldMap(element, global_analysis_year);
    });

    // Add click event listener to the remove button
    removeBtn.addEventListener('click', function (event) {
        // Remove the tab and its content

        $("#" + element + "_ele").click();
    });
}

var addElemTab = function (element, elementName) {
    createTab(element, element, element);
    $('#' + element + '_tab').click();
    global_analysis_element = element;
    update_worldMap(element, global_analysis_year);
}

var removeElemTab = function (element, elementName) {
    el = $('#' + element + "_tab");
    //select the last element
    el.remove();

    if (Object.keys(symblNameMap).length > 0) {
        const lastEl = Object.keys(symblNameMap)[Object.keys(symblNameMap).length - 1]
        global_analysis_element = lastEl;
        $('#' + lastEl + "_tab").click();
    } else {
        global_analysis_element = null;
        update_worldMap(null, global_analysis_year);
    }

}

var updateSelections = function (element, elementName) {

    symblNameMap[element] = elementName;
    // if element is already present then remove
    if (element in hhiProductionMulti) {
        delete hhiProductionMulti[element];
        delete hhiReserveMulti[element];
        delete symblNameMap[element];

        removeElemTab(element, elementName);
    } else { //else add 
        var elementData = dataProd.filter(function (r) {
            return r.element === element && r.HHI !== "";
        });
        let hhis = elementData.map(a => a.HHI);
        let hhiYears = elementData.map(a => a.year);
        hhiProductionMulti[element] = [hhiYears, hhis];

        // Added line 
        elementData = dataReserve.filter(function (r) {
            //if element is in PLATINUM_GROUP_METALS group get the PMG data
            if(PLATINUM_GROUP_METALS.includes(element)){
                return r.element === 'PGM' && r.HHI !== "";
            } else{
                return r.element === element && r.HHI !== "";
            }
        });
        let hhiReserve = elementData.map(a => a.HHI);
        let hhiYearsRes = elementData.map(a => a.year);
        hhiReserveMulti[element] = [hhiYearsRes, hhiReserve];
        
        addElemTab(element, elementName);
    }
    updateVizs();
}

//updates the visualization based on the elements selected
var updateVizs = function () {

    var minProdYear = 2099;
    var maxProdYear = 1999;

    let plotDataProd = [];
    for (let key in hhiProductionMulti) {
        minProdYear = Math.min(minProdYear, Math.min(...hhiProductionMulti[key][0]))
        maxProdYear = Math.max(maxProdYear, Math.max(...hhiProductionMulti[key][0]))
        plotDataProd.push({
            x: hhiProductionMulti[key][0],
            y: hhiProductionMulti[key][1],
            mode: 'lines+markers',
            name: key
        })
    }

    var minResYear = 2099;
    var maxResYear = 1999;
    let plotDataRes = [];
    for (let key in hhiReserveMulti) {
        minResYear = Math.min(minResYear, Math.min(...hhiReserveMulti[key][0]))
        maxResYear = Math.max(maxResYear, Math.max(...hhiReserveMulti[key][0]))
        plotDataRes.push({
            x: hhiReserveMulti[key][0],
            y: hhiReserveMulti[key][1],
            mode: 'lines+markers',
            name: key
        })
    }

    var layoutProd = {
        xaxis: {
            title: "Year",

            titlefont: { // Setting the font for the x-axis title
                size: 18,
                color: 'black'
            },

            tickfont: { // Setting the font for the x-axis tick labels
                size: 15,
                color: 'black'
            }
        },

        yaxis: {
            title: "HHI Production",
            titlefont: { // Setting the font for the x-axis title
                size: 18,
                color: 'black'
            },

            tickfont: { // Setting the font for the x-axis tick labels
                size: 15,
                color: 'black'
            },
            range: [0, 10000]
        },

        title: 'Prouction HHI across Years',

        titlefont: { // Setting the font for the chart title
            size: 18,
            color: 'black'
        },

        margin: {
            t: 25,
            b: 40,
            r: 5
        },
        showlegend :true,
        shapes: [{
            type: 'line',
            x0: minProdYear,
            y0: 2500,
            x1: maxProdYear,
            y1: 2500,
            line: {
                color: '#F51720',
                width: 2.5,
                dash: 'dash'
            }
        },
        {
            type: 'line',
            x0: minProdYear,
            y0: 1500,
            x1: maxProdYear,
            y1: 1500,
            line: {
                color: 'green',
                width: 2.5,
                dash: 'dash'
            }
        }],

        annotations: [
            {
                x: (minProdYear + maxProdYear) / 2, // Assuming minProdYear and maxProdYear are defined, set x to their midpoint
                y: 900,
                xref: 'x',
                yref: 'y',
                text: 'Unconcentrated',
                showarrow: false, // Set to false if you do not need an arrow
                font: {
                    color: 'green', // Setting the text color to green
                    size: 20
                },
                ax: 0,
                ay: 0
            },

            {
                x: (minProdYear + maxProdYear) / 2, // Assuming minProdYear and maxProdYear are defined, set x to their midpoint
                y: 2000,
                xref: 'x',
                yref: 'y',
                text: 'Moderately concentrated',
                showarrow: false, // Set to false if you do not need an arrow
                font: {
                    color: 'Orange', // Setting the text color to green
                    size: 20
                },
                ax: 0,
                ay: 0
            },

            {
                x: (minProdYear + maxProdYear) / 2, // Assuming minProdYear and maxProdYear are defined, set x to their midpoint
                y: 3500,
                xref: 'x',
                yref: 'y',
                text: 'Highly concentrated',
                showarrow: false, // Set to false if you do not need an arrow
                font: {
                    color: 'red', // Setting the text color to green
                    size: 20
                },
                ax: 0,
                ay: 0
            }
        ]
    };

    var layoutRes = {
        xaxis: {
            title: "Year",

            titlefont: { // Setting the font for the x-axis title
                size: 18,
                color: 'black'
            },

            tickfont: { // Setting the font for the x-axis tick labels
                size: 15,
                color: 'black'
            }
        },

        yaxis: {
            title: "HHI Reserve",
            titlefont: { // Setting the font for the x-axis title
                size: 18,
                color: 'black'
            },

            tickfont: { // Setting the font for the x-axis tick labels
                size: 15,
                color: 'black'
            },
            range: [0, 10000]
        },

        title: 'Reserve HHI across Years',

        titlefont: { // Setting the font for the chart title
            size: 18,
            color: 'black'
        },

        margin: {
            t: 25,
            b: 40,
            r: 5
        },
        showlegend :true,
        shapes: [{
            type: 'line',
            x0: minProdYear,
            y0: 2500,
            x1: maxProdYear,
            y1: 2500,
            line: {
                color: '#F51720',
                width: 2.5,
                dash: 'dash'
            }
        },
        {
            type: 'line',
            x0: minProdYear,
            y0: 1500,
            x1: maxProdYear,
            y1: 1500,
            line: {
                color: 'green',
                width: 2.5,
                dash: 'dash'
            }
        }],


        annotations: [
            {
                x: (minProdYear + maxProdYear) / 2, // Assuming minProdYear and maxProdYear are defined, set x to their midpoint
                y: 900,
                xref: 'x',
                yref: 'y',
                text: 'Unconcentrated',
                showarrow: false, // Set to false if you do not need an arrow
                font: {
                    color: 'green', // Setting the text color to green
                    size: 20
                },
                ax: 0,
                ay: 0
            },
            {
                x: (minProdYear + maxProdYear) / 2, // Assuming minProdYear and maxProdYear are defined, set x to their midpoint
                y: 2000,
                xref: 'x',
                yref: 'y',
                text: 'Moderately concentrated',
                showarrow: false, // Set to false if you do not need an arrow
                font: {
                    color: 'Orange', // Setting the text color to green
                    size: 20
                },
                ax: 0,
                ay: 0
            },
            {
                x: (minProdYear + maxProdYear) / 2, // Assuming minProdYear and maxProdYear are defined, set x to their midpoint
                y: 3500,
                xref: 'x',
                yref: 'y',
                text: 'Highly concentrated',
                showarrow: false, // Set to false if you do not need an arrow
                font: {
                    color: 'red', // Setting the text color to green
                    size: 20
                },
                ax: 0,
                ay: 0
            }
        ]
    };

    var hhiProdViz = document.getElementById('hhiProd');
    Plotly.newPlot(hhiProdViz, plotDataProd, layoutProd,
        {
            modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d',
                'zoomOut2d', 'autoScale2d', 'resetScale2d'],
            displaylogo: false,
            toImageButtonOptions: { filename: 'HHI_production' }
        });

    var hhiResViz = document.getElementById('hhiRes');
    Plotly.newPlot(hhiResViz, plotDataRes, layoutRes,
        {
            modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d',
                'zoomOut2d', 'autoScale2d', 'resetScale2d'],
            displaylogo: false,
            toImageButtonOptions: { filename: 'HHI_reserve' }
        });


    $('#mktShareAll').empty()
    for (let key in hhiProductionMulti) {
        // create div for each element
        $('#mktShareAll').append('<div class="row"><div id="shareElement-' + key + '" class="card" style="width:100%;height:300px;"></div></div>');

        var layoutShare = {
            title: 'Market Share of ' + symblNameMap[key] + ' (%)',
            xaxis: {
                tickangle: -45,
                automargin: true,
                tickfont:{
                    weight:7,
                    size:17
                }
            },
            barmode: 'group',
            margin: {
                t: 25
            }
        };

        var shareElement = document.getElementById('shareElement-' + key);
        Plotly.newPlot(shareElement, getMarketShareDataViz(key, global_analysis_year), layoutShare,
            {
                modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d',
                    'zoomOut2d', 'autoScale2d', 'resetScale2d'],
                displaylogo: false,
                toImageButtonOptions: { filename: 'Market Share of ' + symblNameMap[key] }
            });
    }
}

function objectToCsv(alldata) {
    const csvRows = [];

    // Get the headers
    const headers = Object.keys(alldata[0][0]);
    csvRows.push(headers.join(','));

    for (const data of alldata) {
        // Iterate over each object
        for (const row of data) {
            const values = headers.map(header => {
                const escaped = ('' + row[header]).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }
    }
    // Combine rows into a single CSV string
    return csvRows.join('\n');
}

function download(e, ftype) {

    // if (Object.keys(hhiProductionMulti).length > 0) {
    //     var dataDownload = [];
    //     for (let key in hhiProductionMulti) {
    //         var elementData = dataProd.filter(function (r) {
    //             return r.element === key;
    //         });
    //         dataDownload.push(elementData);
    //     }

    //     // Convert object data to CSV format
    //     const csvContent = objectToCsv(dataDownload);

    //     let dataDownloadStr = "data:text/csv;charset=utf-8," + csvContent;
    //     var encodedUri = encodeURI(dataDownloadStr);
    //     window.open(encodedUri);
    // } else {
    //     const csvContent = objectToCsv([dataProd]);

    //     let dataDownloadStr = "data:text/csv;charset=utf-8," + csvContent;
    //     var encodedUri = encodeURI(dataDownloadStr);
    //     window.open(encodedUri);
    // }

    // if (Object.keys(hhiReserveMulti).length > 0) {
    //     var dataDownload = [];
    //     for (let key in hhiReserveMulti) {
    //         var elementData = dataReserve.filter(function (r) {
    //             return r.element === key;
    //         });
    //         dataDownload.push(elementData);
    //     }

    //     // Convert object data to CSV format
    //     const csvContent = objectToCsv(dataDownload);

    //     let dataDownloadStr = "data:text/csv;charset=utf-8," + csvContent;
    //     var encodedUri = encodeURI(dataDownloadStr);
    //     window.open(encodedUri);
    // } else {
    //     const csvContent = objectToCsv([dataReserve]);

    //     let dataDownloadStr = "data:text/csv;charset=utf-8," + csvContent;
    //     var encodedUri = encodeURI(dataDownloadStr);
    //     window.open(encodedUri);
    // }

    e.preventDefault();
    if(ftype == 'prod'){
        const csvContent = objectToCsv([dataProd]);
        let dataDownloadStr = "data:text/csv;charset=utf-8," + csvContent;
        var encodedUri = encodeURI(dataDownloadStr);
        window.open(encodedUri);
    }

    if(ftype == 'res'){
        const csvContentRes = objectToCsv([dataReserve]);
        let dataDownloadStr = "data:text/csv;charset=utf-8," + csvContentRes;
        var encodedUri = encodeURI(dataDownloadStr);
        window.open(encodedUri);
    }
}

// Sample data for demonstration
var prep_country_map_data = function (element, year) {

    var _mktSharedata = null;
    if (global_analysis_type === "res") {
        _mktSharedata = getMarketShareResData(element, year);
    } else {
        _mktSharedata = getMarketShareData(element, year);
    }

    var countries = _mktSharedata[0];
    var mektshares = _mktSharedata[1];
    var tons = _mktSharedata[2];

    var txt_display = mektshares.map(function (num, idx) {
        return num +'% <br>'+ tons[idx] + ' tons';
    });

    var data = [{
        type: 'choropleth',
        geojson: 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json', // GeoJSON 
        // with country boundaries
        z: mektshares,
        locations: countries,
        locationmode: "country names",
        text: txt_display,
        colorscale: 'Bergeron',
        reversescale: false,
        showcountries: true,
        showframe: true,
        scope: 'world',
        colorbar: { title: 'Market Share' },
        hoverinfo: 'location+text',
        zmin: 0,
        zmax: 100,
    }];
    return data;
}

var update_worldMap = function (element, year) {

    if (element === null & global_analysis_element !== null) {
        element = global_analysis_element;
    }

    if (year === null & global_analysis_year !== null) {
        year = global_analysis_year;
    }

    var _data = prep_country_map_data(element, year)
    // Add event listener for hover

    var mapElement = document.getElementById('worldmap');
    var infoTableElement = document.getElementById('info-table');

    var layout = {
        title: element,
        geo: {
            showframe: true,
            showcountries: true,
            scope: 'world',
            projection: { type: 'robinson' }
        },
        margin: { l: 10, r: 10, b: 20, t: 0, pad: 4 },
        colorbar: { len: '70%', thickness: 5 },
        width: 1000, // Increase width
        height: '100%', // Increase height
    };


    Plotly.newPlot('worldmap', _data, layout,
        {
            modeBarButtonsToRemove: ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d',
                'zoomOut2d', 'autoScale2d', 'resetScale2d'],
            displaylogo: false,
            toImageButtonOptions: { filename: 'HHI_map' }
        });

    // Add event listener for unhover
    mapElement.on('plotly_unhover', () => {
        // Reset the map selection and clear the table
        const update = {
            'geo.selectedpoints': null,
        };
        Plotly.update('worldmap', {}, update);
        infoTableElement.innerHTML = '';
    });
}

var switchResProd = function (el) {
    if (el.id === "mapRes") {
        el1 = document.getElementById('mapRes');
        el1.classList.add('active');
        global_analysis_type = "res"

        el2 = document.getElementById('mapProd');
        el2.classList.remove('active');
    } else {
        el1 = document.getElementById('mapRes');
        el1.classList.remove('active');

        el2 = document.getElementById('mapProd');
        el2.classList.add('active');
        global_analysis_type = "prod"
    }

    update_worldMap(global_analysis_element, global_analysis_year);
}

var yearChange = function () {
    global_analysis_year = $('#anaYear').val();
    update_worldMap(global_analysis_element, global_analysis_year);
    updateVizs();
}

// scrolling elements fixed 
//-----------------------------
// Get the floating element
const floatingSelBox = document.getElementById("tab-container-parent");

// Get the initial position of the floating element
const initialPosition = floatingSelBox.getBoundingClientRect().top;

// Add a scroll event listener
window.addEventListener('scroll', function () {
    // Check if the user has scrolled beyond the initial position
    if (window.scrollY > initialPosition) {
        // Add the 'fixed' class to make the element fixed at the top
        floatingSelBox.classList.add('tab-container-parent-fixed');
    } else {
        // Remove the 'fixed' class to revert to the original position
        floatingSelBox.classList.remove('tab-container-parent-fixed');
    }
});

// feedback button
document.getElementById('feedback-button').addEventListener('click', function () {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLScOvle5rLypixpgKNE7hHes5XUsQO3Gssd2O2_GAtJAh2bO1Q/viewform?usp=sf_link', '_blank');
});

//new chat item scroll last
function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

$(document).ready(function() {
    $('.element').on('mouseover', function(event) {
        // const infoId = $(this).data('id');
        const infoWindow = $('#info-window');

        let elm = $(this).children()[1].textContent;
        let elmName = $(this).children()[2].textContent;
        
        var elementData = dataProd.filter(function (r) {
            return r.element.trim() === elm && r.info.trim() !== "";
        });

        var elementDataRes = dataReserve.filter(function (r) {
            return r.element.trim() === elm && r.Info.trim() !== "";
        });

    
        let info = elementData.map(a => "<li>" +a.info.trim());
        let infoRes = elementDataRes.map(a => "<li>" +a.Info.trim());
        
        info = info.concat(infoRes);
        info = [...new Set(info)]

        if(RARE_EARTH_ELE.includes(elm)){
            elmName = elmName + '(Rare Earths)'
            info = '<li>The rare earths include group of 17 elements composed of scandium, yttrium, and the Lanthanides.';
        }

        if(PLATINUM_GROUP_METALS.includes(elm)){
            elmName = elmName + ' : Platinum group metals (PGM)'
            info = '<li>Platinum group metals (PGM) include iridium, osmium, palladium, platinum, rhodium, and ruthenium.';
        }

        $(this).attr('title', '');
        infoWindow.html('<b>'+elmName +'</b></p>'+info);
        infoWindow.css({
            display: 'block',
            left: event.pageX + 10 + 'px',
            top: event.pageY + 10 + 'px'
        });
    });

    $('.element').on('mousemove', function(event) {
        const infoWindow = $('#info-window');
        
        infoWindow.css({
            left: event.pageX + 10 + 'px',
            top: event.pageY + 10 + 'px'
        });
    });

    $('.element').on('mouseout', function() {
        const infoWindow = $('#info-window');
        infoWindow.css('display', 'none');
    });
});