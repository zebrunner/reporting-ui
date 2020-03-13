'use strict';

const serverErrorController = function serverErrorController(
    appHealthService,
    $state,
    messageService,
    $q,
) {
    'ngInject';

    const vm = {
        isChecking: false,

        backToSystem,
    };

    function backToSystem() {
        vm.isChecking = true;
        // TODO: Temporarily disabled due errors
        // appHealthService.checkServerStatus()
        $q.resolve()
            .then(() => {
                appHealthService.changeHealthyStatus(true);
                // TODO: redirect to the referrer page if available
                return $state.go('home');
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
