'use strict'

const SearchModalController = function SearchModalController(onApply, onReset, testsRunsService, windowWidthService, DEFAULT_SC, $rootScope, TestRunService, ProjectService, $q, FilterService, $mdDateRangePicker, $timeout, $mdDialog) {
    'ngInject';
    const subjectName = 'TEST_RUN';
    const SELECT_CRITERIAS = ['ENV', 'PLATFORM', 'PROJECT', 'STATUS'];
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
        onModalApply
    };

    vm.$onInit = init;

    return vm;

    function init() {
        loadFilters();
    }

    function closeModal() {
        $mdDialog.cancel();
    };

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

    function loadFilters() {
        const loadFilterDataPromises = [];

        loadFilterDataPromises.push(loadEnvironments());
        loadFilterDataPromises.push(loadPlatforms());
        loadFilterDataPromises.push(loadProjects());

        return $q.all(loadFilterDataPromises).then(function() {
            loadSubjectBuilder();
        });
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

    function loadEnvironments() {
        return TestRunService.getEnvironments().then(function(rs) {
            if (rs.success) {
                vm.environments = rs.data.filter(function (env) {
                    return !!env;
                });

                return vm.environments;
            } else {
                alertify.error(rs.message);
                $q.reject(rs.message);
            }
        });
    }

    function loadPlatforms() {
        return TestRunService.getPlatforms().then(function (rs) {
            if (rs.success) {
                vm.platforms = rs.data.filter(function (platform) {
                    return platform && platform.length;
                });

                return vm.platforms;
            } else {
                alertify.error(rs.message);

                return $q.reject(rs.message);
            }
        });
    }

    function loadProjects() {
        return ProjectService.getAllProjects().then(function (rs) {
            if (rs.success) {
                vm.allProjects = rs.data.map(function(proj) {
                    return proj.name;
                });

                return rs.data;
            } else {
                $q.reject(rs.message);
            }
        });
    }

    function loadSubjectBuilder() {
        FilterService.getSubjectBuilder(subjectName).then(function (rs) {
            if(rs.success) {
                vm.subjectBuilder = rs.data;
                vm.subjectBuilder.criterias.forEach(function(criteria) {
                    if (isSelectCriteria(criteria)) {
                        switch(criteria.name) {
                            case 'ENV':
                                criteria.values = vm.environments;
                                break;
                            case 'PLATFORM':
                                criteria.values = vm.platforms;
                                break;
                            case 'PROJECT':
                                criteria.values = vm.allProjects;
                                break;
                            case 'STATUS':
                                criteria.values = STATUSES;
                                break;
                        }
                    }
                });
            }
        });
    }

    function isSelectCriteria(criteria) {
        return criteria && SELECT_CRITERIAS.indexOf(criteria.name) >= 0;
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
