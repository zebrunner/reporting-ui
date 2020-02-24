'use strict';

const pageTitleService = function pageTitleService() {
    let title = 'Zebrunner';

    function setTitle(newTitle) {
        title = newTitle ? `${newTitle} | Zebrunner` : 'Zebrunner';
    }

    return {
        get title() { return title; },
        get slicedTitle() { return title.slice(0, -12); },
        setTitle,
    };
};

export default pageTitleService;
