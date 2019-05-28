'use strict';

const testDetailsFilterController = function testDetailsFilterController(onStatusButtonClickGetSelected, onTagClickGetSelected, testDetailsService, onTagSelectParent, $mdDialog, tags, testsTagsOptions, testGroupMode, testsStatusesOptions, onStatusButtonClickParent, windowWidthService, $scope) {
    'ngInject';

    const vm = {
        cancel,
        tags: tags,
        testsTagsOptions: testsTagsOptions,
        testGroupMode: testGroupMode,
        testsStatusesOptions: testsStatusesOptions,
        onStatusButtonClickParent: onStatusButtonClickParent,
        onTagSelect: onTagClickGetSelected,
        resetTestsGrouping: resetTestsGrouping,
        recentlySelectedTags: testDetailsService.getStoredTags() || [],
        resentlySelectedStatuses: testDetailsService.getStoredStatuses() || [],
        onTagSelectParent: onTagSelectParent,
        onStatusButtonClick: onStatusButtonClickGetSelected,
        onApply,
    };

    vm.$onInit = controlInit;

    return vm;

    function controlInit() {

    }

    function resettingStoredStatuses() {
        let chips = Array.from(document.querySelectorAll('.test-run-group_group-items_item'));
        chips.forEach((chip) => {chip.classList.remove('item-checked')});
    }

    function resettingStoredTags() {
        let chips = document.querySelectorAll('md-chip');
        chips.forEach((chip) => {chip.classList.remove('md-focused')});
    }

    function resetTestsGrouping() {
        testDetailsService.clearDataCache();
        resettingStoredStatuses();
        resettingStoredTags();
        vm.onApply(false);
    }

    function cancel() {
        $mdDialog.cancel();
    };

    function onApply(needClosing) {
        vm.onTagSelectParent(vm.onTagSelect());
        vm.onStatusButtonClickParent(vm.onStatusButtonClick());
        if(needClosing) {
            vm.cancel();
        }
    }

};

export default testDetailsFilterController;
