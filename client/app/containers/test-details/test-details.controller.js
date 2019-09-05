'use strict';

import ImagesViewerController from '../../components/modals/images-viewer/images-viewer.controller';
import IssuesModalController from '../../components/modals/issues/issues.controller';
import testDetailsFilterController from './test-details-modal/filter-modal.controller';
import testDetailsTemplate from './test-details-modal/filter-modal.html';
import CiHelperController from '../../shared/ci-helper/ci-helper.controller';
import CiHelperTemplate from '../../shared/ci-helper/ci-helper.html';

const testDetailsController = function testDetailsController($scope, $timeout, $rootScope, $q, TestService, API_URL,
                                                             modalsService, $state, $transitions,
                                                             UtilService, testsRunsService, $mdDialog, toolsService, messageService, windowWidthService, testDetailsService)  {
    'ngInject';

    const mobileWidth = 600;
    const testGroupDataToStore = {
        statuses: testDetailsService.getStatuses() || [],
        tags: testDetailsService.getTags() || []
    };
    let jiraSettings = {};
    let testRailSettings = {};
    let qTestSettings = {};
    let TENANT;
    const vm = {
        currentMode: 'ONE',
        reverse: false,
        predicate: 'startTime',
        tags: [],
        testGroups: null,
        testGroupMode: 'PLAIN',
        testRun: null,
        testsLoading: true,
        testsFilteredEmpty: true,
        testsTagsOptions: {initValues: testDetailsService.getTags() || []},
        testsStatusesOptions: {initValues: testDetailsService.getStatuses() || []},
        subscriptions: {},
        zafiraWebsocket: null,
        showRealTimeEvents: true,
        testId: null,
        isMobile: windowWidthService.isMobile,

        isDetailsFilterActive: testDetailsService.isDetailsFilterActive,
        onStatusButtonClick: onStatusButtonClick,
        onTagSelect: onTagSelect,
        resetTestsGrouping: resetTestsGrouping,
        selectTestGroup: selectTestGroup,
        switchTestGroupMode: switchTestGroupMode,
        changeTestStatus: changeTestStatus,
        showDetailsDialog: showDetailsDialog,
        goToTestDetails: goToTestDetails,
        showFilterDialog: showFilterDialog,
        showCiHelperDialog: showCiHelperDialog,
        subscribeLaunchedTestRuns: subscribeLaunchedTestRuns,
        onBackClick,
        updateTest,
        getTestURL,
        get empty() {
            return !Object.keys(vm.testRun.tests || {}).length ;
        },
        get jira() { return jiraSettings; },
        get testRail() { return testRailSettings; },
        get qTest() { return qTestSettings; },
        isToolConnected: toolsService.isToolConnected,
        openImagesViewerModal,
    };

    vm.$onInit = controlInit;

    return vm;

    function controlInit() {
        TENANT = $rootScope.globals.auth.tenant;

        initJiraSettings();
        initTestRailSettings();
        initQTestSettings();
        initTestGroups();
        initWebsocket();
        initTests();
        fillTestRunMetadata();
        bindEvents();
    }

    function subscribeLaunchedTestRuns() {
        return vm.zafiraWebsocket.subscribe('/topic/' + TENANT + '.launcherRuns', function (data) {
            const event = getEventFromMessage(data.body);
            const launcher = event.launcher;

            launcher.status = 'LAUNCHING';
            launcher.ciRunId = event.ciRunId;
            launcher.testSuite = { name: launcher.name };
            const indexOfLauncher = testsRunsService.readStoredlaunchers().findIndex((res) => { res.ciRunId === launcher.ciRunId });

            if (indexOfLauncher === -1) {
                testsRunsService.addNewLauncher(launcher);
            }
        });
    }

    function showCiHelperDialog(event) {
        $mdDialog.show({
            controller: CiHelperController,
            template: CiHelperTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose:false,
            fullscreen: true,
            autoWrap: false,
            escapeToClose:false
        });
    }

    function highlightTest() {
        const activeTest = getTestById(vm.testId);
        
        if (activeTest) {
            $timeout(function() {
                const el = document.getElementById('test_' + vm.testId);

                vm.testId = parseInt(vm.testId);
                if (!isElementInViewport(el)) {
                    const testRunHeader = document.querySelector('.p-tests-run-details__sticky-header').offsetHeight;
                    const pageHeader = document.querySelector('.fixed-page-header').offsetHeight;
                    const headerOffset = testRunHeader + pageHeader;
                    const elOffsetTop = $(el).offset().top;

                    $('html,body').animate({ scrollTop: elOffsetTop - headerOffset }, 'slow');
                } 
                $timeout(function() {
                    vm.testId = null;
                }, 4000);
            }, 500);
        }
    }

    function getTestIndexById(id) {
        return Object.keys(vm.testRun.tests).findIndex((testId) => { return testId === id; });
    }

    function getTestById(id) {
        let test;
        const index = getTestIndexById(id);
        
        index !== -1 && (test = vm.testRun.tests[id]);

        return test;
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

    function initJiraSettings() {
        toolsService.fetchToolSettings('JIRA')
            .then(function(settings) {
                if (settings.success) {
                    jiraSettings = UtilService.settingsAsMap(settings.data);

                    jiraSettings['JIRA_URL'] && (jiraSettings['JIRA_URL'] = jiraSettings['JIRA_URL'].replace(/\/$/,''));
                }
            });
    }

    function initTestRailSettings() {
        toolsService.fetchToolSettings('TESTRAIL')
            .then(function(settings) {
                if (settings.success) {
                    testRailSettings = UtilService.settingsAsMap(settings.data);

                    testRailSettings['TESTRAIL_URL'] && (testRailSettings['TESTRAIL_URL'] = testRailSettings['TESTRAIL_URL'].replace(/\/$/,''));
                }
            });
    }

    function initQTestSettings() {
        toolsService.fetchToolSettings('QTEST')
            .then(function(settings) {
                if (settings.success) {
                    qTestSettings = UtilService.settingsAsMap(settings.data);

                    qTestSettings['QTEST_URL'] && (qTestSettings['QTEST_URL'] = qTestSettings['QTEST_URL'].replace(/\/$/,''));
                }
            });
    }

    function updateTest(test, isPassed) {
        var newStatus = isPassed ? 'PASSED' : 'FAILED';
        if (test.status !== newStatus) {
            test.status = newStatus;
        }
        else {
            return;
        }
        var message;
        TestService.updateTest(test).then(function(rs) {
            if (rs.success) {
                message = 'Test was marked as ' + test.status;
                addTestEvent(message, test);
                messageService.success(message);
            }
            else {
                console.error(rs.message);
            }
        });
    }

    function  addTestEvent(message, test) {
        var testEvent = {};
        testEvent.description = message;
        testEvent.jiraId = Math.floor(Math.random() * 90000) + 10000;
        testEvent.testCaseId = test.testCaseId;
        testEvent.type = 'EVENT';
        TestService.createTestWorkItem(test.id, testEvent).
            then(function(rs) {
                if (rs.success) {
                } else {
                    messageService.error('Failed to add event test "' + test.id);
                }
            })
    }

    function fillTestRunMetadata() {
        addBrowserVersion();
        initJobMetadata();
    }

    function addBrowserVersion() {
        var platform = vm.testRun.platform ? vm.testRun.platform.split(' ') : [];
        var version = null;

        if (platform.length > 1) {
            version = 'v.' + platform[1];
        }

        if(!version && vm.testRun.config && vm.testRun.config.browserVersion !== '*') {
            version = vm.testRun.config.browserVersion;
        }

        vm.testRun.browserVersion = version;
    }

    function onBackClick() {
        $state.go('tests.runs', {activeTestRunId: vm.testRun.id});
    }

    /**
     * Set default value for testGroups
     */
    function initTestGroups() {
        vm.testGroups = {
            group: {
                'package': {
                    data: {},
                    selectedName: undefined
                },
                'class': {
                    data: {},
                    selectedName: undefined
                },
                common: {
                    data: {
                        'all': []
                    },
                    selectedName: 'all'
                }
            },
            reverse: false,
            predicate: 'startTime',
            mode: 'package',
            apply: false
        };
    }

    function initJobMetadata() {
        if (vm.testRun.job && vm.testRun.job.jobURL) {
            !vm.testRun.jenkinsURL && (vm.testRun.jenkinsURL = vm.testRun.job.jobURL + '/' + vm.testRun.buildNumber);
            !vm.testRun.UID && (vm.testRun.UID = vm.testRun.testSuite.name + ' ' + vm.testRun.jenkinsURL);
        }
    }

    function initTests() {
        vm.testGroups.mode = 'common';

        loadTests(vm.testRun.id)
        .then(function () {
            vm.testId = getSelectedTestId();
            vm.testId && highlightTest();
            vm.testGroups.group.common.data.all = vm.testRun.tests;
            showTestsByTags(vm.testRun.tests, testGroupDataToStore.tags);
            showTestsByStatuses(vm.testRun.tests, testGroupDataToStore.statuses);
            vm.testRun.tags = collectTags(vm.testRun.tests);
        })
        .finally(() => {
            vm.testsLoading = false;
        });
    }

    function getSelectedTestId() {
        let successOldUrl = TestService.getPreviousUrl();

        if (successOldUrl) {
            TestService.clearPreviousUrl();
            TestService.unsubscribeFromLocationChangeStart();
        }
        
        return successOldUrl && successOldUrl.includes('/info/') ? successOldUrl.split('/').pop() : successOldUrl;
    }

    function loadTests(testRunId) {
        const defer = $q.defer();
        const params = {
            'page': 1,
            'pageSize': 100000,
            'testRunId': testRunId
        };

        TestService.searchTests(params)
        .then(function (rs) {
            if (rs.success) {
                const data = rs.data.results || [];

                vm.testRun.tests = {};
                TestService.setTests = data;
                TestService.getTests.forEach(function(test) {
                    addTest(test);
                });

                defer.resolve(angular.copy(data));
            } else {
                console.error(rs.message);
                defer.reject(rs.message);
            }
        });

        return defer.promise;
    }

    function goToTestDetails(testId) {
        $state.go('tests.runInfo', {
            testRunId: vm.testRun.id,
            testId: testId
        });
    }

    function addTest(test) {
        test.elapsed = test.finishTime ? (test.finishTime - test.startTime) : Number.MAX_VALUE;
        prepareArtifacts(test);
        angular.forEach(test.tags, function (tag) {
            if (tag.name === 'TESTRAIL_TESTCASE_UUID' || tag.name === 'QTEST_TESTCASE_UUID') {
                tag.normalizedValue = tag.value.split('-').pop();
            }
        });

        vm.testRun.tests[test.id] = test;

        if (vm.testGroupMode === 'PLAIN') {
            vm.testRun.tags = collectTags(vm.testRun.tests);
        } else {
            addGroupingItem(test);
        }

        onTagSelect(testGroupDataToStore.tags);
        onStatusButtonClick(testGroupDataToStore.statuses);
    }

    function getTestURL(type, value) {
        value = value.split('-');

        switch(type) {
            case 'TESTRAIL_URL':
                return `${testRailSettings['TESTRAIL_URL']}/index.php?/cases/view/${value.pop()}`;
            case 'QTEST_URL':
                return `${qTestSettings['QTEST_URL']}/p/${value[0]}/portal/project#tab=testdesign&object=1&id=${value.pop()}`;
        }
    }

    function prepareArtifacts(test) {
        const formattedArtifacts = test.artifacts.reduce(function(formatted, artifact) {
            const name = artifact.name.toLowerCase();

            if (!name.includes('live') && !name.includes('video')) {
                const links = artifact.link.split(' ');
                const pathname = new URL(links[0]).pathname;

                artifact.extension = pathname.split('/').pop().split('.').pop();
                if (artifact.extension === 'png') {
                    if (links[1]) {
                        artifact.link = links[0];
                        artifact.thumb = links[1];
                    }
                    formatted.imageArtifacts.push(artifact);
                }
                formatted.artifactsToShow.push(artifact);
            }

            return formatted;
        }, {imageArtifacts: [], artifactsToShow: []});

        test.imageArtifacts = formattedArtifacts.imageArtifacts;
        test.artifactsToShow = formattedArtifacts.artifactsToShow;
    }

    function collectTags(tests) {
        var result = [];

        angular.forEach(tests, function (test) {
            test.tags.forEach(function (tag) {
                if (result.indexOfField('value', tag.value) === -1) {
                    result.push(tag);
                }
            });
        });

        return result;
    }

    function addGroupingItem(test) {
        if (!vm.testGroups.group.package.data[test.notNullTestGroup] && test.notNullTestGroup) {
            vm.testGroups.group.package.data[test.notNullTestGroup] = [];
        }

        if (!vm.testGroups.group.class.data[test.testClass] && test.testClass) {
            vm.testGroups.group.class.data[test.testClass] = [];
        }

        var groupPackageIndex = vm.testGroups.group.package.data[test.notNullTestGroup].indexOfField('id', test.id);
        var classPackageIndex = vm.testGroups.group.class.data[test.testClass].indexOfField('id', test.id);

        if (groupPackageIndex !== -1) {
            vm.testGroups.group.package.data[test.notNullTestGroup].splice(groupPackageIndex, 1, test);
        } else {
            vm.testGroups.group.package.data[test.notNullTestGroup].push(test);
        }

        if (classPackageIndex !== -1) {
            vm.testGroups.group.class.data[test.testClass].splice(classPackageIndex, 1, test);
        } else {
            vm.testGroups.group.class.data[test.testClass].push(test);
        }
    }

    function showTestsByTags(tests, tags) {
        angular.forEach(tests, function (test) {
            test.show = false;
            if (tags && tags.length) {
                tags.forEach(function (tag) {
                    if (!test.show) {
                        test.show = test.tags.map(function (testTag) {
                            return testTag.value;
                        }).includes(tag);
                    }
                });
            } else {
                test.show = true;
            }
        });
    }

    function showTestsByStatuses(tests, statuses) {
        vm.testsFilteredEmpty = true;
        angular.forEach(tests, function (test) {
            test.showByStatus = false;
            if (statuses && statuses.length) {
                test.showByStatus = statuses.includes(test.status.toLowerCase());
            } else {
                test.showByStatus = true;
            }
            if (test.showByStatus) {
                vm.testsFilteredEmpty = false;
            }
        });
    }

    function switchTestGroupMode(mode, force) {
        if (vm.testGroupMode !== mode || force) {
            vm.testGroupMode = mode;

            !force && resetTestsGrouping();

            onTestGroupingMode(function () {
                if (!force) {
                    vm.testRun.tags = collectTags(vm.testRun.tests);
                    vm.testsTagsOptions.hashSymbolHide = false;
                    vm.testGroups.mode = 'common';
                }
                angular.element('.page').removeClass('groups-group-mode');
            }, function () {
                angular.element('.page').addClass('groups-group-mode');
                vm.testGroups.mode = 'package';
                vm.testRun.tags = [
                    {name: 'package', value: 'Package', default: true},
                    {name: 'class', value: 'Class'}
                ];
                groupTests(force);

                if (!force) {
                    vm.testsTagsOptions.initValues = ['Package'];
                    vm.testsTagsOptions.hashSymbolHide = true;
                }
            });
        }
    }

    function resetTestsGrouping() {
        vm.testsTagsOptions.reset(); //TODO: refactoring: directive shouldn't extend passed object: ("clear functions" approach)
        vm.testsStatusesOptions.reset();
        vm.testsFilteredEmpty = false;
        vm.predicate = 'startTime';
        vm.reverse = false;
        vm.testGroups.predicate = 'startTime';
        vm.testGroups.reverse = false;
        if (vm.testGroupMode === 'GROUPS') {
            vm.testGroups.mode = 'package';
        }
    }

    function onTestGroupingMode(funcPlain, funcGroups) {
        switch(vm.testGroupMode) {
            case 'PLAIN':
                funcPlain.call();
                break;
            case 'GROUPS':
                funcGroups.call();
                break;
            default:
                break;
        }
    }

    function groupTests(force) {
        if (!force) {
            initTestGroups();
        } else {
            vm.testGroups.group.package.data = {};
            vm.testGroups.group.class.data = {};
        }

        angular.forEach(vm.testRun.tests, function (value) {
            addGroupingItem(value);
        });
    }

    function selectTestGroup(group, selectName) {
        group.selectedName = group.selectedName === selectName ? undefined : selectName;
    }

    function onTagSelect(chips) {
        var fnPlain = function() {
            showTestsByTags(vm.testRun.tests, chips);
        };
        var fgGroups = function() {
            angular.forEach(vm.testRun.tests, function(test) {
                test.show = true;
                test.showByStatus = true;
            });
            if (chips && chips.length) {
                vm.testGroups.mode = chips[0].toLowerCase();
            }
            vm.testGroups.apply = true;
        };

        testDetailsService.setTags(chips);
        vm.testsTagsOptions.initValues = testDetailsService.getTags();
        onTestGroupingMode(fnPlain, fgGroups);
        testGroupDataToStore.tags = angular.copy(chips);
    }

    function onStatusButtonClick(statuses) {
        var fnPlain = function() {
            showTestsByStatuses(vm.testRun.tests, statuses);
        };
        var fgGroups = function() {
            showTestsByStatuses(vm.testRun.tests, statuses);
        };
        
        testDetailsService.setStatuses(statuses);
        vm.testsStatusesOptions.initValues = testDetailsService.getStatuses();
        onTestGroupingMode(fnPlain, fgGroups);
        testGroupDataToStore.statuses = angular.copy(statuses);
    }

    function changeTestStatus(test, status) {
        if(test.status !== status && confirm('Do you really want mark test as ' + status + '?')) {
            test.status = status;
            TestService.updateTest(test)
            .then(function(rs) {
                if (rs.success) {
                    messageService.success('Test was marked as ' + status);
                } else {
                    console.error(rs.message);
                }
            });
        }
    }

    function showDetailsDialog(test, event) {
        const isNew = setWorkItemIsNewStatus(test.workItems);

        modalsService.openModal({
            controller: IssuesModalController,
            template: require('../../components/modals/issues/issues.html'),
            parent: angular.element(document.body),
            targetEvent: event,
            controllerAs: '$ctrl',
            locals: {
                test: test,
                isNewIssue: isNew.issue,
                isNewTask: isNew.task,
            }
        })
        .catch(function(response) {
            if (response) {
                vm.testRun.tests[test.id] = angular.copy(response);
            }
        });
    }

    function showFilterDialog(event) {
        vm.testsStatusesOptions.initValues = testDetailsService.getStatuses();
        vm.testsTagsOptions.initValues = testDetailsService.getTags();
        $mdDialog.show({
            controller: testDetailsFilterController,
            template: testDetailsTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose:true,
            fullscreen: true,
            bindToController: true,
            controllerAs: '$ctrl',
            onComplete: () => {
                $(window).on('resize.filterDialog', () => {
                    if ($(window).width() >= mobileWidth) {
                        $mdDialog.hide();
                    }
                })
            },
            onRemoving: () => {
                $(window).off('resize.filterDialog');
            },
            locals: {
                tags: vm.testRun.tags,
                testsTagsOptions: vm.testsTagsOptions,
                testGroupMode: vm.testGroupMode,
                testsStatusesOptions: vm.testsStatusesOptions,
                sortByStatus: vm.onStatusButtonClick,
                sortByTags: vm.onTagSelect,
                resetTestsGroupingParent: vm.resetTestsGrouping,
            }
        });
    }

    function setWorkItemIsNewStatus(workItems) {
        const isNew = {
            issue: true,
            task: true
        };

        workItems.length && workItems.forEach(function(item) {
            switch (item.type) {
                case 'TASK':
                    isNew.task = false;
                    break;
                case 'BUG':
                    isNew.issue = false;
                    break;
            }
        });

        return isNew;
    }

    function initWebsocket() {
        const wsName = 'zafira';

        vm.zafiraWebsocket = Stomp.over(new SockJS(API_URL + '/api/websockets'));
        vm.zafiraWebsocket.debug = null;
        vm.zafiraWebsocket.ws.close = function() {};
        vm.zafiraWebsocket.connect({withCredentials: false}, function () {
            vm.subscriptions.statistics = subscribeStatisticsTopic();
            vm.subscriptions.testRun = subscribeTestRunsTopic();
            vm.subscriptions[vm.testRun.id] = subscribeTestsTopic(vm.testRun.id);
            vm.subscriptions.launchedTestRuns = subscribeLaunchedTestRuns();
            UtilService.websocketConnected(wsName);
        }, function () {
            UtilService.reconnectWebsocket(wsName, initWebsocket);
        });
    }

    function getEventFromMessage(message) {
        return JSON.parse(message.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    }

    function isCurrentTestRunStatistics(event) {
        return vm.testRun.id === +event.testRunStatistics.testRunId;
    }

    function subscribeStatisticsTopic() {
        return vm.zafiraWebsocket.subscribe('/topic/' + TENANT + '.statistics', function (data) {
            const event = getEventFromMessage(data.body);

            if (!isCurrentTestRunStatistics(event)) {
                return;
            }

            Object.assign(vm.testRun, event.testRunStatistics);
            $scope.$apply();
        });
    }

    function subscribeTestRunsTopic() {
        return vm.zafiraWebsocket.subscribe('/topic/' + TENANT + '.testRuns', function (data) {
            const event = getEventFromMessage(data.body);
            const testRun = angular.copy(event.testRun);

            if (vm.testRun.id !== +testRun.id) { return; }

            vm.testRun.status = testRun.status;
            vm.testRun.reviewed = testRun.reviewed;
            vm.testRun.elapsed = testRun.elapsed;
            vm.testRun.platform = testRun.platform;
            vm.testRun.env = testRun.env;
            vm.testRun.comments = testRun.comments;
            vm.testRun.reviewed = testRun.reviewed;
            $scope.$apply();
        });
    }

    function subscribeTestsTopic() {
        return vm.zafiraWebsocket.subscribe('/topic/' + TENANT + '.testRuns.' + vm.testRun.id + '.tests', function (data) {
            const event = getEventFromMessage(data.body);

            addTest(event.test);
            $scope.$apply();
        });
    }

    function bindEvents() {
        $scope.$on('$destroy', function () {
            if (vm.zafiraWebsocket && vm.zafiraWebsocket.connected) {
                vm.subscriptions.statistics && vm.subscriptions.statistics.unsubscribe();
                vm.subscriptions.testRun && vm.subscriptions.testRun.unsubscribe();
                vm.subscriptions[vm.testRun.id] && vm.subscriptions[vm.testRun.id].unsubscribe();
                vm.subscriptions.launchedTestRuns && vm.subscriptions.launchedTestRuns.unsubscribe();
                $timeout(function () {
                    vm.zafiraWebsocket.disconnect();
                }, 0, false);
                UtilService.websocketConnected('zafira');
            }
        });

        const onTransStartSubscription = $transitions.onStart({}, function(trans) {
            const toState = trans.to();

            if (toState.name !== 'tests.runInfo') {
                TestService.clearDataCache();
                testDetailsService.clearDataCache();
            }

            onTransStartSubscription();
        });
    }

    //TODO: implement lazyLoading after webpack is applied
    function openImagesViewerModal(event, artifact, test) {
        $mdDialog.show({
            controller: ImagesViewerController,
            template: require('../../components/modals/images-viewer/images-viewer.html'),
            controllerAs: '$ctrl',
            bindToController: true,
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose:true,
            fullscreen: false,
            escapeToClose: false,
            locals: {
                test,
                activeArtifactId: artifact.id,
            }
        });
    }
};

export default testDetailsController;
