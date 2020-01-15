import { TutorialsModalController, TutorialsModalTemplate } from './tutorials-modal';

const classes = {
    item: 'zeb-tutorial',
    content: 'zeb-tutorial-content',
    container: 'zeb-tutorials-container',

    visited: '_visited',
    entered: '_entered',
};

const storageKey = 'tutorials';

export function TutorialsProvider() {
    'ngInject'
    let url;
    let prefix = 'zeb-';

    return {
        // Set a link to a json that will be loaded when the project is opened
        setUrl: newUrl => url = newUrl,
        setStoragePrefix: (newPrefix = 'zeb-') => prefix = newPrefix,
        $get($document, $mdCompiler, $rootScope, $animate, $mdDialog) {
            'ngInject';

            const $body = $document.find('body');

            return {
                get url() { return url; },
                render,
                getStorageKey: () => `${prefix}${storageKey}`,
            };

            function getOrCreateRootElement({visited = false} = {}) {
                let $container = $body.find(`.${classes.container}`);
                if (!$container.length) {
                    $container = angular.element(`<div class="${classes.container} ${visited ? classes.visited : ''}"></div>`);
                    $body.append($container);
                }
                return $container;
            }

            function render(tutorials, params) {
                const $container = getOrCreateRootElement(params);
                let $element;
                const callbacks = {};
                const options = {
                    scope: $rootScope.$new(true),
                    template: `
                        <div class="${classes.item}">
                            <div class="${classes.content}" ng-click="$ctrl.open()">
                                <span>Tutorials</span>
                                <md-icon ng-click="$ctrl.setVisited($event)" ng-bind="'close'"></md-icon>
                            </div>
                        </div>
                    `,
                    controller() {
                        'ngInject';
                        return {
                            setVisited,
                            open,
                        };
                    },
                    controllerAs: '$ctrl',
                };

                return $mdCompiler.compile(options).then(compiledData => {
                    $element = compiledData.link(options.scope);
                    $container.append($element);

                    return $animate.addClass($element, classes.entered).then(() => ({
                        $container,
                        $element,

                        setVisited,

                        open,
                        remove,
                        replace,

                        on,
                    }));
                });

                function on(name, callback) {
                    callbacks[name] = callbacks[name] || [];
                    callbacks[name].push(callback);
                    return () => callbacks[name] = callbacks[name].filter(item => item !== callback);
                }

                function emit(name, data) {
                    const currentEventCallbacks = callbacks[name] || [];

                    currentEventCallbacks.forEach(cb => typeof cb === 'function' && cb(data));
                }

                function open() {
                    emit('open');
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
                        .catch(() => { /* modal was cancelled */ })
                        .finally(() => {
                            $container.removeClass('_opened');
                            emit('close');
                        });
                }

                function replace(tutorials, params) {
                    return remove().then(() => render(tutorials, params));
                }

                function remove() {
                    emit('destroy');
                    Object.keys(callbacks).forEach(key => {
                        if (Array.isArray(callbacks[key])) {
                            callbacks[key] = null;
                        }
                    });
                    return $animate.removeClass($element, classes.entered)
                        .then(() => $container.remove());
                }

                function setVisited(event) {
                    event && event.stopPropagation();
                    $container.addClass(classes.visited);
                    emit('visit');
                }
            }
        },
    };
}
