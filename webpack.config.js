const path = require("path");
const webpack = require("webpack");
const htmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

// Webpack Configuration
const config = {
    entry: ["./src/index.ts"],

    output: {
        path: path.resolve(__dirname, "./dist"),
        filename: "bundle.js",
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: ["ts-loader"],
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
        ],
    },

    resolve: {
        extensions: [".ts", ".js"],
    },

    plugins: [
        new webpack.DefinePlugin({
            __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
        }),
        new htmlWebpackPlugin({
            title: "Ceros Ski",
            template: "src/index.html",
        }),
        new CopyPlugin({
            patterns: [{ from: "img/*", to: "" }],
        }),
    ],
};

module.exports = config;
