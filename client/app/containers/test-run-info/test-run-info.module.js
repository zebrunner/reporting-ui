import testRunInfoComponent from './test-run-info.component';
import elasticsearchService from './elasticsearch.service';

export const testRunInfoModule = angular.module('app.testRunInfo', [])
    .factory({ elasticsearchService })
    .component({ testRunInfoComponent });
