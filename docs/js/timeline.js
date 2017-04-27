/*  js for services */

module.exports = function(config){


    this.createTimeline = function(){
    	console.log("Starting the timeline vis")

        var margin = {top: 10, right: 20, bottom: 70, left: 60}; // Margin around visualization
        var width = 600 - margin.left - margin.right; // Width of our visualization
        var height = 200 - margin.top - margin.bottom; // Height of our visualization
        // var transDur = 100; // Transition time in ms
        
        var dataset = "http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/matthew_tweets_per_day.csv"
        
        var parseDate = d3.time.format("%Y-%m-%d").parse;

        d3.csv(dataset, function(csvData){
            var data = csvData;


            data.forEach(function(d,idx){
                d.date = parseDate(d["postedDate2"]);
                d.count = +d["count"];
                d.idx = idx;
            });

            var xScale = d3.scale.ordinal()
                            .rangeRoundBands([0, width], .05)
                            .domain(data.map(function(d) { return d.date; }));

            var yScale = d3.scale.linear()
                            .range([height, 0])
                            .domain([0, d3.max(data, function(d) { return parseFloat(d.count); })+1]);

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
                              .orient("bottom")
                              .tickFormat(d3.time.format("%Y-%m-%d"));
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
            // console.log("X axis width:",d3.select('#xaxis').node().getBoundingClientRect().width)

            // // Update width of chart to accommodate long rotated x-axis labels
            // d3.select("#timelinesvg")
            //         .attr("width", d3.select('#timeline').node().getBoundingClientRect().width)

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
                .style("fill", "steelblue");

            // Add tooltip
            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) {
                    return "<span style='color:white'>"+d.date+"</br>"+d.count+" tweets</span>";
                })

            svg.call(tip);

            // Prettier tooltip
            bar.on('mouseover', function(d){
                tip.show(d);
                // this.style = "fill:"+zayoTeal;
                // d3.select(this).style("cursor", "pointer")
            })

            bar.on('mouseout', function(d){
                tip.hide(d);
                // this.style = "fill:"+zayoOrange;
                // d3.select(this).style("cursor", "default")
            });


        }); //end d3.csv
    } //end createTimeline


} //end module.exports