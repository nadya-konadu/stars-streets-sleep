// simple reusable month slider
// controls a month index from 0–11 and calls onChange(index)

function monthSlider(selection, onChange) {
  // basic size of the slider
  var width = 300;
  var height = 50;
  var margin = 20;

  // svg container for the slider
  var svg = selection.append("svg")
    .attr("width", width)
    .attr("height", height);

  // scale that maps month index (0–11) to x position
  var x = d3.scaleLinear()
    .domain([0, 11])
    .range([margin, width - margin])
    .clamp(true);

  // the track line the handle slides along
  svg.append("line")
    .attr("x1", x(0))
    .attr("x2", x(11))
    .attr("y1", height / 2)
    .attr("y2", height / 2)
    .attr("stroke", "#ccc")
    .attr("stroke-width", 4)
    .attr("stroke-linecap", "round");

  // draggable handle users actually move
  var handle = svg.append("circle")
    .attr("cx", x(0))
    .attr("cy", height / 2)
    .attr("r", 8)
    .attr("fill", "#9ad7ff")
    .attr("cursor", "pointer");

  // drag logic: convert pixel position back to month index
  handle.call(
    d3.drag().on("drag", function () {
      var px = d3.event.x;
      var index = Math.round(x.invert(px));
      index = Math.max(0, Math.min(11, index));

      // move handle visually
      handle.attr("cx", x(index));

      // notify anything listening that the month changed
      if (onChange) {
        onChange(index);
      }
    })
  );

  // set initial state to january (index 0)
  if (onChange) {
    onChange(0);
  }
}
