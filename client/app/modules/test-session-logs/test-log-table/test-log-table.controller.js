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
        logsToDisplay: [],

        getFullLogMessage,
        switchMoreLess,
        copyLogLine,
        switchLogSelection,
        $onInit() {
            lastIndex = initialCountToDisplay > vm.logs.length ? vm.logs.length - 1 : initialCountToDisplay;
            vm.logsToDisplay = vm.logs.slice(0, lastIndex);
        },
        onInfiniteScroll,
    };

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
