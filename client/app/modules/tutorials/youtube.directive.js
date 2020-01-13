import YTPlayer from 'yt-player';

export function youtubeDirective() {
    'ngInject';
    return {
        restrict: 'E',
        scope: {
            videoId: '<',
        },
        template: '<div></div>',
        link: ($scope, element) => {
            let player;
            const deRegistrationCallback = $scope.$watch('videoId', () => {
                if (!$scope.videoId) {
                    return;
                }
                player = new YTPlayer(element.get(0));
                player.load($scope.videoId, false);
            });

            $scope.$on('slide-changed', () => {
                player && player.getState() !== 'paused' && player.pause();
            });

            $scope.$on('$destroy', function() {
                deRegistrationCallback();
            });
        }
    };
  }
