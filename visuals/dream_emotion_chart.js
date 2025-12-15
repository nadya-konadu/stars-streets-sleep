console.log("dream_emotion_chart.js loaded");

function drawDreamEmotionChart() {

  // margins + overall chart size
  var margin = { top: 40, right: 120, bottom: 50, left: 50 },
      width = 700 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  // main svg container
  var svg = d3.select("#dream-emotion-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // load the wide-format monthly emotion data
  d3.csv("../data/cleaned/dream_emotion_month_wide.csv", function(data) {

    // convert everything to numbers
    data.forEach(d => {
      d.month = +d.month;
      d.Joy = +d.Joy;
      d.Cognitive = +d.Cognitive;
      d.Fear = +d.Fear;
      d.Anger = +d.Anger;
      d.Sadness = +d.Sadness;
    });

    // emotion order for stacking
    var keys = ["Joy", "Cognitive", "Fear", "Anger", "Sadness"];

    // shared x + y scales
    var x = d3.scaleLinear()
      .domain([1, 12])
      .range([0, width]);

    var y = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    // color mapping for emotions
    var color = d3.scaleOrdinal()
      .domain(keys)
      .range([
        "#F0E442",
        "#E69F00",
        "#CC79A7",
        "#D55E00",
        "#0072B2"
      ]);

    // stack the data so areas add up to 100%
    var stackedData = d3.stack()
      .keys(keys)
      (data);

    // subtle horizontal gridlines to help read proportions
    var yGrid = d3.axisLeft(y)
      .ticks(5)
      .tickSize(-width)
      .tickFormat("");

    svg.append("g")
      .attr("class", "y-grid")
      .call(yGrid)
      .selectAll("line")
      .attr("stroke", "#dbe7ff")
      .attr("opacity", 0.15)
      .attr("stroke-dasharray", "2,4");

    svg.select(".y-grid path").remove();

    // x and y axes
    var xAxis = svg.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x).ticks(12));

    var yAxis = svg.append("g")
      .attr("class", "axis y-axis")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));

    // baseline at zero
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(0))
      .attr("y2", y(0))
      .attr("stroke", "#dbe7ff")
      .attr("opacity", 0.3);

    // axis styling
    xAxis.selectAll("text")
      .attr("fill", "#dbe7ff")
      .style("font-size", "12px");

    xAxis.selectAll("line, path")
      .attr("stroke", "#dbe7ff")
      .attr("opacity", 0.6);

    yAxis.selectAll("text")
      .attr("fill", "#dbe7ff")
      .style("font-size", "12px");

    yAxis.selectAll("line, path")
      .attr("stroke", "#dbe7ff")
      .attr("opacity", 0.6);

    // axis labels / context text
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 41)
      .attr("text-anchor", "middle")
      .attr("fill", "#9aa3ff")
      .style("font-size", "12px")
      .text("Month (2025)");

    svg.append("text")
      .attr("x", 0)
      .attr("y", -15)
      .attr("text-anchor", "start")
      .attr("fill", "#9aa3ff")
      .style("font-size", "12px")
      .style("letter-spacing", "0.08em")
      .style("text-transform", "uppercase")
      .text("Share of dreams in each emotional category (%)");

    // vertical guide line that follows the mouse
    var guideLine = svg.append("line")
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#6b6fe3")
      .attr("stroke-width", 4)
      .attr("stroke-dasharray", "6,4")
      .attr("opacity", 0)
      .style("pointer-events", "none");

    // area generator for stacked chart
    var area = d3.area()
      .x(d => x(d.data.month))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    // draw stacked emotion layers
    svg.selectAll(".layer")
      .data(stackedData)
      .enter()
      .append("path")
      .attr("class", "layer")
      .attr("fill", d => color(d.key))
      .attr("opacity", 0.9)
      .attr("d", area);

    // interaction state for locking a month
    var lockedMonth = null;

    // invisible overlay to capture mouse movement
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .on("mousemove", function () {
        if (lockedMonth !== null) return;

        var mouseX = d3.mouse(this)[0];
        var month = Math.round(x.invert(mouseX));
        month = Math.max(1, Math.min(12, month));

        guideLine
          .attr("x1", x(month))
          .attr("x2", x(month))
          .attr("opacity", 0.9);
      })
      .on("mouseout", function () {
        if (lockedMonth === null) guideLine.attr("opacity", 0);
      })
      .on("click", function () {
        var mouseX = d3.mouse(this)[0];
        var month = Math.round(x.invert(mouseX));
        month = Math.max(1, Math.min(12, month));

        lockedMonth = month;

        d3.select("#emotion-subtitle")
          .text(`Emotion breakdown — Month ${month}`);

        guideLine
          .attr("x1", x(month))
          .attr("x2", x(month))
          .attr("opacity", 1);

        // update bar chart for the selected month
        drawEmotionBarChart(month);
      });

    // legend for emotion colors
    var legend = svg.append("g")
      .attr("transform", "translate(" + (width + 20) + ", 20)");

    keys.forEach(function(key, i) {
      var g = legend.append("g")
        .attr("transform", "translate(0," + (i * 22) + ")");

      g.append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", color(key));

      g.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(key)
        .attr("fill", "#dbe7ff")
        .style("font-size", "13px");
    });
  });
}

