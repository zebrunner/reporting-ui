'use strict';

const testLogTableController = function testLogTableController(
    $timeout,
    messageService,
    windowWidthService,
) {
    'ngInject';

    let firstIndex;
    let lastIndex;
    const initialCountToDisplay = 100;
    let selectedCountToDisplay = initialCountToDisplay;
    const defaultLimitOptions = [initialCountToDisplay, initialCountToDisplay * 2, initialCountToDisplay * 3];
    const vm = {
        logs: [],
        selectedLog: null,
        currentPage: 1,

        getFullLogMessage,
        switchMoreLess,
        copyLogLine,
        switchLogSelection,
        onPageChange,
        $onInit() {
            initFirstLastIndexes();
            readStoredCountToDisplay();
        },

        get countPerPage() { return  selectedCountToDisplay; },
        set countPerPage(newCount) {
            selectedCountToDisplay = newCount;
            storeCountToDisplay();
        },
        get logsToDisplay() {
            if (!this.logs) {
                return [];
            }

            return this.logs.slice(firstIndex, lastIndex);
        },
        get limitOptions() {  return !windowWidthService.isMobile() ? defaultLimitOptions : false; },
    };

    function initFirstLastIndexes() {
        firstIndex = 0;
        lastIndex = initialCountToDisplay;
    }

    function readStoredCountToDisplay() {
        if (localStorage.getItem('sessionLogsPerPage')) {
            selectedCountToDisplay = parseInt(localStorage.getItem('sessionLogsPerPage'), 10);
        }
    }

    function storeCountToDisplay() {
        localStorage.setItem('sessionLogsPerPage', selectedCountToDisplay);
    }

    function getFullLogMessage(log) {
        return log.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ *(\r?\n|\r)/g, '<br/>').replace(/\s/g, '&nbsp;');
    }

    function onPageChange() {
        updateFirstLastIndexes();
    }

    function updateFirstLastIndexes() {
        const newFirstIndex = (vm.currentPage - 1) * vm.countPerPage;
        let newLastIndex = newFirstIndex + vm.countPerPage;

        firstIndex = newFirstIndex;
        lastIndex = newLastIndex;
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

    return vm;
};

export default testLogTableController;
