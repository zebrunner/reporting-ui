const path = require('path');
const merge = require('webpack-merge');
const package = require('./webpack.lib.js');

module.exports = merge(package, {
    mode: 'development',
    devtool: 'inline-source-map',
    watch: true,
    output: {
        path: path.join(process.cwd(), './dist'),
    },
});
