'use strict';

const vncPlayerDirective = function vncPlayer(
    $document,
    $timeout,
    ArtifactService,
) {
    'ngInject';

    return {
        restrict: 'A',
        scope: {
            driver: '<vncPlayer',
            isActive: '<',
        },
        link: ($scope, $element) => {
            const container = $element[0];
            let playerElem;
            let resizeHandlerTick = false;
            let rfb;
            let canvas;

            $scope.$watch('isActive', (newValue, oldValue) => {
                if (newValue) {
                    $timeout(() => {
                        if ($scope.driver?.link) {
                            rfb = ArtifactService.connectVnc(container, $scope.driver.link);

                            if (rfb) {
                                $scope.driver.isLoading = true;
                                bindListeners();
                            }
                        }
                    }, 0);

                } else if (oldValue) {
                    closeRfbConnection();
                }
            });

            $scope.$on('$destroy', function() {
                closeRfbConnection();
            });

            function closeRfbConnection() {
                if (rfb && rfb['_rfb_connection_state'] === 'connected') {
                    rfb.disconnect();
                }
                window.removeEventListener('resize', resizeEventHandler);
                document.removeEventListener('mozfullscreenchange webkitfullscreenchange fullscreenchange', fullscreenModeChangeHandler);
            }

            function bindListeners() {
                rfb.addEventListener('connect',  onConnect);
                rfb.addEventListener('disconnect',  onDisconnect);
            }

            function onConnect() {
                canvas = container.querySelector('canvas');
                playerElem = container.querySelector('.vnc-player');

                autoScale();
                window.addEventListener('resize', resizeEventHandler);
                document.addEventListener('mozfullscreenchange webkitfullscreenchange fullscreenchange', fullscreenModeChangeHandler);
                $scope.driver.isLoading = false;
            }

            function onDisconnect() {
                // TODO: exit full screen
                window.removeEventListener('resize', resizeEventHandler);
                document.removeEventListener('mozfullscreenchange webkitfullscreenchange fullscreenchange', fullscreenModeChangeHandler);
                $scope.driver.isLoading = false;
            }

            function autoScale() {
                if (canvas) {
                    $timeout(() => {
                        const ratio = canvas.width / canvas.height;
                        const size = getSize(ratio, playerElem);

                        rfb._display.autoscale(size.width, size.height, false);
                    });
                }
            }

            function getSize(ratio) {
                let height;
                let width;

                if (ratio > 1) {
                    width = playerElem.offsetWidth;
                    height = width / ratio;
                } else {
                    height = playerElem.offsetHeight;
                    width = height * ratio;
                }

                return { height, width };
            }

            function resizeEventHandler() {
                if (!resizeHandlerTick) {
                    resizeHandlerTick = true;
                    window.requestAnimationFrame(() => {
                        autoScale();
                        resizeHandlerTick = false;
                    });
                }
            }

            function fullscreenModeChangeHandler() {
                window.requestAnimationFrame(() => {
                    autoScale();
                });
            }
        },
    };
};

export default vncPlayerDirective;

