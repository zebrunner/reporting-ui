'use strict';

const pageTitleService = function pageTitleService() {
    let title = 'Zebrunner';

    function setTitle(newTitle) {
        title = newTitle ? `${newTitle} | Zebrunner` : 'Zebrunner';
    }

    return {
        get title() { return title; },
        setTitle,
    };
};

export default pageTitleService;
