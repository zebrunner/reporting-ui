'use strict';

const pageTitleService = function pageTitleService() {
    let title = 'Zebrunner';
    let pageTitle = '';

    function setTitle(newTitle) {
        pageTitle = newTitle;
        title = newTitle ? `${newTitle} | Zebrunner` : 'Zebrunner';
    }

    return {
        get title() { return title; },
        get pageTitle() { return pageTitle; },
        setTitle,
    };
};

export default pageTitleService;
