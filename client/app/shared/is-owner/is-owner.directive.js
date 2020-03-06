'use strict';

const isOwnerDirective = function (
    authService,
) {
    'ngInject';

    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            elem.hide();

            scope.$watch(() => authService.isLoggedIn, function() {
                const verifiedUser = attrs.user && attrs.user.length ? JSON.parse(attrs.user) : {};

                if (verifiedUser && verifiedUser.id === attrs.isOwner) {
                    elem.show();
                } else {
                    elem.hide();
                }
            });
        }
    };
};

export default isOwnerDirective;
