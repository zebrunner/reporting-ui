'use strict';

const SearchModalController = function SearchModalController(onApply, environments, allProjects, platforms, onReset, testsRunsService, windowWidthService, DEFAULT_SC, $rootScope, TestRunService, ProjectService, $q, FilterService, $mdDateRangePicker, $timeout, $mdDialog) {
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
        environments: environments,
        platforms: platforms,
        allProjects: allProjects,
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
        vm.onApply()
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
