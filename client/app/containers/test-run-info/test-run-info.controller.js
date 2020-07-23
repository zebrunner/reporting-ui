'use strict';

import { Subject, from as rxFrom, timer, defer, of, combineLatest } from 'rxjs';
import { switchMap, takeUntil, tap, take, repeat, map, catchError, filter } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import ImagesViewerController from '../../components/modals/images-viewer/images-viewer.controller';
import ImagesViewerTemplate from '../../components/modals/images-viewer/images-viewer.html';
import IssuesModalController from '../../components/modals/issues/issues.controller';
import IssuesModalTemplate from '../../components/modals/issues/issues.html';

const testRunInfoController = function testRunInfoController(
    $httpMock,
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

    let onTransStartSubscription = null;
    let testCaseManagementTools = [];
    let jiraSettings = {};
    let wsSubscription = null;
    let stompClient = null;
    let logsRequestsCanceler = $q.defer();
    const testsWebsocketName = 'tests';
    const logsGettingDestroy$ = new Subject();
    const initAgentAttemptsLimit = 20; // with 5sec delay provides approximately 2min interval
    const fileExtensionPattern = /\.([0-9a-z]+)(?:[\?#]|$)/i;
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
        isLogsLoading: true,

        $onInit: controllerInit,
        $onDestroy,
        changeTestStatus,
        copyLogLine,
        copyLogPermalink,
        downloadAllArtifacts,
        filterResults,
        getFullLogMessage,
        goToTestRuns,
        isLiveVideoArtifact,
        onDriverChange,
        onHistoryElemClick,
        openImagesViewerModal,
        selectLogRow,
        showDetailsDialog,
        switchMoreLess,
        userHasAnyPermission: authService.userHasAnyPermission,

        get currentTitle() { return pageTitleService.pageTitle; },
        get jira() { return jiraSettings; },
        get isMobile() { return $mdMedia('xs'); },
    };


    let agent = null;
    const MODES = {
        live: {
            name: 'live',
            initFunc: initLiveMode,
            from: 0,
        },
        record: {
            name: 'record',
            initFunc: initRecordMode,
            from: 0,
        },
    };

    return vm;

    /* Controller methods and helpers */
    function goToTestRuns() {
        const parentTest = vm.executionHistory.find(({ testId }) => testId === vm.parentTestId);

        $state.go('tests.runDetails', {
            testRunId: parentTest ? parentTest.testRunId : $stateParams.testRunId,
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

    function downloadAllArtifacts() {
        ArtifactService.downloadArtifacts({
            data: [vm.test],
            field: 'artifactsToDownload',
        });
    }

    function changeTestStatus(test, status = '') {
        status = status.toUpperCase();
        if (!test || !status || test.status === status.toUpperCase()) { return; }

        const testCopy = { ...test };

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

    function getAgents() {
        const defaultAgent = defaultLogsAgent;
        const carinaAgent = carinaLogsAgent;

        defaultAgent.initSearchCriteria(vm.testRun.id, vm.test.id);
        defaultAgent.initESIndex(vm.test.startTime, vm.test.finishTime);

        carinaAgent.initSearchCriteria(vm.testRun.ciRunId, vm.test.ciTestId);
        carinaAgent.initESIndex(vm.test.startTime, vm.test.finishTime);

        return [defaultAgent, carinaAgent];
    }

    function initActiveAgent$() {
        const agents = getAgents();

        return getAgent$(agents, 1)
            .pipe(tap(foundAgent => agent = foundAgent));
    }

    function getAgent$(agents, attempt) {
        return combineLatest(agents.map(agentsMapper))
            .pipe(
                map(findActiveAgent.bind(null, agents)),
                filter(() => attempt <= initAgentAttemptsLimit),
                switchMap((foundAgent) => foundAgent ? of(foundAgent) : reGetAgent$(agents, attempt += 1)),
            );
    }

    function agentsMapper(agent) {
        return getCount$(agent)
            .pipe(catchError(() => of(false)));
    }

    function reGetAgent$(agents, attempt) {
        return timer(5000)
            .pipe(switchMap(() => getAgent$(agents, attempt)));
    }

    function findActiveAgent(agents, responses) {
        const index = responses.findIndex((response) => response);

        if (index !== -1) {
            return agents[index];
        }
    }

    function setTestParams() {
        if (vm.test) {
            setMode(vm.test.status === 'IN_PROGRESS' ? 'live' : 'record');
            vm.activeMode.initFunc();
        }
    }

    function setMode(modeName) {
        if (vm.activeMode?.name === modeName) { return; }

        vm.activeMode = { ...MODES[modeName] };
    }

    function openImagesViewerModal(event, url) {
        const activeArtifact = vm.test.imageArtifacts.find(({ link }) => link === url);

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
                },
            });
        }
    }

    function switchMoreLess(e, log) {
        e.preventDefault();
        e.stopPropagation();
        const rowElem = e.target.closest('.testrun-info__tab-table-col._action')
            || e.target.closest('.testrun-info__tab-mobile-table-data._action-data');

        log.showMore = !log.showMore;
        if (!log.showMore) {
            if (rowElem.scrollIntoView) {
                $timeout(() => {
                    rowElem.scrollIntoView(true);
                }, 0, false);
            }
        }
    }

    function getFullLogMessage(log) {
        return log.message
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/ *(\r?\n|\r)/g, '<br/>')
            .replace(/\s/g, '&nbsp;');
    }

    function prepareArtifacts() {
        // extract image artifacts from logs
        const imageArtifacts = vm.logs.reduce((formatted, artifact) => {
            const path = artifact.urls?.image?.path ?? '';

            if (path) {
                const extensionMatch = path.match(fileExtensionPattern);
                let newArtifact = {
                    id: path,
                    name: artifact.urls?.image?.name,
                    link: path,
                }

                if (extensionMatch) {
                    newArtifact.extension = extensionMatch[1];
                }
                if (artifact.urls?.thumb?.path) {
                    newArtifact.thumb = artifact.urls.thumb.path;
                }

                formatted.push(newArtifact);
            }

            return formatted;
        }, []);

        // extract artifacts from test
        const artifactsToDownload = vm.test.artifacts.reduce((formatted, artifact) => {
            const name = artifact.name.toLowerCase();

            if (!name.includes('live') && !name.includes('video') && artifact.link) {
                const links = artifact.link.split(' ');
                let link = links[0];
                const extensionMatch = link.match(fileExtensionPattern);

                // if link is relative
                if (!link.startsWith('http')) {
                    if (link[0] !== '/') {
                        link = `/${link}`;
                    }

                    artifact.link = `${$httpMock.apiHost}${link}`;
                }
                if (extensionMatch) {
                    artifact.extension = extensionMatch[1];
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

    function copyLogLine(log) {
        const formattedTime = moment(log.timestamp).format('HH:mm:ss');
        const message = `${formattedTime} [${log.threadName}] [${log.level}] ${log.message}`;

        message.copyToClipboard();
    }

    function copyLogPermalink() {
        $location.absUrl().copyToClipboard();
    }

    function initSelectedLog() {
        const hash = $location.hash();

        if (hash) {
            const logIndex = parseInt(hash.replace('log-', ''), 10);

            if (!isNaN(logIndex)) {
                vm.selectedLogRow = logIndex;
            }
        }
    }

    // TODO: refactor this magic :)
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
        agent = null;

        vm.isLogsLoading = true;
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
        logsGettingDestroy$.next();
        logsRequestsCanceler.resolve();
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
            });
    }

    function findToolByName(name) {
        return Array.isArray(testCaseManagementTools) && testCaseManagementTools.find((tool) => tool.name === name);
    }

    function initToolSettings(name, toolSettings) {
        const integration = findToolByName(name);

        if (integration?.settings) {
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

    function initLiveMode() {
        addDrivers(getLiveVideoArtifacts(vm.test.artifacts, true));
        getLiveESLogs$()
            .pipe(
                takeUntil(logsGettingDestroy$),
            )
            .subscribe({
                complete() { vm.isLogsLoading = false; },
            });
    }

    function initRecordMode() {
        addDrivers(getVideoArtifacts(vm.test.artifacts, true));
        fiveMinsLogsFetcher$()
            .pipe(
                takeUntil(logsGettingDestroy$),
            )
            .subscribe({
                complete() { vm.isLogsLoading = false; },
            });
    }

    function controllerInit(skipHistoryUpdate) {
        if (!vm.testRun || !vm.test) { return; }

        pageTitleService.setTitle($mdMedia('max-width: 480px') ? 'Test details' : vm.test.name);
        initSelectedLog();

        initTestsWebSocket();
        vm.testRun.normalizedPlatformData = testsRunsService.normalizeTestPlatformData(vm.testRun.config);
        initTestExecutionData(skipHistoryUpdate);

        initActiveAgent$()
            .pipe(takeUntil(logsGettingDestroy$))
            .subscribe({
                complete() {
                    if (agent) {
                        setTestParams();
                    } else {
                        vm.isLogsLoading = false;
                    }

                    initToolsSettings();
                    bindEvents();
                },
            });
    }

    function $onDestroy() {
        unbindEvents();
    }

    /* END Controller methods and helpers */

    /* Work with drivers */
    function onDriverChange({ activeDriverIndex }) {
        vm.activeDriverIndex = activeDriverIndex;
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

    function addDrivers(artifacts, resetDrivers) {
        if (resetDrivers) {
            vm.drivers = [];
        }

        const artifactsToAdd = artifacts
            .filter((artifact) => !vm.drivers.find(({ id }) => id === artifact.id));

        if (artifactsToAdd) {
            artifactsToAdd.forEach((artifact) => artifact.type = isVideoArtifact(artifact) ? 'video' : 'vnc');
            vm.drivers = [...vm.drivers, ...artifactsToAdd]
                .sort((a, b) => a.createdAt - b.createdAt);
        }
    }

    function getFilteredArtifacts() {
        return vm.test.artifacts.filter()
    }
    /* END Work with drivers */

    /* Work with WebSocket */
    function initTestsWebSocket() {
        const ws = new SockJS(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/websockets`);

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

    function onTestsWSMessage(wsEvent) {
        if (!wsEvent.body) { return; }

        const test = getEventFromMessage(wsEvent.body).test;

        if (test && vm.test && test.id === vm.test.id) {
            if (test.status === 'IN_PROGRESS') {
                addDrivers(getLiveVideoArtifacts(test.artifacts));
            } else {
                const isChangingStatus = vm.test.status === 'IN_PROGRESS';

                if (isChangingStatus) {
                    // keep logs getting work for 30secs delay
                    $timeout(() => logsGettingDestroy$.next(), 30000);
                }

                addDrivers(getVideoArtifacts(test.artifacts), isChangingStatus);
            }
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
            // TODO: ?log error
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
                            .sort((a, b) => {
                                // handles cases when tests started at the same time. Sort them by ID
                                if (a.startTime === b.startTime) {
                                    return a.testId - b.testId;
                                }

                                return a.startTime - b.startTime;
                            });

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
                updateExecutionHistoryItem(test);
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

        return getCount$(agent)
            .pipe(
                switchMap((count) => fetchLiveESLogs$(count)),
            );
    }

    function fetchLiveESLogs$(count) {
        const from = vm.activeMode.from;
        const size = count - vm.activeMode.from;

        vm.activeMode.from = count

        return getESLogs$(from, size)
            .pipe(
                tap((logs) => handleESLogs(logs)),
                switchMap(() => reFetchLiveESLogs$(count)),
            );
    }

    function reFetchLiveESLogs$(count) {
        return timer(5000)
            .pipe(
                switchMap(() => getCount$(agent)),
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
                catchError(logsErrorHandler$),
            );
    }

    function logsErrorHandler$(error) {
        messageService.error(error.message || 'Unable to fetch logs');

        return of(true);
    }

    function getPastESLogs$() {
        return getCount$(agent)
            .pipe(
                switchMap((count) => fetchPastESLogs$(count)),
            );
    }

    function fetchPastESLogs$(count) {
        let from = vm.activeMode.from;
        const size = count - vm.activeMode.from;

        vm.activeMode.from = count

        return getESLogs$(from, size)
            .pipe(
                tap((logs) => handleESLogs(logs)),
            );
    }

    function getESLogs$(from, size) {
        return rxFrom(getLogsFromElasticsearch(from, size));
    }

    function getCount$(agent) {
        return rxFrom(getCountFromElasticSearch(agent))
            .pipe(
                map((response) => response.count),
            );
    }

    function getCountFromElasticSearch(agent) {
        return elasticsearchService.fetchCount(agent.esIndex, agent.searchCriteria, logsRequestsCanceler.promise);
    }

    function getLogsFromElasticsearch(from, size) {
        return elasticsearchService.fetchSearch(agent.esIndex, agent.searchCriteria, from, size, logsRequestsCanceler.promise)
            .then((response) => response?.hits?.hits ?? [])
            .then((hits) => hits.map(hit => hit._source));
    }
    /* END Work with logs */
};

export default testRunInfoController;
