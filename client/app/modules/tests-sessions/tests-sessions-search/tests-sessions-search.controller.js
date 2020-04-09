'use strict';

import SearchModalController from './modal/search-modal.controller';
import modalTemplate from './modal/search-modal.html';

const TestsSessionsSearchController = function TestsSessionsSearchController(
    $mdMedia,
    testsSessionsService,
    UtilService,
    testsRunsService,
    $scope,
    TestRunService,
    $q,
    $mdDateRangePicker,
    $timeout,
    messageService,
    $mdDialog,
) {
    'ngInject';

    let scrollTickingTimeout = null;
    const scrollableParentElement = document.querySelector('.page-wrapper');

    const vm = {
        isSearchActive,
        platforms: [],
        statuses: [],
        scrollTicking: false,
        selectedRange: {
            selectedTemplate: null,
            selectedTemplateName: null,
            dateStart: null,
            dateEnd: null,
            showTemplate: false,
            fullscreen: false,
        },
        additionalSearchParams: {},
        searchParams: {},
        onChangeSearchCriteria,
        openDatePicker,
        onReset,
        showSearchDialog,
        $onInit: init,

        get isMobile() { return $mdMedia('xs'); },
    };

    return vm;

    function init() {
        readCachedSearchParams();
        readDatePickerValues();
        initAdditionalSearchParams();
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
            onComplete: () => {
                angular.element(window).on('resize.searchDialog', () => {
                    if (!vm.isMobile) {
                        closeModal();
                    }
                });
            },
            onRemoving: () => {
                angular.element(window).off('resize.searchDialog');
            },
            locals: {
                platforms: vm.platforms,
                statuses: vm.statuses,
                selectedRange: { ...vm.selectedRange },
                searchParams: { ...vm.searchParams },
            }
        })
            .then(handleSearchDialogResponse)
            .catch(handleSearchDialogResponse);
    }

    function handleSearchDialogResponse(data) {
        if (data) {
            vm.searchParams = data.searchParams;
            vm.selectedRange = data.selectedRange;
            onChangeSearchCriteria();
        }
    }

    function onReset() {
        vm.selectedRange.dateStart = null;
        vm.selectedRange.dateEnd = null;
        vm.selectedRange.selectedTemplate = null;
        vm.selectedRange.selectedTemplateName = null;
        vm.searchParams = {};
        onApply();
    }

    function onApply() {
        $timeout(function() {
            const params = { ...testsSessionsService.DEFAULT_SC, ...vm.searchParams };

            vm.onSearch({ $params: params });
        }, 0);
    }

    function initAdditionalSearchParams() {
        vm.platforms = vm.additionalSearchParams?.platforms ?? [];
        vm.statuses = vm.additionalSearchParams?.statuses ?? [];
    }

    function readDatePickerValues() {
        const params = testsSessionsService.activeParams;

        vm.selectedRange.selectedTemplate = params.selectedTemplate || null;
        vm.selectedRange.selectedTemplateName = params.selectedTemplateName || null;
        vm.selectedRange.dateStart = params.fromDate || params.date || null;
        vm.selectedRange.dateEnd = params.toDate || params.date || null;
    }

    function readCachedSearchParams() {
        const fieldsForSync = ['query', 'platform', 'status'];
        const params = testsSessionsService.activeParams;

        fieldsForSync.forEach(field => {
            if (params[field]) {
                vm.searchParams[field] = params[field];
            }
        });
    }

    function isSearchActive() {
        return Object.keys(vm.searchParams).length;
    }

    function onChangeSearchCriteria() {
        clearParams();
        onApply();
    }

    function openDatePicker($event, showTemplate) {
        vm.selectedRange.showTemplate = showTemplate;

        $mdDateRangePicker.show({
            targetEvent: $event,
            model: vm.selectedRange
        })
            .then(result => {
                if (result) {
                    const res = UtilService.handleDateFilter(result);
                    const newSearchParams = { ...vm.searchParams, ...res.searchParams };

                    vm.selectedRange = res.selectedRange;

                    if ((!res.searchParams.selectedTemplateName && vm.searchParams.selectedTemplateName) ||
                        (res.searchParams.selectedTemplateName && !angular.equals(vm.searchParams, newSearchParams))) {
                        vm.searchParams = newSearchParams;
                        onChangeSearchCriteria();
                    }
                }
            });
    }

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

    function clearParams() {
        Object.keys(vm.searchParams).forEach(property => {
            if (vm.searchParams[property] === '' || vm.searchParams[property] === undefined || vm.searchParams[property] === null) {
                Reflect.deleteProperty(vm.searchParams, property);
            }
        });
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

export default TestsSessionsSearchController;
