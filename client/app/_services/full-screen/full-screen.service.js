'use strict';

const fullScreenService = function fullScreenService(
    $q,
) {
    'ngInject';

    return {
        exitFullscreen,
        isFullscreenActive,
        isFullscreenEnabled,
        requestFullscreen,
    };

    function requestFullscreen(element) {
        const requestFullscreen = element.requestFullscreen
            || element.mozRequestFullScreen
            || element.webkitRequestFullscreen
            || element.msRequestFullscreen;

        if (requestFullscreen) {
            return requestFullscreen.call(element);
        }

        return $q.reject();
    }

    function exitFullscreen() {
        const exitFullscreen = document.exitFullscreen
            || document.webkitCancelFullScreen
            || document.webkitExitFullscreen
            || document.mozCancelFullScreen
            || document.msExitFullscreen;

        if (exitFullscreen) {
            exitFullscreen.call(document);
        }

        return $q.reject();
    }

    function isFullscreenEnabled() {
        return document.fullscreenEnabled
            || document.webkitFullscreenEnabled
            || document.webkitCancelFullScreen
            || document.mozFullScreenEnabled
            || document.msFullscreenEnabled;
    }

    function isFullscreenActive() {
        return document.fullscreenElement
            || document.webkitFullscreenElement
            || document.webkitCurrentFullScreenElement
            || document.mozFullScreenElement
            || document.msFullscreenElement;
    }
};

export default fullScreenService;
