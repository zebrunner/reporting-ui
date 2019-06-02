'use strict';

const messageService = function messageService($mdToast) {
    'ngInject';

    const mainCSSClass = 'message-toast';
    const defOptions = {
        position: 'bottom right',
    };

    return {
        success,
        error,
        warning
    };

    function success(text, options) {
        showToast(text, options, '_success');
    }

    function error(text, options) {
        showToast(text, options, '_error');
    }

    function warning(text, options) {
        showToast(text, options, '_warning');
    }

    function showToast(text, options = {}, localCSSClass = '') {
        const toast = $mdToast.simple().content(text);

        toast._options = {...toast._options, ...defOptions, ...options};
        toast._options.toastClass = [toast._options.toastClass, mainCSSClass, localCSSClass].join(' ');

        $mdToast.show(toast);
    }
};

export default messageService;
