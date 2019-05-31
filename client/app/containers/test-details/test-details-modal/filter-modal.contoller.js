'use strict';

const testDetailsFilterController = function testDetailsFilterController(resetTestsGroupingParent, testDetailsService, sortByTags, $mdDialog, tags, testsTagsOptions, testGroupMode, testsStatusesOptions, sortByStatus) {
    'ngInject';

    const vm = {
        cancel,
        tags,
        testsTagsOptions,
        testGroupMode,
        testsStatusesOptions,
        sortByStatus,
        resetTestsGroupingParent,
        resetTestsGrouping,
        sortByTags,
        onTagSelect,
        onApply,
        resentlySelectedStatuses: [],
        recentlySelectedTags: [],
        onStatusButtonClick,
    };

    return vm;

    function resetTestsGrouping() {
        testDetailsService.clearDataCache();
        vm.resetTestsGroupingParent();
        vm.onApply(false);
    }

    function cancel() {
        $mdDialog.cancel();
    };

    function onApply(needClosing) {
        vm.sortByTags(vm.recentlySelectedTags);
        vm.sortByStatus(vm.resentlySelectedStatuses);
        if (needClosing) {
            vm.cancel();
        }
    }

    function onTagSelect($tags) {
        vm.recentlySelectedTags = $tags;
    }

    function onStatusButtonClick($statuses) {
        vm.resentlySelectedStatuses = $statuses;
    }

};

export default testDetailsFilterController;
