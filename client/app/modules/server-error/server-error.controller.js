'use strict';

const serverErrorController = function serverErrorController(
    appHealthService,
    $state,
    messageService,
) {
    'ngInject';

    const vm = {
        backToSystem,
    };

    function backToSystem() {
        appHealthService.checkServerStatus()
            .then(() => {
                appHealthService.isHealthy = true;
                // TODO: redirect to the referrer page if available
                $state.go('home');
            })
            .catch(err => {
                // API is unavailable, we need to redirect
                appHealthService.isHealthy = false;
                messageService.error('Server is unavailable, please try later');
            });
    }

    return vm;
};

export default serverErrorController;
