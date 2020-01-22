'use strict';

const SearchModalController = function SearchModalController(
    platforms,
    statuses,
    testsSessionsService,
    $mdDateRangePicker,
    $mdDialog,
    selectedRange,
    searchParams
) {
    'ngInject';

    const vm = {
        statuses,
        selectedRange,
        searchParams,
        openDatePicker,
        closeModal,
        onModalReset,
        onModalApply,
        platforms,
    };

    vm.$onInit = init;

    return vm;

    function init() {

    }

    function closeModal() {
        $mdDialog.cancel();
    }

    function onModalApply() {
        // as it is a new search we need to reset page
        vm.selectedRange.page = testsSessionsService.DEFAULT_SC.page;

        $mdDialog.hide({
            selectedRange: vm.selectedRange,
            searchParams: vm.searchParams,
        });
    }

    function onModalReset() {
        vm.selectedRange = {
            selectedTemplate: null,
            selectedTemplateName: null,
            dateStart: null,
            dateEnd: null,
            showTemplate: false,
            fullscreen: false
        };
        vm.searchParams = {};
        onModalApply();
    }

    function openDatePicker($event, showTemplate) {

        vm.selectedRange.showTemplate = showTemplate;

        $mdDateRangePicker.show({
            targetEvent: $event,
            model: vm.selectedRange,
            multiple: true,
        })
        .then(function(result) {
            if (result) {
                vm.selectedRange = result;
                vm.selectedRange.selectedTemplateName = result.selectedTemplateName.split(' ').slice(0,-1).join(' ');
                vm.searchParams.selectedTemplateName = vm.selectedRange.selectedTemplateName;
                if (vm.selectedRange.dateStart && vm.selectedRange.dateEnd) {
                    if (vm.selectedRange.dateStart.getTime() !==
                        vm.selectedRange.dateEnd.getTime()) {
                        vm.searchParams.date = null;
                        vm.searchParams.fromDate = vm.selectedRange.dateStart;
                        vm.searchParams.toDate = vm.selectedRange.dateEnd;
                    } else {
                        vm.searchParams.fromDate = null;
                        vm.searchParams.toDate = null;
                        vm.searchParams.date = vm.selectedRange.dateStart;
                    }
                } else {
                    vm.searchParams.fromDate = null;
                    vm.searchParams.toDate = null;
                    vm.searchParams.date = null;
                    vm.searchParams.selectedTemplateName = null;
                }

                vm.onChangeSearchCriteria();
            }
        })
    }
}

export default SearchModalController;
