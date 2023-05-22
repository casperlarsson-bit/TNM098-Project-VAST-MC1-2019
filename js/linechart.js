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
function drawIndividualChart(yPosition, data, color, stroke) {
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
        .domain([0, 10])
        .range([yPosition, yPosition - height / numCharts])
    svgChart.append('g')
        .call(d3.axisLeft(y))

  // Add the line with smooth curve
  svgChart.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', stroke)
    .attr('d', d3.line()
      .x(d => x(d.time))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX) // Add this line for smooth curve
    );
}
// Define the movingAverage function
function movingAverage2(data, windowSize) {
    const averagedData = [];
  
    for (let i = 0; i < data.length; i++) {
      const startIndex = Math.max(0, i - windowSize + 1);
      const endIndex = i + 1;
      const windowData = data.slice(startIndex, endIndex);
      const average = d3.mean(windowData, d => d.shake_intensity);
  
      averagedData.push({
        time: data[i].time,
        shake_intensity: average
      });
    }
  
    return averagedData;
  }

function drawCharts(data, regionID, category) {
    svgChart.selectAll("*").remove()
    data = data.sort((a, b) => d3.ascending(a.time, b.time))
    const filteredData = data.filter(d => d.location === regionID)

    //Simple downsampling test 10 intervall
  // const downsampledData = filteredData.filter((d, i) => i % 10 === 0);
    //LTOB method downsampleData(data, threshhold)
//   const downsampledData = downsampleData(interpolatedData, 0.8);
  console.log(filteredData)
const downsampledData = movingAverage2(filteredData, 50);
// const downsampledData = downsamplePaa(data, 100);
// downsamplePaa()
    console.log(downsampledData)
  const shakeData = downsampledData.map(d => ({ time: d.time, value: d.shake_intensity }));
  const shakeDataOG = filteredData.map(d => ({ time: d.time, value: d.shake_intensity }));
  const chosenData = filteredData.map(d => ({ time: d.time, value: d[category] }));
  const powerData = filteredData.map(d => ({ time: d.time, value: d.power }));

    const spacing = 30
    //1
    drawIndividualChart(height / numCharts, shakeDataOG, 'steelblue', 0.5)
    drawIndividualChart(height / numCharts, shakeData, 'red', 1)
    //3
    drawIndividualChart(3 * height / numCharts + 2 * spacing, chosenData, 'steelblue', 0.5)

    // const movingAverage = d3.nest()
    //     .key(d => d.location)
    //     .rollup(dataLocation => {
    //         const time = dataLocation.map(d => d.time)

    //         const numAverages = 7
    //         const shake_intensity = dataLocation.map(d => d.shake_intensity)
    //         const average = []
    //         for (let i = 1; i <= shake_intensity.length; ++i) {
    //             const partArray = shake_intensity.slice(d3.max([i - numAverages, 0]), i)
    //             average.push(d3.mean(partArray))
    //         }

    //         return ({ time: time, movingAverage: average })
    //     })
    //     .entries(filteredData)

    // const test = filteredData.map((d, i) => { return { time: d.time, value: movingAverage[0].value.movingAverage[i] } })
    //2
    drawIndividualChart(2 * height / numCharts + 1 * spacing, powerData, 'black', 0.5)
}


//Insipred by LTOB https://github.com/d3fc/d3fc/tree/master/examples/sample/
//Fungerar inte med irregulärt samplad data
//Kika på denna imrogon https://www.earthinversion.com/techniques/how-to-deal-with-irregular-sparse-data-set/
// function downsampleData(data, threshold) {
//     const n = data.length;
//     if (n <= 2) {
//       return data;
//     }
  
//     const sampledData = [data[0]]; //Save first
//     //Indexering
//     let bucketStart = 0;
//     let bucketEnd = 1;
//     let bucketMaxIndex = 0;
//     let bucketMaxDistance = 0;
  
//     for (let i = 2; i < n; i++) {
//       const distance = computeArea(data[bucketStart], data[bucketEnd], data[i]);
//       if (distance > bucketMaxDistance) {
//         bucketMaxDistance = distance;
//         bucketMaxIndex = i;
//       }
  
//       if (i === n - 1 || distance > threshold) {
//         sampledData.push(data[bucketMaxIndex]);
//         bucketStart = bucketMaxIndex;
//         bucketEnd = i;
//         bucketMaxIndex = i;
//         bucketMaxDistance = 0;
//       }
//     }
//     //Save tail
//     sampledData.push(data[n - 1]);
//     return sampledData;
//   }
  
//   function computeArea(a, b, c) {
//     return Math.abs((b.time - a.time) * (c.value - a.value) - (b.value - a.value) * (c.time - a.time));
//   }