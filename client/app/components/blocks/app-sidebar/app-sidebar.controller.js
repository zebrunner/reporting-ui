'use strict';

import dashboardSettingsModalController from '../../../shared/modals/dashboard-settings-modal/dashboard-settings-modal.controller';
import dashboardSettingsModalTemplate from '../../../shared/modals/dashboard-settings-modal/dashboard-settings-modal.html';
import deleteProjectModalController from '../../../shared/modals/delete-project-modal/delete-project-modal.controller';
import deleteProjectModalTemplate from '../../../shared/modals/delete-project-modal/delete-project-modal.html';
import uploadImageModalController from '../../../shared/modals/upload-image-modal/upload-image-modal.controller';
import uploadImageModalTemplate from '../../../shared/modals/upload-image-modal/upload-image-modal.html';
import 'jquery-ui/widgets/sortable';
import 'angular-ui-sortable';

const AppSidebarController = function (
    $scope,
    $rootScope,
    $q,
    $mdDialog,
    $mdMedia,
    $state,
    $timeout,
    $transitions,
    authService,
    ConfigService,
    DashboardService,
    mainMenuService,
    messageService,
    observerService,
    projectsService,
    SettingsService,
    UserService,
) {
    'ngInject';

    const fakeProjectAll = {
        name: 'ALL',
        id: 'all',
    };
    let navElem = null;
    let navContainerElem = null;
    let transSubscription;
    let isMainMenuOpened = false;
    let observerUnsubscribe;
    const mainMenuConfig = {
        liSelector: 'main-nav__list-item',
        openClassifier: 'open',
        mobileClass: 'toggle-bottom',
    };
    // breakpoint when menu ribbon becomes hidden
    // TODO: refactor to use material mobile breakpoint (600)
    const menuMobileBreakpoint = 480;

    const vm = {
        dashboardsLoadingThrottled: false,
        DashboardService: DashboardService,
        version: null,
        projects: [],
        $state,
        selectedProject: fakeProjectAll.id,
        hasHiddenDashboardPermission,
        loadDashboards,
        showProjectDialog,
        showUploadImageDialog,
        chooseProject,
        showDashboardSettingsModal,
        showDeleteModal,
        selectedProjectShortName: '',

        dashboardSortableOptions: {
            stop: function(e, ui) {
                updateDashboardPositions(ui.item.sortable.sourceModel);
            },
            disabled: true
        },

        activateSorter: activateDashboardsSorter,
        userHasAnyPermission: authService.userHasAnyPermission,
        userHasAnyRole: authService.userHasAnyRole,
        handleMenuClick,
        $onDestroy() { unbindListeners(); },
        toggleMobileMenu,

        get companyLogo() { return $rootScope.companyLogo; },
        get currentUser() { return UserService.currentUser; },
        get isMobile() { return $mdMedia('xs'); },
        get dashboardList() { return DashboardService.dashboards; },
        get menuItems() { return mainMenuService.items; },
        getSubitems(name) { return mainMenuService.getSubItemsDefaultMenu(name); },
    };

    vm.$onInit = initController;

    function showDeleteModal(currentProject) {
        $mdDialog.show({
            controller: deleteProjectModalController,
            template: deleteProjectModalTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            controllerAs: '$ctrl',
            clickOutsideToClose: true,
            fullscreen: true,
            autoWrap: false,
            locals: {
                project: currentProject,
                projects: vm.projects.filter(project => !isEqualIDs(project.id, currentProject.id) && project.id !== 'all'),
            }
        })
        .then(() => {
            vm.projects = vm.projects.filter(({ id }) => !isEqualIDs(currentProject.id, id));
            if (isEqualIDs(vm.selectedProject, currentProject.id)) {
                vm.selectedProject = fakeProjectAll.id;
                onProjectSelect();
            }
        }, () => {});
    }

    function activateDashboardsSorter(activate) {
        vm.dashboardSortableOptions.disabled = ! activate;
    };

    function updateDashboardPositions(dashboards) {
        let dashboardPositions = {};
        dashboards.forEach(function (dashboard, index) {
            dashboard.position = index;
            dashboardPositions[dashboard.id] = dashboard.position;
        });
        updatePositions(dashboardPositions);
    };

    function updatePositions(positions) {
        DashboardService.UpdateDashboardOrders(positions).then(function (rs) {
            if(rs.success) {
            } else {
                messageService.error(rs.message);
            }
        });
    };

    function initController() {
        loadProjects()
            .then(() => {
                vm.selectedProjectShortName = cutSelectedProjectName();
            });
        navElem = document.querySelector('.main-nav__list');
        navContainerElem = navElem.closest('#nav-container');
        bindListeners();
    }

    function hasHiddenDashboardPermission(){
        return authService.userHasAnyPermission(['VIEW_HIDDEN_DASHBOARDS']);
    }

    function getNextEmptyPosition(dashboards) {
        let result = 0;
        dashboards.forEach(function (dashboard) {
            if(dashboard.position > result) {
                result = dashboard.position;
            }
        });
        return result + 1;
    };

    function showDashboardSettingsModal(event, dashboard) {
        let position = getNextEmptyPosition(vm.dashboardList);
        $mdDialog.show({
            controller: dashboardSettingsModalController,
            template: dashboardSettingsModalTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose: true,
            fullscreen: true,
            autoWrap: false,
            locals: {
                dashboard: dashboard,
                position : position
            }
        })
            .then(function (rs) {
                if(rs) {
                    $state.go('dashboard.page', {dashboardId: rs.id});
                    DashboardService.dashboards.splice(rs.position, 0, rs);
                    delete rs.action;
                }
            }, function () {
            });
    }

    function loadDashboards(e) {
        // prevent frequent calls on open-close by throttling (1min)
        if (vm.dashboardsLoadingThrottled) { return; }
        vm.dashboardsLoadingThrottled = true;
        $timeout(() => {
            const $el = angular.element(e.target).closest('li');

            //we are closing menu by clicking on link second time
            if ($el.length && !$el.hasClass('open')) { return; }

            DashboardService.RetrieveDashboards()
                .finally(() => {
                    $timeout(() => {
                        vm.dashboardsLoadingThrottled = false;
                    }, 60000, false);
                });
        });
    }

    function showProjectDialog(event) {
        $mdDialog.show({
            controller: 'ProjectController',
            template: require('../../../components/modals/project/project.html'),
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose:true,
            fullscreen: true
        }).then(function (rs) {
            vm.projects.push(rs);
        });
    }

    function showUploadImageDialog($event) {
        $mdDialog.show({
            controller: uploadImageModalController,
            controllerAs: '$ctrl',
            template: uploadImageModalTemplate,
            parent: angular.element(document.body),
            targetEvent: $event,
            clickOutsideToClose: true,
            locals: {
                urlHandler: (url) => {
                    if (url) {
                        $rootScope.companyLogo.value = url;

                        return SettingsService.editSetting($rootScope.companyLogo).then(function (prs) {
                            if (prs.success) {
                                $rootScope.companyLogo.value += '?' + (new Date()).getTime();
                                messageService.success('Company logo was successfully changed');

                                return true;
                            } else {
                                messageService.error(prs.message);

                                return false;
                            }
                        });
                    }

                    return $q.reject(false);
                },
                fileTypes: 'ORG_ASSET',
            }
        });
    }

    function onProjectSelect() {
        //return if trying to select already selected project
        if (projectsService.selectedProject && projectsService.selectedProject.id === vm.selectedProject) { return; }
        //return if no selected project and trying to select "all" wich means to reset selected project
        if (!projectsService.selectedProject && vm.selectedProject === fakeProjectAll.id) { return; }

        //handle project selection
        if (!isEqualIDs(vm.selectedProject, fakeProjectAll.id)) {
            projectsService.selectedProject = vm.projects.find(({ id }) => isEqualIDs(id, vm.selectedProject));
        } else { //handle project deselection
            projectsService.selectedProject = null;
        }
        vm.selectedProjectShortName = cutSelectedProjectName();
        if ($state.current.name === 'tests.runs' || $state.current.name === 'dashboard.page') {
            $timeout(() => {
                $state.reload();
            });
        }
    }

    function loadProjects() {
        return ConfigService.getConfig('projects')
            .then(function(rs) {
                if (rs.success) {
                    vm.projects = [fakeProjectAll, ...rs.data];

                    if (projectsService.selectedProject) {
                        const activeProject = vm.projects.find(({ id }) => isEqualIDs(id, projectsService.selectedProject.id));

                        if (activeProject) {
                            vm.selectedProject = activeProject.id;
                        } else { //Looks like the project doesn't exist anymore, so we need to clear cached selection.
                            projectsService.resetSelectedProject();
                        }
                    }
                }
                // else {
                //     messageService.error('Unable to load projects');
                // }
            });
    }

    function cutSelectedProjectName() {
        let name = '';
        const selectedProject = vm.projects.find(({id}) => isEqualIDs(id, vm.selectedProject) && id !== 'all');

        if (selectedProject) {
            name = selectedProject.name.substr(0, 3);
        }

        return name;
    }

    function chooseProject() {
        $timeout(() => {
            onProjectSelect();
        }, 0);
    }

    //needs this helper because ID can be a string or a number
    function isEqualIDs(a, b) {
        if (!isNaN(a) && !isNaN(b)) {
            return +a === +b;
        }

        return `${a}` === `${b}`;
    }

    function bindListeners() {
        if (navElem) {
            transSubscription = $transitions.onBefore({}, closeMenuOnRouteTransition);
            window.addEventListener('resize', closeMenuOnResize);
        }
        // clear dashboardList on logout
        observerUnsubscribe = observerService.on('logout', () => {
            vm.dashboardsLoadingThrottled = false;
            DashboardService.dashboards = [];
        });
    }

    function unbindListeners() {
        if (transSubscription) {
            transSubscription();
        }
        if (observerUnsubscribe) {
            observerUnsubscribe();
        }
        window.removeEventListener('resize', closeMenuOnResize);
    }

    function handleMenuClick($event) {
        if (!navElem) { return; }

        const btn = $event.target.classList.contains('nav-btn') ? $event.target : $event.target.closest('.nav-btn');

        if (btn) {
            const btnClassList = btn.classList;

            // close menu handling
            if (btnClassList.contains('js-menu-close')) {
                closeMenu();
            } else if (btnClassList.contains('js-menu-toggle')) {
                // handle case if menu is opened, but we trying to open another one
                const openedLiElement = navElem.querySelector(`.${mainMenuConfig.liSelector}.${mainMenuConfig.openClassifier}`);
                const parentLiElement = btn.closest(`.${mainMenuConfig.liSelector}`);

                if (openedLiElement) {
                    closeMenu(openedLiElement);
                }
                if (openedLiElement !== parentLiElement) {
                    openMenu(parentLiElement);
                }
            }
        }
        // handle cases when we need to close menu on special action (for example, custom click handler)
        else if ($event.target.classList.contains('js-menu-close') || $event.target.closest('.js-menu-close')) {
            closeMenu();
        }

        // stop bubbling to prevent closing menu on document "click" listener
        $event.stopPropagation();
    }

    function openMenu(liElem) {
        if (!liElem) { return; }

        liElem.classList.add(mainMenuConfig.openClassifier);
        isMainMenuOpened = true;
        addListenerOnDocument();
    }

    function addListenerOnDocument() {
        document.addEventListener('click', closeMenuOnOutsideClick);
    }

    function removeListenerOnDocument() {
        document.removeEventListener('click', closeMenuOnOutsideClick);
    }

    function closeMenuOnOutsideClick() {
        closeMenu();
    }

    function closeMenuOnResize() {
        if (isMainMenuOpened) {
            closeMenu();
        }
    }

    function closeMenuOnRouteTransition() {
        closeMenu();
    }

    function toggleMobileMenu() {
        if (navContainerElem.classList.contains(mainMenuConfig.mobileClass)) {
            navContainerElem.classList.remove(mainMenuConfig.mobileClass);
            closeMenu();
        } else {
            navContainerElem.classList.add(mainMenuConfig.mobileClass);
        }
    }

    function closeMenu(openedLiElement = navElem.querySelector(`.${mainMenuConfig.liSelector}.${mainMenuConfig.openClassifier}`)) {
        // auto-close mobile menu
        if ($mdMedia(`max-width: ${menuMobileBreakpoint}px`) && navContainerElem.classList.contains(mainMenuConfig.mobileClass)) {
            navContainerElem.classList.remove(mainMenuConfig.mobileClass);
        }
        // there is no opened element
        if (!openedLiElement) { return; }

        removeListenerOnDocument();
        openedLiElement.classList.remove(mainMenuConfig.openClassifier);
        isMainMenuOpened = false;
        clearInputs(openedLiElement);
    }

    function clearInputs(openedElement) {
        const input = angular.element(openedElement).find('input[name="search"]');

        if (input) {
            const ngModel = input.controller('ngModel');

            if (ngModel) {
                input[0].value = '';
                ngModel.$setViewValue('');
            }
        }
    }

    return vm;
};

export default AppSidebarController;
