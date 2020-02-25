'use strict';

import accessKeyModalController from './access-key-modal/access-key-modal.controller';
import accessKeyModalTemplate from './access-key-modal/access-key-modal.html';

const testsSessionsController = function testsSessionsController(
    $q,
    $state,
    windowWidthService,
    testsSessionsService,
    messageService,
    $transitions,
    $mdDialog,
    UserService,
) {
    'ngInject';

    const vm = {
        testSessions: [],
        totalResults: 0,
        pageSize: 20,
        currentPage: 1,
        switcherState: 'sessions',
        isUserParamSaving: false,

        onPageChange,
        onSearch,
        openAccessKeyModal,
        onViewChange,
        $onInit: init,

        get isEmpty() { return this.testSessions && !this.testSessions.length; },
        get isMobile() { return windowWidthService.isMobile(); },
    };

    return vm;

    function init() {
        vm.testSessions = vm.resolvedTestSessions.results || [];
        vm.totalResults = vm.resolvedTestSessions.totalResults || 0;
        vm.pageSize = testsSessionsService.activeParams.pageSize;
        vm.currentPage = testsSessionsService.activeParams.page + 1;
        bindEvents();
    }

    function onViewChange(state) {
        const param = {name: 'DEFAULT_TEST_VIEW', value: state};

        vm.isUserParamSaving = true;

        return UserService.updateUserPreference(UserService.currentUser.id, param).then(rs => {
            if (rs.success) {
                UserService.currentUser.testsView = state;
                $state.go(`tests.${state}`);
            } else {
                vm.isUserParamSaving = false;
                vm.switcherState = 'sessions';
                messageService.error(rs.message);
            }
        });
    }

    // page value comes from pagination where counting starts from 1, so we need to subtract 1
    function onPageChange(page) {
        const activeParams = { ...testsSessionsService.activeParams };

        activeParams.page = page - 1;

        return getTestSessions(activeParams);
    }

    function onSearch(params = { ...testsSessionsService.DEFAULT_SC }) {
        vm.currentPage = params.page + 1;

        return getTestSessions(params);
    }

    function getTestSessions(params = { ...testsSessionsService.activeParams }) {
        return testsSessionsService.searchSessions(params)
            .then(rs => {
                if (rs.success) {
                    const data = rs.data || {};

                    vm.testSessions = data.results || [];
                    vm.totalResults = data.totalResults || 0;

                    return vm.testSessions;
                } else {
                    return $q.reject(rs);
                }
            })
            .catch(function(err) {
                messageService.error(err.message);

                return $q.resolve([]);
            });
    }

    function bindEvents() {
        const onTransStartSubscription = $transitions.onStart({}, trans => {
            const toState = trans.to();

            if (toState.name !== 'tests.sessionLogs'){
                testsSessionsService.resetCachedParams();
            }
            onTransStartSubscription();
        });
    }

    function openAccessKeyModal(e) {
        $mdDialog.show({
            controller: accessKeyModalController,
            template: accessKeyModalTemplate,
            parent: angular.element(document.body),
            targetEvent: e,
            fullscreen: true,
            controllerAs: '$ctrl',
        });
    }
};

export default testsSessionsController;
