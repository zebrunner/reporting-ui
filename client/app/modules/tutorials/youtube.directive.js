export function YoutubeDirective() {
    'ngInject';
    return {
        restrict: 'E',
        scope: {
            height: '@',
            width: '@',
            videoId: '<',
            autoplay: '<',
            mute: '<',
            showinfo: '@',
        },
        template: '<iframe frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
        link: ($scope, element) => {
            const deRegistrationCallback = $scope.$watch('videoId', () => {
                if (!$scope.videoId) {
                    return;
                }
                const $element = angular.element(element).find('iframe');
                const url = 'https://www.youtube.com/embed/' + $scope.videoId + `?rel=0&autoplay=${$scope.autoplay || 0}&mute=${$scope.mute || 0}&showinfo=${$scope.showinfo || 0}`;
                $element.attr('src', url);
                $element.attr('width', $scope.width);
                $element.attr('height', $scope.height);
            });

            $scope.$on('$destroy', function() {
                deRegistrationCallback();
            });
        }
    };
  }
