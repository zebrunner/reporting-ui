'use strict';

import dashboardSettingsModalController from '../../../shared/modals/dashboard-settings-modal/dashboard-settings-modal.controller';
import dashboardSettingsModalTemplate from '../../../shared/modals/dashboard-settings-modal/dashboard-settings-modal.html';

let i = 0;

const appSidebarController = function AppSidebarController($scope, $rootScope, $cookies, $q, $mdDialog, $state, ViewService, ConfigService,
                              ProjectService, projectsService, UtilService, UserService, DashboardService,
                              AuthService, SettingsService, $timeout) {
    'ngInject';

    $scope.DashboardService = DashboardService;

    $scope.version = null;
    $scope.dashboardList = [];
    $scope.views = [];
    $scope.$state = $state;

    $scope.hasHiddenDashboardPermission = function(){
        return AuthService.UserHasAnyPermission(["VIEW_HIDDEN_DASHBOARDS"]);
    };

    function getViews(){
        return $q(function (resolve, reject) {
            ViewService.getAllViews().then(function(rs) {
                if(rs.success)
                {
                    $scope.views = rs.data;
                    resolve(rs.data);
                }
                else
                {
                    reject(rs.message);
                }
            });
        });
    };

    $scope.loadViews = function () {
        $scope.viewsLoaded = false;
        getViews().then(function (response) {
            $scope.viewsLoaded = true;
        });
    };

    $scope.loadDashboards = function() {
        $scope.dashboardsLoaded = false;
        getDashboards().then(function (response) {
            $scope.dashboardsLoaded = true;
        });
    };

    function getDashboards() {
        return $q(function (resolve, reject) {
            if ($scope.hasHiddenDashboardPermission() == true) {
                DashboardService.GetDashboards().then(function (rs) {
                    if (rs.success) {
                        $scope.dashboardList = rs.data;
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
                        $scope.dashboardList = rs.data;
                        resolve(rs.data);
                    } else {
                        reject(rs.message);
                    }
                });
            }
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
};

export default appSidebarController;
