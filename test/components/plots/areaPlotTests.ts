///<reference path="../../testReference.ts" />

var assert = chai.assert;

describe("Plots", () => {
  describe("AreaPlot", () => {
    var svg: D3.Selection;
    var xScale: Plottable.Scale.Linear;
    var yScale: Plottable.Scale.Linear;
    var xAccessor: any;
    var yAccessor: any;
    var y0Accessor: any;
    var colorAccessor: any;
    var fillAccessor: any;
    var simpleDataset: Plottable.DataSource;
    var areaPlot: Plottable.Plot.Area;
    var renderArea: D3.Selection;
    var verifier: MultiTestVerifier;
    // for IE, whose paths look like "M 0 500 L" instead of "M0,500L"
    var normalizePath = (s: string) => s.replace(/ *([A-Z]) */g, "$1").replace(/ /g, ",");

    before(() => {
      svg = generateSVG(500, 500);
      verifier = new MultiTestVerifier();
      xScale = new Plottable.Scale.Linear().domain([0, 1]);
      yScale = new Plottable.Scale.Linear().domain([0, 1]);
      xAccessor = (d: any) => d.foo;
      yAccessor = (d: any) => d.bar;
      y0Accessor = () => 0;
      colorAccessor = (d: any, i: number, m: any) => d3.rgb(d.foo, d.bar, i).toString();
      fillAccessor = () => "steelblue";
      simpleDataset = new Plottable.DataSource([{foo: 0, bar: 0}, {foo: 1, bar: 1}]);
      areaPlot = new Plottable.Plot.Area(simpleDataset, xScale, yScale);
      areaPlot.project("x", xAccessor, xScale)
              .project("y", yAccessor, yScale)
              .project("y0", y0Accessor, yScale)
              .project("fill", fillAccessor)
              .project("stroke", colorAccessor)
              .renderTo(svg);
      renderArea = areaPlot.renderArea;
    });

    beforeEach(() => {
      verifier.start();
    });

    it("draws area and line correctly", () => {
      var areaPath = renderArea.select(".area");
      assert.strictEqual(normalizePath(areaPath.attr("d")), "M0,500L500,0L500,500L0,500Z", "area d was set correctly");
      assert.strictEqual(areaPath.attr("fill"), "steelblue", "area fill was set correctly");
      var areaComputedStyle = window.getComputedStyle(areaPath.node());
      assert.strictEqual(areaComputedStyle.stroke, "none", "area stroke renders as \"none\"");

      var linePath = renderArea.select(".line");
      assert.strictEqual(normalizePath(linePath.attr("d")), "M0,500L500,0", "line d was set correctly");
      assert.strictEqual(linePath.attr("stroke"), "#000000", "line stroke was set correctly");
      var lineComputedStyle = window.getComputedStyle(linePath.node());
      assert.strictEqual(lineComputedStyle.fill, "none", "line fill renders as \"none\"");
      verifier.end();
    });

    it("fill colors set appropriately from accessor", () => {
      var areaPath = renderArea.select(".area");
      assert.equal(areaPath.attr("fill"), "steelblue", "fill set correctly");
      verifier.end();
    });

    it("fill colors can be changed by projecting new accessor and re-render appropriately", () => {
      var newFillAccessor = () => "pink";
      areaPlot.project("fill", newFillAccessor);
      areaPlot.renderTo(svg);
      renderArea = areaPlot.renderArea;
      var areaPath = renderArea.select(".area");
      assert.equal(areaPath.attr("fill"), "pink", "fill changed correctly");
      verifier.end();
    });

    it("area fill works for non-zero floor values appropriately, e.g. half the height of the line", () => {
      areaPlot.project("y0", (d: any) => d.bar/2, yScale);
      areaPlot.renderTo(svg);
      renderArea = areaPlot.renderArea;
      var areaPath = renderArea.select(".area");
      assert.equal(normalizePath(areaPath.attr("d")), "M0,500L500,0L500,250L0,500Z");
      verifier.end();
    });

    it("fill color can be changed by projecting attribute accessor (sets to first datum fill attribute)", () => {
      var data = simpleDataset.data();
      data.forEach(function(d: any) { d.fill = "pink"; });
      simpleDataset.data(data);
      areaPlot.project("fill", "fill");
      renderArea = areaPlot.renderArea;
      var areaPath = renderArea.select(".area");
      assert.equal(areaPath.attr("fill"), "pink", "fill set to uniform stroke color");

      data[0].fill = "green";
      simpleDataset.data(data);
      assert.equal(areaPath.attr("fill"), "green", "fill set to first datum stroke color");
      verifier.end();
    });

    after(() => {
      if (verifier.passed) {svg.remove();};
    });
  });
});
