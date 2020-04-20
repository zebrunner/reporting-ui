'use strict';

import ImagesViewerController from '../../components/modals/images-viewer/images-viewer.controller';
import IssuesModalController from '../../components/modals/issues/issues.controller';
import testDetailsFilterController from './test-details-modal/filter-modal.controller';
import testDetailsTemplate from './test-details-modal/filter-modal.html';
import CiHelperController from '../../shared/ci-helper/ci-helper.controller';
import CiHelperTemplate from '../../shared/ci-helper/ci-helper.html';

const testDetailsController = function testDetailsController(
    $mdMedia,
    $scope,
    $timeout,
    $rootScope,
    $q,
    TestService,
    API_URL,
    modalsService,
    $state,
    $transitions,
    UtilService,
    testsRunsService,
    $mdDialog,
    toolsService,
    messageService,
    ArtifactService,
    pageTitleService,
    authService,
) {
    'ngInject';

    const initialCountToDisplay = 50;
    const defaultLimitOptions = [initialCountToDisplay, initialCountToDisplay * 2];
    let firstIndex;
    let lastIndex;
    const scrollableParentElement = document.querySelector('.page-wrapper');
    let testCaseManagementTools = [];
    let jiraSettings = {};
    let testRailSettings = {};
    let qTestSettings = {};
    let observer;
    const defaultSortField = 'startTime';
    const defaultStatusFilter = {
        field: 'status',
        values: [],
    };
    let _at = [];
    let scrollTickingTimeout = null;

    const vm = {
        scrollTicking: false,
        countPerPage: initialCountToDisplay,
        currentPage: 1,
        testsViewMode: 'plain',
        filters: {
            status: { ...defaultStatusFilter },
            grouping: {},
        },
        sortConfig: {
            field: defaultSortField,
            reverse: false,
        },
        groupingFilters: { //TODO: ?use inheritanse
            'package': {
                field: 'notNullTestGroup',
                dataset: new Set(),
                get data() { return Array.from(this.dataset.values()); },
            },
            'class': {
                field: 'testClass',
                dataset: new Set(),
                get data() { return Array.from(this.dataset.values()); },
            },
            'tags': {
                field: 'tags',
                dataset: new Set(),
                get data() { return Array.from(this.dataset.values()); },
            },
            'plain': {
                get data() { return ['All tests'] },
            }
        },
        testRun: null,
        testsLoading: true,
        testsFilteredEmpty: true, //? Does it still work?
        subscriptions: {},
        zafiraWebsocket: null,
        testId: null,
        configSnapshot: null,
        selectedTestsCount: 0,
        isAllTestsSelected: false,
        bulkChangeInProgress: false,
        batchButtons: [
            {
                text: 'Mark as Passed',
                altText: 'Passed',
                onClick: bulkChangeStatus,
                completed: false,
                class: '_green-icon',
                action: 'PASSED',
                mobileIconClass: 'fa-check-circle'
            },
            {
                text: 'Mark as Failed',
                altText: 'Failed',
                onClick: bulkChangeStatus,
                completed: false,
                class: '_red-icon',
                action: 'FAILED',
                mobileIconClass: 'fa-times-circle'
            },
        ],

        get isMobile() { return $mdMedia('xs'); },
        get isTablet() { return !$mdMedia('gt-md'); },
        get activeTests() { return _at || []; },
        set activeTests(data) { _at = data; return _at; },
        get testsToDisplay() {
            return this.activeTests.slice(firstIndex, lastIndex);
        },
        get limitOptions() {  return !$mdMedia('xs') ? defaultLimitOptions : false; },
        get empty() { return !this.testRun.tests || !this.testRun.tests.length; },
        get jira() { return jiraSettings; },
        get testRail() { return testRailSettings; },
        get qTest() { return qTestSettings; },
        get isStausFilteringActive() { return isStausFilteringActive(); },
        get isSortingActive() { return isSortingActive(); },
        get currentTitle() { return pageTitleService.pageTitle; },

        changeTestStatus,
        changeViewMode,
        clearTestsSelection,
        filterByStatus,
        getArtifactIconId,
        getEmptyTestsMessage,
        getTestURL,
        goToTestDetails,
        highlightTest,
        onAllTestsSelect,
        onBackClick,
        onPageChange,
        onTestSelect,
        onTrackedTestRender,
        openImagesViewerModal,
        orderByElapsed,
        resetStatusFilterAndOrdering,
        showCiHelperDialog,
        showDetailsDialog,
        showFilterDialog,
        toggleGroupingFilter,
        userHasAnyPermission: authService.userHasAnyPermission,
    };

    vm.$onInit = controlInit;

    return vm;

    function controlInit() {
        initAllSettings();
        initFirstLastIndexes();
        initIntersectionObserver();
        initWebsocket();
        initTests();
        initJobMetadata();
        bindEvents();
        vm.testRun.downloadArtifacts = downloadArtifacts;
    }

    function downloadArtifacts() {
        const options = {
            data: Object.values(vm.testRun.tests),
            field: 'artifactsToShow',
            name: vm.testRun.testSuite.name,
        };

        ArtifactService.downloadArtifacts(options);
    }

    function initTests() {
        [vm.testRun.platformIcon, vm.testRun.platformVersion] = testsRunsService.refactorPlatformData(vm.testRun.config);
        loadTests(vm.testRun.id)
            .then(function () {
                vm.testId = getSelectedTestId();
                onInitTests();
            })
            .finally(() => {
                vm.testsLoading = false;
            });
    }

    function loadTests(testRunId) {
        const defer = $q.defer();
        const params = {
            'page': 1,
            'pageSize': 100000,
            'testRunId': testRunId
        };

        TestService.searchTests(params)
            .then((rs) => {
                if (rs.success) {
                    const data = rs.data.results || [];

                    vm.testRun.tests = data;
                    prepareTestsData();
                    defer.resolve(vm.testRun.tests);
                } else {
                    console.error(rs.message);
                    defer.reject(rs.message);
                }
            });

        return defer.promise;
    }

    /**
     * Registers event handlers on controller init event
     * Also registers unsubscribers on controller destroy event
     */
    function bindEvents() {
        $scope.$on('$destroy', function () {
            if (vm.zafiraWebsocket && vm.zafiraWebsocket.connected) {
                for (let key in vm.subscriptions) {
                    vm.subscriptions[key].unsubscribe();
                }
                $timeout(function () {
                    vm.zafiraWebsocket.disconnect();
                }, 0, false);
                UtilService.websocketConnected('zafira');
            }
            disconnectIntersectionObserver();

            if (vm.isMobile) {
                angular.element(scrollableParentElement).off('scroll.hideFilterButton', onScroll);
            }
        });

        const onTransStartSubscription = $transitions.onStart({}, function (trans) {
            const toState = trans.to();

            if (toState.name !== 'tests.runInfo') {
                TestService.clearDataCache();
            }

            onTransStartSubscription();
        });

        if (vm.isMobile) {
            angular.element(scrollableParentElement).on('scroll.hideFilterButton', onScroll);
        }
    }



    /* ------------------------------- UI handlers ------------------------------ */
    function goToTestDetails(testId) {
        $state.go('tests.runInfo', {
            testRunId: vm.testRun.id,
            testId: testId,
            configSnapshot: getConfigSnapshot(),
        });
    }

    /**
     * Hadler to order tests by 'elapsed' field
     * Each next run changes reverses ordering
     */
    function orderByElapsed() {
        vm.sortConfig.reverse = vm.sortConfig.field === 'elapsed' ? !vm.sortConfig.reverse : vm.sortConfig.reverse;
        vm.sortConfig.field = 'elapsed';

        onOrderByElapsed();
    }

    function filterByStatus(statuses = []) {
        onStatusFilterChange({ ...defaultStatusFilter, values: statuses });
    }

    function resetStatusFilterAndOrdering() {
        vm.filters.status = { ...defaultStatusFilter };
        vm.sortConfig.field = defaultSortField;
        vm.sortConfig.reverse = false;
        onFilterChange(true);

        return {
            filters: vm.filters,
            sortConfig: vm.sortConfig,
        }
    }

    function changeViewMode(mode) {
        if (vm.testsViewMode === mode) { return; }

        // Uncomment code line below if you need to reset previously selected group item on view mode change
        // if (vm.groupingFilters[vm.testsViewMode].selectedValue) { vm.groupingFilters[vm.testsViewMode].selectedValue = null; }
        // else save previous active values
        if (vm.filters.grouping && vm.filters.grouping.values) {
            vm.groupingFilters[vm.testsViewMode].cachedValues = vm.filters.grouping.values;
        }
        vm.testsViewMode = mode;
        switch (mode) {
            case 'plain':
                onPlainViewModeActivate();
                break;
            default:
                onFilteredViewModeActivate();
        }
    }

    function toggleGroupingFilter(selectedValue) {
        const filter = vm.groupingFilters[vm.testsViewMode];

        // switch off selected grouping filter if already selected
        if (filter.selectedValue === selectedValue) {
            filter.selectedValue = null;
            vm.filters.grouping = { ...vm.filters.grouping, values: [''] };
        } else {
            filter.selectedValue = selectedValue;
            vm.filters.grouping = { ...vm.filters.grouping, values: [selectedValue] };
        }
        onFilterChange(true);
    }

    function onPageChange() {
        updateFirstLastIndexes();
    }

    function changeTestStatus(test, status) {
        if (test.status !== status && confirm('Do you really want mark test as ' + status + '?')) {
            const copy = {...test};

            copy.status = status;
            TestService.updateTest(copy)
                .then(rs => {
                    if (rs.success) {
                        let message;

                        test.status = status;
                        message = 'Test was marked as ' + test.status;
                        messageService.success(message);
                        addTestEvent(message, test);
                    } else {
                        console.error(rs.message);
                    }
                });
        }
    }

    function bulkChangeStatus(event, btn) {
        if (vm.bulkChangeInProgress) { return; }
        const selectedTests = vm.testsToDisplay.filter(test => test.selected);
        const ids = selectedTests.map(({ id }) => id);
        const params = {
            ids,
            operation: 'STATUS_UPDATE',
            value: btn.action,
        };

        vm.bulkChangeInProgress = true;
        TestService.updateTestsStatus(vm.testRun.id, params)
            .then(res => {
                if (res.success) {
                    const patchedTests = res.data || [];
                    const selectedTestsObj = selectedTests.reduce((accum, test) => {
                        accum[test.id] = test;

                         return accum;
                    }, {});

                    patchedTests.forEach(patchedTest => {
                        selectedTestsObj[patchedTest.id].status = patchedTest.status;
                    });
                    // display alt text for a while (1sec)
                    btn.completed = true;
                    $timeout(() => {
                        btn.completed = false;
                        vm.bulkChangeInProgress = false;
                    }, 1000);

                    const message = 'Test was marked as ' + btn.action;

                    messageService.success('Tests were marked as ' + btn.action);
                    bulkCreateWorkItems(message, selectedTests);
                } else {
                    messageService.error(res.message);
                    vm.bulkChangeInProgress = false;
                }
            });
    }

    function bulkCreateWorkItems(message, tests) {
        const params = tests.map(test => {
            const testEvent = createWorkItem('EVENT', test, message);

            return {
                testId: test.id,
                workItems: [testEvent],
            };
        });

        TestService.createTestsWorkItems(vm.testRun.id, params)
            .then(rs => {
                if (!rs.success) {
                    messageService.error('Failed to add tests events');
                }
            });
    }

    function createWorkItem(type, test, description) {
        return {
            description,
            jiraId: Math.floor(Math.random() * 90000) + 10000,
            testCaseId: test.testCaseId,
            type,
        };
    }

    function onBackClick() {
        $state.go('tests.runs', { activeTestRunId: vm.testRun.id });
    }

    /* ------------------------------ Work with DOM ----------------------------- */
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

    //! incorrect calculating found, need to be checked on scrolling to the last item of long table
    function highlightTest() {
        const activeTest = getTestById(vm.testId);

        if (activeTest) {
            $timeout(function () {
                const el = document.getElementById('test_' + vm.testId);

                if (el && !UtilService.isElementInViewport(el)) {
                    const testRunHeader = document.querySelector('.p-tests-run-details__sticky-header').offsetHeight;
                    const pageHeader = document.querySelector('.fixed-page-header').offsetHeight;
                    const headerOffset = testRunHeader + pageHeader;
                    const elOffsetTop = $(el).offset().top;

                    $(scrollableParentElement).animate({ scrollTop: elOffsetTop - headerOffset }, 'fast');
                }
                $timeout(function () {
                    vm.testId = null;
                }, 4000);
            }, 500);
        }
    }

    function getTestURL(type, value) {
        value = value.split('-');

        switch (type) {
            case 'TESTRAIL_URL':
                return `${testRailSettings['TESTRAIL_URL']}/index.php?/cases/view/${value.pop()}`;
            case 'QTEST_URL':
                return `${qTestSettings['QTEST_URL']}/p/${value[0]}/portal/project#tab=testdesign&object=1&id=${value.pop()}`;
        }
    }

    /* ------------------------------ Other Helpers ----------------------------- */
    function initAllSettings() {
        toolsService.fetchIntegrationOfTypeByName('TEST_CASE_MANAGEMENT')
            .then((res) => {
                testCaseManagementTools = res.data || [];
                initJiraSettings();
                initTestRailSettings();
                initQTestSettings();
            });
    }

    function findToolByName(name) {
        return Array.isArray(testCaseManagementTools) && testCaseManagementTools.find((tool) => tool.name === name);
    }

    function initJiraSettings() {
        const jira = findToolByName('JIRA');

        if (jira && jira.settings) {
            jiraSettings = UtilService.settingsAsMap(jira.settings);

            if (jiraSettings['JIRA_URL']) {
                jiraSettings['JIRA_URL'] = jiraSettings['JIRA_URL'].replace(/\/$/, '');
            }
        }
    }

    function initTestRailSettings() {
        const testRail = findToolByName('TESTRAIL');

        if (testRail && testRail.settings) {
            testRailSettings = UtilService.settingsAsMap(testRail.settings);

            if (testRailSettings['TESTRAIL_URL']) {
                testRailSettings['TESTRAIL_URL'] = testRailSettings['TESTRAIL_URL'].replace(/\/$/, '');
            }
        }
    }

    function initQTestSettings() {
        const qtest = findToolByName('QTEST');

        if (qtest && qtest.settings) {
            qTestSettings = UtilService.settingsAsMap(qtest.settings);

            if (qTestSettings['QTEST_URL']) {
                qTestSettings['QTEST_URL'] = qTestSettings['QTEST_URL'].replace(/\/$/, '');
            }
        }
    }

     //TODO: add logic to handle case when we return from internal page and don't have configSnapshot: we can calculate page, firstIndex and lastIndex for default videMode
    function initFirstLastIndexes() {
        firstIndex = 0;
        lastIndex = initialCountToDisplay;
    }

    function resetPagination() {
        vm.currentPage = 1;
        initFirstLastIndexes();
    }

    function getConfigSnapshot() {
        return {
            countPerPage: vm.countPerPage,
            currentPage: vm.currentPage,
            testsViewMode: vm.testsViewMode,
            filters: vm.filters,
            sortConfig: vm.sortConfig,
            selectedValue: vm.groupingFilters[vm.testsViewMode].selectedValue,
        };
    }

    function applyConfigSnapshot() {
        const selectedValue = vm.configSnapshot.selectedValue;

        delete vm.configSnapshot.selectedValue;
        Object.assign(vm, vm.configSnapshot);
        vm.groupingFilters[vm.testsViewMode].selectedValue = selectedValue;
        vm.configSnapshot = null;
    }

    function getSelectedTestId() {
        let successOldUrl = TestService.getPreviousUrl();
        let selectedId;

        if (successOldUrl) {
            TestService.clearPreviousUrl();
            TestService.unsubscribeFromLocationChangeStart();
        }

        if (successOldUrl && successOldUrl.includes('/info/')) {
            const parsedId = parseInt(successOldUrl.split('/').pop(), 10);

            if (!isNaN(parsedId)) {
                selectedId = parsedId;
            }
        }

        return selectedId;
    }

    function updateFirstLastIndexes() {
        const newFirstIndex = (vm.currentPage - 1) * vm.countPerPage;
        let newLastIndex = newFirstIndex + vm.countPerPage;

        firstIndex = newFirstIndex;
        lastIndex = newLastIndex;
    }

    function addTestEvent(message, test) {
        const testEvent = createWorkItem('EVENT', test, message);

        TestService.createTestWorkItem(test.id, testEvent)
            .then(rs => {
                if (!rs.success) {
                    messageService.error('Failed to add event test "' + test.id);
                }
            });
    }

    function initJobMetadata() {
        if (vm.testRun.job && vm.testRun.job.jobURL) {
            !vm.testRun.jenkinsURL && (vm.testRun.jenkinsURL = vm.testRun.job.jobURL + '/' + vm.testRun.buildNumber);
            !vm.testRun.UID && (vm.testRun.UID = vm.testRun.testSuite.name + ' ' + vm.testRun.jenkinsURL);
        }
    }

    function setWorkItemIsNewStatus(workItems) {
        const isNew = {
            issue: true,
            task: true
        };

        workItems.length && workItems.forEach(function (item) {
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

    function getEventFromMessage(message) {
        return JSON.parse(message.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    }

    function isCurrentTestRunStatistics(event) {
        return vm.testRun.id === +event.testRunStatistics.testRunId;
    }

    function isStausFilteringActive() {
        return vm.filters.status && vm.filters.status.values && vm.filters.status.values.length;
    }

    function isSortingActive() {
        return vm.sortConfig && vm.sortConfig.field !== defaultSortField;
    }

    function getTestsIndexByID(id) {
        if (!vm.testRun.tests) { return -1; }

        return vm.testRun.tests.findIndex(test => test.id === id);
    }

    function getTestById(id) {
        //ID is expected to be a number, so to be sure we added conversion to a number
        return vm.testRun.tests.find(test => test.id === +id);
    }

    function getArtifactIconId(ext) {
        let type = 'bin';
        const predefinedTypes = ['pdf', 'apk', 'exe', 'doc', 'xls', 'txt', 'png'];

        ext = ext.slice(0, 3);

        if (predefinedTypes.find(type => type === ext)) {
            type = ext;
        }

        return `artifacts:${type}`;
    }

    function getEmptyTestsMessage(groupName) {
        let message = '';

        if (vm.empty && vm.testRun.status !== 'IN_PROGRESS') {
            message = 'No tests';
        }
        if (!vm.empty && !vm.activeTests.length && vm.isStausFilteringActive && (vm.testsViewMode === 'plain' || groupName === vm.groupingFilters[vm.testsViewMode].selectedValue)) {
            message = 'No tests matching selected filters';
        }
        if (vm.testRun.status === 'IN_PROGRESS' && (vm.empty || (!vm.isStausFilteringActive && !vm.activeTests.length && vm.testRun.queued)) && (vm.testsViewMode === 'plain' || groupName === vm.groupingFilters[vm.testsViewMode].selectedValue)) {
            message = 'No tests yet';
        }

        return message;
    }

    /* --------------------- Filtering and ordering helpers --------------------- */

    function onStatusFilterChange(newFilter) {
        vm.filters.status = newFilter;
        onFilterChange(true);
    }

    function isFitsByFilter(itemValue, filterValues) {
        if (!filterValues || !filterValues.length) {
            return true;
        } else if (Array.isArray(itemValue)) {
            return itemValue.some(({ value }) => (filterValues.findIndex(fValue => fValue && value && fValue.toLowerCase() === value.toLowerCase()) > -1));
        }

        return (filterValues.findIndex(fValue => fValue && itemValue && fValue.toLowerCase() === itemValue.toLowerCase()) > -1);
    }

    function onPlainViewModeActivate() {
        vm.filters.grouping = null;
        onFilterChange(true);
        // resetStatusFilterAndOrdering(); // Use this if you need to reset status filters and ordering on view mode change
    }

    function onFilteredViewModeActivate() {
        const values = vm.groupingFilters[vm.testsViewMode].cachedValues || [''];

        vm.filters.grouping = { field: vm.groupingFilters[vm.testsViewMode].field, values };
        onFilterChange(true);
        // resetStatusFilterAndOrdering(); // Use this if you need to reset status filters and ordering on view mode change
    }

    /* -------------- Work with data (filtering, ordering and etc.) ------------- */

    /**
     * Init tests for view by filtering and sorting with default values
     */
    function onInitTests() {
        initGroupingData();
        if (vm.configSnapshot) {
            applyConfigSnapshot();
            onPageChange();
            onFilterChange();
        } else {
            onFilterChange(true);
        }
    }

    function initGroupingData() {
        const { class: classData, package: packageData, tags: tagsData } = vm.groupingFilters;

        vm.testRun.tests.forEach((test) => {
            if (test[classData.field]) {
                classData.dataset.add(test[classData.field]);
            }
            if (test[packageData.field]) {
                packageData.dataset.add(test[packageData.field]);
            }
            if (test[tagsData.field]) {
                test[tagsData.field].forEach((tag) => {
                    //skip Testrail and Qtest tags (see ZEB-486 ticket)
                    if (tag.name !== 'TESTRAIL_TESTCASE_UUID' && tag.name !== 'QTEST_TESTCASE_UUID') {
                        tagsData.dataset.add(tag.value);
                    }
                });
            }
        });
    }

    function updateGroupingData(test) {
        const { class: classData, package: packageData, tags: tagsData } = vm.groupingFilters;

        if (test[classData.field]) {
            classData.dataset.add(test[classData.field]);
        }
        if (test[packageData.field]) {
            packageData.dataset.add(test[packageData.field]);
        }
        if (test[tagsData.field]) {
            test[tagsData.field].forEach((tag) => {
                tagsData.dataset.add(tag.value);
            });
        }
    }

    /**
     * Sorts array of tests by specified field of items
     *
     * @param {[]} [data=vm.activeTests]
     * @returns {[]} sorted array of tests
     */
    function getOrderedTests(data = vm.activeTests) {
        const { field, reverse } = vm.sortConfig;

        vm.filteredTests = UtilService.sortArrayByField(data, field, reverse);
        vm.activeTests = vm.filteredTests;
    }

    /**
     * Sorts current array of tests by 'elapsed' field on appropriate event
     */
    function onOrderByElapsed() {
        getOrderedTests();
    }

    function onAddingNewTest(test) {
        updateGroupingData(test);
        onFilterChange();
    }

    function onUpdatingTest(test, fromQueuedStatus) {
        //recollect testsToDisplay, if old test was in current displaing scope
        //or test changed status from 'QUEUED' and probably need to be displayed
        if (fromQueuedStatus || vm.testsToDisplay.find(({ id }) => id === test.id)) {
            onFilterChange();
        }
    }

    function onFilterChange(shouldResetPagination) {
        const filters = [vm.filters.status, vm.filters.grouping].filter(Boolean);
        const filteredData = vm.testRun.tests.filter((test) => {
            const skipQueued = !(vm.testRun.status === 'IN_PROGRESS' && test.status === 'QUEUED');

            return filters.every(filter => isFitsByFilter(test[filter.field], filter.values)) && skipQueued;
        });

        //reset tests selection
        clearTestsSelection();
        shouldResetPagination && resetPagination();
        getOrderedTests(filteredData);
    }

    function prepareArtifacts(test) {
        test.artifactsToShow = test.artifacts.reduce(function (formatted, artifact) {
            const name = artifact.name.toLowerCase();

            if (!name.includes('live') && !name.includes('video') && artifact.link) {
                const links = artifact.link.split(' ');
                let url = null;

                try {
                    url = new URL(links[0]);
                } catch (error) {
                    artifact.hasBrokenLink = true;
                    console.warn(`Artifact "${name}" has invalid link.`);
                }

                if (url instanceof URL) {
                    artifact.extension = url.pathname.split('/').pop().split('.').pop();
                    //if artifact is external link
                    if (window.location.host !== url.host) {
                        artifact.isExternalLink = true;
                    } else if (!vm.testRun.hasArtifacts) {
                        vm.testRun.hasArtifacts = true;
                    }
                    /* FOR_DEV_ONLY:START */
                    //previous condition won't work on localhost, so lets check if it is not a production and link's host starts on correct tenant name
                    if (!window.isProd && authService.tenant !== url.host.split('.')[0]) {
                        artifact.isExternalLink = true;
                    } else {
                        artifact.isExternalLink = false;
                        if (!vm.testRun.hasArtifacts) {
                            vm.testRun.hasArtifacts = true;
                        }
                    }
                    /* FOR_DEV_ONLY:END */
                }
                formatted.push(artifact);
            }

            return formatted;
        }, []);
    }

    function prepareTestsData() {
        vm.testRun.tests.forEach(test => {
            test.elapsed = test.finishTime ? (test.finishTime - test.startTime) : Number.MAX_VALUE;
            prepareArtifacts(test);
            test.tags.forEach(tag => {
                if (tag.name === 'TESTRAIL_TESTCASE_UUID' || tag.name === 'QTEST_TESTCASE_UUID') {
                    tag.normalizedValue = tag.value.split('-').pop();
                }
            });
        });
    }

    function addNewTest(test) {
        prepareTestData(test);
        vm.testRun.tests.push(test);
        onAddingNewTest(test);
    }

    function updateTest(test, index) {
        const oldTest = vm.testRun.tests[index];
        const isChangedStatusFromQueued = oldTest.status === 'QUEUED' && test.status !== 'QUEUED';

        prepareTestData(test);
        vm.testRun.tests[index] = {...vm.testRun.tests[index], ...test};
        onUpdatingTest(vm.testRun.tests[index], isChangedStatusFromQueued);
    }

    function prepareTestData(test) {
        test.elapsed = test.finishTime ? (test.finishTime - test.startTime) : Number.MAX_VALUE;
        prepareArtifacts(test);
        test.tags.forEach(tag => {
            if (tag.name === 'TESTRAIL_TESTCASE_UUID' || tag.name === 'QTEST_TESTCASE_UUID') {
                tag.normalizedValue = tag.value.split('-').pop();
            }
        });
    }

    /* -------------------------- Intersection Observer ------------------------- */

    /**
     * Creates a new IntersectionObserver object which will execute a specified callback function
     * when it detects that a target element's visibility has crossed one or more thresholds
     */
    function initIntersectionObserver() {
        observer = new IntersectionObserver(intersectionHandler, { threshold: 0.1 });
    }

    /**
     * Stops the IntersectionObserver object from observing any target.
     */
    function disconnectIntersectionObserver() {
        observer && observer.disconnect();
    }

    /**
     * Callback function for Intersection Observer
     * Adds flagg 'isInView' when appropriate element becomes visible in viewport
     * and then ubsubsribes this element from observer
     *
     * @param {IntersectionObserverEntry} entries
     * @param {IntersectionObserver} observer
     */
    function intersectionHandler(entries, observer) {
        entries.filter(entry => entry.isIntersecting).forEach(entry => {
            const id = entry.target.getAttribute('data-source-id');
            const test = getTestById(id);

            if (test && !test.isInView) {
                test.isInView = true;
                // we use intersection observer only to deley rendering, so after status is changed we can unsubscribe it from observer
                observer.unobserve(entry.target);
            }
        });
        $scope.$apply();
    }

    /**
     * Targeting an element to be observed
     *
     * @param {data} Object
     * @returns {function(): void} a function to stop observing a particular target element
     */
    function onTrackedTestRender(data) {
        observer.observe(data.element);

        return () => {
            data.test.isInView = false;
            observer.unobserve(data.element);
        };
    }

    /* ----------------------------- Dialog openers ----------------------------- */
    function showCiHelperDialog(event) {
        $mdDialog.show({
            controller: CiHelperController,
            controllerAs: '$ctrl',
            template: CiHelperTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true,
            autoWrap: false,
            escapeToClose: false
        });
    }

    function showDetailsDialog(test, event) {
        const isNew = setWorkItemIsNewStatus(test.workItems);

        modalsService
            .openModal({
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
            .catch(function (response) {
                if (response) {
                    const index = getTestsIndexByID(test.id);

                    if (index !== -1) {
                        vm.testRun.tests[index] = angular.copy(response);
                    }
                }
            });
    }

    function showFilterDialog(event) {
        $mdDialog.show({
            controller: testDetailsFilterController,
            template: testDetailsTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose: true,
            fullscreen: true,
            bindToController: true,
            controllerAs: '$ctrl',
            onComplete: () => {
                $(window).on('resize.filterDialog', () => {
                    if (!vm.isMobile) {
                        $mdDialog.hide();
                    }
                })
            },
            onRemoving: () => {
                $(window).off('resize.filterDialog');
            },
            locals: {
                statusInitValues: vm.filters.status.values,
                defaultValues: {
                    status: defaultStatusFilter.values,
                },
                filterByStatus,
                reset: resetStatusFilterAndOrdering,
            }
        });
    }

    function openImagesViewerModal(event, artifact, test) {
        ArtifactService.extractImageArtifacts([test]);

        $mdDialog.show({
            controller: ImagesViewerController,
            template: require('../../components/modals/images-viewer/images-viewer.html'),
            controllerAs: '$ctrl',
            bindToController: true,
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose: true,
            fullscreen: false,
            escapeToClose: false,
            locals: {
                test,
                activeArtifactId: artifact.id,
            }
        });
    }

    /* --------------------------- Work with Websocket -------------------------- */
    function initWebsocket() {
        const wsName = 'zafira';

        vm.zafiraWebsocket = Stomp.over(new SockJS(API_URL + '/api/websockets'));
        vm.zafiraWebsocket.debug = null;
        vm.zafiraWebsocket.ws.close = function () { };
        vm.zafiraWebsocket.connect({ withCredentials: false }, function () {
            vm.subscriptions.statistics = subscribeStatisticsTopic();
            vm.subscriptions.testRun = subscribeTestRunsTopic();
            vm.subscriptions[vm.testRun.id] = subscribeTestsTopic(vm.testRun.id);
            vm.subscriptions.launchedTestRuns = subscribeLaunchedTestRuns();
            UtilService.websocketConnected(wsName);
        }, function () {
            UtilService.reconnectWebsocket(wsName, initWebsocket);
        });
    }

    /**
     * Subscribes to launchers soket to store new ones in session storage
     *
     * @returns function to unsubscribe from socket
     */
    function subscribeLaunchedTestRuns() {
        return vm.zafiraWebsocket.subscribe('/topic/' + authService.tenant + '.launcherRuns', function (data) {
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

    function subscribeStatisticsTopic() {
        return vm.zafiraWebsocket.subscribe('/topic/' + authService.tenant + '.statistics', function (data) {
            const event = getEventFromMessage(data.body);

            if (!isCurrentTestRunStatistics(event)) {
                return;
            }

            Object.assign(vm.testRun, event.testRunStatistics);
            $scope.$apply();
        });
    }

    function subscribeTestRunsTopic() {
        return vm.zafiraWebsocket.subscribe('/topic/' + authService.tenant + '.testRuns', function (data) {
            const event = getEventFromMessage(data.body);
            const testRun = angular.copy(event.testRun);

            if (vm.testRun.id !== +testRun.id) { return; }

            vm.testRun.status = testRun.status;
            vm.testRun.reviewed = testRun.reviewed;
            vm.testRun.elapsed = testRun.elapsed;
            vm.testRun.config = testRun.config;
            vm.testRun.comments = testRun.comments;
            vm.testRun.reviewed = testRun.reviewed;
            vm.testRun.blocker = testRun.blocker;
            $scope.$apply();
        });
    }

    function subscribeTestsTopic() {
        return vm.zafiraWebsocket.subscribe('/topic/' + authService.tenant + '.testRuns.' + vm.testRun.id + '.tests', function (data) {
            const { test } = getEventFromMessage(data.body);

            if (test) {
                const index = getTestsIndexByID(test.id);

                if (index !== -1) {
                    updateTest(test, index);
                } else {
                    addNewTest(test);
                }

                $scope.$apply();
            }
        });
    }

    function onTestSelect() {
        vm.isAllTestsSelected = !!vm.testsToDisplay.length && vm.testsToDisplay.filter(test => test.selected).length === vm.testsToDisplay.length;
    }

    function onAllTestsSelect() {
        vm.testsToDisplay.forEach(test => test.selected = vm.isAllTestsSelected);
        onTestSelect();
    }

    function clearTestsSelection() {
        vm.isAllTestsSelected = false;
        onAllTestsSelect();
        onTestSelect();
    }
};

export default testDetailsController;
