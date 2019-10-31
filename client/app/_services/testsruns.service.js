(function () {
    'use strict';

    angular
        .module('app.services')
        .factory({ testsRunsService });

    function testsRunsService(TestRunService, $q, DEFAULT_SC, projectsService) {
        'ngInject';

        const searchTypes = ['testSuite', 'executionURL', 'appVersion'];
        let _lastResult = null;
        let _lastParams = null;
        let _launchers = [];
        let _searchParams = angular.copy(DEFAULT_SC);

        return  {
            getSearchTypes: getSearchTypes,
            fetchTestRuns: fetchTestRuns,
            addBrowserVersion: addBrowserVersion,
            getLastSearchParams: getLastSearchParams,
            isFilterActive: isFilterActive,
            isSearchActive: isSearchActive,
            setSearchParam: setSearchParam,
            getSearchParam: getSearchParam,
            deleteSearchParam: deleteSearchParam,
            resetFilteringState: resetFilteringState,
            readStoredParams: readStoredParams,
            deleteStoredParams: deleteStoredParams,
            clearDataCache: clearDataCache,
            addNewTestRun: addNewTestRun,
            updateTestRun: updateTestRun,
            readStoredlaunchers: readStoredlaunchers,
            isOnlyAdditionalSearchActive: isOnlyAdditionalSearchActive,
            deleteLauncherFromStorebyCiId: deleteLauncherFromStorebyCiId,
            addNewLauncher: addNewLauncher,
            checkForDestroyingLaunchersByTime: checkForDestroyingLaunchersByTime,
        };

        function getSearchTypes() {
            return searchTypes;
        }

        function fetchTestRuns() {
            // save search params
            deleteStoredParams();
            storeParams();
            readStoredlaunchers();
            checkForDestroyingLaunchersByTime();
            _lastParams = angular.copy(_searchParams);

            return TestRunService.searchTestRuns(_searchParams)
                .then(function(rs) {
                    if (rs.success) {
                        const data = rs.data;

                        data.results = data.results || [];
                        data.results.forEach(function(testRun) {
                            addBrowserVersion(testRun);
                            addJob(testRun);
                            testRun.tests = null;
                        });
                        _lastResult = data;
                        
                        if (_launchers && _launchers.length) {
                            filterLaunchers();
                        }
                        _lastResult.launchers = _launchers;
                        return $q.resolve(_lastResult);
                    } else {
                        console.error(rs.message);
                        return $q.reject(rs);
                    }
                });

        }

        function filterLaunchers() {
            _launchers = _launchers.filter((launcher) => {
                return _lastResult.results.findIndex((res) => { return res.ciRunId === launcher.ciRunId })=== -1;
            })
            storeLaunchers();
        }

        function checkForDestroyingLaunchersByTime() {
            let dateNow = new Date();

            _launchers = _launchers.filter((launcher) => {
                return launcher.shouldBeDestroyedAt - dateNow.getTime() > 0;
            })
            storeLaunchers();
        }

        function getLastSearchParams() {
            return _lastParams;
        }

        function addBrowserVersion(testRun) {
            const platform = testRun.platform ? testRun.platform.split(' ') : [];
            let version = null;

            if (platform.length > 1) {
                version = 'v.' + platform[1];
            }

            if (!version && testRun.config && testRun.config.browserVersion !== '*') {
                version = testRun.config.browserVersion;
            }

            testRun.browserVersion = version;
        }

        function addJob(testRun) {
            if (testRun.job && testRun.job.jobURL) {
                testRun.jenkinsURL = testRun.job.jobURL + '/' + testRun.buildNumber;
                testRun.UID = testRun.testSuite.name + ' ' + testRun.jenkinsURL;
            }
        }

        function resetSearchParams() {
            _searchParams = angular.copy(DEFAULT_SC);
            _lastParams = null;
        }

        function setSearchParam(name, value) {
            _searchParams[name] = value;
        }

        function getSearchParam(name) {
            return _searchParams[name];
        }

        function deleteSearchParam(name) {
            delete _searchParams[name];
        }

        function isFilterActive() {
            return _searchParams.hasOwnProperty('filterId');
        }

        function isSearchActive() {
            let defaultCriteria = DEFAULT_SC;
            const projects = projectsService.getSelectedProjects();

            if (projects && projects.length) {
                defaultCriteria = {
                    ...defaultCriteria,
                    projectNames: projects.map(project => project.name),
                };
            }
            defaultCriteria.page = _searchParams.page;

            return !isFilterActive() && !angular.equals(_searchParams, defaultCriteria);
        }

        function isOnlyAdditionalSearchActive() {
            return isSearchActive() && !_searchParams.hasOwnProperty('query');
        }

        function resetFilteringState() {
            resetSearchParams();
        }
        
        function storeParams() {
            sessionStorage.setItem('searchParams', angular.toJson(_searchParams));
        }

        function deleteStoredParams() {
            sessionStorage.removeItem('searchParams');
        }

        function readStoredParams() {
            const params = sessionStorage.getItem('searchParams');

            params && (_searchParams = angular.fromJson(params)) && (_lastParams = _searchParams);
        }

        function storeLaunchers() {
            if (_launchers.length) {
                sessionStorage.setItem('launchers', angular.toJson(_launchers));
            } else {
                sessionStorage.removeItem('launchers');
            }
        }

        function readStoredlaunchers() {
            const launchers = sessionStorage.getItem('launchers');
            
            launchers && (_launchers = angular.fromJson(launchers));

            return _launchers;
        }

        function deleteLauncherFromStorebyCiId(ciRunId) {
            _launchers = _launchers.filter((res) => { return res.ciRunId !== ciRunId });
            storeLaunchers();

            return _launchers;
        }

        function addNewTestRun(testRun) {
            addBrowserVersion(testRun);
            addJob(testRun);
            testRun.tests = null;

            if (_lastResult.results.length === _searchParams.pageSize) {
                _lastResult.results.splice(-1);
            }
            _lastResult.results = [testRun].concat(_lastResult.results);
            
            return _lastResult.results;
        }

        function addNewLauncher(testRun) {
            let dateNow = new Date();

            testRun.tests = null;
            testRun.startedAt = dateNow.getTime();
            dateNow.setMinutes( dateNow.getMinutes() + 5 );
            testRun.shouldBeDestroyedAt = dateNow.getTime();
            _launchers.push(testRun);
            storeLaunchers();
            
            return _launchers;
        }

        function updateTestRun(index, data) {
            const testRun = _lastResult.results[index];

            data = data || {};
            if (testRun) {
                Object.keys(data).forEach(function(key) {
                    testRun[key] = data[key];
                });
            }

            return _lastResult.results;
        }

        function clearDataCache() {
            _lastResult = null;
        }
    }
})();
