(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('ProjectService', ['$httpMock', '$rootScope', 'UtilService', ProjectService])

    function ProjectService($httpMock, $rootScope, UtilService) {
        return {
            createProject,
            deleteProject,
            updateProject,
            getAllProjects,
        };

        function createProject(project) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/projects`, project)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to create project'));
        }

        function deleteProject(id, reassignTo) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/projects/${id}${reassignTo ? '?reassignTo=' + reassignTo : ''}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete project'));
        }

        function updateProject(project) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/projects`, project)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update project'));
        }

        function getAllProjects() {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/projects`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get projects list'));
        }
    }
})();
