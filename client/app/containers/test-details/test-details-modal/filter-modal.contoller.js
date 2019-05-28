'use strict';

const testDetailsFilterController = function testDetailsFilterController(testDetailsService, onTagSelectParent, $mdDialog, tags, testsTagsOptions, testGroupMode, testsStatusesOptions, onStatusButtonClickParent) {
    'ngInject';

    const vm = {
        cancel,
        tags: tags,
        testsTagsOptions: testsTagsOptions,
        testGroupMode: testGroupMode,
        testsStatusesOptions: testsStatusesOptions,
        onStatusButtonClickParent: onStatusButtonClickParent,
        onStatusButtonClick,
        onTagSelect: onTagSelect,
        resetTestsGrouping: resetTestsGrouping,
        recentlySelectedTags: testDetailsService.getStoredTags() || null,
        resentlySelectedStatuses: testDetailsService.getStoredStatuses() || null,
        onTagSelectParent: onTagSelectParent,
        onApply,
    };

    vm.$onInit = controlInit;

    return vm;

    function controlInit() {
        readingStoredTags();
        readingStoredStatuses();
    }

    function readingStoredTags() {
        let chips = null;
        angular.element(document).ready(function () {
            chips =  Array.from(document.querySelectorAll('md-chip'));
            if(vm.recentlySelectedTags) {
                chips.map((el, index) => {
                    vm.recentlySelectedTags.forEach((tag) => {
                        if(el.innerText.slice(1) === tag) {
                            el.classList.add('md-focused');
                        }
                    })
                })
            }
        })
    }
    
    function readingStoredStatuses() {
        let chips = null;
        angular.element(document).ready(function () {
            chips = Array.from(document.querySelectorAll('.test-run-group_group-items_item'));
            if(vm.resentlySelectedStatuses) {
                chips.map((el) => {
                        vm.resentlySelectedStatuses.forEach((status) => {
                            if(el.getAttribute('name') === status) {
                                el.classList.add('item-checked');
                            }
                        })
                })
            }
        })
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
        vm.resentlySelectedStatuses = null;
        vm.recentlySelectedTags = null;
        testDetailsService.clearDataCache();
        resettingStoredStatuses();
        resettingStoredTags();
        vm.onApply(false);
    }

    function cancel() {
        $mdDialog.cancel();
    };

    function onApply(needClosing) {
        vm.onTagSelectParent(vm.recentlySelectedTags);
        vm.onStatusButtonClickParent(vm.resentlySelectedStatuses);
        if(needClosing) {
            vm.cancel();
        }
    }

    function onStatusButtonClick() {
        vm.resentlySelectedStatuses = [];
        let chips = Array.from(document.querySelectorAll('.item-checked'));
        chips.map((chip) => { vm.resentlySelectedStatuses.push(chip.getAttribute('name')); })
        testDetailsService.setStatuses(vm.resentlySelectedStatuses);
    }

    function onTagSelect() {
        vm.recentlySelectedTags = [];
        let chips = Array.from(document.querySelectorAll('.md-focused'));
        chips.map((chip) => { vm.recentlySelectedTags.push(chip.innerText.slice(1)); })
        testDetailsService.setTags(vm.recentlySelectedTags);
    }

};

export default testDetailsFilterController;
