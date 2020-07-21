(function () {
    'use strict';

    angular.module('app.page')
        .directive('customPage', customPage);


    // add class for specific pages to achieve fullscreen, custom background etc.
    function customPage() {
        var directive = {
            restrict: 'A',
            controller: customPageCtrl
        };

        return directive;

        function customPageCtrl($scope, $element, $location, $transitions, REJECT_TYPES) {
            'ngInject';

            function handleTransition(toState, fromState) {
                $element.removeClass('on-canvas');
                if (toState.name !== fromState.name) {
                    if (fromState.data?.classes) {
                        $element.removeClass(fromState.data.classes);
                    }
                    if (toState.data?.classes) {
                        $element.addClass(toState.data.classes);
                    }
                }
            }

            $transitions.onSuccess({}, function(e) {
                handleTransition(e.to(), e.from());
            });
            $transitions.onError({}, function(e) {
                const error = e.error();

                if (error.type !== REJECT_TYPES.SUPERSEDED) {
                    handleTransition(e.from(), e.to());
                }
            });
        }
    }
})();


