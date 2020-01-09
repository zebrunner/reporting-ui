import { TutorialsModalController, TutorialsModalTemplate } from './tutorials-modal';

const classes = {
    item: 'zeb-tutorial',
    content: 'zeb-tutorial-content',
    container: 'zeb-tutorials-container',
};

export function TutorialsProvider() {
    'ngInject'
    let url;

    return {
        setUrl: newUrl => url = newUrl,
        $get($document, $mdCompiler, $rootScope, $animate) {
            'ngInject';

            const $body = $document.find('body');

            return {
                get url() { return url; },
                render,
            };

            function getOrCreateRootElement() {
                let $container = $body.find(`.${classes.container}`);
                if (!$container.length) {
                    $container = angular.element(`<div class="${classes.container}"></div>`);
                    $body.append($container);
                }
                return $container;
            }

            function render(tutorials) {
                const $container = getOrCreateRootElement();
                let $element;
                const options = {
                    scope: $rootScope.$new(true),
                    template: `
                        <div class="${classes.item}">
                            <div class="${classes.content}" ng-click="$ctrl.open()">
                                <span>Tutorials</span>
                                <md-icon ng-click="$ctrl.hide($event)" ng-bind="'close'"></md-icon>
                            </div>
                        </div>
                    `,
                    controller($mdDialog) {
                        'ngInject';
                        return {
                            hide,
                            open,
                        };

                        function open() {
                            $container.addClass('_opened');
                            $mdDialog
                                .show({
                                    controller: TutorialsModalController,
                                    controllerAs: '$ctrl',
                                    template: TutorialsModalTemplate,
                                    clickOutsideToClose: true,
                                    fullscreen: true,
                                    bindToController: true,
                                    locals: {
                                        tutorials,
                                    },
                                })
                                .catch(() => { /* modal was closed by backdrop */ })
                                .finally(() => $container.removeClass('_opened'));
                        }
                    },
                    controllerAs: '$ctrl',
                };
                return $mdCompiler.compile(options).then(compiledData => {
                    $element = compiledData.link(options.scope);
                    $container.append($element);

                    return $animate.addClass($element, 'entered').then(() => ({
                        $container,
                        $element,
                        hide,
                        show,
                        remove,
                        replace,
                    }));
                });

                function replace(tutorials) {
                    return remove().then(() => render(tutorials));
                }

                function remove() {
                    return $animate.removeClass($element, 'entered')
                        .then(() => $container.remove());
                }

                function show() {
                    $container.removeClass('_hide');
                }

                function hide(event) {
                    event.stopPropagation();
                    $container.addClass('_hide');
                }
            }
        },
    };
}
