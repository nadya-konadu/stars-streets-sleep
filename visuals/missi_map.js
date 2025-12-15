console.log("missi_map.js loaded");

function drawMississaugaMap() {
var width = 500;
var height = 700;

var svg = d3.select("#missi-map")
  .attr("width", width)
  .attr("height", height);

// Projection + path
var projection = d3.geoMercator();
var path = d3.geoPath().projection(projection);

// Load Mississauga GeoJSON
d3.json("../data/cleaned/missi.geojson", function(error, geo) {
  if (error) {
    console.error("GeoJSON load error:", error);
    return;
  }

  // Auto-fit map to shape
  projection.fitSize([width, height], geo);

  // NOW load the CSV
  d3.csv("../data/cleaned/mississauga_monthsum.csv", function(error, data) {
    if (error) {
      console.error("CSV load error:", error);
      return;
    }

    console.log("CSV data:", data);

    var monthNames = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
      ];

    // Simple color scale (we’ll refine later)
    var color = d3.scaleSequential(d3.interpolateViridis)
    .domain(d3.extent(data, d => +d.mean_rad))  // placeholder domain

    
    var mapPath = svg.selectAll("path")
    .data(geo.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("stroke", "#9ad7ff")
    .attr("stroke-width", 2);

    function updateMap(monthIndex) {
        d3.select("#month-label")
            .text(monthNames[monthIndex]);

        var meanRad = +data[monthIndex].mean_rad;
        mapPath
            .interrupt()  
            .transition()
            .duration(300)
            .ease(d3.easeSinInOut)
            .attr("fill", color(meanRad));
      }

      updateMap(0);


      // =====================================================
    // 👇👇👇 LEGEND CODE GOES HERE (AFTER MAP IS DRAWN)
    // =====================================================

    var legendWidth = 200;
    var legendHeight = 12;

    // Define gradient
    var defs = svg.append("defs");

    var linearGradient = defs.append("linearGradient")
      .attr("id", "viridis-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    linearGradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.01))
      .enter()
      .append("stop")
      .attr("offset", d => (d * 100) + "%")
      .attr("stop-color", d => d3.interpolateViridis(d));

    // Legend group
    var legend = svg.append("g")
      .attr("transform", "translate(20, 20)");

    // Gradient bar
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#viridis-gradient)");

    // Labels
    legend.append("text")
      .attr("x", 0)
      .attr("y", legendHeight + 18)
      .text("Low light")
      .attr("fill", "#dbe7ff")
      .attr("font-size", "12px");

    legend.append("text")
      .attr("x", legendWidth)
      .attr("y", legendHeight + 18)
      .attr("text-anchor", "end")
      .text("High light")
      .attr("fill", "#dbe7ff")
      .attr("font-size", "12px");

      
    monthSlider(d3.select("#month-slider"), function(monthIndex) {
        updateMap(monthIndex);

    
    });

  });
});

}
drawMississaugaMap();