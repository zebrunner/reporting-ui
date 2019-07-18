window.d3 = require('d3');
import 'gridstack/dist/gridstack.js';
import 'gridstack/dist/gridstack.jQueryUI.js';
import 'vendors/gridstack-angular.min';
import 'vendors/pie-chart.min';
import 'n3-charts/build/LineChart.min';
import * as echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/bar';
import 'echarts/lib/chart/line';
import 'echarts/lib/chart/pie';
import 'echarts/lib/chart/radar';
import 'echarts/lib/chart/gauge';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/legend';
import 'echarts/lib/component/title';
import 'echarts/lib/component/grid';
import 'echarts/lib/component/calendar';

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
