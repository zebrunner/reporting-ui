'use strict';

const mainMenuService = function mainMenuService() {
    'ngInject';

    let menuItems = [];

    function addMenuItem(data) {
        menuItems.push(data);
    }

    function removeMenuItem(menuItem) {
        menuItems = menuItems.filter(({ name }) => name === menuItem.name);
    }

    return {
        addMenuItem,
        removeMenuItem,

        get items() { return menuItems; }
    };
};

export default mainMenuService;
