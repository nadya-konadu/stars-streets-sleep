console.log("Radial emotion chart loaded");

function drawRadialEmotion() {

  // basic sizing for the whole row of donuts
  const width = 1100;
  const height = 300;
  const radius = 90;
  const innerR = 40;

  // tooltip that follows the mouse when hovering slices
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "radial-tooltip")
    .style("position", "fixed")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // load the summarized emotion + light data
  d3.csv("../data/cleaned/light_emotion_radial.csv", function(error, data) {
    if (error) throw error;

    // make sure proportions are numbers
    data.forEach(d => {
      d.prop = +d.prop;
    });

    // split data into low / medium / high light groups
    const groups = d3.nest()
      .key(d => d.light_group)
      .entries(data);

    // main svg that holds all three donuts
    const svg = d3.select("#radial-small-multiples")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // defs for glow effect around the halo ring
    const defs = svg.append("defs");

    const glow = defs.append("filter")
      .attr("id", "halo-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    // inner blur
    glow.append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", 3)
      .attr("result", "blur1");

    // outer blur
    glow.append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", 8)
      .attr("result", "blur2");

    // merge the blur layers with the original shape
    const merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur2");
    merge.append("feMergeNode").attr("in", "blur1");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    // x positions for the three light-level donuts
    const center = width / 2;
    const spacing = 260;

    const xPos = {
      Low: center - spacing,
      Medium: center,
      High: center + spacing
    };

    // color scale for emotion categories
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.emotion))
      .range([
        "#0072B2",
        "#E69F00",
        "#009E73",
        "#CC79A7"
      ]);

    // build legend using the emotion categories
    const emotions = color.domain();
    const legend = d3.select("#emotion-legend");

    legend.selectAll(".legend-item")
      .data(emotions)
      .enter()
      .append("div")
      .attr("class", "legend-item")
      .each(function(d) {
        const item = d3.select(this);
        item.append("div")
          .attr("class", "legend-swatch")
          .style("background", color(d));
        item.append("div").text(d);
      });

    // pie layout converts proportions into angles
    const pie = d3.pie()
      .value(d => d.prop)
      .sort(null);

    // arc for the actual donut slices
    const arc = d3.arc()
      .innerRadius(innerR)
      .outerRadius(radius);

    // slightly bigger arc for the glow/halo ring
    const haloArc = d3.arc()
      .innerRadius(radius - 1)
      .outerRadius(radius + 8);

    // halo brightness differs by light level
    const haloOpacity = {
      Low: 0.15,
      Medium: 0.29,
      High: 0.45
    };

    // draw one donut per light group
    groups.forEach(group => {

      const g = svg.append("g")
        .attr("transform", `translate(${xPos[group.key]}, ${height / 2})`);

      // halo ring behind the donut
      g.selectAll(".halo")
        .data(pie(group.values))
        .enter()
        .append("path")
        .attr("class", "halo")
        .attr("d", haloArc)
        .attr("fill", "#ffffff")
        .attr("opacity", haloOpacity[group.key])
        .style("filter", "url(#halo-glow)");

      // actual donut slices for emotions
      g.selectAll(".slice")
        .data(pie(group.values))
        .enter()
        .append("path")
        .attr("class", "slice")
        .attr("d", arc)
        .attr("fill", d => color(d.data.emotion))
        .attr("opacity", 0.95)

        // hover one emotion -> highlight it across all donuts
        .on("mouseover", function(d) {
          const emotion = d.data.emotion;

          d3.selectAll(".slice")
            .transition()
            .duration(200)
            .attr("opacity", s =>
              s.data.emotion === emotion ? 1 : 0.15
            );

          tooltip
            .style("opacity", 1)
            .html(`
              <strong>${emotion}</strong><br/>
              ${(d.data.prop * 100).toFixed(1)}% of dreams<br/>
              <span style="opacity:0.7; font-size:11px;">
                (within ${group.key.toLowerCase()} light)
              </span>
            `);
        })

        // keep tooltip near the cursor
        .on("mousemove", function() {
          tooltip
            .style("left", (d3.event.clientX + 14) + "px")
            .style("top", (d3.event.clientY + 14) + "px");
        })

        // reset opacity + hide tooltip
        .on("mouseout", function() {
          d3.selectAll(".slice")
            .transition()
            .duration(200)
            .attr("opacity", 0.95);

          tooltip.style("opacity", 0);
        });

      // title above each donut
      g.append("text")
        .attr("y", -radius - 32)
        .attr("text-anchor", "middle")
        .style("fill", "#dbe7ff")
        .style("font-size", "14px")
        .style("letter-spacing", "0.08em")
        .text(group.key.toUpperCase() + " LIGHT");
    });
  });
}

drawRadialEmotion();
