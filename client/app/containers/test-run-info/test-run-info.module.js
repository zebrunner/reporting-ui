'use strict';

import testRunInfoComponent from './test-run-info.component';
import elasticsearchService from './elasticsearch.service';
import { testExecutionHistoryModule } from './test-execution-history/test-execution-history.module';
import { testVideoSliderModule } from './test-video-slider/test-video-slider.module';

export const testRunInfoModule = angular.module('app.testRunInfo', [
    testExecutionHistoryModule,
    testVideoSliderModule,
])
    .factory({ elasticsearchService })
    .component({ testRunInfoComponent });
