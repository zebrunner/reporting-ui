'use strict';

export default function FullscreenLoaderController(
    $rootScope,
    $timeout,
) {
    'ngInject';

    let unsubscriber = null;
    let autohideTimeout = null;
    const vm = {
        hidden: false,

        get companyLogo() { return $rootScope.companyLogo; },

        $onInit() {
            registerListener();
        },
        $onDestroy() {
            if (unsubscriber) {
                unsubscriber();
            }
        },
    };

    function registerListener() {
        unsubscriber = $rootScope.$on('event:fullscreen-logo', function(ev, payload) {
            if (payload) {
                if (payload.type === 'hide') {
                    hideLoader(payload.delay);
                } else if (payload.type === 'show') {
                    vm.hidden = false;

                    if (payload.autohideDelay) {
                        hideLoader(payload.autohideDelay);
                    }
                }
            } else {
                // hide loader by default if payload is missing
                hideLoader();
            }
        });
    }

    function hideLoader(delay = 0) {
        if (autohideTimeout) {
            $timeout.cancel(autohideTimeout);
        }

        autohideTimeout = $timeout(() => {
            vm.hidden = true;
            autohideTimeout = null;
        }, delay);
    }

    return vm;
}
