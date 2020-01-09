import { TutorialsModalController } from './tutorials-modal/tutorials-modal.controller';
import { tutorialsSlider } from './tutorials-slider';
import { YoutubeDirective } from './youtube.directive';

// export const TutorialsModule = (url) => {
const classes = {
    item: 'zeb-tutorial',
    content: 'zeb-tutorial-content',
    container: 'zeb-tutorials-container',
};

export const TutorialsModule = angular.module('tutorials', [
    'ngAnimate',
    'ui.router',
    'ngMaterial',
])

    .component({ tutorialsSlider })
    .directive('youtube', YoutubeDirective)
    .run(($transitions, $state, Tutorials) => {
        'ngInject';
        let routesData = null;
        let tutorialRef = null;
        let lastRouteData = null;

        const findRouteTutorial = stateName => routesData.tutorials.find(({ route }) => stateName === route);
        const getCurrentRouteData = () => {
            let currentState = $state.$current;
            let currentRouteTutorials;

            do {
                currentRouteTutorials = currentState && findRouteTutorial(currentState.name);
                currentState = currentState.parent;
            } while (currentState && currentState.parent && !currentRouteTutorials);

            return currentRouteTutorials;
        }

        const removeTutorialContainer = () => tutorialRef && tutorialRef.then(({ remove }) => {
            tutorialRef = remove().then(() => tutorialRef = null);
        });
        const renderTutorialContainer = tutorials => tutorialRef = Tutorials.render(tutorials);
        const swapTutorialContainer = tutorials => tutorialRef = tutorialRef.then(oldTutorialRef =>
            tutorialRef = oldTutorialRef.replace(tutorials));
        const handleRouteData = () => {
            if (routesData) {
                const currentRouteData = getCurrentRouteData();

                if (!currentRouteData) {
                    removeTutorialContainer();
                } else if (lastRouteData !== currentRouteData) {
                    if (tutorialRef) {
                        swapTutorialContainer(currentRouteData.steps);
                    } else {
                        renderTutorialContainer(currentRouteData.steps);
                    }
                }
                lastRouteData = currentRouteData;
            }
        };

        fetchData()
            .then(data => routesData = data)
            .then(handleRouteData);
        $transitions.onSuccess({}, handleRouteData);
    })
    .provider('Tutorials', () => {
        let url;

        return {
            setUrl: newUrl => url = newUrl,
            $get: ($document, $mdCompiler, $rootScope, $animate) => {
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
                                    <md-icon ng-click="$ctrl.hide()" ng-bind="'close'"></md-icon>
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
                                $mdDialog.show({
                                    controller: TutorialsModalController,
                                    controllerAs: '$ctrl',
                                    template: require('./tutorials-modal/tutorials-modal.component.html'),
                                    clickOutsideToClose: true,
                                    fullscreen: true,
                                    bindToController: true,
                                    locals: {
                                        tutorials,
                                    },
                                });
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

                    function hide() {
                        $container.addClass('_hide');
                    }
                }
            },
        };
    })
    // .service('Tutorials', ($document, $mdCompiler, $rootScope, $animate) => {
    //     'ngInject';
    //     debugger;
    //     console.log($document);

    //     console.log(Tutorials);

    //     return {
    //         render,
    //     };

    //     function render() {
    //         const options = {
    //             scope: $rootScope.$new(true),
    //             template: `
    //                 <div class="${classes.item}">
    //                     <span>Tutorials</span>
    //                     <md-icon ng-bind="'close'"></md-icon>
    //                 </div>
    //             `,
    //             controller($mdDialog) {
    //                 'ngInject';
    //                 return {};
    //             },
    //             controllerAs: '$ctrl',
    //         };
    //         return $mdCompiler.compile(options).then(compiledData => {
    //             const $container = getOrCreateRootElement();
    //             const $element = compiledData.link(options.scope);

    //             $container.append($element);

    //             return $animate.addClass($element, 'entered').then(() => ({
    //                 $container,
    //                 $element,
    //                 hide,
    //                 show,
    //                 remove,
    //             }));

    //             function remove() {
    //                 return $animate.removeClass($element, 'entered')
    //                     .then(() => $container.remove());
    //             }

    //             function show() {
    //             }

    //             function hide() {
    //             }
    //         });
    //     }
    // })

    .name;
// }

function fetchData() {

    return new Promise(res => setTimeout(() => {
        res({
            tutorials: [
                {
                    route: 'dashboard',
                    steps: [
                        {
                            order: 0,
                            title: 'T1',
                            description: 'D1',
                            id: 'gocwRvLhDf8',
                        },
                        {
                            order: 1,
                            title: 'T2',
                            description: 'D2',
                            id: 'TcHIZuSn-9I',
                        },
                        {
                            order: 1,
                            title: 'T2',
                            description: 'D2',
                            id: 'TcHIZuSn-9I',
                        },
                        {
                            order: 1,
                            title: 'T2',
                            description: 'D2',
                            id: 'TcHIZuSn-9I',
                        },
                        {
                            order: 1,
                            title: 'T2',
                            description: 'D2',
                            id: 'TcHIZuSn-9I',
                        },
                    ],
                },
                {
                    route: 'users',
                    steps: [],
                },
            ],
        });
    }, 1000));
}

// tutorials: {
//     name: '',
// }
