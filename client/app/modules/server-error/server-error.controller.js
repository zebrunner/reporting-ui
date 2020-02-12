'use strict';

const serverErrorController = function serverErrorController(
    appHealthService,
    $state,
    messageService,
) {
    'ngInject';

    const vm = {
        isChecking: false,

        backToSystem,
    };

    function backToSystem() {
        vm.isChecking = true;
        appHealthService.checkServerStatus()
            .then(() => {
                appHealthService.changeHealthyStatus(true);
                // TODO: redirect to the referrer page if available
                $state.go('home');
            })
            .catch(err => {
                // API is unavailable, we need to redirect
                appHealthService.changeHealthyStatus(false);
                messageService.error('Server is unavailable, please try later');
            })
            .finally(() => {
                vm.isChecking = false;
            });
    }

    return vm;
};

export default serverErrorController;
