'use strict';

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');

module.exports = {
    mode: 'production',
    devtool: false,
    context: path.join(process.cwd(), './client/app'),
    entry: {
        styles: '../styles/main.scss',
        vendors: './app.vendors.js',
        index: '../../reactify/index.js',
    },
    output: {
        filename: '[name].js',
        path: path.join(process.cwd(), './dist'),
        libraryTarget: 'commonjs2',
    },
    // Remove libraries from the output build
    externals: {
      angular: 'commonjs2 angular',
    },
    resolve: {
        modules: [
            'node_modules',
            path.join(process.cwd(), './client/app'),
            path.join(process.cwd(), './reactify'),
        ],
        alias: {
            'jquery-ui': path.resolve(process.cwd(), './node_modules/jquery-ui/ui'),
            'vendors': path.resolve(process.cwd(), './client/vendors'),
        },
        symlinks: false,
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                include: [
                    path.join(process.cwd(), './client/app'),
                    path.join(process.cwd(), './reactify'),
                ],
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
            },
            {
                // "oneOf" will traverse all following loaders until one will
                // match the requirements. When no loader matches it will fall
                // back to the "file" loader at the end of the loader list.
                oneOf: [
                    // Process application JS with Babel.
                    {
                        test: /\.m?js$/,
                        include: [
                            path.join(process.cwd(), './client/app'),
                            path.join(process.cwd(), './reactify'),
                        ],
                        use: [
                            {
                                loader: 'babel',
                                options: {
                                    babelrc: false,
                                    configFile: false,
                                    presets: ['@babel/preset-env'],
                                    plugins: [
                                        '@babel/plugin-proposal-object-rest-spread',
                                        '@babel/transform-runtime',
                                        ['angularjs-annotate', { 'explicitOnly' : true}],
                                        '@babel/plugin-syntax-dynamic-import'
                                    ],
                                    compact: 'auto',
                                    cacheDirectory: true,
                                    cacheCompression: true,
                                }
                            },
                        ]

                    },
                    // Process any JS outside of the app with Babel.
                    // Unlike the application JS, we only compile the standard ES features.
                    {
                        test: /\.m?js$/,
                        exclude: [
                            path.join(process.cwd(), './client/app'),
                            /\.min\./,
                            path.join(process.cwd(), './reactify'),
                        ],
                        use: [
                            {
                                loader: 'babel',
                                options: {
                                    babelrc: false,
                                    configFile: false,
                                    presets: ['@babel/preset-env'],
                                    compact: false,
                                    cacheDirectory: true,
                                    cacheCompression: true,
                                    // If an error happens in a package, it's possible to be
                                    // because it was compiled. Thus, we don't want the browser
                                    // debugger to show the original code. Instead, the code
                                    // being evaluated would be much more helpful.
                                    sourceMaps: false,
                                }
                            },
                        ]
                    },
                    {
                        test: /\.(gif|png|jpe?g)$/i,
                        loader: 'url',
                        exclude: [
                            path.resolve(process.cwd(), './node_modules/font-awesome/fonts')
                        ],
                        options: {
                            limit: 8192,
                            name: '[name].[ext]',
                        },
                    },
                    {
                        test: /\.(otf|ttf|eot|woff2?|svg)$/i,
                        include: [
                            path.resolve(process.cwd(), './node_modules/font-awesome/fonts')
                        ],
                        loader: 'file',
                        options: {
                            name: '[name].[ext]',
                        },
                    },
                    {
                        test: /\.html$/,
                        exclude: [path.resolve(process.cwd(), './client/index.html')],
                        loader: 'html',
                        options: {
                            attrs: [':md-svg-src', ':data-src', ':src']
                        }
                    },
                    {
                        test: /\.(sa|sc|c)ss$/,
                        use: [
                            MiniCssExtractPlugin.loader,
                            {loader: 'css', options: { importLoaders: 1, sourceMap: false }},
                            {
                                loader: `postcss`,
                                options: {
                                    // Necessary for external CSS imports to work
                                    // https://github.com/facebook/create-react-app/issues/2677
                                    ident: 'postcss',
                                    plugins: () => [
                                        require('postcss-flexbugs-fixes'),
                                        require('postcss-preset-env')({
                                            autoprefixer: {
                                                flexbox: 'no-2009',
                                            },
                                            stage: 3,
                                        }),
                                    ],
                                    sourceMap: false,
                                },
                            },
                            { loader: 'sass', options: { sourceMap: false }},
                        ],
                    },
                    // "file" loader makes sure those assets get served by WebpackDevServer.
                    // When you `import` an asset, you get its (virtual) filename.
                    // In production, they would get copied to the `build` folder.
                    // This loader doesn't use a "test" so it will catch all modules
                    // that fall through the other loaders.
                    {
                        loader: 'file',
                        // Exclude `js` files to keep "css" loader working as it injects
                        // its runtime that would otherwise be processed through "file" loader.
                        // Also exclude `html` and `json` extensions so they get processed
                        // by webpacks internal loaders.
                        exclude: [/\.(s?css)$/, /\.(m?js)$/, /\.html$/, /\.json$/],
                        options: {
                            name: '[name].[hash:8].[ext]',
                        },
                    },
                    // ** STOP ** Are you adding a new loader?
                    // Make sure to add the new loader(s) before the "file" loader.
                ]
            },
        ]
    },
    resolveLoader: {
        moduleExtensions: ['-loader']
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), '@babel/runtime/helpers/asyncToGenerator.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), '@babel/runtime/regenerator/index.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), '@babel/runtime/helpers/typeof.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), '@babel/runtime/helpers/classCallCheck.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), '@babel/runtime/helpers/createClass.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), 'angular-material/index.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), 'angular-material-data-table/index.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), 'angular-messages/index.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), 'angular-scroll/index.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), 'angular-cookies/index.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), 'angular-jwt/index.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), 'angular-moment/angular-moment.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), 'angular-sanitize/index.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), 'rangy/lib/rangy-core.js'),
        new webpack.PrefetchPlugin(path.join(process.cwd(), './node_modules'), 'angular/angular.js'),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
    ],
    optimization: {
        runtimeChunk: false,
        splitChunks: false,
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
        ],
    },
    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    node: {
        module: 'empty',
        dgram: 'empty',
        dns: 'mock',
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
        child_process: 'empty',
    },
    performance: {
        hints: false,
    },
    stats: {
        colors: true,
    },
};
