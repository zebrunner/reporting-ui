'use strict'

const TestsRunsSearchController = function TestsRunsSearchController(windowWidthService, DEFAULT_SC, testsRunsService, $rootScope, TestRunService, ProjectService, $q, FilterService, $mdDateRangePicker, $timeout) {
    'ngInject';

    const subjectName = 'TEST_RUN';
    const SELECT_CRITERIAS = ['ENV', 'PLATFORM', 'PROJECT', 'STATUS'];
    const STATUSES = ['PASSED', 'FAILED', 'SKIPPED', 'ABORTED', 'IN_PROGRESS', 'QUEUED', 'UNKNOWN'];

    const vm = {
        isMobile: windowWidthService.isMobile,
        isMobileSearchActive: false,
        fastSearchBlockExpand: false,
        isFilterActive: testsRunsService.isFilterActive,
        isSearchActive: testsRunsService.isSearchActive,
        fastSearch: {},
        statuses: STATUSES,
        selectedRange: {
            selectedTemplate: null,
            selectedTemplateName: null,
            dateStart: null,
            dateEnd: null,
            showTemplate: false,
            fullscreen: false
        },
        getActiveSearchType: testsRunsService.getActiveSearchType,
        onSearchChange: onSearchChange,
        selectSearchType: selectSearchType,
        searchParams: testsRunsService.getLastSearchParams(),
        onChangeSearchCriteria: onChangeSearchCriteria,
        openDatePicker: openDatePicker,
        toggleMobileSearch: toggleMobileSearch,
        onReset: onReset,
        onApply: onApply,
    };

    vm.$onInit = init;

    return vm;

    function init() {
        vm.fastSearchBlockExpand = true;
        loadFilters();
        readStoredParams();
        if (vm.isMobile()) {
            // $rootScope.$on('tr-filter-apply', onApply);
            $rootScope.$on('tr-filter-open-search', toggleMobileSearch);
            $rootScope.$on('tr-filter-close', toggleMobileSearch);
        }
        $rootScope.$on('tr-filter-reset', onReset);
    }

    function readStoredParams() {
        if (vm.isSearchActive()) {
            let fromDate = testsRunsService.getSearchParam('fromDate');
            let toDate = testsRunsService.getSearchParam('toDate');
            const date = testsRunsService.getSearchParam('date');

            date && (fromDate = toDate = date);
            fromDate && (vm.selectedRange.dateStart = new Date(fromDate));
            toDate && (vm.selectedRange.dateEnd = new Date(toDate));

            testsRunsService.getSearchTypes().forEach(function(type) {
                const searchValue = testsRunsService.getSearchParam(type);

                searchValue && (vm.fastSearch[type] = searchValue);
            });
        }
    }

    function toggleMobileSearch() {
        vm.isMobileSearchActive = !vm.isMobileSearchActive;
    }

    function onReset() {
        vm.selectedRange.dateStart = null;
        vm.selectedRange.dateEnd = null;
        vm.selectedRange.selectedTemplate = null;
        vm.selectedRange.selectedTemplateName = null;
        vm.searchParams = angular.copy(DEFAULT_SC);
        vm.fastSearch = {};
        testsRunsService.resetFilteringState();
        vm.onFilterChange();
        vm.chipsCtrl && (delete vm.chipsCtrl.selectedChip);
    }

    function onApply() {
        $timeout(function() {
            vm.onFilterChange();
        }, 0);
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

    function onSearchChange() {
        const activeFilteringTool = testsRunsService.getActiveFilteringTool();

        if (activeFilteringTool && activeFilteringTool !== 'search') { return; }

        !activeFilteringTool && testsRunsService.setActiveFilteringTool('search');
        testsRunsService.getSearchTypes().forEach(function(type) {
            if (vm.fastSearch[type]) {
                testsRunsService.setSearchParam(type, vm.fastSearch[type]);
            } else if (testsRunsService.getSearchParam(type)) {
                testsRunsService.deleteSearchParam(type);
            }
        });
        vm.onApply();
    }

    function onChangeSearchCriteria(name) {//TODO: refactor this fn and onSearchChange for "DRY"
        const activeFilteringTool = testsRunsService.getActiveFilteringTool();

        if (!name) { return; }
        if (activeFilteringTool && activeFilteringTool !== 'search') { return; }

        !activeFilteringTool && testsRunsService.setActiveFilteringTool('search');
        if (vm.searchParams[name]) {
            testsRunsService.setSearchParam(name, vm.searchParams[name]);
        } else {
            testsRunsService.deleteSearchParam(name);
        }
        vm.onApply();
    }

    function selectSearchType(type) {
        if (vm.getActiveSearchType() === type) { return; }

        testsRunsService.setActiveSearchType(type);
    }

    function openDatePicker($event, showTemplate) {
        if (vm.isFilterActive()) { return; }

        vm.selectedRange.showTemplate = showTemplate;

        $mdDateRangePicker.show({
            targetEvent: $event,
            model: vm.selectedRange
        })
        .then(function(result) {
            if (result) {
                const activeFilteringTool = testsRunsService.getActiveFilteringTool();

                vm.selectedRange = result;
                !vm.isSearchActive() && testsRunsService.setActiveFilteringTool('search');
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
                vm.onApply();
            }
        })
    }
}

export default TestsRunsSearchController;
