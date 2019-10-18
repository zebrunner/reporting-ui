'use strict';

const testDetailsFilterController = function testDetailsFilterController(
    reset,
    $mdDialog,
    filterByStatus,
    statusInitValues,
    defaultValues,
) {
    'ngInject';

    let resentlySelectedStatuses = [];
    const vm = {
        cancel: $mdDialog.cancel,
        reset: resetFilters,
        onApply,
        statusInitValues,
        onStatusChange,
    };

    return vm;

    function onApply(needClosing) {
        filterByStatus(resentlySelectedStatuses);
        if (needClosing) {
            vm.cancel();
        }
    }

    function resetFilters() {
        // If you need to use parent's reset
        // reset();
        // otherwise just reset current dialog's values
        vm.statusInitValues = defaultValues.status;
    }

    function onStatusChange($statuses) {
        resentlySelectedStatuses = $statuses;
    }
};

export default testDetailsFilterController;
