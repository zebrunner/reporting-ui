'use strict';

import testSessionCard from './test-session-card/test-session-card.component';
import testsSessionsComponent from './tests-sessions.component';
import testsSessionsSearch from './tests-sessions-search/tests-sessions-search.directive';
import testsSessionsService from './tests-sessions.service';

export const testsSessionsModule = angular.module('app.testsSessions', ['ui.ace'])
    .directive({ testsSessionsSearch })
    .service({ testsSessionsService })
    .component({ testSessionCard })
    .component({ testsSessionsComponent });
