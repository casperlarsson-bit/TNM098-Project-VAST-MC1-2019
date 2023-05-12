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

const numCharts = 3.5
function drawIndividualChart(yPosition, data, color) {
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
        .attr('stroke', color)
        .attr('stroke-width', 0.5)
        .attr('d', d3.line()
            .x(function (d) { return x(d.time) })
            .y(function (d) { return y(d.value) })
        )
}

function drawCharts(data, regionID, category) {
    svgChart.selectAll("*").remove()
    data = data.sort((a, b) => d3.ascending(a.time, b.time))
    filteredData = data.filter(d => d.location === regionID)

    const shakeData = filteredData.map(d => { return { time: d.time, value: d.shake_intensity } })
    const chosenData = filteredData.map(d => { return { time: d.time, value: d[category] } })
    const powerData = filteredData.map(d => { return { time: d.time, value: d.power } })

    const spacing = 30

    drawIndividualChart(height / numCharts, shakeData, 'steelblue')
    drawIndividualChart(3 * height / numCharts + 2 * spacing, chosenData, 'steelblue')

    const movingAverage = d3.nest()
        .key(d => d.location)
        .rollup(dataLocation => {
            const time = dataLocation.map(d => d.time)

            const numAverages = 7
            const shake_intensity = dataLocation.map(d => d.shake_intensity)
            const average = []
            for (let i = 1; i <= shake_intensity.length; ++i) {
                const partArray = shake_intensity.slice(d3.max([i - numAverages, 0]), i)
                average.push(d3.mean(partArray))
            }

            return ({ time: time, movingAverage: average })
        })
        .entries(filteredData)

    const test = filteredData.map((d, i) => { return { time: d.time, value: movingAverage[0].value.movingAverage[i] } })


    drawIndividualChart(2 * height / numCharts + 1 * spacing, test, 'black')
}