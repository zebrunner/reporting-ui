'use strict';

import template from './status-buttons.html';

const statusButtonsDirective = function($timeout) {
    'ngInject';

    return {
        restrict: 'AE',
        scope: {
            onButtonClick: '&',
            initialSelections: '<',
        },
        template: template,
        replace: true,
        controllerAs: '$ctrl',
        bindToController: true,
        controller: ($scope) => {
            'ngInject';

            let initialSelectionsWatcher;
            const vm = {
                buttons: [
                    {
                        key: 'FAILED',
                        class: 'failed',
                        txt: 'Failed',
                    },
                    {
                        key: 'SKIPPED',
                        class: 'skipped',
                        txt: 'Skipped',
                    },
                    {
                        key: 'PASSED',
                        class: 'passed',
                        txt: 'Passed',
                    },
                    {
                        key: 'ABORTED',
                        class: 'aborted',
                        txt: 'Aborted',
                    },
                    //at the moment we don't display queued tests, so we don't need in this button
                    // {
                    //     key: 'QUEUED',
                    //     class: 'queued',
                    //     txt: 'Queued',
                    // },
                    {
                        key: 'IN_PROGRESS',
                        class: 'in-progress',
                        txt: 'In Progress',
                    }
                ],

                getFormattedName,
                changeSelection,
                $onInit() {
                    initSelections();
                    bindListeners();
                },
                $onDestroy() {
                    unbindListeners();
                },
            };

            function getFormattedName(button) {
                return button.key.replace('_', ' ').toLowerCase();
            }

            function changeSelection(button) {
                button.isSelected = !button.isSelected;

                onSelectionChange();
            }

            function onSelectionChange() {
                const newSelections = vm.buttons.filter(button => button.isSelected).map(button => button.key);

                vm.onButtonClick({'$statuses': newSelections});
            }

            function initSelections() {
                if (vm.initialSelections && vm.initialSelections.length) {
                    updateSelections();
                }
            }

            function updateSelections() {
                vm.buttons.forEach(button => {
                    button.isSelected = (vm.initialSelections.indexOf(button.key) > -1);
                });
            }

            function bindListeners() {
                initialSelectionsWatcher = $scope.$watch('$ctrl.initialSelections', function(newValue, oldValue) {
                    updateSelections();
                }, true);
            }

            function unbindListeners() {
                initialSelectionsWatcher && initialSelectionsWatcher();
            }

            return vm;
        },
    };
};

    export default statusButtonsDirective;
