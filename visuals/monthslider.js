// Minimal reusable month slider (D3 v4)
// Controls an index from 0–11 and calls onChange(index)

function monthSlider(selection, onChange) {
    var width = 300;
    var height = 50;
    var margin = 20;
  
    var svg = selection.append("svg")
      .attr("width", width)
      .attr("height", height);
  
    // Scale: index (0–11) → pixel position
    var x = d3.scaleLinear()
      .domain([0, 11])
      .range([margin, width - margin])
      .clamp(true);
  
    // Track
    svg.append("line")
      .attr("x1", x(0))
      .attr("x2", x(11))
      .attr("y1", height / 2)
      .attr("y2", height / 2)
      .attr("stroke", "#ccc")
      .attr("stroke-width", 4)
      .attr("stroke-linecap", "round");
  
    // Handle
    var handle = svg.append("circle")
      .attr("cx", x(0))
      .attr("cy", height / 2)
      .attr("r", 8)
      .attr("fill", "#9ad7ff")
      .attr("cursor", "pointer");
  
    // Drag behavior
    handle.call(
      d3.drag().on("drag", function () {
        var px = d3.event.x;
        var index = Math.round(x.invert(px));
        index = Math.max(0, Math.min(11, index));
  
        handle.attr("cx", x(index));
  
        if (onChange) {
          onChange(index);
        }
      })
    );
  
    // Initial callback
    if (onChange) {
      onChange(0);
    }
  }