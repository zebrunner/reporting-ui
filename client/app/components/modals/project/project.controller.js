(function () {
    'use strict';

    angular.module('app').controller('ProjectController', ProjectController);

    function ProjectController($scope, $mdDialog, ProjectService, UtilService, messageService) {
        'ngInject';

        $scope.project = {};
        $scope.UtilService = UtilService;

        $scope.createProject = function(project){
            ProjectService.createProject(project).then(function(rs) {
                if (rs.success) {
                    messageService.success("Project created successfully");
                    $scope.hide(rs.data);
                } else
                {
                    messageService.error(rs.message);
                }
            });
        };

        $scope.hide = function(rs) {
            $mdDialog.hide(rs);
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };
    }

})();
