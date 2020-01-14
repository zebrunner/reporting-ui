window.d3 = require('d3');
//TODO: check if released gridstack version visout lodash dependancy. If so, replace dependency in package.json (last checked version of the library is 0.4.0)
import 'gridstack/src/gridstack.js';
import 'gridstack/src/gridstack.jQueryUI.js';
import 'vendors/gridstack-angular.min';
import 'vendors/pie-chart.min';
import 'n3-charts/build/LineChart.min';
import * as echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/bar';
import 'echarts/lib/chart/line';
import 'echarts/lib/chart/pie';
import 'echarts/lib/chart/radar';
import 'echarts/lib/chart/gauge';
import 'echarts/lib/chart/heatmap';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/legend';
import 'echarts/lib/component/title';
import 'echarts/lib/component/grid';
import 'echarts/lib/component/calendar';
import 'echarts/lib/component/dataZoom';
import 'echarts/lib/component/visualMap';


function echartDecorator(echart) {
    const overridedFunction = echart.Axis.prototype.getViewLabels;

    echart.Axis.prototype.getViewLabels = function () {
        let labels = overridedFunction.call(this);
        let reg = /^-?[\d.|,\d]*?$/;

        if (this.type === 'value') {
            function transform(tick) {
                let absoluteValue = Math.abs(tick);

                if (absoluteValue >= 1000000000) {
                    return `${(tick / 1000000000).toFixed(2)}B`;
                } else if (absoluteValue >= 1000000) {
                    return `${(tick / 1000000).toFixed(2)}M`;
                } else if (absoluteValue >= 1000) {
                    return `${(tick / 1000).toFixed(2)}K`;
                } else {
                    return `${tick}`;
                };
            };

            for (let value of labels) {
                if (typeof value.formattedLabel === 'number') {
                    value.formattedLabel = transform(value.formattedLabel);
                } else if (reg.test(value.formattedLabel)) {
                    let correctValue = parseFloat(value.formattedLabel.replace(',', ''));

                    value.formattedLabel = transform(correctValue);
                }
            }
        }

        return labels;
    }
}

echartDecorator(echarts);

window.echarts = echarts;

//TODO: can't use npm  package because this file has custom changes;
//TODO: seems like that changes don't allow to minify this file therefore it's excluded in webpack config
//TODO: fix DI and use as custom module
require('vendors/ngecharts');

import emptyPageComponent from '../shared/empty-page/empty-page.component';
import ScreenshotService from './screenshot.util';
import dashboardComponent from './dashboard.component';

export const dashboardModule = angular.module('app.dashboard', [
    'gridstack-angular',
    'n3-pie-chart',
    'n3-line-chart',
    'ngecharts',
])
    .component({ dashboardComponent })
    .component({ emptyPageComponent })
    .service('$screenshot', ScreenshotService);
