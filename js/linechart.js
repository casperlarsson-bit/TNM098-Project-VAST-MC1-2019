// set the dimensions and margins of the graph
const margin = { top: 50, right: 0, bottom: 30, left: 60 },
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
function drawIndividualChart(yPosition, data, color, stroke, label) {
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
  //Label
  svgChart.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -margin.left)
    .attr('x', -(yPosition - height / (numCharts * 2)))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .classed('axis-label', true)
    .text(label)
  // add line
  svgChart.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', color)
    .attr('stroke-width', stroke)
    .attr('d', d3.line()
      .x(d => x(d.time))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX) //Smooth curve 
    )

  // Add legend
  const legend = svgChart.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(' + (width - 100) + ', 20)')

  // label 1
  legend.append('rect')
    .attr('x', -15)
    .attr('y', -15)
    .attr('width', 10)
    .attr('height', 10)
    .attr('fill', 'steelblue')

  legend.append('text')
    .attr('x', 0)
    .attr('y', -10)
    .attr('dy', '0.35em')
    .text('Reports')

  // label 2
  legend.append('rect')
    .attr('x', -15)
    .attr('y', 5)
    .attr('width', 10)
    .attr('height', 10)
    .attr('fill', 'red')

  legend.append('text')
    .attr('x', 0)
    .attr('y', 10)
    .attr('dy', '0.35em')
    .text('Moving avg')
}

// Define the movingAverage function
function movingAverage(data, windowSize, category) {
  const averagedData = []

  for (let i = 0; i < data.length; i++) {
    const startIndex = Math.max(0, i - windowSize + 1)
    const endIndex = i + 1
    const windowData = data.slice(startIndex, endIndex)
    const avg1 = d3.mean(windowData, d => d.shake_intensity)
    const avg2 = d3.mean(windowData, d => d.power)
    const avg3 = d3.mean(windowData, d => d[category])

    averagedData.push({
      time: data[i].time,
      shake_intensity: avg1,
      power: avg2,
      [category]: avg3
    })
  }

  return averagedData
}

function drawCharts(data, regionID, category) {
  if (regionID == null) return
  svgChart.selectAll("*").remove()
  data = data.sort((a, b) => d3.ascending(a.time, b.time))
  const filteredData = data.filter(d => d.location === regionID)

  //Simple downsampling test 10 intervall
  // const downsampledData = filteredData.filter((d, i) => i % 10 === 0)

  const movAvgData = movingAverage(filteredData, 50, category)

  const shakeDataMavg = movAvgData.map(d => ({ time: d.time, value: d.shake_intensity }))
  const shakeData = filteredData.map(d => ({ time: d.time, value: d.shake_intensity }))

  const choosenMavg = movAvgData.map(d => ({ time: d.time, value: d[category] }))
  const chosenData = filteredData.map(d => ({ time: d.time, value: d[category] }))

  const powerDataMavg = movAvgData.map(d => ({ time: d.time, value: d.power }))
  const powerData = filteredData.map(d => ({ time: d.time, value: d.power }))

  const spacing = 30
  //1
  drawIndividualChart(height / numCharts, shakeData, 'steelblue', 0.5, 'Shake Data')
  drawIndividualChart(height / numCharts, shakeDataMavg, 'red', 1)
  //2
  drawIndividualChart(2 * height / numCharts + 1 * spacing, powerData, 'steelblue', 0.5, 'Power Data')
  drawIndividualChart(2 * height / numCharts + 1 * spacing, powerDataMavg, 'red', 1)
  //3
  drawIndividualChart(3 * height / numCharts + 2 * spacing, chosenData, 'steelblue', 0.5, document.getElementById('select-category').value)
  drawIndividualChart(3 * height / numCharts + 2 * spacing, choosenMavg, 'red', 1)
}
