const certificationController = function certificationController($scope, $rootScope, $cookies, $location, $state, $http, $mdConstant, $stateParams, CertificationService, messageService) {
    'ngInject';

    $scope.certificationDetails = null;

    (function init() {
        CertificationService.loadCertificationDetails($location.search().upstreamJobId, $location.search().upstreamJobBuildNumber)
        .then(function (rs) {
            if(rs.success)
            {
                $scope.certificationDetails = rs.data;
            }
            else
            {
                messageService.error(rs.message);
            }
        });
    })();
};

export default certificationController;
