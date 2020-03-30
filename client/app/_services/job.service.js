(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('JobService', ['$httpMock', '$rootScope', 'UtilService', 'API_URL', JobService])

    function JobService($httpMock, $rootScope, UtilService, API_URL) {
        var service = {};

        service.createJob = createJob;
        service.getAllJobs = getAllJobs;

        return service;

        function createJob(job, project){
            return $httpMock.post(API_URL + '/api/jobs', {headers:{'Project': project}}, job).then(UtilService.handleSuccess, UtilService.handleError('Failed to create job'));
        }

        function getAllJobs(){
            return $httpMock.get(API_URL + '/api/jobs').then(UtilService.handleSuccess, UtilService.handleError('Failed to get all jobs'));
        }
    }
})();
