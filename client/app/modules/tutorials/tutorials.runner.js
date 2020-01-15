export function TutorialsRunner($q, $transitions, $state, Tutorials, $http) {
    'ngInject';
    let allTutorials = null;
    let currentRouteTutorials = null;
    let tutorialComponentRef = null;

    fetchData()
        .then(response => response && response.tutorials || [])
        .then(tutorials => tutorials.map(tutorial => ({
            ...tutorial,
            steps: tutorial.steps.sort((a, b) => a.order - b.order)
        })))
        .then(data => allTutorials = data)
        .then(handleRouteData)
        .catch(() => { /* Handle errors. But we don't have external server for logging */ });
    $transitions.onSuccess({}, handleRouteData);

    return;

    function handleRouteData() {
        if (allTutorials) {
            const newRouteTutorials = getRouteTutorials();

            // If there isn't data remove it
            if (!newRouteTutorials || !Array.isArray(newRouteTutorials.steps) || !newRouteTutorials.steps.length) {
                removeTutorialContainer(tutorialComponentRef).then(() => tutorialComponentRef = null);
            } else if (currentRouteTutorials !== newRouteTutorials) {
                // if current route was changed swap/render a new tutorials
                const storageState = getStorageState(newRouteTutorials.route);

                tutorialComponentRef = showNewTutorials(tutorialComponentRef, newRouteTutorials, storageState).then(containerRef => {
                    if (!storageState.opened) {
                        containerRef.open();
                        patchStorageState(newRouteTutorials.route, { opened: true });
                    }
                    if (!storageState.visited) {
                        containerRef.on('visit', () =>
                            patchStorageState(newRouteTutorials.route, { visited: true }));
                        containerRef.on('open', () => containerRef.setVisited());
                    }
                    return containerRef;
                });
            }

            currentRouteTutorials = newRouteTutorials;
        }
    }

    function removeTutorialContainer(containerRef) {
        if (containerRef) {
            containerRef.then(({ remove }) => remove());
        }
        return $q.resolve(null);
    }

    function showNewTutorials(containerRef, routeData, storageState) {
        if (containerRef) {
            return swapTutorialContainer(containerRef, routeData.steps, storageState);
        }
        return renderTutorialContainer(routeData.steps, storageState);
    }

    function renderTutorialContainer(tutorials, params) {
        return Tutorials.render(tutorials, params);
    }

    function swapTutorialContainer(containerRef, tutorials, params) {
        return containerRef.then(oldRef =>
            oldRef.replace(tutorials, params));
    }

    function findRouteTutorial(stateName) {
        return allTutorials.find(({ route }) => stateName === route);
    }

    function getRouteTutorials() {
        let currentState = $state.$current;
        let currentRouteTutorials;

        // Find needed route using current route + parent routes; Return the first rout
        do {
            currentRouteTutorials = currentState && findRouteTutorial(currentState.name);
            currentState = currentState.parent;
        } while (currentState && currentState.parent && !currentRouteTutorials);

        return currentRouteTutorials;
    }

    function getFullStorageState() {
        const key = Tutorials.getStorageKey();
        const stateString = localStorage.getItem(key) || '{}';

        return JSON.parse(stateString);
    }

    function getStorageState(routerState) {
        const state = getFullStorageState();

        return state && state[routerState] || {};
    }

    function patchStorageState(routerState, newStorageState) {
        const key = Tutorials.getStorageKey();
        const state = getFullStorageState();

        localStorage.setItem(key, JSON.stringify({
            ...state,
            [routerState]: {
                ...(state[routerState] || {}),
                ...newStorageState,
            },
        }));
    }

    function fetchData() {
        return $http.get(Tutorials.url)
            .then(response => response.data);
    }
}
