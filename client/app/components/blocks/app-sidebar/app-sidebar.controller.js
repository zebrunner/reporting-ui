'use strict';

import dashboardSettingsModalController from '../../../shared/modals/dashboard-settings-modal/dashboard-settings-modal.controller';
import dashboardSettingsModalTemplate from '../../../shared/modals/dashboard-settings-modal/dashboard-settings-modal.html';

import uploadImageModalController
    from '../../../shared/modals/upload-image-modal/upload-image-modal.controller';
import uploadImageModalTemplate
    from '../../../shared/modals/upload-image-modal/upload-image-modal.html';

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
        dashboardList: [],
        views: [],
        projects: [],
        $state: $state,
        selectedProject: fakeProjectAll.id,
        hasHiddenDashboardPermission,
        loadViews: loadViews,
        loadDashboards: loadDashboards,
        showViewDialog: showViewDialog,
        showProjectDialog: showProjectDialog,
        showUploadImageDialog: showUploadImageDialog,
        chooseProject: chooseProject,
        selectedProjectShortName: '',

        get companyLogo() { return $rootScope.companyLogo; },
        get currentUser() { return UserService.currentUser; },
        get isMobile() { return windowWidthService.isMobile(); },
    };

    vm.$onInit = initController;

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
                if(rs.success)
                {
                    vm.views = rs.data;
                    resolve(rs.data);
                }
                else
                {
                    reject(rs.message);
                }
            });
        });
    };


    $scope.showViewDialog = function(event, view) {
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
        })
            .then(function(answer) {
            }, function() {
            });
    };

    $scope.showDashboardSettingsModal = function (event, dashboard, isNew) {
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
                isNew: isNew
            }
        })
            .then(function (rs) {
                if(rs) {
                    switch(rs.action) {
                        case 'CREATE':
                            $state.go('dashboard.page', {dashboardId: rs.id});
                            $scope.dashboardList.splice(rs.position, 0, rs);
                            break;
                        case 'UPDATE':
                            rs.widgets = $scope.dashboard.widgets;
                            $scope.dashboard = angular.copy(rs);
                            $scope.dashboardList.splice(rs.position, 1, rs);
                            break;
                        default:
                            break;
                    }
                    delete rs.action;
                }
            }, function () {
            });
    };

    function loadViews() {
        vm.viewsLoaded = false;
        getViews().then(function (response) {
            vm.viewsLoaded = true;
        });
    };

    function loadDashboards() {
        vm.dashboardsLoaded = false;
        getDashboards().then(function (response) {
            vm.dashboardsLoaded = true;
        });
    };

    function getDashboards() {
        return $q(function (resolve, reject) {
            if (vm.hasHiddenDashboardPermission()) {
                DashboardService.GetDashboards().then(function (rs) {
                    if (rs.success) {
                        vm.dashboardList = rs.data;
                        resolve(rs.data);
                    } else {
                        reject(rs.message);
                    }
                });
            }
            else {
                var hidden = true;
                DashboardService.GetDashboards(hidden).then(function (rs) {
                    if (rs.success) {
                        vm.dashboardList = rs.data;
                        resolve(rs.data);
                    } else {
                        reject(rs.message);
                    }
                });
            }
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
        $scope.hide();
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
        if(view)
        {
            $scope.view.id = view.id;
            $scope.view.name = view.name;
            $scope.view.projectId = view.project.id;
        }

        ConfigService.getConfig("projects").then(function(rs) {
            if(rs.success)
            {
                $scope.projects = rs.data;
            }
            else
            {
            }
        });

        $scope.createView = function(view){
            ViewService.createView(view).then(function(rs) {
                if(rs.success)
                {
                    alertify.success("View created successfully");
                }
                else
                {
                    alertify.error(rs.message);
                }
            });
            $scope.hide();
        };

        $scope.updateView = function(view){
            ViewService.updateView(view).then(function(rs) {
                if(rs.success)
                {
                    alertify.success("View updated successfully");
                }
                else
                {
                    alertify.error(rs.message);
                }
            });
            $scope.hide();
        };

        $scope.deleteView = function(view){
            ViewService.deleteView(view.id).then(function(rs) {
                if(rs.success)
                {
                    alertify.success("View deleted successfully");
                }
                else
                {
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
        (function initController() {
        })();
    }

    return vm;
};

export default AppSidebarController;

