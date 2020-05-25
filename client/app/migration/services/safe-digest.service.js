export function SafeDigestService() {
    return {
        rxjs: ($scope) => () => run($scope),
        run,
    };

    function run($scope) {
        const phase = $scope.$root.$$phase;
        if (phase !== '$apply' && phase !== '$digest') {
            $scope.$digest();
        }
    }
}
