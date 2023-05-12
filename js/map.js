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

    const categories = d3.keys(data[0]).slice(1, -1)
    const inputParseDate = d3.timeParse('%Y-%m-%dT%H:%M')

    // Create a select element
    const select = d3.select('#control-panel')
        .append('select')
        .attr('id', 'select-category')
        .on('change', update)

    // Add the options:
    select.selectAll(null)
        .data(categories)
        .enter()
        .append('option')
        .text(d => {
            return d.charAt(0).toUpperCase() + d.slice(1).replace(/_/g, ' ')
        })

    function update() {
        svg.selectAll('*').remove()
        d3.selectAll('.tooltip').remove()
        const category = document.getElementById('select-category').value.toLowerCase().replace(/ /g, '_')
        const startDate = inputParseDate(document.getElementById('start').value)
        const endDate = inputParseDate(document.getElementById('end').value)

        //data = data.filter(d => d.time >= startDate && d.time <= endDate)

        const enterData = svg.selectAll('g')
            .data(regions.features)
            .enter()

        enterData.append('path')
            .attr('d', path)
            .attr('class', d => 'region region' + d.id)
            .style('fill', d => {
                const filteredData = data.filter(i => i.location === d.id)
                //console.log(d.id + ' ' + filteredData.length)
                return colorScale(d3.mean(filteredData, i => i[category]))
            })

        drawConfidence(data, regions, category)

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

        // Color code from https://gist.github.com/HarryStevens/6eb89487fc99ad016723b901cbd57fde
        const colorData = [{ 'color': colorScale(-1), 'value': 0 }, { 'color': colorScale(0), 'value': 5 }, { 'color': colorScale(1), 'value': 10 }, { 'color': colorScale(2), 'value': 15 }, { 'color': colorScale(3), 'value': 20 }, { 'color': colorScale(4), 'value': 25 }, { 'color': colorScale(5), 'value': 30 }, { 'color': colorScale(6), 'value': 35 }, { 'color': colorScale(7), 'value': 40 }]
        const extent = d3.extent(colorData, d => d.value);
        const defs = svg.append('defs')
        const linearGradient = defs.append('linearGradient').attr('id', 'myGradient')
        linearGradient.selectAll('stop')
            .data(colorData)
            .enter().append('stop')
            .attr('offset', d => ((d.value - extent[0]) / (extent[1] - extent[0]) * 100) + '%')
            .attr('stop-color', d => d.color)

        // Colour scale explanation
        svg.append('rect')
            .attr('x', 20)
            .attr('y', 400)
            .attr('height', 40)
            .attr('width', 180)
            .attr('id', 'scale')
            .style('fill', 'url(#myGradient')
        svg.append('g')
            .append('text')
            .attr('dx', 20)
            .attr('dy', 400 - 5)
            .text('Low')
        svg.append('g')
            .append('text')
            .attr('dx', 200)
            .attr('dy', 400 - 5)
            .style('text-anchor', 'end')
            .text('High')

        // Create a tooltip from https://d3-graph-gallery.com/graph/interactivity_tooltip.html
        const Tooltip = d3.select('#map-canvas')
            .append('div')
            .style('opacity', 0)
            .attr('class', 'tooltip')
            .style('width', 100)
            .style('background-color', 'white')
            .style('border', 'solid')
            .style('border-width', '2px')
            .style('border-radius', '5px')
            .style('padding', '5px')

        const mouseover = (d) => {
            d3.selectAll('.region' + d.id)
                .style('fill', 'lightblue')

            Tooltip.style('opacity', 1)
        }

        const mousemove = (d) => {
            const filteredData = data.filter(i => i.location === d.id)
            const mean = d3.mean(filteredData, i => i[category])

            Tooltip.html(d.id + ' ' + d.properties.name + ' <br />With value ' + mean.toFixed(2))
                .style('left', (d3.event.pageX) + 'px')
                .style('top', (d3.event.pageY - 20) + 'px')
        }

        const mouseleave = (d) => {
            Tooltip.style('opacity', 0)
        }

        const mouseout = (d) => {
            d3.selectAll('.region' + d.id)
                .style('fill', d => {
                    if (d.value) {
                        const filteredData = data.filter(i => i.location === d.value.id)
                        return colorScale(d3.mean(filteredData, i => i[category]))
                    }

                    const filteredData = data.filter(i => i.location === d.id)
                    return colorScale(d3.mean(filteredData, i => i[category]))
                })
        }


        d3.selectAll('.region')
            .on('click', d => {
                drawCharts(data, d.id.replace(/^0+/, ''), category)
            })
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('mousemove', mousemove)
            .on('mouseleave', mouseleave)
    }

    document.getElementById('start').addEventListener('change', () => update())
    document.getElementById('end').addEventListener('change', () => update())

    update()
}