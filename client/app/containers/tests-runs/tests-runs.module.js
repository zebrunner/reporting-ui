'use strict';

import testsRunsFilter from './tests-runs-filter/tests-runs-filter.directive';
import testsRunsComponent from './tests-runs.component';
import testsRunsSearch from './tests-runs-search/tests-runs-search.directive';

import './test-runs.scss';

export const testsRunsModule = angular.module('app.testsRuns', ['ui.ace'])
    .directive({ testsRunsFilter })
    .directive({ testsRunsSearch })
    .component({ testsRunsComponent });
