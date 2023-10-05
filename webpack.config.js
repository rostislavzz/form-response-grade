const path = require("path");
const GasPlugin = require("gas-webpack-plugin");

module.exports = {
  context: __dirname,
  entry: {
    code: {
      import: "./src/main.js",
      filename: "Code.gs",
    },
  },
  output: {
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [new GasPlugin()],
};
