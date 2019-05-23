'use strict'

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
            dateEnd: null,
            showTemplate: false,
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
            model: vm.selectedRange
        })
        .then(function(result) {
            if (result) {
                vm.selectedRange = result;
                if (vm.selectedRange.dateStart && vm.selectedRange.dateEnd) {
                    if (vm.selectedRange.dateStart.getTime() !==
                        vm.selectedRange.dateEnd.getTime()) {
                        testsRunsService.deleteSearchParam('date');
                        testsRunsService.setSearchParam('fromDate', vm.selectedRange.dateStart);
                        testsRunsService.setSearchParam('toDate', vm.selectedRange.dateEnd);
                    } else {
                        testsRunsService.deleteSearchParam('fromDate');
                        testsRunsService.deleteSearchParam('toDate');
                        testsRunsService.setSearchParam('date', vm.selectedRange.dateStart);
                    }
                }

                vm.onChangeSearchCriteria();
            }
        })
    }
}

export default SearchModalController;
