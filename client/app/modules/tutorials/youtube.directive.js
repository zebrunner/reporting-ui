import YouTubePlayer from 'youtube-player';

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
                player = new YouTubePlayer(element.get(0), {
                    videoId: $scope.videoId
                });
            });

            $scope.$on('slide-changed', () => {
                player && player.pauseVideo();
            });

            $scope.$on('$destroy', function() {
                deRegistrationCallback();
            });
        }
    };
  }
