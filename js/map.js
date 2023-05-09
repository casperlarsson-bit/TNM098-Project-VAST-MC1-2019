const mapWidth = 900 //document.getElementById('map-canvas').offsetWidth
const mapHeight = 600 //document.getElementById('map-canvas').offsetHeight
const svg = d3.select('#map-canvas')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('id', 'map-svg')

const projection = d3.geoEquirectangular()
    .center([80, -50])
    .translate([mapWidth / 2, mapHeight / 2]) // translate to center of screen
    .scale([300]) // Temp scale


const path = d3.geoPath().projection(projection)


d3.json('data/map.json', function (error, regions) {
    if (error) throw error

    function mapColor(value) {
        const colorScale = d3.scaleSequential(d3.interpolateRgb('#e4f2e4', 'green'))
            .domain([0, regions.features.length])
        return colorScale(value)
    }

    const enterData = svg.selectAll('g')
        .data(regions.features)
        .enter()

    enterData.append('path')
        .attr('d', path)
        .attr('class', 'region')
        .style('fill', d => mapColor(d.id)) // Temp colouring

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
            drawCharts(d.id.replace(/^0+/, ''))
        })
})