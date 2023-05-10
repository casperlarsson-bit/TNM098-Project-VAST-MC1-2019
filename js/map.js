const mapWidth = 900 //document.getElementById('map-canvas').offsetWidth
const mapHeight = 600 //document.getElementById('map-canvas').offsetHeight
const svg = d3.select('#map-canvas')
    .append('svg')
    .attr('width', '80%')
    .attr('height', '100%')
    .attr('id', 'map-svg')

const projection = d3.geoEquirectangular()
    .center([80, -50])
    .translate([mapWidth / 2, mapHeight / 2]) // translate to center of screen
    .scale([300]) // Temp scale


const path = d3.geoPath().projection(projection)

d3.queue()
    .defer(d3.csv, 'data/mc1-reports-data.csv',
        // Format time
        function (d) {
            return {
                time: d3.timeParse('%Y-%m-%d %H:%M:%S')(d.time),
                sewer_and_water: d.sewer_and_water,
                power: d.power,
                roads_and_bridges: d.roads_and_bridges,
                medical: d.medical,
                buildings: d.buildings,
                shake_intensity: d.shake_intensity,
                location: d.location
            }
        })
    .defer(d3.json, 'data/map.json')
    .await(ready)

function ready(error, data, regions) {
    if (error) throw error

    // Map color, change in the feature?
    // Example: https://d3-graph-gallery.com/graph/choropleth_basic.html
    // Colours: https://observablehq.com/@d3/color-schemes
    const colorScale = d3.scaleThreshold()
        .domain(Array.from(Array(11).keys()))
        .range(d3.schemeOrRd[9])

    const enterData = svg.selectAll('g')
        .data(regions.features)
        .enter()



    enterData.append('path')
        .attr('d', path)
        .attr('class', 'region')
        .style('fill', d => {
            const filteredData = data.filter(i => i.location === d.id)
            return colorScale(d3.mean(filteredData, i => i.shake_intensity))
        })

    drawConfidence(data, regions)

    // Add text and position them over the area
    enterData.append('g').append('text')
        .attr('dx', d => {
            const coordinates = d.geometry.coordinates[0]
            const xCoord = []

            coordinates.forEach(coord => {
                if (coord.length === 2) {
                    xCoord.push(coord[0])

                }
                else {
                    coord.forEach(edgeCase => {
                        xCoord.push(edgeCase[0])
                    })
                }
            })

            return d3.mean(xCoord) * 5
        })
        .attr('dy', d => {
            const coordinates = d.geometry.coordinates[0]
            const yCoord = []

            coordinates.forEach(coord => {
                if (coord.length === 2) {
                    yCoord.push(coord[1])

                }
                else {
                    coord.forEach(edgeCase => {
                        yCoord.push(edgeCase[1])
                    })
                }
            })

            return -(d3.mean(yCoord) - 10) * 5
        })
        .text(d => d.id.replace(/^0+/, '') + ' ' + d.properties.name)
        .attr('class', 'region-name')

    d3.selectAll('.region')
        .on('click', d => {
            drawCharts(data, d.id.replace(/^0+/, ''))
        })
}