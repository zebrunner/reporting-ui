'use strict';

const testSessionLogsController = function testsSessionsController(
    windowWidthService,
    testSessionLogsService,
    testsSessionsService,
    $transitions,
    $state,
    moment,
    pageTitleService,
) {
    'ngInject';

    let _rawLog = '';
    const splitPattern = '/* ZEBRUNNER_PARSING_SPLITTER */';
    const logLevels = ['info', 'error', 'warn', 'debug', 'trace', 'warning'];
    const mobileWidth = 480;
    
    const vm = {
        testSession: null,
        rawLog: '',
        logs: [],
        videoURL: '',
        logURL: '',
        parserNotFound: false,

        goToTestsSessions,
        openRawLogs,
        getFormattedPlainLog,

        get currentTitle() { return pageTitleService.pageTitle },
        get isMobile() { return windowWidthService.isMobile(); },
    };

    vm.$onInit = init;

    return vm;

    function init() {
        [vm.testSession.platformIcon, vm.testSession.platformVersion] = testsSessionsService.refactorPlatformData(vm.testSession);
        const testName = vm.testSession.testName ? vm.testSession.testName : 'Untitled';

        vm.videoURL = testSessionLogsService.getSessionVideoURL(vm.testSession.sessionId);
        vm.logURL = testSessionLogsService.getSessionLogURL(vm.testSession.sessionId);
        pageTitleService.setTitle(window.innerWidth <= mobileWidth ? 'Session logs' : testName);
        testSessionLogsService.getSessionLog(vm.testSession.sessionId)
            .then(res => {
                if (res.success) {
                    _rawLog = res.data || '';
                    vm.rawLog = _rawLog;
                    parseLog(vm.rawLog);
                }
            });
        bindEvents();
    }

    function bindEvents() {
        const onTransStartSubscription = $transitions.onStart({}, function(trans) {
            const toState = trans.to();

            if (toState.name !== 'tests.sessions'){
                testsSessionsService.resetCachedParams();
            }
            onTransStartSubscription();
        });
    }

    function parseLog(log) {
        if (isSeleniumLog(log)) {
            seleniumParser(log);
        } else if (isAppiumLog(log)) {
            appiumParser(log);
        } else if (isFirefoxLog(log)) {
            firefoxParser(log);
        } else {
            vm.parserNotFound = true;
        }
    }

    function seleniumParser(log) {
        console.info('using selenium parser');
        const startLineRegExpString = `^(\\[([\\d.]+)\\]\\[(${logLevels.join('|')})\\]:)`;
        const startLineRegExp = new RegExp(startLineRegExpString, 'gmi');
        const groupRegExp = new RegExp(`${startLineRegExpString}([\\s\\S]*$)`, 'i');
        const data = log.replace(startLineRegExp, `${splitPattern}$1`)
            .split(splitPattern);

        vm.logs = data
            .map(chunk => {
                // if it is a log chunk
                if ((new RegExp(startLineRegExpString, 'i')).test(chunk)) {
                    const [selection, , stamp, level = 'info', message] = chunk.match(groupRegExp);

                    return {
                        timestamp: moment.utc(+stamp.replace('.', '')).format('HH:mm:ss'),
                        level: level.toLowerCase(),
                        message,
                        raw: selection,
                    };
                }

                return { message: chunk };
            })
            // filter empty logs
            .filter(logItem => logItem.message.trim());
    }

    function firefoxParser(log) {
        console.info('using firefox parser');
        const startLineRegExpString = `^((\\d{13})\\s([^\\s]+)\\s(${logLevels.join('|')}))`;
        const startLineRegExp = new RegExp(startLineRegExpString, 'gmi');
        const groupRegExp = new RegExp(`${startLineRegExpString}([\\s\\S]*$)`, 'i');
        const data = log.replace(startLineRegExp, `${splitPattern}$1`)
            .split(splitPattern);

        vm.logs = data
            .map(chunk => {
                // if it is a log chunk
                if ((new RegExp(startLineRegExpString, 'i')).test(chunk)) {
                    const [selection, , stamp, source, level = 'info', message] = chunk.match(groupRegExp);

                    return {
                        timestamp: moment.utc(+stamp).format('HH:mm:ss'),
                        level: level.toLowerCase(),
                        message,
                        source,
                        raw: selection,
                    };
                }

                return { message: chunk };
            })
            // filter empty logs
            .filter(logItem => logItem.message.trim());
    }

    function appiumParser(log) {
        console.info('using appium parser');
        const dateRegExpString = '((?:[\\d-]+)\\s(?:[\\d:]+))';
        const separatorRegExpString = '(?:[\\s-]+)';
        const levelRegExpString  = `(?:\\[(${logLevels.join('|')})\\]\\s)?`;
        const sourceRegExpString  = '(?:\\[([^\\]]+)\\]\\s?)?';
        const startLineRegExpString = `^(${dateRegExpString}${separatorRegExpString}${levelRegExpString}${sourceRegExpString})`;
        const startLineRegExp = new RegExp(startLineRegExpString, 'gmi');
        const groupRegExp = new RegExp(`${startLineRegExpString}([\\s\\S]*$)`);
        const data = log.replace(startLineRegExp, `${splitPattern}$1`)
            .split(splitPattern);

        vm.logs = data
            .map(chunk => {
                // if it is a log chunk
                if ((new RegExp(startLineRegExpString)).test(chunk)) {
                    const [selection, , stamp, level = 'info', source, message] = chunk.match(groupRegExp);

                    return  {
                        timestamp: moment.utc(stamp).format('HH:mm:ss'),
                        level: level.toLowerCase(),
                        source,
                        message,
                        raw: selection,
                    };
                }

                return { message: chunk };
            })
            // filter empty logs
            .filter(logItem => logItem.message.trim());
    }

    function isFirefoxLog(log) {
        const startLineRegExpString = `^((\\d{13})\\s([^\\s]+)\\s(${logLevels.join('|')}))`;
        const reg = new RegExp(startLineRegExpString, 'mi');

        return !!log.match(reg);
    }

    function isSeleniumLog(log) {
        const startLineRegExpString = `^(\\[([\\d.]+)\\]\\[(${logLevels.join('|')})\\]:)`;
        const reg = new RegExp(startLineRegExpString, 'mi');

        return !!log.match(reg);
    }

    function isAppiumLog(log) {
        const dateRegExpString = '((?:[\\d-]+)\\s(?:[\\d:]+))';
        const separatorRegExpString = '(?:[\\s-]+)';
        const levelRegExpString  = `(?:\\[(${logLevels.join('|')})\\]\\s)?`;
        const sourceRegExpString  = '(?:\\[([^\\]]+)\\]\\s?)?';
        const startLineRegExpString = `^(${dateRegExpString}${separatorRegExpString}${levelRegExpString}${sourceRegExpString})`;
        const reg = new RegExp(startLineRegExpString, 'mi');

        return !!log.match(reg);
    }

    function goToTestsSessions() {
        $state.go('tests.sessions', {
            sessionId: vm.testSession.sessionId,
        });
    }

    function openRawLogs() {
        window.open(vm.logURL, '_blank');
    }

    function getFormattedPlainLog() {
        return vm.rawLog.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ *(\r?\n|\r)/g, '<br/>').replace(/\s/g, '&nbsp;');
    }
};

export default testSessionLogsController;
