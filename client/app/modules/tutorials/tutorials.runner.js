import data from './data';

export function TutorialsRunner($transitions, $state, Tutorials) {
    'ngInject';
    let routesData = null;
    let tutorialRef = null;
    let lastRouteData = null;

    fetchData()
        .then(data => routesData = data)
        .then(handleRouteData);
    $transitions.onSuccess({}, handleRouteData);

    return;

    function removeTutorialContainer() {
        if (tutorialRef) {
            tutorialRef.then(({ remove }) => {
                tutorialRef = remove().then(() => tutorialRef = null);
            });
        }
    }

    function renderTutorialContainer(tutorials) {
        tutorialRef = Tutorials.render(tutorials);
    }

    function swapTutorialContainer(tutorials) {
        tutorialRef = tutorialRef.then(oldTutorialRef =>
        tutorialRef = oldTutorialRef.replace(tutorials));
    }

    function findRouteTutorial(stateName) {
        return routesData.tutorials.find(({ route }) => stateName === route);
    }

    function getCurrentRouteData() {
        let currentState = $state.$current;
        let currentRouteTutorials;

        do {
            currentRouteTutorials = currentState && findRouteTutorial(currentState.name);
            currentState = currentState.parent;
        } while (currentState && currentState.parent && !currentRouteTutorials);

        return currentRouteTutorials;
    }

    function handleRouteData() {
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
    }

    function fetchData() {
        return new Promise(res => setTimeout(() => {
            res(data);
        }, 3000));
    }
}
