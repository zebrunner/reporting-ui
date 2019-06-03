'use strict';

import template from './chips-array.html';

const chipsArrayDirective = function($timeout) {
    'ngInject';

    return {
        restrict: 'E',
        scope: {
            onSelect: '&',
            multi: '=',
            chips: '=',
            countToShow: '=',
            options: '='
        },
        template: template,
        replace: true,
        link: (scope, iElement, iAttrs, ngModel) => {
            scope.showingChips = [];
            let selectedTags = {};

            angular.extend(scope.options, {
                reset: (onSwitch) => {
                    selectedTags = {};
                    angular.element('md-chip').removeClass('md-focused');
                    if (!onSwitch) {
                        angular.element('md-chip:has(.chip-item-template.item-default)').addClass('md-focused');
                        scope.chips.forEach((chip) => {
                            if (chip.default) {
                                selectedTags[chip.name + chip.value] = chip.value;
                            }
                        });
                    }
                    scope.options.initValues = [];
                    scope.onSelect({'$tags': selectedTags});
                }
            });

            scope.selectGroup = (event, currentChip, index) => {
                const chip = angular.element(event.target.closest('md-chip'));

                if (!scope.multi) {
                    scope.options.reset(true);
                }
                if (chip.hasClass('md-focused')) {
                    chip.removeClass('md-focused');
                    selectedTags[currentChip.name + currentChip.value] = null;
                } else {
                    chip.addClass('md-focused');
                    selectedTags[currentChip.name + currentChip.value] = currentChip.value;
                }
                scope.onSelect({'$tags': collectSelectedTags(currentChip.value)});
            };

            function collectSelectedTags(currentChip) {
                let result = scope.options.initValues.length ? scope.options.initValues : [];

                angular.forEach(selectedTags, (value) => {
                    if (value && result.indexOf(value) === -1 ) {
                        result.push(value);
                    } else if (!value) {
                        let index = result.indexOf(currentChip);
                        if (index !== -1) {
                            result.splice(index, 1);
                        }
                    }
                });

                return result;
            };

            function collectTagsToShow() {
                return scope.chips.filter((chip) => {
                    return chip.checked;
                });
            };

            scope.resetCheckedTags = () => {
                scope.chips.forEach((chip) => {
                    chip.checked = false;
                });
            };

            scope.addCheckedTags = () => {
                scope.showingChips = collectTagsToShow();
            };

            scope.$watch('chips', (newVal) => {
                if (newVal) {
                    if (scope.countToShow > 0 && scope.chips) {
                        scope.chips.forEach((chip, index) => {
                            if (scope.countToShow > index) {
                                chip.checked = true;
                            }
                        });
                        scope.addCheckedTags();
                    }
                }
            });

            scope.$watch('options.initValues', (newVal, oldVal) => {
                if (newVal && newVal.length) {
                    $timeout(() => {
                        if (scope.options && scope.options.initValues) {
                            scope.options.initValues.forEach((value) => {
                                let chipTemplates = angular.element('*[name = ' + '"' + value.replace(/ /g,"") + '"' + ']');

                                angular.forEach(chipTemplates, (element) => {
                                    angular.element(element.closest('md-chip')).addClass('md-focused');
                                });
                            });
                            scope.onSelect({'$tags': scope.options.initValues});
                        }
                    }, 0, false);
                }
            });
        }
    };
};

export default chipsArrayDirective;
