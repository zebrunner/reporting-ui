'use strict';

const testsSessionCardController = function testsSessionCardController(
    windowWidthService,
    $rootScope,
    $state
) {
    'ngInject';

    const vm = {
        testSession: null,

        goToTestSession,

        get isMobile() { return windowWidthService.isMobile(); },
        get currentOffset() { return $rootScope.currentOffset; },
    };

    return vm;

    function goToTestSession() {
        // TODO:
        // $state.go('tests.sessionLogs', {testSessionId: vm.testSession.id});
    }

    // function copyLink() {
    //     const url = $state.href('tests.runDetails', {testRunId: vm.testRun.id}, {absolute : true});
    //
    //     url.copyToClipboard();
    // }
};

export default testsSessionCardController;
