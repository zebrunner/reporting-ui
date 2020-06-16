'use strict';

import testRunInfoComponent from './test-run-info.component';
import elasticsearchService from './elastic-search/elasticsearch.service';
import { testExecutionHistoryModule } from './test-execution-history/test-execution-history.module';
import { testVideoSliderModule } from './test-video-slider/test-video-slider.module';
import carinaLogsAgent from './logs-agents/carina.logs-agent';
import defaultLogsAgent from './logs-agents/default.logs-agent';

export const testRunInfoModule = angular.module('app.testRunInfo', [
    testExecutionHistoryModule,
    testVideoSliderModule,
])
    .factory({ carinaLogsAgent })
    .factory({ defaultLogsAgent })
    .factory({ elasticsearchService })
    .component({ testRunInfoComponent });
