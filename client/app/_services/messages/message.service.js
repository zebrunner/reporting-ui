'use strict';

const messageService = function messageService($mdToast) {
    'ngInject';

    return {
        success,
        error,
        warning
    };

    function success(text, options) {
        var toast = $mdToast.simple()
                            .content(text)
                            .theme(options && options.theme ? options.theme : "success")
                            .position(options && options.position ? options.position : 'bottom right');
        $mdToast.show(toast);
    }

    function error(text, options) {
        var toast = $mdToast.simple()
                            .content(text)
                            .theme(options && options.theme ? options.theme : "error")
                            .position(options && options.position ? options.position :'bottom right');
        $mdToast.show(toast);
    }

    function warning(text, options) {
        var toast = $mdToast.simple()
                            .content(text)
                            .theme(options && options.theme ? options.theme : "warning")
                            .position(options && options.position ? options.position :'bottom right');
        $mdToast.show(toast);
    }
};

export default messageService;
