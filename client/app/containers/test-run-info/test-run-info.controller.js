'use strict';

// fixed:
// vnc resize listeners removing
// logs adding if filter is enabled (previously was ignored)
// images viewer thumbnails displaying bug: added min-width
// realized incorrect ordering by @timestamp, but simple timestamp is more accurate

// features
// added video slider
// screen logs as a separate log
// removed video + logs highlighting sync

// TODO: [+] pageSessionID - get rid of its ugly using and make requests canceling
// TODO: [-] get rid of unused DI
// TODO: [+] import images-viewer template by the same way as controller
// TODO: [+] make importable agents
// TODO: [+] add http requests cancelling
// TODO: [+] clarify "driversQueue" meaning
// TODO: [-] check template for "$ctrl" uses and redundant code
// TODO: [-] add page scroll to the log from page's hash (anchor link)

import { Subject, from as rxFrom, timer, defer } from 'rxjs';
import { switchMap, takeUntil, tap, take, repeat, map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import ImagesViewerController from '../../components/modals/images-viewer/images-viewer.controller';
import ImagesViewerTemplate from '../../components/modals/images-viewer/images-viewer.html';
import IssuesModalController from '../../components/modals/issues/issues.controller';
import IssuesModalTemplate from '../../components/modals/issues/issues.html';

const testRunInfoController = function testRunInfoController(
    $location,
    $mdDialog,
    $mdMedia,
    $q,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $transitions,
    $window,
    carinaLogsAgent,
    defaultLogsAgent,
    elasticsearchService,
    UtilService,
    ArtifactService,
    API_URL,
    TestExecutionHistoryService,
    TestRunService,
    testsRunsService,
    TestService,
    pageTitleService,
    authService,
    messageService,
    logLevelService,
    toolsService,
    modalsService,
    moment,
) {
    'ngInject';

    const mobileWidth = 480; // TODO: get rid of it if possible
    let onTransStartSubscription = null;
    let testCaseManagementTools = [];
    let jiraSettings = {};
    let testRailSettings = {};
    let qTestSettings = {};
    let wsSubscription = null;
    let stompClient = null;
    let logsRequestsCanceler = $q.defer();
    const testsWebsocketName = 'tests';
    const destroy$ = new Subject();
    const vm = {
        activeDriverIndex: 0,
        activeMode: null,
        activeTestId: null,
        configSnapshot: null,
        drivers: [],
        executionHistory: [],
        logs: [],
        parentTestId: null,
        test: null,
        testRun: null,
        logLevels: logLevelService.logLevels,
        filteredLogs: [],
        selectedLevel: logLevelService.initialLevel,
        selectedLogRow: -1,
        isControllerRefreshing: false,
        testsTimeMedian: null,

        $onInit: controllerInit,
        $onDestroy: unbindEvents,
        changeTestStatus,
        copyLogLine,
        copyLogPermalink,
        downloadAllArtifacts,
        downloadImageArtifacts,
        filterResults,
        getFullLogMessage,
        goToTestRuns,
        initToolsSettings,
        onDriverChange,
        onHistoryElemClick,
        openImagesViewerModal,
        selectLogRow,
        setWorkItemIsNewStatus,
        showDetailsDialog,
        switchMoreLess,
        userHasAnyPermission: authService.userHasAnyPermission,

        get selectedDriver() { return this.drivers[this.activeDriverIndex]; },
        get currentTitle() { return pageTitleService.pageTitle; },
        get jira() { return jiraSettings; },
        get testRail() { return testRailSettings; },
        get qTest() { return qTestSettings; },
        get isMobile() { return $mdMedia('xs'); },
    };


    let agent = null;
    const MODES = {
        live: {
            name: 'live',
            initFunc: initLiveMode,
            logGetter: {
                from: 0,
            }

        },
        record: {
            name: 'record',
            initFunc: initRecordMode,
            logGetter: {
                from: 0,
            }
        }
    };

    return vm;

    /* Controller methods and helpers */
    function goToTestRuns() {
        const parentTest = vm.executionHistory.find(({ testId }) => testId === vm.parentTestId);

        $state.go('tests.runDetails', {
            testRunId: parentTest.testRunId,
            configSnapshot: vm.configSnapshot,
        });
    }

    function filterResults(index) {
        if (vm.selectedLevel === logLevelService.logLevels[index]) {
            return;
        }

        vm.selectedLevel = logLevelService.logLevels[index];
        vm.filteredLogs = logLevelService.filterLogs(vm.logs, vm.selectedLevel);
    }

    function downloadImageArtifacts() {
        ArtifactService.extractImageArtifacts([vm.test]);

        ArtifactService.downloadArtifacts({
            data: [vm.test],
            field: 'imageArtifacts',
        });
    }

    function downloadAllArtifacts() {
        ArtifactService.downloadArtifacts({
            data: [vm.test],
            field: 'artifactsToDownload',
        });
    }

    function changeTestStatus(test, status = '') {
        status = status.toUpperCase();
        if (!test || !status || test.status === status.toUpperCase()) { return; }

        const testCopy = {...test};

        testCopy.status = status.toUpperCase();

        return TestService.updateTest(testCopy)
            .then((response) => {
                if (response.success) {
                    messageService.success(`Test was marked as ${status}`);
                    vm.test = response.data;
                    updateExecutionHistoryItem(vm.test);
                } else {
                    const message = response.message ? response.message : 'Unable to change test status';

                    messageService.error(message);
                }
            });
    }

    // TODO: Refactoring
    function postModeConstruct(test) {
        $timeout(() => {
            switch (vm.activeMode.name) {
                case 'live':
                    getLiveESLogs$()
                        .pipe(
                            takeUntil(destroy$),
                        )
                        .subscribe(
                            (res) => console.log('getLiveESLogs$ next:::', res),
                            (res) => console.log('getLiveESLogs$ error:::', res),
                            (res) => console.log('getLiveESLogs$ copmplete:::', res),
                        );
                    break;
                case 'record':
                    initRecords(test);

                    fiveMinsLogsFetcher$()
                        .pipe(
                            takeUntil(destroy$),
                        )
                        .subscribe(
                            (res) => console.log('fiveMinsLogsFetcher$ next:::', res),
                            (res) => console.log('fiveMinsLogsFetcher$ error:::', res),
                            (res) => console.log('fiveMinsLogsFetcher$ copmplete:::', res),
                        );
                    break;
                default:
                    break;
            }
        }, 0);
    }

    function setMode(modeName) {
        if (vm.activeMode && vm.activeMode.name === modeName) { return; }

        vm.drivers = [];
        vm.activeMode = MODES[modeName];
    }

    // TODO: refactoring
    function openImagesViewerModal(event, url) {
        const activeArtifact = vm.test.imageArtifacts.find(function (art) {
            return art.link === url;
        });

        if (activeArtifact) {
            $mdDialog.show({
                controller: ImagesViewerController,
                template: ImagesViewerTemplate,
                controllerAs: '$ctrl',
                bindToController: true,
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true,
                fullscreen: false,
                escapeToClose: false,
                locals: {
                    test: vm.test,
                    activeArtifactId: activeArtifact.id,
                }
            });
        }
    }
    // TODO: ? move to the directive
    function switchMoreLess(e, log) {
        e.preventDefault();
        e.stopPropagation();
        const rowElem = e.target.closest('.testrun-info__tab-table-col._action') || e.target.closest('.testrun-info__tab-mobile-table-data._action-data');
        const scrollableElem = rowElem.closest('.testrun-info__tab-table-wrapper'); // TODO: mobile layout has another scrollable element

        log.showMore = !log.showMore;
        if (!log.showMore) {
            $timeout(function () {
                if (scrollableElem.scrollTop > rowElem.offsetTop) {
                    scrollableElem.scrollTop = rowElem.offsetTop;
                }
            }, 0);
        }
    }

    function getFullLogMessage(log) {
        return log.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ *(\r?\n|\r)/g, '<br/>').replace(/\s/g, '&nbsp;');
    }

    // TODO: complete refactoring
    function prepareArtifacts() {
        // extract image artifacts from logs
        const imageArtifacts = vm.logs.reduce((formatted, artifact) => {
            const path = artifact.urls?.image?.path ?? '';

            if (path) {
                try {
                    const url = new URL(path);
                    let newArtifact = {
                        id: path,
                        name: artifact.urls?.image?.name,
                        link: path,
                        extension: url.pathname.split('/').pop().split('.').pop(),
                    };

                    if (artifact.urls?.thumb?.path) {
                        newArtifact.thumb = artifact.urls.thumb.path;
                    }

                    formatted.push(newArtifact);
                } catch (error) {
                    console.warn(`Broken screenshot url: "${path}"`);
                }
            }

            return formatted;
        }, []);

        // extract artifacts from test
        const artifactsToDownload = vm.test.artifacts.reduce((formatted, artifact) => {
            const name = artifact.name.toLowerCase();

            if (!name.includes('live') && !name.includes('video') && artifact.link) {
                const links = artifact.link.split(' ');

                try {
                    const url = new URL(links[0]);

                    artifact.extension = url.pathname.split('/').pop().split('.').pop();
                } catch (error) {
                    artifact.hasBrokenLink = true;
                    console.warn(`Artifact "${name}" has invalid link.`);
                }

                formatted.push(artifact);
            }

            return formatted;
        }, []);

        vm.test.imageArtifacts = imageArtifacts;
        vm.test.artifactsToDownload = [...artifactsToDownload, ...imageArtifacts];
    }

    function selectLogRow(ev, index) {
        const hash = ev.currentTarget.attributes.id.value;
        const stateParams = $state.params;

        stateParams['#'] = hash;

        const newUrl = $state.href('tests.runInfo', stateParams, {absolute: true});

        vm.selectedLogRow = index;
        // we don't want reload page
        $window.history.pushState(null, null, newUrl);
    }

    // TODO: [+] refactoring
    function copyLogLine(log) {
        const formattedTime = moment(log.timestamp).format('HH:mm:ss');
        const message = `${formattedTime} [${log.threadName}] [${log.level}] ${log.message}`;

        message.copyToClipboard();
    }

    // TODO: [+] refactoring
    function copyLogPermalink() {
        $location.absUrl().copyToClipboard();
    }

    // TODO: [+] refactoring
    function initSelectedLog() {
        const hash = $location.hash();

        if (hash) {
            const logIndex = parseInt(hash.replace('log-', ''), 10);

            if (!isNaN(logIndex)) {
                vm.selectedLogRow = logIndex;
            }
        }
    }

    function bindEvents() {
        TestService.subscribeOnLocationChangeStart();
        onTransStartSubscription = $transitions.onStart({}, function (trans) {
            const toState = trans.to();

            if (toState.name !== 'tests.runDetails') {
                TestService.clearDataCache();
                TestService.clearPreviousUrl();
                TestService.unsubscribeFromLocationChangeStart();
            }
            onTransStartSubscription();
        });
    }

    function resetInitialValues(testRun, test) {
        onTransStartSubscription = null;
        testCaseManagementTools = [];
        jiraSettings = {};
        testRailSettings = {};
        qTestSettings = {};
        agent = null;

        // TODO: at least we can clone original obj for working one
        MODES.live.logGetter.from = 0;
        MODES.record.logGetter.from = 0;

        vm.selectedLogRow = -1;
        vm.logs = [];
        vm.activeDriverIndex = 0;
        vm.activeMode = {};
        vm.drivers = [];
        vm.filteredLogs = [];
        vm.testRun = testRun;
        vm.test = test;
    }

    function unbindEvents() {
        logsRequestsCanceler.resolve();
        destroy$.next();
        wsSubscription = wsSubscription && wsSubscription.unsubscribe();
        closeTestsWebsocket();
        if (typeof onTransStartSubscription === 'function') {
            onTransStartSubscription();
        }
    }

    function initToolsSettings() {
        toolsService.fetchIntegrationOfTypeByName('TEST_CASE_MANAGEMENT')
            .then((res) => {
                testCaseManagementTools = res.data || [];
                initToolSettings('JIRA', jiraSettings);
                initToolSettings('TESTRAIL', testRailSettings);
                initToolSettings('QTEST', qTestSettings);
            });
    }

    function findToolByName(name) {
        return Array.isArray(testCaseManagementTools) && testCaseManagementTools.find((tool) => tool.name === name);
    }

    function initToolSettings(name, toolSettings) {
        const integration = findToolByName(name);

        if (integration && integration.settings) {
            toolSettings = UtilService.settingsAsMap(integration.settings);

            if (toolSettings[`${name}_URL`]) {
                toolSettings[`${name}_URL`] = toolSettings[`${name}_URL`].replace(/\/$/, '');
            }
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

    function showDetailsDialog(test, event) {
        const isNew = setWorkItemIsNewStatus(test.workItems);

        modalsService
            .openModal({
                controller: IssuesModalController,
                template: IssuesModalTemplate,
                parent: angular.element(document.body),
                targetEvent: event,
                controllerAs: '$ctrl',
                locals: {
                    test,
                    isNewIssue: isNew.issue,
                    isNewTask: isNew.task,
                }
            })
            .catch((response) => {
                if (response) {
                    vm.test = angular.copy(response);
                }
            });
    }

    function initLiveMode(test) {
        addDrivers(getLiveVideoArtifacts(test.artifacts));
        postModeConstruct(test);
    }

    function initRecordMode(test) {
        addDrivers(getVideoArtifacts(test.artifacts));
        postModeConstruct(test);
    }

    function controllerInit(skipHistoryUpdate) {
        // TODO: whi we get errors? Resolve doesn't work? We have redirect, but can see errors from controller
        if (!vm.testRun || !vm.test) { return; }
        // filter EVENT items
        // TODO: do we ever need in "EVENT" work items on the client? (opened ZEB-1416)
        vm.test.workItems = (vm.test.workItems || []).filter(({ type }) => type !== 'EVENT');

        pageTitleService.setTitle(window.innerWidth <= mobileWidth ? 'Test details' : vm.test.name);
        initSelectedLog();

        initTestsWebSocket();
        vm.testRun.normalizedPlatformData = testsRunsService.normalizeTestPlatformData(vm.testRun.config);

        agent = getAgent();
        setTestParams();
        initToolsSettings();
        initTestExecutionData(skipHistoryUpdate);
        bindEvents();
    }
    /* END Controller methods and helpers */

    /* Work with drivers */
    function onDriverChange({ activeDriverIndex }) {
        vm.activeDriverIndex = activeDriverIndex;
        //TODO: check if correct?
        postDriverChanged();
    }

    // TODO: do we need?
    function postDriverChanged() {
        if (vm.activeMode.name === 'record') {
            initRecords(vm.test);
        }
    }

    // TODO: refactoring
    // TODO: define active driver
    function initRecords(test) {
        var videoArtifacts = getVideoArtifacts(test.artifacts);
        if (videoArtifacts && videoArtifacts.length) {
            // TODO: use addDrivers() instead if possible
            // TODO: what this?
            vm.drivers = vm.drivers.concat(videoArtifacts.filter(function (value) {
                return vm.drivers.indexOfField('name', value.name) == -1;
            }));
        }
    }

    // TODO: change filtering after https://solvd.atlassian.net/browse/ZEB-1417 is solved
    function getVideoArtifacts(artifacts = []) {
        return artifacts.filter((artifact) => isVideoArtifact(artifact));
    }

    // TODO: change filtering after https://solvd.atlassian.net/browse/ZEB-1417 is solved
    function getLiveVideoArtifacts(artifacts = []) {
        return artifacts.filter((artifact) => isLiveVideoArtifact(artifact));
    }

    function isVideoArtifact(artifact) {
        return artifact.name.toLowerCase().includes('video') && !artifact.name.toLowerCase().includes('live');
    }

    function isLiveVideoArtifact(artifact) {
        return artifact.name.toLowerCase().includes('video') && artifact.name.toLowerCase().includes('live');
    }

    function addDrivers(artifacts) {
        artifacts
            .sort((a, b) => a.createdAt - b.createdAt)
            .forEach((artifact) => addDriver(artifact));
    }

    function addDriver(artifact) {
        if (!vm.drivers.find(({ name }) => artifact.name === name)) {
            // TODO: use system types: https://solvd.atlassian.net/browse/ZEB-1417
            artifact.type = isVideoArtifact(artifact) ? 'video' : 'vnc';
            vm.drivers.push(artifact);
        }
    }
    /* END Work with drivers */

    /* Work with WebSocket */
    function initTestsWebSocket() {
        const ws = new SockJS(`${API_URL}/api/websockets`);

        stompClient = Stomp.over(ws);
        stompClient.debug = null;
        stompClient.ws.close = () => {};
        stompClient.connect({ withCredentials: false }, stompConnectHandler, stompErrorHandler);

        UtilService.websocketConnected(testsWebsocketName);
    }

    function stompConnectHandler() {
        if (stompClient.connected) {
            const destination = `/topic/${authService.tenant}.testRuns.${vm.testRun.id}.tests`;

            wsSubscription = stompClient.subscribe(destination, onTestsWSMessage);
        }
    }

    function stompErrorHandler() {
        UtilService.reconnectWebsocket(testsWebsocketName, initTestsWebSocket);
    }

    // TODO: [-] Refactoring
    function onTestsWSMessage(wsEvent) {
        if (!wsEvent.body) { return; }

        const test = getEventFromMessage(wsEvent.body).test;

        if (test && vm.test && test.id === vm.test.id) {
            if (test.status === 'IN_PROGRESS') {
                addDrivers(getLiveVideoArtifacts(test.artifacts));
            } else {
                // TODO: stop logs getting
                setMode('record'); // TODO: define intermediate mode between live and record
                var videoArtifacts = getVideoArtifacts(test.artifacts);
                if (videoArtifacts.length === vm.drivers.length) {
                    addDrivers(videoArtifacts);
                    postModeConstruct(test);
                }
            }
            // TODO: do we need merge?
            vm.test = test;

            $scope.$apply();
        }
        updateExecutionHistoryItem(test);
    }

    function getEventFromMessage(message) {
        let parsedMessage = {};

        try {
            parsedMessage = JSON.parse(message.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
        } catch (err) {
            // TODO: debug error log
        }

        return parsedMessage;
    }

    function closeTestsWebsocket() {
        if (stompClient && stompClient.connected) {
            stompClient.disconnect();
            UtilService.websocketConnected(testsWebsocketName);
        }
    }
    /* END Work with WebSocket */

    /* Work with screenshots */
    function presentsUncompletedScreenshotLogs() {
        return vm.logs.some(({ urls }) => urls && !(urls.image && urls.thumb));
    }
    /* END work with screenshots */

    /* Work with execution history */
    function initTestExecutionData(skipHistoryUpdate) {
        vm.activeTestId = vm.test.id;
        vm.parentTestId = $stateParams.parentTestId ? parseInt($stateParams.parentTestId, 10) : vm.activeTestId;

        if (!skipHistoryUpdate) {
            TestExecutionHistoryService.getTestExecutionHistory(vm.parentTestId)
                .then((response) => {
                    if (response.success) {
                        const sortedData = (response.data || [])
                            .sort((a, b) => a.startTime - b.startTime);

                        vm.executionHistory = TestExecutionHistoryService.addTimeDiffs(sortedData);
                    }
                });
        }
    }

    function onHistoryElemClick(historyItem) {
        if (vm.isControllerRefreshing) { return; }
        vm.isControllerRefreshing = true;
        getPageData(historyItem.testRunId, historyItem.testId)
            .then(([testRun, test]) => {
                pushNewState(historyItem);
                unbindEvents();
                logsRequestsCanceler = $q.defer();
                resetInitialValues(testRun, test);
                $timeout(() => {
                    controllerInit(true);
                });
            })
            .catch((err) => {
                if (err.message) {
                    messageService.error(err.message);
                }
            })
            .finally(() => {
                $timeout(() => {
                    vm.isControllerRefreshing = false;
                }, 0, false);
            });
    }

    function pushNewState(historyItem) {
        const stateParams = $state.params;

        stateParams.testId = historyItem.testId;
        stateParams.testRunId = historyItem.testRunId;
        if (historyItem.testId === vm.parentTestId) {
            Reflect.deleteProperty(stateParams, 'parentTestId');
        } else {
            stateParams.parentTestId = vm.parentTestId;
        }
        Reflect.deleteProperty(stateParams, '#');

        const newUrl = $state.href('tests.runInfo', stateParams, {absolute: true});

        $window.history.pushState(null, null, newUrl);
    }

    function getPageData(testRunId, testId) {
        const testParams = {
            'page': 1,
            'pageSize': 100000,
            testRunId,
        };

        const testRequest =  TestService.searchTests(testParams)
            .then((rs) => {
                if (rs.success) {
                    TestService.tests = rs.data.results || [];

                    return TestService.getTest(testId);
                } else {
                    return $q.reject({message: `Can't fetch tests for test run with ID=${testRunId}` });
                }
            });

        const testRunRequest = TestRunService.searchTestRuns({ id: testRunId })
            .then((response) => {
                if (response.success && response.data.results && response.data.results[0]) {
                    return response.data.results[0];
                } else {
                    return $q.reject({message: 'Can\'t get test run with ID=' + testRunId});
                }
            });

        return $q.all([testRunRequest, testRequest]);
    }

    function updateExecutionHistoryItem(test) {
        if (!test) { return; }

        const updatingTestIndex = vm.executionHistory.findIndex(({ testId }) => testId === test.id);

        if (updatingTestIndex !== -1) {
            const status = test.status;
            const workItems = (test.workItems || []).filter(({ type }) => type === 'BUG');
            const elapsed = test.finishTime ? test.finishTime - test.startTime : null;
            const testToUpdate = vm.executionHistory[updatingTestIndex];

            $timeout(() => {
                vm.executionHistory[updatingTestIndex] = {
                    ...testToUpdate,
                    status,
                    elapsed,
                    workItems,
                };
                vm.executionHistory = TestExecutionHistoryService.addTimeDiffs(vm.executionHistory);
            }, 0);
        }
    }
    /* END Work with execution history */

    function getAgent() {
        let agent = null;

        // return default (new) version of the agent if test has an UUID
        if (vm.test.hasOwnProperty('uuid')) {
            agent = defaultLogsAgent;
            agent.initSearchCriteria(vm.testRun.id, vm.test.id);
            agent.initESIndex(vm.test.startTime, vm.test.finishTime);
        } else {
            agent = carinaLogsAgent;
            agent.initSearchCriteria(vm.testRun.ciRunId, vm.test.ciTestId);
            agent.initESIndex(vm.test.startTime, vm.test.finishTime);
        }

        console.log(agent);

        return agent;
    }

    // TODO
    function setTestParams() {
        if (vm.test) {
            setMode(vm.test.status === 'IN_PROGRESS' ? 'live' : 'record');
            vm.activeMode.initFunc.call(this, vm.test);
        }
    }

    /* Work with logs */
    function handleESLogs(logs) {
        logs.forEach(handleESLog);
        prepareArtifacts();
    }

    function handleESLog(log) {
        if (log.level === 'META_INFO' || log.kind === 'screenshot') {
            const newLog = agent.handleScreenshotLog(log, vm.logs);

            if (newLog) {
                addNewLog(newLog);
            }
        } else {
            addNewLog(log);
        }
    }

    function addNewLog(log) {
        log.uuidInternal = uuidv4();

        vm.logs = [ ...vm.logs, log ];
        if (!logLevelService.logShouldBeFiltered(log, vm.selectedLevel)) {
            vm.filteredLogs = [ ...vm.filteredLogs, log ];
        }

        $scope.$applyAsync();
    }

    function getLiveESLogs$() {
        vm.logs = [];

        return getCount$()
            .pipe(
                switchMap((count) => fetchLiveESLogs$(count)),
            );
    }

    function fetchLiveESLogs$(count) {
        const from = vm.activeMode.logGetter.from;
        const size = count - vm.activeMode.logGetter.from;

        vm.activeMode.logGetter.from = count

        return getESLogs$(from, size)
            .pipe(
                tap((logs) => {console.log('handle LIVE logs', logs);}),
                tap((logs) => handleESLogs(logs)),
                switchMap(() => reFetchLiveESLogs$(count)),
            );
    }

    function reFetchLiveESLogs$(count) {
        return timer(5000)
            .pipe(
                switchMap(() => getCount$()),
                switchMap(newCount => count !== newCount ? fetchLiveESLogs$(newCount) : reFetchLiveESLogs$(count)),
            );
    }

    function fiveMinsLogsFetcher$() {
        let imagesLoadingAttempts = 0;
        const attemptsToLoadImages = 10;
        let delay = 0;
        const delayInterval = 5000;
        const maxDelay = 40000;
        const timerDestroy$ = new Subject();

        vm.logs = [];

        return defer(() => timer(delay))
            .pipe(
                take(1),
                tap(() => console.log('hm.....')),
                tap(() => imagesLoadingAttempts++),
                switchMap(() => getPastESLogs$()),
                tap(() => delay = delay < maxDelay ? delay + delayInterval : maxDelay),
                repeat(),
                takeUntil(timerDestroy$),
                tap(() => {
                    if (!presentsUncompletedScreenshotLogs() || imagesLoadingAttempts >= attemptsToLoadImages) {
                        timerDestroy$.next();
                    }
                }),
            );
    }

    function getPastESLogs$() {
        return getCount$()
            .pipe(
                tap((count) => console.log('+++++++++++', count)),
                switchMap((count) => fetchPastESLogs$(count)),
            );
    }

    function fetchPastESLogs$(count) {
        let from = vm.activeMode.logGetter.from;
        const size = count - vm.activeMode.logGetter.from;

        vm.activeMode.logGetter.from = count

        return getESLogs$(from, size)
            .pipe(
                tap((logs) => {console.log('handle PAST logs', logs);}),
                tap((logs) => handleESLogs(logs)),
            );
    }

    function getESLogs$(from, size) {
        return rxFrom(getLogsFromElasticsearch(from, size));
    }

    function getCount$() {
        return rxFrom(elasticsearchService.fetchCount(agent.esIndex, agent.searchCriteria, logsRequestsCanceler.promise))
            .pipe(
                map((response) => response.count),
            );
    }

    function getLogsFromElasticsearch(from, size) {
        console.log(11111, from, size);
        return elasticsearchService.fetchSearch(agent.esIndex, agent.searchCriteria, from, size, logsRequestsCanceler.promise)
            .then((response) => response?.hits?.hits ?? [])
            .then((hits) => hits.map(hit => hit._source));
    }
    /* END Work with logs */
};

export default testRunInfoController;
