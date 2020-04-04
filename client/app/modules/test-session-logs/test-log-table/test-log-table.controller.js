'use strict';

const testLogTableController = function testLogTableController(
    $timeout,
    messageService,
) {
    'ngInject';

    let lastIndex;
    const initialCountToDisplay = 150;
    const itemsCountPerScroll = 50;
    const vm = {
        logs: [],
        selectedLog: null,
        logsLevels: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'status'],
        selectedLevels: [],
        selectedLevel: 'status',
        logsToDisplay: [],

        getFullLogMessage,
        switchMoreLess,
        copyLogLine,
        switchLogSelection,
        filterResults,
        selectFilterRange,
        $onInit() {
            lastIndex = initialCountToDisplay > vm.logs.length ? vm.logs.length - 1 : initialCountToDisplay;
            vm.logsToDisplay = vm.logs.slice(0, lastIndex);
        },
        onInfiniteScroll,
    };

    function filterResults(itemLevel) {
        if (vm.selectedLevel === 'status') {
            return true;
        }

        return vm.selectedLevels.includes(itemLevel);
    }

    function selectFilterRange(item) {
        vm.selectedLevel = vm.logsLevels[item];
        vm.selectedLevels = vm.logsLevels.slice(0, item + 1);
    }

    function getFullLogMessage(log) {
        return log.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ *(\r?\n|\r)/g, '<br/>').replace(/\s/g, '&nbsp;');
    }

    function switchMoreLess(e, log) {
        log.showMore = !log.showMore;

        if (e) {
            e.stopPropagation();
            e.preventDefault();

            const rowElem = e.target.closest('.test-log-table__col._action');
            const scrollableElem = rowElem.closest(vm.isMobile ? '.history-tab' : '.test-session-logs__tab-table-wrapper');

            if (!log.showMore) {
                $timeout(function () {
                    if (scrollableElem.scrollTop > rowElem.offsetTop) {
                        scrollableElem.scrollTop = rowElem.offsetTop;
                    }
                }, 0);
            }
        }
    }

    function copyLogLine(log) {
        (log.raw || log.message).copyToClipboard();
        messageService.success('Log copied to clipboard');
    }

    function switchLogSelection(log) {
        if (vm.selectedLog === log) {
            vm.selectedLog = null;
        } else {
            vm.selectedLog = log;
        }
    }

    function onInfiniteScroll() {
        // there is nothing to add
        if (vm.logs.length <= lastIndex + 1) {
            return;
        }

        const newLastIndex = lastIndex + itemsCountPerScroll;

        $timeout(() => {
            lastIndex = newLastIndex < vm.logs.length ? newLastIndex : vm.logs.length - 1;
            vm.logsToDisplay = vm.logs.slice(0, lastIndex);
        }, 0);

    }

    return vm;
};

export default testLogTableController;
