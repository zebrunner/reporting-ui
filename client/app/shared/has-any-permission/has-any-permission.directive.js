'use strict';

const hasAnyPermissionDirective = function (
    authService,
) {
    'ngInject';

    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            elem.hide();

            scope.$watch(() => authService.isLoggedIn, function(newVal) {
                if (newVal && authService.userHasAnyPermission(attrs.hasAnyPermission.split(/,\s*/))) {
                    elem.show();
                } else {
                    elem.hide();
                }
            });
        }
    };
};

export default hasAnyPermissionDirective;
