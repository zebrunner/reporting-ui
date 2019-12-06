(function () {
    'use strict';

    angular
        .module('app.services')
        .factory({ SafariFixesService });

    function SafariFixesService() {
        const ua = window.navigator.userAgent;
        const isIpad = ua.indexOf('(iPad') > -1;
        const isIphone = ua.indexOf('(iPhone') > -1 || ua.indexOf('(iPod') > -1;
        const isChrome = ua.indexOf('Chrome/') > -1 || ua.indexOf('CriOS/') > -1;
        const isSafari = !isChrome && ua.indexOf('Safari/') > -1;

        const service =  {
            get isIosSafari() { return (isIpad || isIphone) && isSafari; },
            registerForcedReloading,
        };

        //fixes Safari issue (see comment https://github.com/qaprosoft/zafira/issues/1908)
        function registerForcedReloading() {
            if (!service.isIosSafari) { return; }

            window.addEventListener('popstate', function () { window.location.reload(); });
        }

        return service;
    }
})();
