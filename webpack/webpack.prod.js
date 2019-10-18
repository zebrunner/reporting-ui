'use strict';

const path = require('path');
const mode = 'production';
const merge = require('webpack-merge');
const common = require('./webpack.common.js')(mode);
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = merge(common, {
    mode,
    devtool: false,
    module: {
        rules: [
            {
                test: /\.m?js$/,
                include: path.join(__dirname, '../client/app'),
                enforce: 'pre',
                use: [
                    {
                        loader: 'webpack-strip-block',
                        options: {
                            start: 'FOR_DEV_ONLY:START',
                            end: 'FOR_DEV_ONLY:END'
                        }
                    }
                ]
            }
        ]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        // turn off flags with small gains to speed up minification
                        arrows: false,
                        collapse_vars: false, // 0.3kb
                        comparisons: false,
                        computed_props: false,
                        hoist_funs: false,
                        hoist_props: false,
                        hoist_vars: false,
                        inline: false,
                        loops: false,
                        negate_iife: false,
                        properties: false,
                        reduce_funcs: false,
                        reduce_vars: false,
                        switches: false,
                        toplevel: false,
                        typeofs: false,
                  
                        // a few flags with noticable gains/speed ratio
                        // numbers based on out of the box vendor bundle
                        booleans: true, // 0.7kb
                        if_return: true, // 0.4kb
                        sequences: true, // 0.7kb
                        unused: true, // 2.3kb
                  
                        // required features to drop conditional branches
                        conditionals: true,
                        dead_code: true,
                        evaluate: true
                    },
                    mangle: {
                        safari10: true
                    },
                    output: {
                      comments: false,
                    },
                  },
            }),
            new OptimizeCssAssetsPlugin({
                cssProcessorOptions: {
                    parser: safePostCssParser,
                },
            }),
        ]
    }
});
