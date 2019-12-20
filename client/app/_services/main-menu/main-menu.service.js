'use strict';

const mainMenuService = function mainMenuService() {
    'ngInject';

    let menuItems = [];
    const defaultMenu = {
        profile: [],
    };

    function addMenuItem(data) {
        menuItems.push(data);
    }

    function removeMenuItem(menuItem) {
        menuItems = menuItems.filter(({ name }) => name !== menuItem.name);
    }

    function getSubItemsDefaultMenu(name) {
        return defaultMenu[name];
    }

    /**
     * Add subitem to default menus. It handles in different way for each menu
     * @param {string} name of default menu
     * @param {object} item - config of the item
     * @param {string} item.name - name of subitem (something like slug)
     * @param {string} item.title - displayed value
     * @param {string} item.linkType - 'internal' | 'external'. Internal link is a sref, angular link. External link is a link to other page
     * @param {string} item.link - link to the page
     * @param {string} item.className - additional class name for customize a menu
     * @param {string} item.matIcon - additional class name for customize a menu
     * @param {string[]} item.permissions - permissions for `has-any-permission` directive
     */
    function addSubItemDefaultMenu(name, item) {
        defaultMenu[name] = defaultMenu[name] || [];
        defaultMenu[name].push(item);
    }

    function updateSubItemDefaultMenu(name, subName, updatedItem) {
        defaultMenu[name] = defaultMenu[name] || [];
        defaultMenu[name] = defaultMenu[name].map(item => item.name === subName
            ? ({...item, ...updatedItem, name: item.name})
            : item);
    }

    function removeSubItemDefaultMenu(name, subName) {
        if (defaultMenu[name]) {
            defaultMenu[name] = defaultMenu[name].filter(item => item.name !== subName);
        }
    }

    return {
        addMenuItem,
        removeMenuItem,

        addSubItemDefaultMenu,
        getSubItemsDefaultMenu,
        updateSubItemDefaultMenu,
        removeSubItemDefaultMenu,

        get items() { return menuItems; }
    };
};

export default mainMenuService;
