'use strict';

import testSessionLogsComponent from './test-session-logs.component';
import testSessionLogsService from './test-session-logs.service';
import testLogTable  from './test-log-table/test-log-table.directive';

export const testSessionLogsModule = angular.module('app.testSessionLogs', [])
    .directive({ testLogTable })
    .service({ testSessionLogsService })
    .component({ testSessionLogsComponent });
