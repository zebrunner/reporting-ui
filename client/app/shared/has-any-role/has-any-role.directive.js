'use strict';

const hasAnyRoleDirective = function (
    authService,
) {
    'ngInject';

    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            elem.hide();

            scope.$watch(() => authService.isLoggedIn, function(newVal) {
                if (newVal && authService.userHasAnyRole(attrs.hasAnyRole.split(/,\s*/))) {
                    elem.show();
                } else {
                    elem.hide();
                }
            });
        }
    };
};

export default hasAnyRoleDirective;
