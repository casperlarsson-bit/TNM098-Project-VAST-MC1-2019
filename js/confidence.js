function drawConfidence(data, regions) {
    const margin = { top: 10, right: 30, bottom: 30, left: 90 },
        width = 800 - margin.left - margin.right,
        height = document.getElementById('overview').offsetHeight - margin.top - margin.bottom

    const svg = d3.select('#overview')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform',
            'translate(' + margin.left + ',' + margin.top + ')')

    const sumstats = d3.nest()
        .key(d => d.properties.name)
        .rollup(d => {
            const filteredData = data.filter(i => i.location === d[0].id)
            const standardDeviation = d3.deviation(filteredData, i => i.shake_intensity)
            const confidence99 = 2.58 * standardDeviation / Math.sqrt(filteredData.length) // 2.58 comes from N(0,1) and 99% confidence interval
            const confidence95 = 1.96 * standardDeviation / Math.sqrt(filteredData.length) // 1.96 comes from N(0,1) and 95% confidence interval
            const confidence80 = 1.28 * standardDeviation / Math.sqrt(filteredData.length) // 1.28 comes from N(0,1) and 80% confidence interval
            const mean = d3.mean(filteredData, i => i.shake_intensity)

            return ({ id: d[0].id, mean: mean, std: standardDeviation, confidence95: confidence95, confidence80: confidence80, confidence99: confidence99 })
        })
        .entries(regions.features)
        .sort((a,b) => d3.ascending(a.value.mean, b.value.mean))

    const regionNames = sumstats.map(d => d.key)

    const x = d3.scaleLinear()
        .range([0, width])
        .domain([0, 10])
    svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x))

    const y = d3.scaleBand()
        .range([height, 0])
        .domain(regionNames)
        .paddingInner(1)
        .paddingOuter(.5)
    svg.append('g')
        .call(d3.axisLeft(y))

    svg.selectAll('vertLines')
        .data(sumstats)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.value.mean))
        .attr('cy', d => y(d.key))
        .attr('r', 5)
        .style('fill', 'red')

    svg.selectAll('vertLines')
        .data(sumstats)
        .enter()
        .append('line')
        .attr('x1', d => x(d.value.mean - d.value.confidence95))
        .attr('x2', d => x(d.value.mean + d.value.confidence95))
        .attr('y1', d => y(d.key))
        .attr('y2', d => y(d.key))
        .attr('stroke', 'black')
        .style('stroke-width', 4)
}

// Design https://clauswilke.com/dataviz/visualizing-uncertainty.html
// https://d3-graph-gallery.com/graph/boxplot_several_groups.html