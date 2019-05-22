const dashboardSettingsModalController = function dashboardSettingsModalController($scope, $mdDialog, $location, UtilService, DashboardService, dashboard, position, messageService) {
    'ngInject';

    $scope.isNew = ! dashboard.id;
    $scope.dashboard = angular.copy(dashboard);
    $scope.newAttribute = {};

    if($scope.isNew)
    {
        $scope.dashboard.hidden = false;
    }

    $scope.createDashboard = function(dashboard){
        dashboard.position = position;
        DashboardService.CreateDashboard(dashboard).then(function (rs) {
            if (rs.success) {
                messageService.success("Dashboard created");
                $scope.hide(rs.data, 'CREATE');
            }
            else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.updateDashboard = function(dashboard){
        dashboard.widgets = null;
        DashboardService.UpdateDashboard(dashboard).then(function (rs) {
            if (rs.success) {
                messageService.success("Dashboard updated");
                $scope.hide(rs.data, 'UPDATE');
            }
            else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.deleteDashboard = function(dashboard){
        var confirmedDelete = confirm('Would you like to delete dashboard "' + dashboard.title + '"?');
        if (confirmedDelete) {
            DashboardService.DeleteDashboard(dashboard.id).then(function (rs) {
                if (rs.success) {
                    messageService.success("Dashboard deleted");
                    var mainDashboard = $location.$$absUrl.substring(0, $location.$$absUrl.lastIndexOf('/'));
                    window.open(mainDashboard, '_self');
                }
                else {
                    messageService.error(rs.message);
                }
            });
        }
        $scope.hide();
    };

     // Dashboard attributes
    $scope.createAttribute = function(attribute, form){
        DashboardService.CreateDashboardAttribute(dashboard.id, attribute).then(function (rs) {
            if (rs.success) {
                $scope.dashboard.attributes = rs.data;
                $scope.newAttribute = {};
                UtilService.untouchForm(form);
                messageService.success('Dashboard attribute created');
            }
            else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.checkDuplicateAttributeKey = function(key, form) {
        let duplicateAttribute = $scope.dashboard.attributes.find(function (attr) {
            return attr.key === key;
        });
        form.$setValidity('duplicateKey', ! duplicateAttribute);
    };

    $scope.checkDuplicateDashboardTitle = function(title, form) {
        const dashboards = DashboardService.dashboards.length ? DashboardService.dashboards : DashboardService.RetrieveDashboards(true);
        let duplicateAttribute = dashboards.find(function (d) {
            return d.title === title;
        });
        form.$setValidity('duplicateKey', ! duplicateAttribute);
    };

    $scope.updateAttribute = function(attribute){
        DashboardService.UpdateDashboardAttribute(dashboard.id, attribute).then(function (rs) {
            if (rs.success) {
                $scope.dashboard.attributes = rs.data;
                messageService.success('Dashboard attribute updated');
            }
            else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.deleteAttribute = function(attribute){
        DashboardService.DeleteDashboardAttribute(dashboard.id, attribute.id).then(function (rs) {
            if (rs.success) {
                $scope.dashboard.attributes = rs.data;
                messageService.success('Dashboard attribute removed');
            }
            else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.hide = function (result, action) {
        if(result) {
            result.action = action;
        }
        $mdDialog.hide(result);
    };
    $scope.cancel = function () {
        $mdDialog.cancel();
    };
    (function initController(dashboard) {
    })();
};

export default dashboardSettingsModalController;