// bar chart that updates when a month is clicked
function drawEmotionBarChart(selectedMonth) {

  var margin = { top: 20, right: 10, bottom: 80, left: 10 },
      width = 300 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var svg = d3.select("#emotion-bar-chart");

  // only set up axes once
  if (svg.select("g").empty()) {
    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("class", "plot")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.select(".plot")
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", height)
      .attr("y2", height)
      .attr("stroke", "#dbe7ff")
      .attr("opacity", 0.3);

    svg.select(".plot")
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`);
  }

  var plot = svg.select(".plot");

  // load long-format emotion data
  d3.csv("../data/cleaned/dream_emotion_long.csv", function(data) {

    data.forEach(d => {
      d.month = +d.month;
      d.prop = +d.prop;
    });

    // filter to just the selected month
    var monthData = data.filter(d => d.month === selectedMonth);

    // sum proportions by emotion
    var categoryData = d3.nest()
      .key(d => d.category)
      .rollup(v => d3.sum(v, d => d.prop))
      .entries(monthData)
      .map(d => ({ category: d.key, value: d.value }));

    var x = d3.scaleBand()
      .domain(categoryData.map(d => d.category))
      .range([0, width])
      .padding(0.3);

    var y = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    // background gridlines for the bars
    var yGrid = d3.axisLeft(y)
      .ticks(5)
      .tickSize(-width)
      .tickFormat("");

    plot.selectAll(".y-grid").remove();

    plot.insert("g", ":first-child")
      .attr("class", "y-grid")
      .call(yGrid)
      .selectAll("line")
      .attr("stroke", "#dbe7ff")
      .attr("opacity", 0.15)
      .attr("stroke-dasharray", "2,4");

    plot.select(".y-grid path").remove();

    plot.select(".x-axis")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("fill", "#dbe7ff")
      .style("font-size", "11px");

    var color = d3.scaleOrdinal()
      .domain(["Joy", "Cognitive", "Fear", "Anger", "Sadness"])
      .range(["#F0E442", "#E69F00", "#CC79A7", "#D55E00", "#0072B2"]);

    var bars = plot.selectAll("rect.bar")
      .data(categoryData, d => d.category);

    bars.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.category))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", d => color(d.category))
      .merge(bars)
      .transition()
      .duration(600)
      .ease(d3.easeCubicOut)
      .attr("y", d => y(d.value))
      .attr("height", d => height - y(d.value));

    bars.exit()
      .transition()
      .duration(300)
      .attr("y", height)
      .attr("height", 0)
      .remove();
  });
}

drawDreamEmotionChart();
