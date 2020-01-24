'use strict';

import CiHelperController from '../../shared/ci-helper/ci-helper.controller';
import CiHelperTemplate from '../../shared/ci-helper/ci-helper.html';

const testsRunsController = function testsRunsController($cookieStore, $mdDialog, $timeout, $q, TestRunService,
                                                         UtilService, UserService, testsRunsService, $scope, API_URL,
                                                         $rootScope, $transitions, windowWidthService, TestService,
                                                         toolsService, projectsService, messageService) {
    'ngInject';

    let TENANT;
    let scrollTickingTimeout = null;
    const scrollableParentElement = document.querySelector('.page-wrapper');

    const vm = {
        testRuns: [],
        launchers: [],
        totalResults: 0,
        pageSize: 20,
        currentPage: 1,
        selectedTestRuns: [],
        zafiraWebsocket: null,
        subscriptions: {},
        isMobile: windowWidthService.isMobile,
        isFilterActive: testsRunsService.isFilterActive,
        isSearchActive: testsRunsService.isSearchActive,
        projects: null,
        activeTestRunId: null,
        scrollTicking: false,

        isTestRunsEmpty: isTestRunsEmpty,
        getTestRuns: getTestRuns,
        areTestRunsFromOneSuite: areTestRunsFromOneSuite,
        showCompareDialog: showCompareDialog,
        batchRerun: batchRerun,
        batchDelete: batchDelete,
        abortSelectedTestRuns: abortSelectedTestRuns,
        batchEmail: batchEmail,
        deleteSingleTestRun: deleteSingleTestRun,
        showCiHelperDialog: showCiHelperDialog,
        resetFilter: resetFilter,
        displaySearch: displaySearch,
        selectAllTestRuns: selectAllTestRuns,
        selectTestRun: selectTestRun,
        isToolConnected: toolsService.isToolConnected,
    };

    vm.$onInit = init;

    return vm;

    function init() {
        vm.testRuns = vm.resolvedTestRuns.results || [];
        vm.totalResults = vm.resolvedTestRuns.totalResults || 0;
        vm.pageSize = vm.resolvedTestRuns.pageSize;
        vm.currentPage = vm.resolvedTestRuns.page;

        initLaunchers();
        setTimersOnDestroyingLaunchers();
        TENANT = $rootScope.globals.auth.tenant;
        readStoredParams();
        initWebsocket();
        bindEvents();
        vm.activeTestRunId && highlightTestRun();
        bindEventListeners();
    }

    function initLaunchers() {
        const launchers = vm.resolvedTestRuns.launchers || [];

        if (launchers && launchers.length) {
            vm.launchers = launchers.reduce((filteredLaunchers, launcher) => {
                if (vm.testRuns.find(testRun => testRun.ciRunId === launcher.ciRunId)) {
                    filteredLaunchers = testsRunsService.deleteLauncherFromStorebyCiId(launcher.ciRunId);
                }

                return filteredLaunchers;
            }, launchers);
        }
    }

    function setTimersOnDestroyingLaunchers() {
        vm.launchers.forEach((launcher) => {
            setTimerOnDestroingLauncher(launcher);
        })
    }

    function setTimerOnDestroingLauncher(launcher) {
        let dateNow = new Date();
        let timeDiff = launcher.shouldBeDestroyedAt - dateNow.getTime();

        if (timeDiff > 0) {
            launcher.timeout = setTimeout(function() {
                vm.launchers = testsRunsService.deleteLauncherFromStorebyCiId(launcher.ciRunId);
                $scope.$apply();
            }, timeDiff)
        }
    }

    function resetFilter() {
        $rootScope.$broadcast('tr-filter-reset');
    }

    function highlightTestRun() {
        const activeTestRun = getTestRunById(vm.activeTestRunId);

        if (activeTestRun) {
            $timeout(function() {
                //Scroll to the element if it out of the viewport
                const el = document.getElementById('testRun_' + vm.activeTestRunId);

                //scroll to the element
                if (!isElementInViewport(el)) {
                    const headerOffset = vm.isMobile() && !vm.isSearchActive() ? 144 : 96;
                    const elOffsetTop = $(el).offset().top;

                    $('html,body').animate({ scrollTop: elOffsetTop - headerOffset }, 'slow', function() {
                        activeTestRun.highlighting = true;
                    });
                } else {
                    activeTestRun.highlighting = true;
                }
                $timeout(function() {
                    delete activeTestRun.highlighting;
                }, 4000); //4000 - highlighting animation duration in CSS
            }, 500); // wait for content is rendered (maybe need to be increased if scroll position is incorrect)
        }
    }

    function displaySearch() {
        !vm.isFilterActive() && $rootScope.$broadcast('tr-filter-open-search');
    }

    function readStoredParams() {
        const currentPage = testsRunsService.getSearchParam('page');
        const pageSize = testsRunsService.getSearchParam('pageSize');

        currentPage && (vm.currentPage = currentPage);
        pageSize && (vm.pageSize = pageSize);
    }

    function isTestRunsEmpty() {
        return vm.testRuns && !vm.testRuns.length;
    }

    function getTestRuns(page, pageSize) {
        vm.selectedAll = false;

        projectsService.selectedProject && testsRunsService.setSearchParam('projectNames', [projectsService.selectedProject.name]);
        if (page) {
            testsRunsService.setSearchParam('page', page);
            page !== vm.currentPage && (vm.currentPage = page);
        }
        pageSize && testsRunsService.setSearchParam('pageSize', pageSize);
        // vm.selectAll = false;

        return testsRunsService.fetchTestRuns(true)
            .then(function(rs) {
                const testRuns = rs.results;

                vm.totalResults = rs.totalResults;
                vm.pageSize = rs.pageSize;
                vm.testRuns = testRuns;
                vm.launchers = rs.launchers;

                return $q.resolve(vm.testRuns);
            })
            .catch(function(err) {
                console.error(err.message);
                messageService.error(err.message);

                return $q.resolve([]);
            });
    }

    function areTestRunsFromOneSuite() {
        let firstItem;

        // return false if nothing to compare
        if (vm.selectedTestRuns.length <= 1) { return false; }

        firstItem = vm.selectedTestRuns[0];

        return !vm.selectedTestRuns.some(testRun => testRun.testSuite.id !== firstItem.testSuite.id);
    }

    function showCompareDialog(event) {
        $mdDialog.show({
            controller: 'CompareController',
            template: require('../../components/modals/compare/compare.html'),
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose:true,
            fullscreen: true,
            locals: {
                selectedTestRuns: vm.selectedTestRuns
            }
        });
    }

    function batchRerun() {
        const rerunFailures = confirm('Would you like to rerun only failures, otherwise all the tests will be restarted?');
        const resultsCounter = {success: 0, fail: 0};
        const promises = vm.testRuns
            .filter(testRun => testRun.selected)
            .map(function(testRun) {
                return rebuild(testRun, rerunFailures, resultsCounter);
            });

        $q.all(promises)
            .finally(() => {
                let delay = 0;
                const countOfSelectedTestRuns = vm.selectedTestRuns.length;

                if (vm.selectedAll && resultsCounter.success) {
                    vm.selectedAll = false;
                }
                if (!resultsCounter.fail) {
                    vm.selectedTestRuns = [];
                } else {
                    updateSelectedTestRuns();
                }

                showBulkOperationMessages({
                    action: 'rerun',
                    succeeded: resultsCounter.success,
                    failed: resultsCounter.fail,
                    total: countOfSelectedTestRuns,
                });
            });
    }

    function rebuild(testRun, rerunFailures, resultsCounter) {
        if (vm.isToolConnected('JENKINS')) {
            if (typeof rerunFailures === 'undefined') {
                rerunFailures = confirm('Would you like to rerun only failures, otherwise all the tests will be restarted?');
            }

            return TestRunService.rerunTestRun(testRun.id, rerunFailures).then(function(rs) {
                if (rs.success) {
                    testRun.status = 'IN_PROGRESS';
                    if (resultsCounter) {
                        testRun.selected && (testRun.selected = false);
                        resultsCounter.success += 1;
                    } else {
                        messageService.success('Rebuild triggered in CI service');
                    }
                } else {
                    if (resultsCounter) {
                        resultsCounter.fail += 1;
                    } else {
                        messageService.error(rs.message);
                    }
                }
            });
        } else {
            if (testRun.jenkinsURL) {
                resultsCounter && (resultsCounter.success += 1);
                window.open(testRun.jenkinsURL + '/rebuild/parameterized', '_blank');

                return $q.resolve();
            } else {
                resultsCounter && (resultsCounter.fail += 1);

                return $q.resolve();
            }

        }
    }

    function batchDelete() {//TODO: why we don't use confirmation in this case?
        const selectedCount = vm.selectedTestRuns.length;
        const resultsCounter = {success: 0, fail: 0};
        const promises = vm.selectedTestRuns.map(testRun => deleteTestRunFromQueue(testRun, resultsCounter));

        $q.all(promises)
            .finally(function() {
                const isAllTestsWasSelected = selectedCount === vm.testRuns.length;
                const isLastPage = vm.currentPage === Math.ceil(vm.totalResults / vm.pageSize);
                const isFirstPage = vm.currentPage === 1;

                // reset selectAll if enabled and we have success responses
                if (vm.selectedAll && resultsCounter.success) { vm.selectedAll = false; }
                // update or reset selectedTestRuns object
                if (resultsCounter.fail) {
                    updateSelectedTestRuns();
                } else {
                    vm.selectedTestRuns = [];
                }

                showBulkOperationMessages({
                    action: 'deleted',
                    succeeded: resultsCounter.success,
                    failed: resultsCounter.fail,
                    total: selectedCount,
                });
                testsRunsService.clearDataCache();
                // load previous page if:
                // 1) was selected all tests on page
                // 2) it was a last page
                // 3) it wasn't a single page
                // 4) no failed operations
                if (isAllTestsWasSelected  && isLastPage && !isFirstPage && !resultsCounter.fail) {
                    getTestRuns(vm.currentPage - 1);
                } else if (resultsCounter.success) {
                    getTestRuns()
                        .then((testRuns) => {
                            // update new data statuses and reinitialize selectedTestRuns if not all selected test runs was removed
                            if (resultsCounter.fail) {
                                vm.selectedTestRuns = testRuns.reduce((newSelectedTestRuns, testRun) => {
                                    if (vm.selectedTestRuns.length) {
                                        const index = vm.selectedTestRuns.findIndex(({ id }) => id === testRun.id);

                                        if (index !== -1) {
                                            testRun.selected = true;
                                            newSelectedTestRuns.push(testRun);
                                            vm.selectedTestRuns.splice(index, 1);
                                        }
                                    }

                                    return newSelectedTestRuns;
                                }, []);
                                // enable selectedAll if on the page left only previously selected test runs
                                if (vm.selectedTestRuns.length === testRuns.length) { vm.selectedAll = true; }
                            }
                        });
                }
            });
    }

    function abortSelectedTestRuns() {
        if (vm.isToolConnected('JENKINS')) {
            const resultsCounter = {success: 0, fail: 0};
            let selectedCount = 0;
            let promises = [];

            vm.selectedTestRuns = vm.selectedTestRuns.reduce((newSelection, testRun) => {
                if (testRun.status === 'IN_PROGRESS') {
                    newSelection.push(testRun);
                } else {
                    testRun.selected = false;
                }

                return newSelection;
            }, []);
            updateSelectedTestRuns();
            selectedCount = vm.selectedTestRuns.length;

            promises = vm.selectedTestRuns.map(testRun => abort(testRun, resultsCounter));

            $q.all(promises).finally(() => {
                showBulkOperationMessages({
                    action: 'aborted',
                    succeeded: resultsCounter.success,
                    failed: resultsCounter.fail,
                    total: selectedCount,
                });
            });
        } else {
            messageService.error('Unable connect to jenkins');
        }
    }

    function abort(testRun, resultsCounter) {
        return TestRunService.abortCIJob(testRun.id, testRun.ciRunId)
            .then(function (rs) {
                if(!rs.success){
                    messageService.error(rs.message);
                }
                const abortCause = {};
                const currentUser = UserService.currentUser;

                abortCause.comment = 'Aborted by ' + currentUser.username;

                return TestRunService.abortTestRun(testRun.id, testRun.ciRunId, abortCause)
                    .then(function(rs) {
                        if (rs.success){
                            testRun.status = 'ABORTED';
                            testRun.selected = false;
                            if (resultsCounter) {
                                resultsCounter.success += 1;
                            } else {
                                messageService.success('Testrun ' + testRun.testSuite.name + ' is aborted' );
                            }
                        } else {
                            if (resultsCounter) {
                                resultsCounter.fail += 1;
                            } else {
                                messageService.error(rs.message);
                            }
                        }
                    });
            });
    }

    //TODO: implement deselection on operation complete
    //TODO: use common single message for bulk operation
    function batchEmail(event) {
        showEmailDialog(vm.selectedTestRuns, event);
    }

    function showEmailDialog(testRuns, event) {
        $mdDialog.show({
            controller: 'EmailController',
            template: require('../../components/modals/email/email.html'),
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose:true,
            fullscreen: true,
            controllerAs: '$ctrl',
            locals: {
                testRuns: testRuns
            }
        });
    }

    function selectTestRun(testRun) {
        if (testRun.selected) {
            if (!vm.testRuns.some(testRun => !testRun.selected)) {
                vm.selectedAll = true;
            }
        } else if (!testRun.selected && vm.selectedAll) {
            vm.selectedAll = false;
        }

        updateSelectedTestRuns();
    }

    function selectAllTestRuns() {
        vm.testRuns.forEach(testRun => testRun.selected = vm.selectedAll);
        updateSelectedTestRuns();
    }

    function updateSelectedTestRuns() {
        vm.selectedTestRuns = vm.testRuns.filter(testRun => testRun.selected);
    }

    function deleteSingleTestRun(testRun) {
        const confirmation = confirm('Do you really want to delete "' + testRun.testSuite.name + '" test run?');

        if (confirmation) {
            const id = testRun.id;
            TestRunService.deleteTestRun(id).then(function(rs) {
                const messageData = rs.success ? {success: rs.success, id: id, message: 'Test run{0} {1} removed'} : {id: id, message: 'Unable to delete test run{0} {1}'};

                UtilService.showDeleteMessage(messageData, [id], [], []);
                if (rs.success) {
                    vm.selectedAll = false;
                    testsRunsService.clearDataCache();
                    //if it was last item on the page try to load previous page
                    if (vm.testRuns.length === 1 && vm.currentPage !== 1) {
                        getTestRuns(vm.currentPage - 1);
                    } else {
                        getTestRuns();
                    }
                }
            });
        }
    }

    function deleteTestRunFromQueue(testRun, resultsCounter) {
        return TestRunService.deleteTestRun(testRun.id)
            .then(function(rs) {
                if (rs.success) {
                    testRun.selected = false;
                    resultsCounter.success += 1;
                } else {
                    resultsCounter.fail += 1;
                }
        });
    }

    function getEventFromMessage(message) {
        return JSON.parse(message.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    }

    function initWebsocket() {
        const wsName = 'zafira';

        vm.zafiraWebsocket = Stomp.over(new SockJS(API_URL + '/api/websockets'));
        vm.zafiraWebsocket.debug = null;
        vm.zafiraWebsocket.ws.close = function() {};
        vm.zafiraWebsocket.connect({withCredentials: false}, function () {
            vm.subscriptions.statistics = subscribeStatisticsTopic();
            vm.subscriptions.testRuns = subscribeTestRunsTopic();
            vm.subscriptions.launchedTestRuns = subscribeLaunchedTestRuns();
            UtilService.websocketConnected(wsName);
        }, function () {
            UtilService.reconnectWebsocket(wsName, initWebsocket);
        });
    }

    function subscribeLaunchedTestRuns() {
        return vm.zafiraWebsocket.subscribe('/topic/' + TENANT + '.launcherRuns', function (data) {
            const event = getEventFromMessage(data.body);
            const launcher = event.launcher;

            launcher.status = 'LAUNCHING';
            launcher.ciRunId = event.ciRunId;
            launcher.testSuite = { name: launcher.name };
            const indexOfLauncher = vm.launchers.findIndex((res) => { res.ciRunId === launcher.ciRunId });

            if (indexOfLauncher === -1) {
                vm.launchers = testsRunsService.addNewLauncher(launcher);
                setTimerOnDestroingLauncher(launcher);
                $scope.$apply();
            }
        });
    }

    function subscribeTestRunsTopic() {
        return vm.zafiraWebsocket.subscribe('/topic/' + TENANT + '.testRuns', function (data) {
            const event = getEventFromMessage(data.body);
            const testRun = angular.copy(event.testRun);
            const index = getTestRunIndexById(+testRun.id);

            if (vm.launchers) {
                const indexOfLauncher = vm.launchers.findIndex((launcher) => { return launcher.ciRunId === testRun.ciRunId });

                if (indexOfLauncher !== -1) {
                    clearTimeout(vm.launchers[indexOfLauncher].timeout);
                    $timeout(() => {
                        vm.launchers = testsRunsService.deleteLauncherFromStorebyCiId(testRun.ciRunId);
                    });
                }
            }

            if (projectsService.selectedProject && +projectsService.selectedProject.id !== +testRun.project.id) { return; }

            //add new testRun to the top of the list or update fields if it is already in the list
            if (index === -1) {
                // do no add new Test run if Search is active
                if (vm.isFilterActive() || vm.isSearchActive()) { return; }
                if (vm.currentPage === 1) {
                    vm.testRuns = testsRunsService.addNewTestRun(testRun);
                    vm.totalResults += 1;
                }
            } else {
                const data = {
                    status: testRun.status,
                    reviewed: testRun.reviewed,
                    elapsed: testRun.elapsed,
                    platform: testRun.platform,
                    env: testRun.env,
                    comments: testRun.comments,
                };

                vm.testRuns = testsRunsService.updateTestRun(index, data);
            }
            $scope.$apply();
        });
    }

    function subscribeStatisticsTopic() {
        return vm.zafiraWebsocket.subscribe('/topic/' + TENANT + '.statistics', function (data) {
            const event = getEventFromMessage(data.body);
            const index = getTestRunIndexById(+event.testRunStatistics.testRunId);

            if (index !== -1) {
                const data = {
                    inProgress: event.testRunStatistics.inProgress,
                    passed: event.testRunStatistics.passed,
                    failed: event.testRunStatistics.failed,
                    failedAsKnown: event.testRunStatistics.failedAsKnown,
                    failedAsBlocker: event.testRunStatistics.failedAsBlocker,
                    skipped: event.testRunStatistics.skipped,
                    reviewed: event.testRunStatistics.reviewed,
                    aborted: event.testRunStatistics.aborted,
                    queued: event.testRunStatistics.queued,
                };

                vm.testRuns = testsRunsService.updateTestRun(index, data);
                $scope.$apply();
            }


        });
    }

    function bindEvents() {
        $scope.$on('$destroy', function () {
            if (vm.zafiraWebsocket && vm.zafiraWebsocket.connected) {
                vm.subscriptions.statistics && vm.subscriptions.statistics.unsubscribe();
                vm.subscriptions.testRuns && vm.subscriptions.testRuns.unsubscribe();
                vm.subscriptions.launchedTestRuns && vm.subscriptions.launchedTestRuns.unsubscribe();
                $timeout(function () {
                    vm.zafiraWebsocket.disconnect();
                }, 0, false);
                UtilService.websocketConnected('zafira');
            }
        });

        const onTransStartSubscription = $transitions.onStart({}, function(trans) {
            const toState = trans.to();

            if (toState.name !== 'tests.runDetails'){
                TestService.clearDataCache();
            }
            onTransStartSubscription();
        });
    }

    function showCiHelperDialog(event) {
        $mdDialog.show({
            controller: CiHelperController,
            controllerAs: '$ctrl',
            template: CiHelperTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose:false,
            fullscreen: true,
            autoWrap: false,
            escapeToClose:false,
        });
    }

    function getTestRunIndexById(id) {
        let index = -1;

        vm.testRuns.some(function(testRun, i) {
            return testRun.id === id && (index = i) && true;
        });

        return index;
    }

    function getTestRunById(id) {
        let testRun;
        const index = getTestRunIndexById(id);

        index !== -1 && (testRun = vm.testRuns[index]);

        return testRun;
    }

    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();

        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    function showBulkOperationMessages({ action, succeeded, failed, total }) {
        let delay = 0;

        switch (true) {
            case !!succeeded:
                delay = 2500;
                showSuccessBulkOperationMessage({
                    action,
                    count: succeeded,
                    total,
                    options: {hideDelay: delay},
                });
                if (!failed) {
                    break;
                }
            case !!failed:
                $timeout(() => {
                    showFailBulkOperationMessage({
                        action,
                        count: failed,
                        total,
                    });
                }, delay);
        }
    }

    function showSuccessBulkOperationMessage({ action, count, total, options = {} }) {
        messageService.success(`${count} out of ${total} test runs have been successfully ${action}.`, options);
    }

    function showFailBulkOperationMessage({ action, count, total, options = {} }) {
        messageService.error(`${count} out of ${total} test runs have failed to be ${action}. Please, try again.`, options);
    }

    function bindEventListeners() {
        vm.$onDestroy = () => {
            if (vm.isMobile) {
                angular.element(scrollableParentElement).off('scroll.hideFilterButton', onScroll);
            }
        }
        if (vm.isMobile) {
            angular.element(scrollableParentElement).on('scroll.hideFilterButton', onScroll);
        }
    }

    function onScroll() {
        if (!vm.scrollTicking) {
            vm.scrollTicking = true;
            $scope.$apply();
            scrollTickingTimeout = $timeout(() => {
                vm.scrollTicking = false;
            }, 300);
        } else {
            $timeout.cancel(scrollTickingTimeout);
            scrollTickingTimeout = $timeout(() => {
                vm.scrollTicking = false;
            }, 300);
        }
    }
};

export default testsRunsController;
