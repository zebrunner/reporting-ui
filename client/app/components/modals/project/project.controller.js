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
                } else
                {
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

})();
