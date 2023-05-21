// set the dimensions and margins of the graph
const margin = { top: 10, right: 0, bottom: 30, left: 60 },
    width = document.getElementById('lineplot-canvas').offsetWidth - margin.left - margin.right,
    height = document.getElementById('lineplot-canvas').offsetHeight - margin.top - margin.bottom

// append the svg object to the body of the page
const svgChart = d3.select('#lineplot-canvas')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .append('g')
    .attr('transform',
        'translate(' + margin.left + ',' + margin.top + ')')

const numCharts = 3.5
function drawIndividualChart(yPosition, data, confidenceInterval, color) {
    // TODO Design
    // Add X axis --> it is a time format
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.time))
        .range([0, width])
    svgChart.append('g')
        .attr('transform', 'translate(0,' + yPosition + ')')
        .call(d3.axisBottom(x))

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.value), d3.max(data, d => d.value)])
        .range([yPosition, yPosition - height / numCharts]);

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

    // Add the confidence interval area
    const area = d3.area()
    .x(function(d) { return x(d.time); })
    .y0(function(d) { return y(d.lower); })
    .y1(function(d) { return y(d.upper); });

    svgChart.append('path')
    .datum(confidenceInterval)
    .attr('fill', color)
    .attr('opacity', 0.3)
    .attr('d', area);
}

//Problemet här ty skickar in bara 1 rad array n är alltid 1
// function calculateConfidenceInterval(data) {
//     // console.log(data)
//     const confidenceLevel = 0.95; // confidence level **
//     const n = data.length;
//     const mean = d3.mean(data);
//     // console.log("asddas: " + mean)
//     // console.log("n: " + n)
//     const standardError = d3.deviation(data) / Math.sqrt(n);
//     const degreesOfFreedom = n - 1;

//     const tValue = jStat.studentt.inv(1 - (1 - confidenceLevel) / 2, degreesOfFreedom);
//     // console.log("tValue: " + tValue)
//     const lower = mean - tValue * standardError;
//     const upper = mean + tValue * standardError;
  
//     return { lower, upper };
//   }
function calculateConfidenceInterval(data, confidenceLevel) {
    const n = data.length;
    const mean = d3.mean(data, d => d.value);
    const standardError = d3.deviation(data, d => d.value) / Math.sqrt(n);
    const degreesOfFreedom = n - 1;
  
    const tValue = jStat.studentt.inv(1 - (1 - confidenceLevel) / 2, degreesOfFreedom);
    const lower = mean - tValue * standardError;
    const upper = mean + tValue * standardError;
  
    return { lower, upper };
  }
  
  function tDistribution(degreesOfFreedom) {
    return x => jStat.studentt.cdf(x, degreesOfFreedom);
  }
  

function drawCharts(data, regionID, category) {
    svgChart.selectAll("*").remove()
    data = data.sort((a, b) => d3.ascending(a.time, b.time))
    const filteredData = data.filter(d => d.location === regionID)

    const shakeData = filteredData.map(d => { return { time: d.time, value: d.shake_intensity } })
    const chosenData = filteredData.map(d => { return { time: d.time, value: d[category] } })
    const powerData = filteredData.map(d => { return { time: d.time, value: d.power } })
    //console.log(chosenData)
    // const confidenceInterval = chosenData.map(d => {
    //     //  console.log("Before conversion:", d.time); 
    //     const parsedValue = parseFloat(d.value);
    //     // console.log("After conversion:", parsedValue); 
    //     const dataSubset = filteredData
    //       .filter(entry => entry.time === d.time)
    //       .map(entry => ({ time: entry.time, value: parsedValue }));
    //     //   console.log("Data Subset:", dataSubset); 
    //     return calculateConfidenceInterval(dataSubset);
    //   });
    const confidenceInterval = chosenData.map(d => {
        const dataSubset = filteredData.filter(entry => entry.time === d.time);
        return calculateConfidenceInterval(dataSubset, 0.95);
      });
      

    const spacing = 30

    drawIndividualChart(height / numCharts, shakeData, confidenceInterval, 'steelblue')
    //drawIndividualChart(3 * height / numCharts + 2 * spacing, chosenData, confidenceInterval, 'steelblue');
      //console.log(confidenceInterval)
    drawIndividualChart(3 * height / numCharts + 2 * spacing, chosenData, confidenceInterval, 'steelblue');

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

    drawIndividualChart(2 * height / numCharts + 1 * spacing, test, confidenceInterval, 'black')
}

// Downsampling timeseries data using the "Largest-Triangle-Three-Buckets algorithm" 
// (LTTB) as described in Sveinn Steinarsson's 2013 Master's thesis 
// Downsampling Time Series for Visual Representation.

// The algorithm is based on the technique of forming triangles between adjacent
//  data points and using the area of the triangles to determine the perceptual 
//  importance of the individual points. This helps to retain the visual characteristics
//  of the original path whilst greatly reducing the number of points representing it.
const downsampleButton = document.getElementById('downsample-button');
downsampleButton.addEventListener('click', () => {
    const desiredNumberOfPoints = 100; 

    const downsampledData = d3fc
      .sampleLargestTriangleThreeBucket()
      .xValue(d => d.time) 
      .yValue(d => d.value) 
      .bucketSize(desiredNumberOfPoints)
      .reduce(data); 

    chosenData = downsampledData;
    //Redraw deta funkar för tillfället inte
    drawCharts(data, regionID, category); 
  });
  
  