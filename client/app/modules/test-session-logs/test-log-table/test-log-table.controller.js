'use strict';

// TODO: Fix styles especially for small screens

const testLogTableController = function testLogTableController(
    messageService,
) {
    'ngInject';

    const vm = {
        logs: [],
        selectedLog: null,

        getFullLogMessage,
        switchMoreLess,
        copyLogLine,
        switchLogSelection,
    };

    function getFullLogMessage(log) {
        return log.message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ *(\r?\n|\r)/g, '<br/>').replace(/\s/g, '&nbsp;');
    }

    function switchMoreLess(e, log) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        // TODO: fix scroll
        // const rowElem = e.target.closest('.testrun-info__tab-table-col._action');
        // const scrollableElem = rowElem.closest('.testrun-info__tab-table-wrapper');

        log.showMore = !log.showMore;
        // if (!log.showMore) {
        //     $timeout(function () {
        //         if (scrollableElem.scrollTop > rowElem.offsetTop) {
        //             scrollableElem.scrollTop = rowElem.offsetTop;
        //         }
        //     }, 0);
        // }
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
