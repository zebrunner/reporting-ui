'use strict';

const testDetailsFilterController = function testDetailsFilterController(
    $mdMedia,
    $mdDialog,
    defaultValues,
    filterByStatus,
    reset,
    searchCriteria,
    statusInitValues,
) {
    'ngInject';

    let recentlySelectedStatuses = [];
    const vm = {
        cancel: $mdDialog.cancel,
        reset: resetFilters,
        onApply,
        searchCriteria,
        statusInitValues,
        onStatusChange,

        get isMobile() { return $mdMedia('xs'); },
    };

    return vm;

    function onApply(needClosing) {
        filterByStatus(recentlySelectedStatuses, vm.searchCriteria);
        if (needClosing) {
            vm.cancel();
        }
    }

    function resetFilters() {
        // If you need to use parent's reset
        // reset();
        // otherwise just reset current dialog's values
        vm.searchCriteria = '';
        vm.statusInitValues = defaultValues.status;
    }

    function onStatusChange($statuses) {
        recentlySelectedStatuses = $statuses;
    }
};

export default testDetailsFilterController;
