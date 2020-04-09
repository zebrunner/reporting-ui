'use strict';

import SearchModalController from './modal/search-modal.controller';
import modalTemplate from './modal/search-modal.html';

const TestsRunsSearchController = function TestsRunsSearchController(
    $mdMedia,
    $window,
    $q,
    $mdDateRangePicker,
    $timeout,
    $mdDialog,
    DEFAULT_SC,
    testsRunsService,
    $scope,
    TestRunService,
    ProjectService,
    FilterService,
    messageService,
    UtilService,
) {
    'ngInject';

    const subjectName = 'TEST_RUN';
    const SELECT_CRITERIAS = ['ENV', 'PLATFORM', 'PROJECT', 'STATUS', 'BROWSER'];
    const STATUSES = ['PASSED', 'FAILED', 'SKIPPED', 'ABORTED', 'IN_PROGRESS', 'QUEUED', 'UNKNOWN'];
    let scrollTickingTimeout = null;
    const scrollableParentElement = document.querySelector('.page-wrapper');

    const vm = {
        isMobileSearchActive: false,
        fastSearchBlockExpand: false,
        isFilterActive: testsRunsService.isFilterActive,
        isSearchActive: testsRunsService.isSearchActive,
        isOnlyAdditionalSearchActive: testsRunsService.isOnlyAdditionalSearchActive,
        fastSearch: {},
        statuses: STATUSES,
        scrollTicking: false,
        selectedRange: {
            selectedTemplate: null,
            selectedTemplateName: null,
            dateStart: null,
            dateEnd: null,
            showTemplate: false,
            fullscreen: false
        },
        platforms: [],
        browsers: [],
        allProjects: [],

        getActiveSearchType: testsRunsService.getActiveSearchType,
        searchParams: testsRunsService.getLastSearchParams(),
        isModalSearchActive: testsRunsService.isSearchActive,
        onChangeSearchCriteria: onChangeSearchCriteria,
        openDatePicker: openDatePicker,
        onReset: onReset,
        showSearchFilters: showSearchFilters,
        showAdvancedSearchFilters: false,
        closeModal: closeModal,
        showSearchDialog: showSearchDialog,
        onApply: onApply,

        get isMobile() { return $mdMedia('xs'); },
    };

    vm.$onInit = init;

    return vm;

    function init() {
        vm.fastSearchBlockExpand = true;
        loadFilters();
        readStoredParams();
        bindEventListeners();
    }

    function closeModal() {
        $mdDialog.cancel();
    }


    function showSearchDialog(event) {
        $mdDialog.show({
            controller: SearchModalController,
            template: modalTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            fullscreen: true,
            controllerAs: '$ctrl',
            bindToController: true,
            onComplete: () => {
                angular.element($window).on('resize.searchDialog',() => {
                    if (!vm.isMobile) {
                        vm.closeModal();
                    }
                });
            },
            onRemoving: () => {
                angular.element($window).off('resize.searchDialog');
            },
            locals: {
                onReset: vm.onReset,
                onApply: vm.onApply,
                environments: vm.environments,
                platforms: vm.platforms,
                browsers: vm.browsers,
                locales: vm.locales,
                allProjects: vm.allProjects,
            }
        });
    }

    function readStoredParams() {
        if (vm.isSearchActive()) {
            let fromDate = testsRunsService.getSearchParam('fromDate');
            let toDate = testsRunsService.getSearchParam('toDate');
            const date = testsRunsService.getSearchParam('date');
            const selectedTemplateName = testsRunsService.getSearchParam('selectedTemplateName');

            date && (fromDate = toDate = date);
            fromDate && (vm.selectedRange.dateStart = new Date(fromDate));
            toDate && (vm.selectedRange.dateEnd = new Date(toDate));
            selectedTemplateName && (vm.selectedRange.selectedTemplateName = selectedTemplateName);

            testsRunsService.getSearchTypes().forEach(function(type) {
                const searchValue = testsRunsService.getSearchParam(type);

                searchValue && (vm.fastSearch[type] = searchValue);
            });
        }
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
        loadFilterDataPromises.push(loadBrowsers());
        loadFilterDataPromises.push(loadLocales());
        loadFilterDataPromises.push(loadProjects());

        return $q.all(loadFilterDataPromises).then(function() {
            loadSubjectBuilder();
        });
    }

    function loadEnvironments() {
        return TestRunService.getEnvironments()
            .then(rs => {
                if (rs.success) {
                    // TODO: remove when BE get rid of nullish values from DB
                    vm.environments = rs.data.filter(Boolean);
                } else {
                    messageService.error(rs.message);
                }

                return vm.environments;
            });
    }

    function loadPlatforms() {
        return TestRunService.getPlatforms()
            .then(rs => {
                if (rs.success) {
                    // TODO: remove when BE get rid of nullish values from DB
                    vm.platforms = rs.data.filter(Boolean);
                } else {
                    messageService.error(rs.message);
                }

                return vm.platforms;
            });
    }

    function loadBrowsers() {
        return TestRunService.getBrowsers()
            .then(rs => {
                if (rs.success) {
                    // TODO: remove when BE get rid of nullish values from DB
                    vm.browsers = (rs.data  || []).filter(Boolean);
                } else {
                    messageService.error(rs.message);
                }

                return vm.browsers;
            });
    }

    function loadLocales() {
        return TestRunService.getLocales()
            .then(rs => {
                if (rs.success) {
                    vm.locales = rs.data || [];
                } else {
                    messageService.error(rs.message);
                }

                return vm.locales;
            });
    }

    function loadProjects() {
        return ProjectService.getAllProjects()
            .then(rs => {
                if (rs.success) {
                    vm.allProjects = rs.data.map(function(proj) {
                        return proj.name;
                    });
                } else {
                    messageService.error(rs.message);
                }

                return vm.allProjects;
            });
    }

    // TODO: looks like it is used on filters and redundant here
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
                            case 'BROWSER':
                                criteria.values = vm.browsers;
                                break;
                            case 'LOCALE':
                                criteria.values = vm.locales;
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

    function onChangeSearchCriteria() {
        angular.forEach(vm.searchParams, function (value, name) {
            if (vm.searchParams[name]) {
                testsRunsService.setSearchParam(name, value);
            } else {
                testsRunsService.deleteSearchParam(name);
            }
        });
        vm.onApply();
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
                const res = UtilService.handleDateFilter(result);
                const newSearchParams = {...vm.searchParams, ...res.searchParams};

                vm.selectedRange = res.selectedRange;

                if ((!res.searchParams.selectedTemplateName && vm.searchParams.selectedTemplateName) || (res.searchParams.selectedTemplateName && !angular.equals(vm.searchParams, newSearchParams))) {
                    vm.searchParams = newSearchParams;
                    onChangeSearchCriteria();
                }
            }
        })
    }

    function showSearchFilters() {
        vm.showAdvancedSearchFilters = ! vm.showAdvancedSearchFilters;
    };

    function bindEventListeners() {
        vm.$onDestroy = () => {
            if (vm.isMobile) {
                angular.element(scrollableParentElement).off('scroll.hideFilterButton', onScroll);
            }
        };
        if (vm.isMobile) {
            angular.element(scrollableParentElement).on('scroll.hideFilterButton', onScroll);
        }
    }

    function onScroll() {
        if (!vm.scrollTicking) {
            vm.scrollTicking = true;
            $scope.$apply();
            scrollTickingTimeout = $timeout(() => {
                vm.scrollTicking = false;
            }, 300);
        } else {
            $timeout.cancel(scrollTickingTimeout);
            scrollTickingTimeout = $timeout(() => {
                vm.scrollTicking = false;
            }, 300);
        }
    }
};

export default TestsRunsSearchController;
