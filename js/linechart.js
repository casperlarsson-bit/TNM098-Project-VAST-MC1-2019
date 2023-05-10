// set the dimensions and margins of the graph
const margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = document.getElementById('lineplot-canvas').offsetWidth - margin.left - margin.right,
    height = document.getElementById('lineplot-canvas').offsetHeight - margin.top - margin.bottom

// append the svg object to the body of the page
const svgChart = d3.select('#lineplot-canvas')
    .append('svg')
    .attr('width', width)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform',
        'translate(' + margin.left + ',' + margin.top + ')')

const numCharts = 3.1
function drawIndividualChart(yPosition, data) {
    // Add X axis --> it is a time format
    const x = d3.scaleTime()
        .domain(d3.extent(data, function (d) { return d.time }))
        .range([0, width])
    svgChart.append('g')
        .attr('transform', 'translate(0,' + yPosition + ')')
        .call(d3.axisBottom(x))

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([0, 10])
        .range([yPosition, yPosition - height / numCharts])
    svgChart.append('g')
        .call(d3.axisLeft(y))

    // Add the line
    svgChart.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', d3.line()
            .x(function (d) { return x(d.time) })
            .y(function (d) { return y(d.value) })
        )
}

function drawCharts(regionID) {
    svgChart.selectAll("*").remove()
    //Read the data
    d3.csv('data/mc1-reports-data.csv',

        // Format time, need to make a copy of the dataset?
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
        },

        function (data) {
            data = data.sort((a, b) => d3.ascending(a.time, b.time))
            data = data.filter(d => d.location === regionID)

            const shakeData = data.map(d => { return { time: d.time, value: d.shake_intensity } })
            const medicalData = data.map(d => { return { time: d.time, value: d.medical } })
            const powerData = data.map(d => { return { time: d.time, value: d.power } })


            drawIndividualChart(height / numCharts, shakeData)
            drawIndividualChart(2 * height / numCharts + 10, medicalData)
            drawIndividualChart(3 * height / numCharts + 20, powerData)


        })
}