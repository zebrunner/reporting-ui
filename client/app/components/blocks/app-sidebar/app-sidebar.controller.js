'use strict';

import dashboardSettingsModalController from '../../../shared/modals/dashboard-settings-modal/dashboard-settings-modal.controller';
import dashboardSettingsModalTemplate from '../../../shared/modals/dashboard-settings-modal/dashboard-settings-modal.html';

import deleteProjectModalController from '../../../shared/modals/delete-project-modal/delete-project-modal.controller';
import deleteProjectModalTemplate from '../../../shared/modals/delete-project-modal/delete-project-modal.html';

import uploadImageModalController
    from '../../../shared/modals/upload-image-modal/upload-image-modal.controller';
import uploadImageModalTemplate
    from '../../../shared/modals/upload-image-modal/upload-image-modal.html';

import 'jquery-ui/widgets/sortable';
import 'angular-ui-sortable'

const AppSidebarController = function ($scope, $rootScope, $q, $mdDialog, $state, ViewService, ConfigService,
                                       projectsService, UserService, DashboardService, messageService,
                                       AuthService, SettingsService, $timeout, windowWidthService, mainMenuService) {
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
        showDeleteModal,
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
        get menuItems() { return mainMenuService.items; },
    };

    vm.$onInit = initController;

    function showDeleteModal(currentProject) {
        $mdDialog.show({
            controller: deleteProjectModalController,
            template: deleteProjectModalTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            controllerAs: '$ctrl',
            clickOutsideToClose: true,
            fullscreen: true,
            autoWrap: false,
            locals: {
                project: currentProject,
                projects: vm.projects.filter(project => !isEqualIDs(project.id, currentProject.id) && project.id !== 'all'),
            }
        })
        .then(() => {
            vm.projects = vm.projects.filter(({ id }) => !isEqualIDs(currentProject.id, id));
            if (isEqualIDs(vm.selectedProject, currentProject.id)) {
                vm.selectedProject = fakeProjectAll.id;
                onProjectSelect();
            }
        }, () => {})
    }

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
                messageService.error(rs.message);
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

    function loadViews(e) {
        if (vm.viewsLoading || vm.viewsLoaded) { return; }

        $timeout(() => {
            const $el = angular.element(e.target).closest('li');

            //we are closing menu by clicking on link second time
            if ($el.length && !$el.hasClass('open')) { return; }

            vm.viewsLoading = true;
            getViews()
                .then(function() {
                    vm.viewsLoaded = true;
                })
                .finally(() => {
                    vm.viewsLoading = false;
                });
        });
    }

    function loadDashboards() {
        vm.dashboardsLoaded = false;
        DashboardService.RetrieveDashboards()
            .finally(() => vm.dashboardsLoaded = true);
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
        }).then(function (rs) {
            vm.projects.push(rs);
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
                                messageService.success('Company logo was successfully changed');

                                return true;
                            } else {
                                messageService.error(prs.message);

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

        if (cachedSelection && cachedSelection[0] && isEqualIDs(cachedSelection[0].id,+vm.selectedProject)) { return; }

        if (!isEqualIDs(vm.selectedProject, fakeProjectAll.id)) {
            const selectedProject = vm.projects.find(({id}) => isEqualIDs(id, vm.selectedProject));

            projectsService.setSelectedProjects([selectedProject]);
        } else {
            projectsService.resetSelectedProjects();
        }
        vm.selectedProjectShortName = cutSelectedProjectName();
        if ($state.current.name === 'tests.runs' || $state.current.name === 'dashboard.page') {
            $timeout(() => {
                $state.reload();
            });
        }
    }

    function loadProjects() {
        const selectedFromCache = projectsService.getSelectedProjects();

        return ConfigService.getConfig('projects').then(function(rs) {
            if (rs.success) {
                vm.projects = [fakeProjectAll, ...rs.data];

                if (selectedFromCache && selectedFromCache[0]) {
                    const activeProject = vm.projects.find(({ id }) => isEqualIDs(id, selectedFromCache[0].id));

                    if (activeProject) {
                        vm.selectedProject = activeProject.id;
                    } else { //Looks like the project doesn't exist anymore, so we need to clear cached selection.
                        projectsService.resetSelectedProjects();
                    }
                }
            } else {
                messageService.error('Unable to load projects');
            }
        });
    }

    function cutSelectedProjectName() {
        let name = '';
        const selectedProject = vm.projects.find(({id}) => isEqualIDs(id, vm.selectedProject) && id !== 'all');

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
                        messageService.success("View created successfully");
                    } else {
                        messageService.error(rs.message);
                    }
                });

            $scope.hide();
        };

        $scope.updateView = function(view){
            ViewService.updateView(view)
                .then(function(rs) {
                    if (rs.success) {
                        messageService.success("View updated successfully");
                    } else {
                        messageService.error(rs.message);
                    }
                });
            $scope.hide();
        };

        $scope.deleteView = function(view){
            ViewService.deleteView(view.id)
                .then(function(rs) {
                    if (rs.success) {
                        messageService.success("View deleted successfully");
                    } else {
                        messageService.error(rs.message);
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

    //needs this helper because ID can be a string or a number
    function isEqualIDs(a, b) {
        if (!isNaN(a) && !isNaN(b)) {
            return +a === +b;
        }

        return `${a}` === `${b}`;
    }

    return vm;
};

export default AppSidebarController;

