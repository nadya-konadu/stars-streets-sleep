console.log("dream_emotion_chart.js loaded");

function drawDreamEmotionChart() {

  // =====================
  // SETUP
  // =====================
//   var margin = { top: 40, right: 120, bottom: 50, left: 50 },
//       width = 800 - margin.left - margin.right,
//       height = 500 - margin.top - margin.bottom;

      var margin = { top: 40, right: 120, bottom: 50, left: 50 },
      width = 700 - margin.left - margin.right,   // ⬅️ was 800
      height = 500 - margin.top - margin.bottom

  var svg = d3.select("#dream-emotion-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // =====================
  // LOAD DATA
  // =====================
  d3.csv("../data/cleaned/dream_emotion_month_wide.csv", function(data) {

    data.forEach(d => {
      d.month = +d.month;
      d.Joy = +d.Joy;
      d.Cognitive = +d.Cognitive;
      d.Fear = +d.Fear;
      d.Anger = +d.Anger;
      d.Sadness = +d.Sadness;
    });

    var keys = ["Joy", "Cognitive", "Fear", "Anger", "Sadness"];

    // =====================
    // SCALES
    // =====================
    var x = d3.scaleLinear()
      .domain([1, 12])
      .range([0, width]);

    var y = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    var color = d3.scaleOrdinal()
      .domain(keys)
      .range([
        "#F0E442", // Joy
        "#E69F00", // Cognitive
        "#CC79A7", // Fear
        "#D55E00", // Anger
        "#0072B2"  // Sadness
      ]);

     
    // =====================
    // STACK
    // =====================
    var stackedData = d3.stack()
      .keys(keys)
      (data);

    // =====================
    // AXES
    // =====================
    var xAxis = svg.append("g").attr("class", "axis x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(12));

    var yAxis = svg.append("g").attr("class", "axis y-axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));

    svg.append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", y(0))
    .attr("y2", y(0))
    .attr("stroke", "#dbe7ff")
    .attr("opacity", 0.3);

    // Style X axis
    xAxis.selectAll("text")
    .attr("fill", "#dbe7ff")
    .style("font-size", "12px");

    xAxis.selectAll("line, path")
    .attr("stroke", "#dbe7ff")
    .attr("opacity", 0.6);

    // Style Y axis
    yAxis.selectAll("text")
    .attr("fill", "#dbe7ff")
    .style("font-size", "12px");

    yAxis.selectAll("line, path")
    .attr("stroke", "#dbe7ff")
    .attr("opacity", 0.6);


    svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 41)
    .attr("text-anchor", "middle")
    .attr("fill", "#9aa3ff")        // softer purple
    .style("font-size", "12px")
    .text("Month (2025)");
    
    svg.append("text")
    .attr("x", 0)
    .attr("y", -15)
    .attr("text-anchor", "start")
    .attr("fill", "#9aa3ff")        // softer purple
    .style("font-size", "12px")
    .style("letter-spacing", "0.08em")
    .style("text-transform", "uppercase")
    .text("Share of dreams in each emotional category (%)");

    var guideLine = svg.append("line")
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "#6b6fe3")        // dark purple
    .attr("stroke-width", 4)          // thicker
    .attr("stroke-dasharray", "6,4")  // longer dashes
    .attr("opacity", 0)               // still hidden until hover
    .style("pointer-events", "none")
    .style("filter", "drop-shadow(0 0 6px rgba(107,111,227,0.6))");
    

    // =====================
    // AREA GENERATOR
    // =====================
    var area = d3.area()
      .x(d => x(d.data.month))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    // =====================
    // DRAW AREAS
    // =====================
    svg.selectAll(".layer")
      .data(stackedData)
      .enter()
      .append("path")
      .attr("class", "layer")
      .attr("fill", d => color(d.key))
      .attr("opacity", 0.9)
      .attr("d", area)
  //     .on("click", function(event, d) {
  //        // mouse position (D3 v4)
  //       var mouseX = d3.mouse(this)[0];

  //       // pixel → month
  //       var clickedMonth = Math.round(x.invert(mouseX));

  //       console.log("Clicked month:", clickedMonth);

  //       // update bar chart
  //       drawEmotionBarChart(clickedMonth);
  // });
  var lockedMonth = null;

  svg.append("rect")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "transparent")

  .on("mousemove", function () {
    if (lockedMonth !== null) return;
    var mouse = d3.mouse(this);
    var mouseX = mouse[0];

    var month = Math.round(x.invert(mouseX));
    month = Math.max(1, Math.min(12, month));

    guideLine
      .attr("x1", x(month))
      .attr("x2", x(month))
      .attr("opacity", 0.9);
  })

  .on("mouseout", function () {
    if (lockedMonth === null) {
      guideLine.attr("opacity", 0);
    }
  })

  .on("click", function () {
    var mouse = d3.mouse(this);
    var mouseX = mouse[0];

    var month = Math.round(x.invert(mouseX));
    month = Math.max(1, Math.min(12, month));

    lockedMonth = month;
    d3.select("#emotion-subtitle")
    .text(`Emotion breakdown — Month ${month}`);

    guideLine
      .attr("x1", x(month))
      .attr("x2", x(month))
      .attr("opacity", 1);

    console.log("Clicked month:", month);
    drawEmotionBarChart(month);
  });

    // =====================
    // LEGEND
    // =====================
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
function drawEmotionBarChart(selectedMonth) {
  var margin = { top: 20, right: 10, bottom: 80, left: 10 },
      width = 300 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  // Clear previous chart
  var svg = d3.select("#emotion-bar-chart");

  // create SVG only once
  if (svg.select("g").empty()) {
    svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("class", "plot")
      .attr("transform", `translate(${margin.left},${margin.top})`);

       // baseline
    svg.select(".plot")
    .append("line")
    .attr("class", "baseline")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", height)
    .attr("y2", height)
    .attr("stroke", "#dbe7ff")
    .attr("opacity", 0.3);

  // x-axis group
  svg.select(".plot")
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`);
  }


  var plot = svg.select(".plot");

  var svg = d3.select("#emotion-bar-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("../data/cleaned/dream_emotion_long.csv", function(data) {

      data.forEach(d => {
        d.month = +d.month;
        d.prop = +d.prop;
      });
    
      var monthData = data.filter(d => d.month === selectedMonth);
    
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
    
      var color = d3.scaleOrdinal()
        .domain(["Joy", "Cognitive", "Fear", "Anger", "Sadness"])
        .range(["#F0E442", "#E69F00", "#CC79A7", "#D55E00", "#0072B2"]);
    
      // UPDATE x-axis
      plot.select(".x-axis")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("fill", "#dbe7ff")
        .style("font-size", "11px");
    
      // DATA JOIN
      var bars = plot.selectAll("rect.bar")
        .data(categoryData, d => d.category);
    
      // ENTER
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
        .attr("x", d => x(d.category))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value));
    
      // EXIT (not really needed, but clean)
      bars.exit()
        .transition()
        .duration(300)
        .attr("height", 0)
        .attr("y", height)
        .remove();
    });
}
// =====================
// CALL FUNCTION
// =====================
drawDreamEmotionChart();
