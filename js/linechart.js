// set the dimensions and margins of the graph
var margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 1200 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom

// append the svg object to the body of the page
var svg = d3.select("#line-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")")

//Read the data
d3.csv("data/mc1-reports-data.csv",

    // When reading the csv, perform time format
    function (d) {
        return { time: d3.timeParse('%Y-%m-%d %H:%M:%S')(d.time), value: d.sewer_and_water, location: d.location }
    },

    // Now I can use this dataset:
    function (data) {    
        return
        data = data.sort((a, b) => d3.ascending(a.time, b.time))
        data = data.filter(d => d.location == 4)
        // Add X axis --> it is a time format
        var x = d3.scaleTime()
            .domain(d3.extent(data, function (d) { return d.time }))
            .range([0, width])
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))

        // Add Y axis
        var y = d3.scaleLinear()
            .domain([0, d3.max(data, function (d) { return +d.value })])
            .range([height, 0])
        svg.append("g")
            .call(d3.axisLeft(y))

        // Add the line
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function (d) { return x(d.time) })
                .y(function (d) { return y(d.value) })
            )

    })