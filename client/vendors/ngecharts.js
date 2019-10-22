/**
 * https://github.com/gudh/ngecharts
 * License: MIT
 */

(function () {
    //'use strict';

    var app = angular.module('ngecharts', [])
    app.directive('echarts', ['$window', '$filter', function ($window, $filter) {
        return {
            restrict: 'EA',
            template: '<div></div>',
            scope: {
                options: '=options',
                dataset: '=dataset',
                withLegend: '=withLegend',
                forceWatch: '=forceWatch',
                chartActions: '=chartActions',
                config: '=config'
            },
            link: buildLinkFunc($window, $filter)
        };
    }]);

    var DEFAULT_HEIGHT = '320px';

    function buildLinkFunc($window, $filter) {
        return function (scope, ele, attrs) {
            var chart, options;

            createChart(scope.options);

            function createChart(options) {
                var opts = angular.copy(options);
                var dataset = angular.copy(scope.dataset);
                if (!opts) return;

                ele[0].style.height = recognizeHeight();
                chart = echarts.init(ele[0], 'macarons');

                const isJson = opts.isJson();
                if (!isJson) {
                    eval(opts);
                    opts = chart.getOption();
                } else {
                    opts = JSON.parse(opts);
                }

                if (scope.dataset && ! opts.dataset) {
                    setData(opts);
                }

                if (!scope.withLegend) {
                    hideLegend(opts);
                }

                if (scope.forceWatch) {
                    optimizeForMiniature(opts);
                }

                chart.setOption(opts);
                scope.$emit('create', chart);

                angular.element($window).on('resize', onResize);

                if (scope.config) {
                    angular.extend(scope.config, {
                        clear: function () {
                            if(chart && chart.clear) {
                                chart.clear();
                            }
                        },
                        isDisposed: function () {
                            return chart && chart.isDisposed && chart.isDisposed();
                        },
                        dispose: function () {
                            if(chart && chart.dispose) {
                                chart.dispose();
                            }
                        }
                    });
                }

                if (scope.chartActions) {
                    scope.$watchCollection('chartActions', function (actions, oldVal) {
                        if (!scope.chartActions || ! scope.chartActions.length) return;
                        if (chart && chart.dispatchAction) {
                            applyActions(scope.chartActions);
                        }
                    });
                }
            };

            scope.$watch('options', function (newVal, oldVal) {
                if (angular.equals(newVal, oldVal) && ! scope.forceWatch) return;
                createChart(newVal);
            });

            scope.$watch('dataset', function (newVal, oldVal) {
                if (angular.equals(newVal, oldVal)) return;
                createChart(scope.options);
            });

            function applyActions(actions) {
                actions.forEach(function (action, index) {
                    chart.dispatchAction(action);
                    delete actions[index];
                });
            };

            function recognizeHeight(opts) {
                // If there is height static value in html element
                return ele[0].style.height ? ele[0].style.height :
                    // else if there is height static value in options.height (options.height.value)
                    /*opts.height && opts.height.value && opts.height.value.length ? opts.height.value :
                        // else if there is each data element height static value in options.height (options.height.dataItemValue)
                        opts.height && opts.height.dataItemValue && opts.height.dataItemValue > 0 && scope.dataset && ! opts.dataset ? scope.dataset.length * opts.height.dataItemValue + 'px' :
                            // else use default value*/
                            DEFAULT_HEIGHT;
            };

            function setData(opts) {
                if (!opts.data || opts.data === 'outer') {
                    opts.dataset = {};
                    opts.dataset.source = scope.dataset;
                } else if (opts.data && opts.data === 'inner' && opts.series && opts.series.length) {
                    scope.dataset.forEach(function (dataItem, index, array) {
                        if (opts.series.length > index) {
                            opts.series[index].data = [dataItem];
                        }
                    });
                }

                if (opts.dimensions && opts.dimensions.length) {
                    opts.dataset.dimensions = opts.dimensions;
                    delete opts.dimensions;
                }
            };

            function hideLegend(opts) {
                opts.legend = {
                    show: false
                };
            };

            // hide tooltip and legend for beauty view a miniature
            function optimizeForMiniature(opts) {
                opts.tooltip = opts.tooltip || {};
                opts.tooltip.show = false;

                opts.legend = opts.legend || {};
                opts.legend.show = false;

                opts.grid = opts.grid || {};
                opts.grid.top = 0;
                opts.grid.bottom = 0;
                opts.grid.right = 0;
                opts.grid.left = 0;
            };

            function onResize() {
                chart.resize();
            };

            scope.$on('$destroy', function() {
                angular.element($window).off('resize', onResize);
            });

        };
    };

})();
