/*  js for services */

module.exports = function(config){

    this.dataset = config.dataset

    this.createTimeline = function(map){
    	console.log("Starting the timeline vis")

        var margin = {top: 10, right: 10, bottom: 40, left: 60}; // Margin around visualization, including space for labels
        var width = d3.select('#timeline').node().getBoundingClientRect().width - margin.left - margin.right; // Width of our visualization
        var height = 200 - margin.top - margin.bottom; // Height of our visualization
        // var transDur = 100; // Transition time in ms

        var parseDate = d3.time.format("%Y-%m-%d").parse;
        var formatDate = d3.time.format("%a %b %d, %Y");


        d3.csv(this.dataset, function(csvData){
            var data = csvData;

            data.forEach(function(d,idx){
                d.date = parseDate(d["postedDate2"]);
                d.count = +d["count"];
                d.idx = idx;
            });

            var xScale = d3.scale.ordinal()
                            .rangeRoundBands([0, width], .05)
                            .domain(data.map(function(d) { return d.date; }));

            var xScaleIdx = d3.scale.ordinal()
                            .rangeRoundBands([0, width], .05)
                            .domain(data.map(function(d) { return d.idx; }));

            var yScale = d3.scale.linear()
                            .range([height, 0])
                            .domain([0, d3.max(data, function(d) { return parseFloat(d.count); })+1]);

            var brushYearStart = d3.min(data, function(d) { return d.idx})
            var brushYearEnd   = d3.max(data, function(d) { return d.idx})

            // Create an SVG element to contain our visualization.
            var svg = d3.select("#timeline").append("svg")
                                            .attr("width", width+margin.left+margin.right)
                                            .attr("height", height+margin.top+margin.bottom)
                                            .attr("id","timelinesvg")
                                          .append("g")
                                            .attr("transform","translate(" + margin.left + "," + margin.right + ")");


            // Build axes!
            // Specify the axis scale and general position
            var xAxis = d3.svg.axis()
                              .scale(xScale)
                              .ticks(5)
                              .orient("bottom")
                              .tickFormat(d3.time.format("%m/%d"))
                              // .ticks(5);

            var xAxisG = svg.append('g')
                            .attr('class', 'axis')
                            .attr('id','xaxis')
                            .attr("transform", "translate(0," + height + ")")
                            .call(xAxis)
                          .selectAll("text")
                            .attr("dy", ".35em")
                            .attr("dx", "-.5em")
                            .attr("transform", "rotate(-45)")
                            .style("text-anchor", "end");

            // // Update width of chart to accommodate long rotated x-axis labels
            // d3.select("#timelinesvg")
            //         .attr("width", d3.select('#timeline').node().getBoundingClientRect().width)

            d3.select("#timelinesvg")
                    .attr("height", d3.select('#timeline').node().getBoundingClientRect().height)

            // Repeat for the y-axis
            var yAxis = d3.svg.axis()
                              .scale(yScale)
                              .orient("left")
                              .ticks(5);

            var yAxisG = svg.append('g')
                            .attr('class', 'axis')
                            // .attr('transform', 'translate(' + xOffset + ', 0)')
                            .call(yAxis);

            var yLabel = svg.append("text")
                            .attr('class', 'label')
                            .attr("transform", "rotate(-90)")
                            .attr('y',6)
                            .attr('dy','.4em')
                            .style("text-anchor", "end")
                            .text("# Tweets");

            // Build bar chart
            var bar = svg.selectAll('.rect') // Select elements
                        .data(data); // Bind data to elements

            bar.enter().append("rect")
                .attr("class", "rect")
                .attr("x", function(d) { return xScale(d.date); })
                .attr("y", function(d) { return yScale(d.count); })
                .attr("id", function(d) { return "bar-"+d.date; })
                .attr("height", function(d) { return height-yScale(d.count); })
                .attr("width", xScale.rangeBand())
                .style("fill", "lightsteelblue");

            // Add tooltip
            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([0, 0])
                .html(function(d) {
                    return "<span style='color:white'>"+formatDate(d.date)+"</br>"+d.count+" tweets</span>";
                })

            svg.call(tip);

            // Prettier tooltip
            bar.on('mouseover', function(d){
                tip.show(d);
                this.style = "fill:steelblue";
                // d3.select(this).style("cursor", "pointer")
            })

            bar.on('mouseout', function(d){
                tip.hide(d);
                this.style = "fill:lightsteelblue";
                // d3.select(this).style("cursor", "default")
            });


            // Brushing from http://bl.ocks.org/emeeks/8899a3e8c31d4c5e7cfd
            // Draw brush
            brush = d3.svg.brush()
                .x(xScale)
                .on("brush", brushmove)
                .on("brushend", brushend);

            var arc = d3.svg.arc()
              .outerRadius(height / 20)
              .startAngle(0)
              .endAngle(function(d, i) { return i ? -Math.PI : Math.PI; });

            brushg = svg.append("g")
              .attr("class", "brush")
              .call(brush);

            brushg.selectAll(".resize").append("path")
                .attr("transform", "translate(0," +  height / 2 + ")")
                .attr("d", arc);

            brushg.selectAll("rect")
                .attr("height", height);

            // ****************************************
            // Brush functions
            // ****************************************

            function brushmove() {
                yScale.domain(xScaleIdx.range())
                        .range(xScaleIdx.domain());
                b = brush.extent();

                var localBrushYearStart = (brush.empty()) ? brushYearStart : Math.ceil(yScale(b[0])),
                    localBrushYearEnd = (brush.empty()) ? brushYearEnd : Math.ceil(yScale(b[1]));

                // Snap to rect edge
                d3.select("g.brush").call((brush.empty()) ? brush.clear() : brush.extent([yScale.invert(localBrushYearStart), yScale.invert(localBrushYearEnd)]));

                // Fade all years in the histogram not within the brush:
                // for each bar, if index is within selected range, set opacity to 1
                // else set opacity to .4
                d3.selectAll("rect.rect").style("opacity", function(d, i) {
                  return d.idx >= localBrushYearStart && d.idx < localBrushYearEnd || brush.empty() ? "1" : ".4";
                });

            }

            var timeFilters = []

            function brushend() {

              var localBrushYearStart = (brush.empty()) ? brushYearStart : Math.ceil(yScale(b[0])),
                  localBrushYearEnd   = (brush.empty()) ? brushYearEnd : Math.floor(yScale(b[1]));

              d3.selectAll("rect.bar").style("opacity", function(d, i) {
                return d.idx >= localBrushYearStart && d.idx <= localBrushYearEnd || brush.empty() ? "1" : ".4";
              });

              //Add the filter to the map
              map.setFilter('marker-layer',['all',[">=",'day',localBrushYearStart],["<=",'day',localBrushYearEnd]])

              map.fire('moveend')
              console.log('local=', [localBrushYearStart,localBrushYearEnd])
            }

            function resetBrush() {
              brush
                .clear()
                .event(d3.select(".brush"));
            }

        }); //end d3.csv

    } //end createTimeline


} //end module.exports
