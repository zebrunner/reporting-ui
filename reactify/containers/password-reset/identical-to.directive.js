export const identicalTo = () => {
    return {
        require: 'ngModel',
        restrict: 'A',
        scope: {
            otherModelValue: '<identicalTo',
        },
        link: function(scope, element, attributes, ngModel) {
            ngModel.$validators.identicalTo = modelValue => modelValue === scope.otherModelValue;

            scope.$watch('otherModelValue', () => ngModel.$validate());
        },
    };
};
