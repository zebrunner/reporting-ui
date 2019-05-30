'use strict';

import template from './status-buttons.html';

const statusButtonsDirective = function($timeout) {
    return {
        restrict: 'AE',
        scope: {
            onButtonClick: '&onButtonClick',
            multi: '=',
            options: '='
        },
        template: template,
        replace: true,
        link: (scope, iElement, iAttrs, ngModel) => {
            let previousChecked = {};

            angular.extend(scope.options, {
                reset: () => {
                    angular.element('.test-run-group_group-items_item').removeClass('item-checked');
                    previousChecked = {};
                    scope.options.initValues = [];
                    scope.onButtonClick({'$statuses': []});
                }
            });

            scope.changeStatus = (event) => {
                let elementStatus = angular.element(event.target);
                let value = elementStatus[0].attributes['name'].value;
                let removed = null;
                let values = null;

                if (previousChecked && (!iAttrs.multi || !iAttrs.multi == 'true')) {
                    angular.forEach(previousChecked, (previousElement) => {
                        previousElement.removeClass('item-checked');
                    });
                    previousChecked = {};
                }
                if (previousChecked && iAttrs.multi == 'true' && elementStatus.hasClass('item-checked')) {
                    elementStatus.removeClass('item-checked');
                    previousChecked[value] = null;
                    removed = true;
                }
                if (!removed) {
                    elementStatus.addClass('item-checked');
                    previousChecked[value] = elementStatus;
                }
                values = collectValues(previousChecked);
                scope.onButtonClick({'$statuses': values});
            };

            function collectValues(elements, currentValue) {
                let result = scope.options.initValues.length ? scope.options.initValues : [];

                angular.forEach(elements, (element, key) => {
                    if (element && result.indexOf(element[0].attributes['name'].value) === -1 ) {
                        result.push(element[0].attributes['name'].value);
                    } else if (!element) {
                        let index = result.indexOf(key);
                        if (index !== -1) {
                            result.splice(index, 1);
                        }
                    }
                });

                return result;
            };

            scope.$watch('options.initValues', (newVal, oldVal) => {
                if (newVal) {
                    if (scope.options && scope.options.initValues) {
                        scope.options.initValues.forEach((value) => {
                            let chipTemplates = angular.element('*[name = ' + value + ']');
                            chipTemplates.addClass('item-checked');
                        });
                        $timeout(() => {
                            scope.onButtonClick({'$statuses': scope.options.initValues});
                        }, 0, false);
                    }
                }
            });
        }
    };
}

    export default statusButtonsDirective;
