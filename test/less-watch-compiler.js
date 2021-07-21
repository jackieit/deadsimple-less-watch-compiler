const assert = require("assert"),
  sh = require("shelljs"),
  cwd = sh.pwd().toString(),
  path = require("path"),
  fs = require("fs"),
  execSync = require("child_process").execSync,
  outDir = cwd + "/test/css";

describe("The CLI should", function () {
  describe("run correctly with these options:", function () {
    describe("--run-once parameter", function () {
      it("exit after once", () => {
        cli("--run-once", "test/less", "test/css");
      });
    });

    describe("--enable-js parameter", function () {
      const lessDir = cwd + "/test/examples/with-js/less",
        expectedCssDir = cwd + "/test/examples/with-js/css",
        filename = "/with-js.css";

      it("should load a config json", () => {
        cli("--enable-js", "--run-once", lessDir, outDir);
        const contents = fs.readFileSync(outDir + filename),
          contentsExpected = fs.readFileSync(expectedCssDir + filename);
        assert.ok(contents.equals(contentsExpected));
        fs.rmSync(outDir + filename, { force: true });
      });
    });

    describe("--include-hidden parameter", function () {
      const lessDir = cwd + "/test/examples/with-hidden-variables-file/less",
        expectedCSSDir = cwd + "/test/examples/with-hidden-variables-file/css",
        filename = "/with-hidden.css";

      it("should compile hidden files when parameter is specified", () => {
        cli("--include-hidden", "--run-once", lessDir, outDir);
        const contents = fs.readFileSync(outDir + filename),
          contentsExpected = fs.readFileSync(expectedCSSDir + filename);
        assert.ok(contents.equals(contentsExpected));
        fs.rmSync(outDir + filename, { force: true });
      });

      it("should not compile the hidden variables files when flag not specified", () => {
        const compiledVariablesPath = outDir + "/_variables.css",
          compiledOtherVariablesPath = outDir + "/.other-variables.css";

        // Make sure we don't detect compiled variables files left over from other runs
        fs.rmSync(compiledVariablesPath, { force: true });
        fs.rmSync(compiledOtherVariablesPath, { force: true });

        const variablesFilesWereNotCompiled =
          !fs.existsSync(compiledVariablesPath) &&
          !fs.existsSync(compiledOtherVariablesPath);

        assert.ok(variablesFilesWereNotCompiled);
      });
    });

    describe("--config parameter", function () {
      const cssDir = cwd + "/test/examples/with-config/css",
        filename = "/with-config.css";
      it("should load a config json", () => {
        cli(
          "--run-once",
          "--config",
          cwd + "/test/examples/with-config/less-watch-compiler.config.json"
        );
        const contents = fs.readFileSync(outDir + filename),
          contentsExpected = fs.readFileSync(cssDir + filename);
        assert.ok(contents.equals(contentsExpected));

        fs.rmSync(outDir + filename, { force: true });
      });
    });
  });
});

function cli(...args) {
  const command = `node ${path.resolve("dist/main.js")} ${args.join(" ")}`;
  return execSync(command);
}
