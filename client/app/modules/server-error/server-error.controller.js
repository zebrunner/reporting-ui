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
            .catch(() => {
                vm.isChecking = false;
                appHealthService.changeHealthyStatus(false);
                messageService.error('Server is unavailable, please try later');
            });
    }

    return vm;
};

export default serverErrorController;
