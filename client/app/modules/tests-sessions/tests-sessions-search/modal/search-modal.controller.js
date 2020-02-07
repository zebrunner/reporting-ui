'use strict';

const SearchModalController = function SearchModalController(
    platforms,
    statuses,
    testsSessionsService,
    $mdDateRangePicker,
    $mdDialog,
    selectedRange,
    searchParams,
    UtilService,
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

    return vm;

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
            .then(result => {
                if (result) {
                    const res = UtilService.handleDateFilter(result);
                    const newSearchParams = { ...vm.searchParams, ...res.searchParams };

                    vm.selectedRange = res.selectedRange;

                    if ((!res.searchParams.selectedTemplateName && vm.searchParams.selectedTemplateName) ||
                        (res.searchParams.selectedTemplateName && !angular.equals(vm.searchParams, newSearchParams))) {
                        vm.searchParams = newSearchParams;
                        vm.onChangeSearchCriteria();
                    }
                }
            });
    }
};

export default SearchModalController;
