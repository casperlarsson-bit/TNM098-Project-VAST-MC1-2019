// Map color, change in the feature?
// Example: https://d3-graph-gallery.com/graph/choropleth_basic.html
// Colours: https://observablehq.com/@d3/color-schemes
const colorScale = d3.scaleThreshold()
    .domain(Array.from(Array(11).keys()))
    .range(d3.schemeOrRd[9])

const marginC = { top: 10, right: 30, bottom: 30, left: 60 },
    widthC = document.getElementById('overview').offsetWidth - marginC.left - marginC.right,
    heightC = document.getElementById('overview').offsetHeight - marginC.top - marginC.bottom

const svgC = d3.select('#overview')
    .append('svg')
    .attr('width', widthC + marginC.left + marginC.right)
    .attr('height', heightC + marginC.top + marginC.bottom)
    .append('g')
    .attr('transform',
        'translate(' + marginC.left + ',' + marginC.top + ')')

function drawConfidence(data, regions, category) {
    svgC.selectAll("*").remove()

    const sumstats = d3.nest()
        .key(d => d.properties.name)
        .rollup(d => {
            const filteredData = data.filter(i => i.location === d[0].id)
            const standardDeviation = d3.deviation(filteredData, i => i[category])
            const confidence99 = 2.58 * standardDeviation / Math.sqrt(filteredData.length) // 2.58 comes from N(0,1) and 99% confidence interval
            const confidence95 = 1.96 * standardDeviation / Math.sqrt(filteredData.length) // 1.96 comes from N(0,1) and 95% confidence interval
            const confidence80 = 1.28 * standardDeviation / Math.sqrt(filteredData.length) // 1.28 comes from N(0,1) and 80% confidence interval
            const mean = d3.mean(filteredData, i => i[category])

            q1 = d3.quantile(filteredData.map(function (g) { return g[category] }).sort(d3.ascending), .25)
            median = d3.quantile(filteredData.map(function (g) { return g[category] }).sort(d3.ascending), .5)
            q3 = d3.quantile(filteredData.map(function (g) { return g[category] }).sort(d3.ascending), .75)
            interQuantileRange = q3 - q1
            min = q1 - 1.5 * interQuantileRange
            max = q3 + 1.5 * interQuantileRange

            return ({ id: d[0].id, mean: mean, std: standardDeviation, confidence95: confidence95, confidence80: confidence80, confidence99: confidence99, q1: q1, q3: q3, median: median, min: min, max: max })
        })
        .entries(regions.features)
        .sort((a, b) => d3.ascending(a.value.mean, b.value.mean))

    const regionNames = sumstats.map(d => d.key)

    const x = d3.scaleBand()
        .range([0, widthC])
        .domain(regionNames)
        .paddingInner(1)
        .paddingOuter(.5)
    svgC.append('g')
        .attr('transform', 'translate(0,' + heightC + ')')
        .call(d3.axisBottom(x))

    const y = d3.scaleLinear()
        .range([heightC, 0])
        .domain([d3.min(sumstats, d => d.value.min) - 1, d3.max(sumstats, d => d.value.max)])
    svgC.append('g')
        .call(d3.axisLeft(y))

    svgC.selectAll('vertLines')
        .data(sumstats)
        .enter()
        .append('line')
        .attr('y1', d => y(d.value.min))
        .attr('y2', d => y(d.value.max))
        .attr('x1', d => x(d.key))
        .attr('x2', d => x(d.key))
        .attr('stroke', 'black')
        .style('stroke-width', 1)

    // rectangle for the main box
    const boxWidth = 50
    svgC.selectAll('boxes')
        .data(sumstats)
        .enter()
        .append('rect')
        .attr('x', function (d) { return (x(d.key) - boxWidth / 2) })
        .attr('y', function (d) { return (y(d.value.q3)) })
        .attr('height', function (d) { return Math.max(y(d.value.q1) - y(d.value.q3), (y(d.value.q3) - y(d.value.q1))) })
        .attr('width', boxWidth)
        .attr('stroke', 'black')
        .attr('class', d => 'box region' + d.value.id)
        .style('fill', d => colorScale(d.value.mean))
        .style('opacity', 0.8)

    d3.selectAll('.box')
        .on('click', d => {
            drawCharts(data, d.value.id.replace(/^0+/, ''), category)
        })
        .on('mouseover', d => {
            d3.selectAll('.region' + d.value.id)
                .style('fill', 'lightblue')
        })
        .on('mouseout', d => {
            d3.selectAll('.region' + d.value.id)
                .style('fill', d => {
                    if (d.value) {
                        const filteredData = data.filter(i => i.location === d.value.id)
                        return colorScale(d3.mean(filteredData, i => i[category]))
                    }

                    const filteredData = data.filter(i => i.location === d.id)
                    return colorScale(d3.mean(filteredData, i => i[category]))
                })
        })

    // Show the median
    svgC.selectAll('medianLines')
        .data(sumstats)
        .enter()
        .append('line')
        .attr('x1', function (d) { return (x(d.key) - boxWidth / 2) })
        .attr('x2', function (d) { return (x(d.key) + boxWidth / 2) })
        .attr('y1', function (d) { return (y(d.value.median)) })
        .attr('y2', function (d) { return (y(d.value.median)) })
        .attr('stroke', 'black')
        .style('width', 80)
}

// Design https://clauswilke.com/dataviz/visualizing-uncertainty.html
// https://d3-graph-gallery.com/graph/boxplot_several_groups.html