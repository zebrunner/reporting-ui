(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('ProjectService', ['$httpMock', '$rootScope', 'UtilService', 'API_URL', ProjectService])

    function ProjectService($httpMock, $rootScope, UtilService, API_URL) {
        const service = {
            createProject,
            deleteProject,
            updateProject,
            getAllProjects,
        };

        return service;

        function createProject(project) {
            return $httpMock.post(API_URL + '/api/projects', project).then(UtilService.handleSuccess, UtilService.handleError('Unable to create project'));
        }

        function deleteProject(id, reassignTo) {
            return $httpMock.delete(API_URL + '/api/projects/' + id + (reassignTo ? '?reassignTo=' + reassignTo : '')).then(UtilService.handleSuccess, UtilService.handleError('Unable to delete project'));
        }

        function updateProject(project) {
            return $httpMock.put(API_URL + '/api/projects', project).then(UtilService.handleSuccess, UtilService.handleError('Unable to update project'));
        }
        function getAllProjects() {
            return $httpMock.get(API_URL + '/api/projects').then(UtilService.handleSuccess, UtilService.handleError('Unable to get projects list'));
        }
    }
})();
