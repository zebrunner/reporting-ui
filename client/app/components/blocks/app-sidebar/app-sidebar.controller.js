'use strict';

import dashboardSettingsModalController from '../../../shared/modals/dashboard-settings-modal/dashboard-settings-modal.controller';
import dashboardSettingsModalTemplate from '../../../shared/modals/dashboard-settings-modal/dashboard-settings-modal.html';

import uploadImageModalController
    from '../../../shared/modals/upload-image-modal/upload-image-modal.controller';
import uploadImageModalTemplate
    from '../../../shared/modals/upload-image-modal/upload-image-modal.html';

import 'jquery-ui/widgets/sortable';
import 'angular-ui-sortable'

const AppSidebarController = function ($scope, $rootScope, $cookies, $q, $mdDialog, $state, ViewService, ConfigService,
                                       ProjectService, projectsService, UtilService, UserService, DashboardService,
                                       AuthService, SettingsService, $timeout, windowWidthService) {
    'ngInject';

    const fakeProjectAll = {
        name: 'ALL',
        id: 'all',
    };

    const vm = {
        DashboardService: DashboardService,
        version: null,
        views: [],
        projects: [],
        $state: $state,
        selectedProject: fakeProjectAll.id,
        hasHiddenDashboardPermission,
        loadViews,
        loadDashboards,
        showViewDialog,
        showProjectDialog,
        showUploadImageDialog,
        chooseProject,
        showDashboardSettingsModal,
        selectedProjectShortName: '',

        dashboardSortableOptions: {
            stop: function(e, ui) {
                updateDashboardPositions(ui.item.sortable.sourceModel);
            },
            disabled: true
        },

        activateSorter: activateDashboardsSorter,

        get companyLogo() { return $rootScope.companyLogo; },
        get currentUser() { return UserService.currentUser; },
        get isMobile() { return windowWidthService.isMobile(); },
        get dashboardList() { return DashboardService.dashboards; },
    };

    vm.$onInit = initController;

    function activateDashboardsSorter(activate) {
        vm.dashboardSortableOptions.disabled = ! activate;
    };

    function updateDashboardPositions(dashboards) {
        let dashboardPositions = {};
        dashboards.forEach(function (dashboard, index) {
            dashboard.position = index;
            dashboardPositions[dashboard.id] = dashboard.position;
        });
        updatePositions(dashboardPositions);
    };

    function updatePositions(positions) {
        DashboardService.UpdateDashboardOrders(positions).then(function (rs) {
            if(rs.success) {
            } else {
                alertify.error(rs.message);
            }
        });
    };

    function initController() {
        loadProjects()
            .then(() => {
                vm.selectedProjectShortName = cutSelectedProjectName();
            });
    }

    function hasHiddenDashboardPermission(){
        return AuthService.UserHasAnyPermission(['VIEW_HIDDEN_DASHBOARDS']);
    }

    function getViews(){
        return $q(function (resolve, reject) {
            ViewService.getAllViews().then(function(rs) {
                if (rs.success) {
                    vm.views = rs.data;
                    resolve(vm.views);
                } else {
                    reject(rs.message);
                }
            });
        });
    };

    function getNextEmptyPosition(dashboards) {
        let result = 0;
        dashboards.forEach(function (dashboard) {
            if(dashboard.position > result) {
                result = dashboard.position;
            }
        });
        return result + 1;
    };

    function showDashboardSettingsModal(event, dashboard) {
        let position = getNextEmptyPosition(vm.dashboardList);
        $mdDialog.show({
            controller: dashboardSettingsModalController,
            template: dashboardSettingsModalTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose: true,
            fullscreen: true,
            autoWrap: false,
            locals: {
                dashboard: dashboard,
                position : position
            }
        })
            .then(function (rs) {
                if(rs) {
                    $state.go('dashboard.page', {dashboardId: rs.id});
                    DashboardService.dashboards.splice(rs.position, 0, rs);
                    delete rs.action;
                }
            }, function () {
            });
    }

    function loadViews() {
        vm.viewsLoaded = false;
        getViews()
            .then(function() {
                vm.viewsLoaded = true;
            });
    }

    function loadDashboards() {
        vm.dashboardsLoaded = false;
        DashboardService.RetrieveDashboards().then(function (response) {
            vm.dashboardsLoaded = true;
        });
    };

    function showViewDialog(event, view) {
        $mdDialog.show({
            controller: ViewController,
            template: require('./view_modal.html'), //TODO: move to separate component
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose:true,
            fullscreen: true,
            locals: {
                view: view
            }
        });
    };

    function showProjectDialog(event) {
        $mdDialog.show({
            controller: 'ProjectController',
            template: require('../../../components/modals/project/project.html'),
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose:true,
            fullscreen: true
        });
    }

    function showUploadImageDialog($event) {
        $mdDialog.show({
            controller: uploadImageModalController,
            controllerAs: '$ctrl',
            template: uploadImageModalTemplate,
            parent: angular.element(document.body),
            targetEvent: $event,
            clickOutsideToClose: true,
            locals: {
                urlHandler: (url) => {
                    if (url) {
                        $rootScope.companyLogo.value = url;

                        return SettingsService.editSetting($rootScope.companyLogo).then(function (prs) {
                            if (prs.success) {
                                $rootScope.companyLogo.value += '?' + (new Date()).getTime();
                                alertify.success('Company logo was successfully changed');

                                return true;
                            } else {
                                alertify.error(prs.message);

                                return false;
                            }
                        });
                    }

                    return $q.reject(false);
                },
                fileTypes: 'COMMON',
            }
        });
    }

    function onProjectSelect() {
        const cachedSelection = projectsService.getSelectedProjects();

        if (cachedSelection && cachedSelection[0] && cachedSelection[0].id === vm.selectedProject) { return; }
        if ((!cachedSelection || !cachedSelection[0]) && vm.selectedProject === fakeProjectAll.id) { return; }

        if (vm.selectedProject !== fakeProjectAll.id) {
            const selectedProject = vm.projects.find(({id}) => +id === +vm.selectedProject);

            projectsService.setSelectedProjects([selectedProject]);
        } else {
            projectsService.resetSelectedProjects();
        }
        vm.selectedProjectShortName = cutSelectedProjectName();
        $timeout(() => {
            $state.reload();
        });
    }

    function loadProjects() {
        const selectedFromCache = projectsService.getSelectedProjects();

        return ConfigService.getConfig('projects').then(function(rs) {
            if (rs.success) {
                vm.projects = [fakeProjectAll, ...rs.data];

                if (selectedFromCache && selectedFromCache[0]) {
                    vm.projects.forEach(function (project) {
                        if (+project.id === +selectedFromCache[0].id) {
                            vm.selectedProject = project.id;
                        }
                    });
                }
            } else {
                alertify.error('Unable to load projects');
            }
        });
    }

    function cutSelectedProjectName() {
        let name = '';
        const selectedProject = vm.projects.find(({id}) => +id === +vm.selectedProject);

        if (selectedProject) {
            name = selectedProject.name.substr(0, 3);
        }

        return name;
    }

    function chooseProject() {
        $timeout(() => {
            onProjectSelect();
        }, 0);
    }

    function ViewController($scope, $mdDialog, view) {
        'ngInject';

        $scope.view = {};

        if (view) {
            $scope.view.id = view.id;
            $scope.view.name = view.name;
            $scope.view.projectId = view.project.id;
        }

        ConfigService.getConfig('projects')
            .then(function(rs) {
                if (rs.success) {
                    $scope.projects = rs.data;
                }
            });

        $scope.createView = function(view) {
            ViewService.createView(view)
                .then(function(rs) {
                    if (rs.success) {
                        alertify.success("View created successfully");
                    } else {
                        alertify.error(rs.message);
                    }
                });

            $scope.hide();
        };

        $scope.updateView = function(view){
            ViewService.updateView(view)
                .then(function(rs) {
                    if (rs.success) {
                        alertify.success("View updated successfully");
                    } else {
                        alertify.error(rs.message);
                    }
                });
            $scope.hide();
        };

        $scope.deleteView = function(view){
            ViewService.deleteView(view.id)
                .then(function(rs) {
                    if (rs.success) {
                        alertify.success("View deleted successfully");
                    } else {
                        alertify.error(rs.message);
                    }
                });
            $scope.hide();
        };

        $scope.hide = function() {
            $mdDialog.hide();
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };
    }

    return vm;
};

export default AppSidebarController;

