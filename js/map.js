const width = 900
const height = 600
const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)

const projection = d3.geoEquirectangular()
.center([80, -50])
    .translate([width / 2, height / 2]) // translate to center of screen
    .scale([300]) // Temp scape
    

const path = d3.geoPath().projection(projection)


d3.json("data/map.json", function (error, regions) {
    if (error) throw error

    function getColor(value) {
        const colorScale = d3.scaleSequential(d3.interpolateRgb("#e4f2e4", "green"))
            .domain([0, regions.features.length])
        return colorScale(value)
    }

    svg.selectAll('path')
        .data(regions.features)
        .enter()
        .append('path')
        .attr("d", path)
        .attr('class', 'region')
        .style('fill', (d) => getColor(d.id))

    d3.selectAll('.region')
        .on('click', (d) => {
            console.log(d.id)
        })
})