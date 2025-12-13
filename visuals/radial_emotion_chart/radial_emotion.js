console.log("Radial wheels loaded");

const WIDTH = 750;
const HEIGHT = 400;      
const RADIUS = 120;
const INNER_R = 40;

const monthNames = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

// brightness catgeories
function brightnessCategory(v) {
  if (v < 39) return "low";
  if (v < 60) return "medium";
  return "high";
}

const haloColors = {
  low:    "#2b3a67",
  medium: "#6a4fbf",
  high:   "#ff5bb7"
};

d3.csv("../../data/cleaned/dreams_with_light_full_2025.csv").then(data => {

  data.forEach(d => {
    d.year = +d.year;
    d.month = +d.month;
    d.valence_mean = +d.valence_mean;
    d.mean_rad = +d.mean_rad;
  });

  const filtered = data.filter(d => d.year === 2025);


  const minValence = d3.min(filtered, d => d.valence_mean);
  const maxValence = d3.max(filtered, d => d.valence_mean);

  console.log("MIN VALENCE:", minValence);
  console.log("MAX VALENCE:", maxValence);

 
  const valenceColor = d3.scaleSequential()
    .domain([minValence, maxValence])
    .interpolator(d3.interpolateRdYlBu);

  
  const grouped = d3.rollup(
    filtered,
    v => ({
      valence: d3.mean(v, d => d.valence_mean),
      rad: d3.mean(v, d => d.mean_rad)
    }),
    d => d.city,
    d => d.month
  );

  const TOR = grouped.get("Toronto");
  const MIS = grouped.get("Mississauga");

  //debug
  if (!TOR || !MIS) {
    console.error("Missing city data.");
    return;
  }

  const cities = [
    { name: "Toronto", data: TOR },
    { name: "Mississauga", data: MIS }
  ];

  const svg = d3.select("#radial-emotion-chart")
    .append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("padding", "6px 10px")
    .style("background", "#111")
    .style("color", "#fff")
    .style("font-size", "12px")
    .style("border-radius", "6px")
    .style("opacity", 0)
    .style("pointer-events","none");

  const wheelGroup = svg.append("g")
    .attr("transform", `translate(${WIDTH / 2}, ${HEIGHT / 2})`);

  // layout left + right
  const cityPositions = {
    Toronto:      { x: -200, y: 0 },
    Mississauga:  { x:  200, y: 0 }
  };
  const angle = d3.scaleLinear()
    .domain([1, 13])
    .range([0, 2 * Math.PI]);

 
  cities.forEach(city => {
    const g = wheelGroup.append("g")
      .attr("transform", `translate(${cityPositions[city.name].x},${cityPositions[city.name].y})`);

    // Halo ring (brightness)
    const halo = d3.arc()
      .innerRadius(RADIUS + 15)
      .outerRadius(RADIUS + 35);

    g.selectAll(".halo-slice")
      .data(Array.from(city.data.entries()))
      .enter()
      .append("path")
      .attr("d", ([month, vals]) =>
        halo({
          startAngle: angle(month),
          endAngle: angle(month + 1)
        })
      )
      .attr("fill", ([m, v]) => haloColors[brightnessCategory(v.rad)])
      .attr("opacity", 0.9);

    // valence slicing
    const valSlice = d3.arc()
      .innerRadius(INNER_R)
      .outerRadius(RADIUS);

    g.selectAll(".valence")
      .data(Array.from(city.data.entries()))
      .enter()
      .append("path")
      .attr("d", ([month, vals]) =>
        valSlice({
          startAngle: angle(month),
          endAngle: angle(month + 1)
        })
      )
      .attr("fill", ([m, v]) => valenceColor(v.valence))
      .on("mousemove", (event, [m, v]) => {
        tooltip.style("opacity", 1)
          .html(`
            <b>${city.name}</b><br>
            ${monthNames[m - 1]} 2025<br><br>
            <b>Valence:</b> ${v.valence.toFixed(2)}<br>
            <b>Brightness (mean_rad):</b> ${v.rad.toFixed(2)}
          `)
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY + 12 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // city labels
    g.append("text")
      .attr("y", -RADIUS - 55)
      .attr("text-anchor", "middle")
      .text(city.name.toUpperCase())
      .style("fill", "#f5f3ff")
      .style("font-size", "22px")
      .style("font-weight", "700");

  
    // month labels
    g.selectAll(".month-label")
      .data(Array.from(city.data.keys()))
      .enter()
      .append("text")
      .attr("class", "month-label")
      .attr("x", d => Math.cos(angle(d) + Math.PI/12) * (RADIUS + 48))
      .attr("y", d => Math.sin(angle(d) + Math.PI/12) * (RADIUS + 48))
      .text(d => monthNames[d - 1])
      .style("fill", "#ddd")
      .style("font-size", "11px")
      .style("text-anchor", "middle");
  });

});
