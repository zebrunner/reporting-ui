'use strict';

const SearchModalController = function SearchModalController(
    $mdDateRangePicker,
    $mdDialog,
    onApply,
    environments,
    allProjects,
    platforms,
    browsers,
    onReset,
    testsRunsService,
    windowWidthService,
    DEFAULT_SC,
    UtilService,
    ) {
    'ngInject';

    const STATUSES = ['PASSED', 'FAILED', 'SKIPPED', 'ABORTED', 'IN_PROGRESS', 'QUEUED', 'UNKNOWN'];
    const vm = {
        isMobile: windowWidthService.isMobile,
        statuses: STATUSES,
        selectedRange: {
            selectedTemplate: null,
            selectedTemplateName: null,
            dateStart: null,
            dateEnd:  null,
            showTemplate: true,
            fullscreen: false
        },
        searchParams: testsRunsService.getLastSearchParams(),
        onChangeSearchCriteria,
        openDatePicker,
        closeModal,
        onModalReset,
        onReset: onReset,
        onApply: onApply,
        onModalApply,
        environments,
        platforms,
        browsers,
        allProjects,
    };

    vm.$onInit = init;

    return vm;

    function init() {
        readStoredDate();
    }

    function readStoredDate() {
        let fromDate = testsRunsService.getSearchParam('fromDate');
        let toDate = testsRunsService.getSearchParam('toDate');
        const date = testsRunsService.getSearchParam('date');
        const selectedTemplateName = testsRunsService.getSearchParam('selectedTemplateName');

        selectedTemplateName && (vm.selectedRange.selectedTemplateName = selectedTemplateName);
        date && (fromDate = toDate = date);
        fromDate && (vm.selectedRange.dateStart = new Date(fromDate));
        toDate && (vm.selectedRange.dateEnd = new Date(toDate));
    }

    function closeModal() {
        $mdDialog.cancel();
    }

    function onModalApply() {
        vm.onApply();
        vm.closeModal();
    }

    function onModalReset() {
        vm.selectedRange.dateStart = null;
        vm.selectedRange.dateEnd = null;
        vm.selectedRange.selectedTemplate = null;
        vm.selectedRange.selectedTemplateName = null;
        vm.searchParams = angular.copy(DEFAULT_SC);
        vm.onReset();
    }

    function onChangeSearchCriteria() {
        angular.forEach(vm.searchParams, function (value, name) {
            if (vm.searchParams[name]) {
                testsRunsService.setSearchParam(name, value);
            } else {
                testsRunsService.deleteSearchParam(name);
            }
        });
    }

    function openDatePicker($event, showTemplate) {
        vm.selectedRange.showTemplate = showTemplate;

        $mdDateRangePicker
            .show({
                targetEvent: $event,
                model: vm.selectedRange,
                multiple: true,
            })
            .then(result => {
                if (result) {
                    const res = UtilService.handleDateFilter(result);
                    const newSearchParams = {...vm.searchParams, ...res.searchParams};

                    vm.selectedRange = res.selectedRange;

                    if ((!res.searchParams.selectedTemplateName && vm.searchParams.selectedTemplateName) || (res.searchParams.selectedTemplateName && !angular.equals(vm.searchParams, newSearchParams))) {
                        vm.searchParams = newSearchParams;
                        onChangeSearchCriteria();
                    }
                }
            });
    }
};

export default SearchModalController;
