console.log("Radial chart script loaded");

// -------- CONFIG --------
const WIDTH = 650;
const HEIGHT = 650;
const RADIUS = 230;
const INNER_R = 110;
const YEAR = 2025;

const monthNames = {
  1: "JAN", 2: "FEB", 3: "MAR", 4: "APR",
  5: "MAY", 6: "JUN", 7: "JUL", 8: "AUG",
  9: "SEP", 10: "OCT", 11: "NOV", 12: "DEC"
};

const emotionColors = {
  joy: "#ffd37a",
  excitement: "#ff9c6a",
  surprise: "#8cd5ff",
  nervousness: "#ff6a6a",
  confusion: "#c5a3ff",
  curiosity: "#7dffb5",
  anger: "#ff5b5b",
  sadness: "#7aa2ff",
  grief: "#c47aa3",
  remorse: "#f0a2b2",
  fear: "#ff9bd1",
  annoyance: "#ffc47a",
  desire: "#f2c879",
  embarrassment: "#ffb3c6",
  relief: "#9ee6b8",
  caring: "#ffe0a6",
  disappointment: "#e4a37e",
  disapproval: "#f19999",
  realization: "#e0e0ff"
};

// -------- LOAD DATA --------
d3.csv("../data/cleaned/dreams_with_light.csv").then(data => {
  // Clean obviously bad rows
  const cleaned = data.filter(d =>
    !isNaN(+d.year) &&
    !isNaN(+d.month) &&
    d.city
  );

  const filtered = cleaned.filter(d => +d.year === YEAR);

  if (!filtered.length) {
    console.warn("No rows for year", YEAR);
    return;
  }

  // -------- NEST BY CITY → MONTH --------
  const byCityMonth = d3.rollup(
    filtered,
    v => {
      const city = v[0].city;
      const month = +v[0].month;

      // mean_rad: ignore missing / NaN
      const radVals = v
        .map(d => +d.mean_rad)
        .filter(x => !isNaN(x));
      const mean_rad = radVals.length ? d3.mean(radVals) : NaN;

      // collect and count emotions
      const allEmos = v.flatMap(d =>
        d.emotions_top3
          ? d.emotions_top3
              .split(",")
              .map(e => e.split(":")[0].trim().toLowerCase())
          : []
      );

      const emoCountsArr = d3.rollups(
        allEmos,
        vv => vv.length,
        d => d
      ).sort((a, b) => b[1] - a[1]);

      const top3 = emoCountsArr.slice(0, 3).map(([emotion, count]) => ({
        emotion,
        count
      }));

      return {
        city,
        month,
        mean_rad,
        emotions: top3,
        totalDreams: v.length
      };
    },
    d => d.city,
    d => +d.month
  );

  // Turn that into a { city: [monthObj, ...] } structure
  const cityData = {};
  for (const [city, monthMap] of byCityMonth.entries()) {
    const arr = Array.from(monthMap.values()).sort((a, b) => a.month - b.month);
    if (arr.length) cityData[city] = arr;
  }

  const cityNames = Object.keys(cityData).sort();
  if (!cityNames.length) {
    console.warn("No valid city aggregates.");
    return;
  }

  // Collect *all* month entries (all cities) for scaling
  const allMonths = cityNames.flatMap(c => cityData[c]);
  const radValsAll = allMonths
    .map(d => d.mean_rad)
    .filter(x => !isNaN(x));

  // If somehow no VIIRS data is valid, bail
  if (!radValsAll.length) {
    console.warn("No valid VIIRS radiance values.");
    return;
  }

  const radExtent = d3.extent(radValsAll);

  // Raw 0–1 scale
  const haloScaleRaw = d3.scaleLinear()
    .domain(radExtent)
    .range([0, 1])
    .clamp(true);

  // More dramatic halo opacity: dim = 0.15, bright ≈ 1.05
  const haloOpacity = val => {
    if (isNaN(val)) return 0.15; // missing VIIRS → faint halo
    const t = haloScaleRaw(val);  // 0–1
    const eased = t * t;         // quadratic, exaggerates differences
    return 0.15 + eased * 0.9;   // [0.15, ~1.05]
  };

  // -------- LAYOUT (container + dropdowns + svg) --------
  const container = d3.select("#radial-emotion-chart");

  // Controls wrapper
  const controls = container.append("div")
    .attr("class", "controls")
    .style("margin-bottom", "1rem")
    .style("text-align", "center");

  // City dropdown
  const cityLabel = controls.append("span")
    .style("margin-right", "0.5rem")
    .style("color", "#f5f3ff")
    .style("font-weight", "500")
    .text("City: ");

  const citySelect = controls.append("select")
    .attr("id", "city-select")
    .style("margin-right", "1rem")
    .style("padding", "0.35rem 0.75rem")
    .style("border-radius", "999px")
    .style("border", "none")
    .style("background", "#f5f0e0")
    .style("font-weight", "600");

  citySelect.selectAll("option")
    .data(cityNames)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  // Month dropdown
  // Add a line break by making a new div for month selector
    const monthRow = container.append("div")
    .attr("class", "month-row")
    .style("margin-bottom", "1.2rem")
    .style("text-align", "center");

    monthRow.append("span")
    .style("margin-right", "0.5rem")
    .style("color", "#f5f3ff")
    .style("font-weight", "500")
    .text("Month: ");

    const monthSelect = monthRow.append("select")
    .attr("id", "month-select")
    .style("padding", "0.35rem 0.75rem")
    .style("border-radius", "999px")
    .style("border", "none")
    .style("background", "#f5f0e0")
    .style("font-weight", "600");

  const svg = container.append("svg")
    .attr("width", WIDTH)
    .attr("height", HEIGHT);

  const root = svg.append("g")
    .attr("transform", `translate(${WIDTH / 2}, ${HEIGHT / 2})`);

  // -------- DEFS (halo gradient + inner shadow) --------
  const defs = svg.append("defs");

  // Soft golden halo
  const haloGrad = defs.append("radialGradient")
    .attr("id", "haloGrad");
  haloGrad.append("stop")
    .attr("offset", "65%")
    .attr("stop-color", "#ffe9a6")
    .attr("stop-opacity", 1);
  haloGrad.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#ffe9a6")
    .attr("stop-opacity", 0);

  // Inner shadow for center circle
  const innerShadow = defs.append("filter")
    .attr("id", "innerShadow")
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");
  innerShadow.append("feDropShadow")
    .attr("dx", 0)
    .attr("dy", 0)
    .attr("stdDeviation", 20)
    .attr("flood-color", "#000")
    .attr("flood-opacity", 0.9);

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#111")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("border-radius", "6px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  const showTooltip = (event, html) => {
    tooltip.style("opacity", 1)
      .html(html)
      .style("left", event.pageX + 10 + "px")
      .style("top", event.pageY + 10 + "px");
  };

  const hideTooltip = () => tooltip.style("opacity", 0);

  // Main chart group
  const chartG = root.append("g").attr("class", "chart");

  // Pie for up to 3 emotions
  const pie = d3.pie()
    .value(d => d.count)
    .sort(null);

  const arc = d3.arc()
    .innerRadius(INNER_R)
    .outerRadius(RADIUS);

  // -------- HELPERS --------
  function updateMonthOptions(city) {
    const arr = cityData[city] || [];
    monthSelect.selectAll("option").remove();

    monthSelect.selectAll("option")
      .data(arr)
      .enter()
      .append("option")
      .attr("value", d => d.month)
      .text(d => `${monthNames[d.month]} ${YEAR}`);
  }

  // -------- RENDER FUNCTION --------
  function render(city, monthValue) {
    const arr = cityData[city];
    if (!arr || !arr.length) return;

    let m = arr.find(d => d.month === +monthValue);
    if (!m) m = arr[0]; // fallback

    chartG.selectAll("*").remove();
    root.selectAll(".legend").remove();

    // Outer glowing halo (full circle) with *drastic* brightness differences
    chartG.append("path")
      .attr("d", d3.arc()
        .innerRadius(RADIUS + 10)
        .outerRadius(RADIUS + 40)
        .startAngle(0)
        .endAngle(2 * Math.PI)
      )
      .style("fill", "url(#haloGrad)")
      .style("opacity", haloOpacity(m.mean_rad));

    if (!m.emotions.length) {
      chartG.append("text")
        .attr("text-anchor", "middle")
        .text("No emotion tags for this month")
        .style("fill", "#f5f0dd")
        .style("font-size", "16px");
      return;
    }

    const arcs = pie(m.emotions);

    const sliceG = chartG.selectAll(".slice")
      .data(arcs)
      .enter()
      .append("g")
      .attr("class", "slice");

    // Donut slices (solid pastel)
    sliceG.append("path")
      .attr("d", arc)
      .attr("fill", d => emotionColors[d.data.emotion] || "#aaa")
      .attr("stroke", "#000")
      .attr("stroke-width", 1.5)
      .on("mouseover", (event, d) => {
        const pct = (d.data.count / m.totalDreams * 100).toFixed(1);
        showTooltip(event,
          `<b>${d.data.emotion}</b><br/>Dreams: ${d.data.count}<br/>Share: ${pct}%`
        );
      })
      .on("mouseout", hideTooltip);

    // Center donut shadow
    chartG.append("circle")
      .attr("r", INNER_R - 15)
      .attr("fill", "#0d0d16")
      .style("filter", "url(#innerShadow)");

    // Center labels: CITY + MONTH YEAR
    chartG.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.3em")
      .text(m.city.toUpperCase())
      .style("fill", "#f5f0dd")
      .style("font-size", "28px")
      .style("font-weight", "700")
      .style("letter-spacing", "1.5px");

    chartG.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .text(`${monthNames[m.month]} ${YEAR}`)
      .style("fill", "#f5f0dd")
      .style("font-size", "20px")
      .style("font-weight", "600");

    // Small legend for the 3 emotions
    const legend = root.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${ -WIDTH / 2 + 40}, ${-HEIGHT / 2 + 40})`);

    legend.append("text")
      .text("Top emotions")
      .style("fill", "#f5f0dd")
      .style("font-size", "14px")
      .style("font-weight", "600");

    const rows = legend.selectAll(".legend-row")
      .data(m.emotions)
      .enter()
      .append("g")
      .attr("class", "legend-row")
      .attr("transform", (_, i) => `translate(0, ${18 + i * 20})`);

    rows.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", d => emotionColors[d.emotion] || "#aaa");

    rows.append("text")
      .attr("x", 20)
      .attr("y", 11)
      .text(d => d.emotion.toUpperCase())
      .style("fill", "#f5f0dd")
      .style("font-size", "12px");
  }

  // -------- INITIAL SETUP --------
  const initialCity = cityNames.includes("Toronto") ? "Toronto" : cityNames[0];
  citySelect.property("value", initialCity);
  updateMonthOptions(initialCity);
  const initialMonth = cityData[initialCity][0].month;
  monthSelect.property("value", initialMonth);
  render(initialCity, initialMonth);

  // -------- INTERACTIONS --------
  citySelect.on("change", function () {
    const city = this.value;
    updateMonthOptions(city);
    const mArr = cityData[city];
    if (!mArr || !mArr.length) return;
    const newMonth = mArr[0].month;
    monthSelect.property("value", newMonth);
    render(city, newMonth);
  });

  monthSelect.on("change", function () {
    const city = citySelect.property("value");
    const monthVal = this.value;
    render(city, monthVal);
  });
});