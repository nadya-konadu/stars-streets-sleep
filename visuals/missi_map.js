console.log("missi_map.js loaded");

function drawMississaugaMap() {
  // basic svg size for the map
  var width = 500;
  var height = 700;

  // grab the svg and set its size
  var svg = d3.select("#missi-map")
    .attr("width", width)
    .attr("height", height);

  // map projection + path generator
  var projection = d3.geoMercator();
  var path = d3.geoPath().projection(projection);

  // load mississauga boundary geometry
  d3.json("../data/cleaned/missi.geojson", function(error, geo) {
    if (error) {
      console.error("GeoJSON load error:", error);
      return;
    }

    // auto-scale projection so the city fits the svg
    projection.fitSize([width, height], geo);

    // now load the monthly brightness data
    d3.csv("../data/cleaned/mississauga_monthsum.csv", function(error, data) {
      if (error) {
        console.error("CSV load error:", error);
        return;
      }

      console.log("CSV data:", data);

      // month labels for the slider + display text
      var monthNames = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
      ];

      // color scale for mean nighttime brightness
      var color = d3.scaleSequential(d3.interpolateViridis)
        .domain(d3.extent(data, d => +d.mean_rad));

      // draw the city shape once
      var mapPath = svg.selectAll("path")
        .data(geo.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "#9ad7ff")
        .attr("stroke-width", 2);

      // update fill color + month label when slider moves
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

      // initialize map to january
      updateMap(0);

      // legend sizing
      var legendWidth = 200;
      var legendHeight = 12;

      // gradient definition for legend
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

      // legend container
      var legend = svg.append("g")
        .attr("transform", "translate(20, 20)");

      // gradient bar
      legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#viridis-gradient)");

      // legend labels
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

      // hook the slider up to the map update
      monthSlider(d3.select("#month-slider"), function(monthIndex) {
        updateMap(monthIndex);
      });

    });
  });
}

drawMississaugaMap();
