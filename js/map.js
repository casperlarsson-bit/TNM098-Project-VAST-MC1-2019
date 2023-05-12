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

    // Create a select element
    const select = d3.select("#control-panel")
        .append("select")
        .on("change", update)

    // Add the options:
    select.selectAll(null)
        .data(categories)
        .enter()
        .append("option")
        .text(d => {
            return d.charAt(0).toUpperCase() + d.slice(1).replace(/_/g, ' ')
        })

    function update() {
        svg.selectAll("*").remove()
        const category = this.value ? this.value.toLowerCase().replace(/ /g, '_') : categories[0]

        const enterData = svg.selectAll('g')
            .data(regions.features)
            .enter()

        enterData.append('path')
            .attr('d', path)
            .attr('class', d => 'region region' + d.id)
            .style('fill', d => {
                const filteredData = data.filter(i => i.location === d.id)
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
        var colorData = [{ "color": colorScale(-1), "value": 0 }, { "color": colorScale(0), "value": 5 }, { "color": colorScale(1), "value": 10 }, { "color": colorScale(2), "value": 15 }, { "color": colorScale(3), "value": 20 }, { "color": colorScale(4), "value": 25 }, { "color": colorScale(5), "value": 30 }, { "color": colorScale(6), "value": 35 }, { "color": colorScale(7), "value": 40 }]
        var extent = d3.extent(colorData, d => d.value);
        const defs = svg.append("defs")
        const linearGradient = defs.append("linearGradient").attr("id", "myGradient")
        linearGradient.selectAll("stop")
            .data(colorData)
            .enter().append("stop")
            .attr("offset", d => ((d.value - extent[0]) / (extent[1] - extent[0]) * 100) + "%")
            .attr("stop-color", d => d.color)

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


        d3.selectAll('.region')
            .on('click', d => {
                drawCharts(data, d.id.replace(/^0+/, ''))
            })
            .on('mouseover', d => {
                d3.selectAll('.region' + d.id)
                    .style('fill', 'lightblue')
            })
            .on('mouseout', d => {
                d3.selectAll('.region' + d.id)
                    .style('fill', d => {
                        if (d.value) {
                            const filteredData = data.filter(i => i.location === d.value.id)
                            return colorScale(d3.mean(filteredData, i => i[category]))
                        }

                        const filteredData = data.filter(i => i.location === d.id)
                        return colorScale(d3.mean(filteredData, i => i[category]))
                    })
            })
    }

    update()
}