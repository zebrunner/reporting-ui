'use strict';

const mode = 'development';
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js')(mode);

module.exports = merge(common, {
    mode,
    devtool: 'inline-source-map',
    devServer: {
        contentBase: path.join(process.cwd(), './dist'),
        publicPath: '/',
        compress: true,
        port: 3000,
        disableHostCheck: true,
        inline: true,
        hot: true,
        historyApiFallback: true,
        watchContentBase: true,
        writeToDisk: true,
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
    ],
    stats: {
        // modules: true,
        // reasons: true,
        errorDetails: true
    },
    watch: true,
});
