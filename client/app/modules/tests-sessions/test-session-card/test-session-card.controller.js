'use strict';

const testsSessionCardController = function testsSessionCardController(
    $mdMedia,
    $rootScope,
    $state,
    $stateParams,
    $timeout,
    UtilService,
    $scope,
    messageService,
) {
    'ngInject';

    const vm = {
        testSession: null,

        goToTestSession,
        copyLink,
        $onInit: onInit,
        openMenu,
        openLogs,

        get isMobile() { return $mdMedia('xs'); },
        get currentOffset() { return $rootScope.currentOffset; },
    };

    return vm;

    function goToTestSession() {
        $state.go('tests.sessionLogs', { testSessionId: vm.testSession.sessionId });
    }

    function openLogs() {
        const url = $state.href('tests.sessionLogs', { testSessionId: vm.testSession.sessionId }, { absolute : true });

        window.open(url);
    }

    function copyLink() {
        const url = $state.href('tests.sessionLogs', { testSessionId: vm.testSession.sessionId }, { absolute : true });

        url.copyToClipboard();
        messageService.success('URL copied to clipboard');
    }

    function onInit() {
        if ($stateParams.sessionId && $stateParams.sessionId === vm.testSession.sessionId) {
            highlightTestSession();
        }
    }

    function highlightTestSession() {
        $timeout(function() {
            //Scroll to the element if it out of the viewport
            const el = document.getElementById('testSession_' + vm.testSession.sessionId);

            //scroll to the element
            if (el && !UtilService.isElementInViewport(el)) {
                const headerOffset = document.querySelector('.fixed-page-header').offsetHeight;
                const elOffsetTop = angular.element(el).offset().top;
                const scrollableParentElement = document.querySelector('.page-wrapper');

                angular.element(scrollableParentElement).animate({ scrollTop: elOffsetTop - headerOffset }, 'slow', function() {
                    handleHighlighting();
                });
            } else {
                handleHighlighting();
            }
        }, 500); // wait for content is rendered (maybe need to be increased if scroll position is incorrect)
    }

    function handleHighlighting() {
        vm.testSession.highlighting = true;
        $scope.$apply();
        $timeout(function() {
            delete vm.testSession.highlighting;
        }, 4000); //4000 - highlighting animation duration in CSS
    }

    function openMenu($event, $msMenuCtrl) {
        UtilService.setOffset($event);
        $timeout(function() {
            $msMenuCtrl.open($event);
        }, 0, false);
    }
};

export default testsSessionCardController;
