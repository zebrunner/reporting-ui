// TODO: refactor redirections: create global "$rootScope.$on('$stateChangeError'..." handler inside a run() function
(function () {
    'use strict';

    angular.module('app')
        .config(function($stateProvider, $urlRouterProvider) {
            'ngInject';

            $stateProvider
                .state('home', {
                    redirectTo: transition => transition.router.stateService.target('dashboard.list', {}, { location: 'replace', reload: true, inherit: false })
                })
                .state('dashboard', {
                    url: '/dashboards',
                    abstract: true,
                    template: '<ui-view />',
                    data: {
                        requireLogin: true,
                    }
                })
                .state('dashboard.page', {
                    url: '/:dashboardId?userId&currentUserId&currentUserName&testCaseId&testCaseName&hashcode&PARENT_JOB&PARENT_BUILD',
                    component: 'dashboardComponent',
                    data: {
                        requireLogin: true,
                        classes: 'p-dashboard',
                        isDynamicTitle: true,
                    },
                    resolve: {
                        dashboard: ($transition$, $state, DashboardService, $q, $timeout, messageService) => {
                            'ngInject';

                            const { dashboardId } = $transition$.params();

                            if (dashboardId) {
                                return DashboardService.GetDashboardById(dashboardId).then(function (rs) {
                                    if (rs.success) {
                                        return rs.data;
                                    } else {
                                        //TODO: dashboards is a home page. If we redirect to dashboards we can get infinity loop. We need to add simple error page;
                                        const message = rs && rs.message || `Can\'t fetch dashboard with id: ${dashboardId}`;
                                        const is404 = rs && rs.error && rs.error.status === 404;

                                        if (!is404) {
                                            messageService.error(message);
                                        }
                                        // Timeout to avoid digest issues
                                        $timeout(() => {
                                            const state = is404 ? '404' : 'home';

                                            $state.go(state);
                                        }, 0, false);

                                        return $q.reject({ message });
                                    }
                                });
                            } else {
                                // Timeout to avoid digest issues
                                $timeout(function () {
                                    $state.go('home');
                                }, 0, false);

                                return false;
                            }
                        },
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "dashboard" */ '../_dashboards/dashboard.module.js');

                            return $ocLazyLoad.load(mod.dashboardModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load dashboard module, ' + err);
                        }
                    }
                })
                .state('dashboard.list', {
                    url: '',
                    template: '',
                    data: {
                        requireLogin: true,
                    },
                    resolve: {
                        dashboardId: (authService, DashboardService, UserService, $state, $q, $timeout, messageService) => {
                            'ngInject';

                            const currentUser = UserService.currentUser;
                            let { defaultDashboardId } = currentUser;

                            if (!currentUser || defaultDashboardId === undefined) {
                                //get first available dashboard
                                const hideDashboards = !authService.userHasAnyPermission(['VIEW_HIDDEN_DASHBOARDS']);

                                return DashboardService.GetDashboards(hideDashboards).then(function (rs) {
                                    if (rs.success) {
                                        let defaultDashboard = rs.data.find(({ title }) => title.toLowerCase() === 'general') || rs.data[0];

                                        if (defaultDashboard) {
                                            defaultDashboardId = defaultDashboard.id;

                                            // Redirect to default dashboard
                                            // Timeout to avoid digest issues
                                            $timeout(function() {
                                                $state.go('dashboard.page', {dashboardId: defaultDashboardId}, {location: 'replace'});
                                            }, 0, false);

                                            return false;
                                        } else {
                                            //TODO: dashboards is a home page. If we redirect to dashboards we can get infinity loop. We need to add simple error page;
                                            const message = 'Can\'t fetch default dashboard';

                                            messageService.error(message);

                                            return $q.reject(message);
                                        }
                                    } else {
                                        //TODO: dashboards is a home page. If we redirect to dashboards we can get infinity loop. We need to add simple error page;
                                        const message = rs && rs.message || 'Can\'t fetch dashboards';

                                        messageService.error(message);

                                        return $q.reject(message);
                                    }
                                });
                            }

                            // Redirect to default dashboard
                            // Timeout to avoid digest issues
                            $timeout(function() {
                                $state.go('dashboard.page', {dashboardId: defaultDashboardId}, {location: 'replace'});
                            }, 0, false);

                            return false;
                        }
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "dashboard" */ '../_dashboards/dashboard.module.js');

                            return $ocLazyLoad.load(mod.dashboardModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load dashboard module, ' + err);
                        }
                    }
                })
                .state('views', {
                    url: '/views/:id',
                    template: require('../_views/list.html'),
                    data: {
                        requireLogin: true,
                        permissions: ['VIEW_TEST_RUN_VIEWS', 'MODIFY_TEST_RUN_VIEWS'],
                        isDynamicTitle: true,
                    }
                })
                .state('signin', {
                    url: '/signin',
                    component: 'signinComponent',
                    params: {
                        location: null,
                        referrer: null,
                        referrerParams: null,
                        user: null,
                    },
                    data: {
                        title: 'Signin',
                        onlyGuests: true,
                        classes: 'body-wide body-auth'
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "auth" */ '../_auth/auth.module.js');

                            return $ocLazyLoad.load(mod.authModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load auth module, ' + err);
                        }
                    }
                })
                .state('signup', {
                    url: '/signup?token',
                    component: 'signupComponent',
                    data: {
                        title: 'Signup',
                        onlyGuests: true,
                        classes: 'body-wide body-auth'
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "auth" */ '../_auth/auth.module.js');

                            return $ocLazyLoad.load(mod.authModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load auth module, ' + err);
                        }
                    }
                })
                .state('logout', {
                    url: '/logout',
                    controller: function($state, authService, $timeout, observerService) {
                        'ngInject';

                        authService.clearCredentials();
                        observerService.emit('logout');
                        // Timeout to avoid digest issues
                        $timeout(function() {
                            $state.go('signin');
                        }, 0, false);
                    },
                    data: {
                        requireLogin: true,
                    }
                })
                .state('forgotPassword', {
                    url: '/password/forgot',
                    component: 'forgotPasswordComponent',
                    data: {
                        title: 'Forgot password',
                        onlyGuests: true,
                        classes: 'body-wide body-auth'
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "auth" */ '../_auth/auth.module.js');

                            return $ocLazyLoad.load(mod.authModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load auth module, ' + err);
                        }
                    }
                })
                .state('resetPassword', {
                    url: '/password/reset?token',
                    component: 'resetPasswordComponent',
                    data: {
                        title: 'Reset password',
                        onlyGuests: true,
                        classes: 'body-wide body-auth'
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "auth" */ '../_auth/auth.module.js');

                            return $ocLazyLoad.load(mod.authModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load auth module, ' + err);
                        }
                    }
                })
                .state('users', {
                    url: '/users',
                    template: '<ui-view />',
                    data: {
                        requireLogin: true,
                    },
                    redirectTo: (transisiton) => {
                        return transisiton.router.stateService.target('users.list', {}, { location: 'replace' });
                      },
                })
                .state('users.list', {
                    url: '/list',
                    component: 'usersComponent',
                    data: {
                        title: 'Users',
                        requireLogin: true,
                        classes: 'p-users',
                        permissions: ['VIEW_USERS', 'MODIFY_USERS'],
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "users" */ '../_users/users.module.js');

                            return $ocLazyLoad.load(mod.usersModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load usersModule module, ' + err);
                        }
                    }
                })
                .state('users.groups', {
                    url: '/groups',
                    component: 'groupsComponent',
                    data: {
                        title: 'Groups',
                        requireLogin: true,
                        classes: 'p-users-groups',
                        permissions: ['MODIFY_USER_GROUPS'],
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "users" */ '../_groups/groups.module.js');

                            return $ocLazyLoad.load(mod.groupsModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load groupsModule module, ' + err);
                        }
                    }
                })
                .state('users.invitations', {
                    url: '/invitations',
                    component: 'invitationsComponent',
                    data: {
                        title: 'Invitations',
                        requireLogin: true,
                        classes: 'p-users',
                        permissions: ['INVITE_USERS', 'MODIFY_INVITATIONS'],
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "users" */ '../_invitations/invitations.module.js');

                            return $ocLazyLoad.load(mod.invitationsModule);
                        }
                        catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load invitationsModule module, ' + err);
                        }
                    }
                })
                .state('userProfile', {
                    url: '/profile',
                    component: 'userComponent',
                    data: {
                        title: 'Account & profile',
                        requireLogin: true,
                        classes: 'p-user-profile'
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "profile" */ '../_user/user.module.js');

                            return $ocLazyLoad.load(mod.userModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load userModule module, ' + err);
                        }
                    }
                })
                // For github redirection
                // TODO: Should be only for guests?
                .state('scm/callback', {
                    url: '/scm/callback?code',
                    component: 'scmComponent',
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "scm" */ '../_scm/scm.module.js');

                            return $ocLazyLoad.load(mod.scmModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load scm module, ' + err);
                        }
                    }
                })
                .state('tests', {
                    url: '/tests',
                    abstract: true,
                    template: '<ui-view />',
                    data: {
                        requireLogin: true,
                    }
                })
                .state('tests.runs', {
                    url: '/runs',
                    component: 'testsRunsComponent',
                    params: {
                        activeTestRunId: null
                    },
                    data: {
                        title: 'Test runs',
                        requireLogin: true,
                        classes: 'p-tests-runs'
                    },
                    resolve: {
                        resolvedTestRuns: function($state, testsRunsService, $q, projectsService, messageService) {
                            'ngInject';

                            const prevState = $state.current.name;

                            testsRunsService.resetFilteringState();
                            // read saved search/filtering data only if we returning from internal page
                            if (prevState === 'tests.runDetails' || prevState === 'tests.runs') {
                                testsRunsService.readStoredParams();
                            } else {
                                testsRunsService.deleteStoredParams();
                            }

                            if (projectsService.selectedProject) {
                                testsRunsService.setSearchParam('projectNames', [projectsService.selectedProject.name]);
                            } else {
                                testsRunsService.deleteSearchParam('projectNames');
                            }

                            return testsRunsService.fetchTestRuns().catch(function(err) {
                                err && err.message && messageService.error(err.message);
                                //if can't load with user/cached searchParams return empty data
                                return $q.resolve([]);
                            });
                        },
                        activeTestRunId: function($stateParams, $q) {
                            'ngInject';

                            const id = $stateParams.activeTestRunId ? $stateParams.activeTestRunId : undefined;

                            return $q.resolve(id);
                        },
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "tests-runs" */ '../containers/tests-runs/tests-runs.module.js');

                            return $ocLazyLoad.load(mod.testsRunsModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load testsRuns module, ' + err);
                        }
                    }
                })
                .state('tests.runDetails', {
                    url: '/runs/:testRunId',
                    component: 'testDetailsComponent',
                    store: true,
                    params: {
                        testRun: null,
                        configSnapshot: null,
                    },
                    data: {
                        title: 'Test results',
                        requireLogin: true,
                        classes: 'p-tests-run-details'
                    },
                    resolve: {
                        testRun: function($stateParams, $q, $state, TestRunService, $timeout) {
                            'ngInject';

                            if ($stateParams.testRunId) {
                                const params = {
                                    id: $stateParams.testRunId
                                };

                                return TestRunService.searchTestRuns(params)
                                    .then(function(response) {
                                        if (response.success && response.data.results && response.data.results[0]) {
                                            return response.data.results[0];
                                        } else { //TODO: show error message & redirect to testruns
                                            return $q.reject({message: 'Can\'t get test run with ID=' + $stateParams.testRunId});
                                        }
                                    })
                                    .catch(function(error) {
                                        console.log(error); //TODO: show toaster notification
                                        // Timeout to avoid digest issues
                                        $timeout(() => {
                                            $state.go('tests.runs');
                                        }, 0, false);
                                    });
                            } else {
                                // Timeout to avoid digest issues
                                $timeout(() => {
                                    $state.go('tests.runs');
                                }, 0, false);
                            }
                        },
                        configSnapshot: ($stateParams, $q) => {
                            'ngInject';

                            return $q.resolve($stateParams.configSnapshot);
                        }
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "test-details" */ '../containers/test-details/test-details.module.js');

                            return $ocLazyLoad.load(mod.testDetailsModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load testDetails module, ' + err);
                        }
                    }
                })
                .state('tests.runInfo', {
                    url: '/runs/:testRunId/info/:testId',
                    component: 'testRunInfoComponent',
                    data: {
                        requireLogin: true,
                        classes: 'p-tests-run-info',
                        isDynamicTitle: true,
                    },
                    params: {
                        configSnapshot: null,
                    },
                    resolve: {
                        testRun: ($stateParams, $q, $state, TestRunService, $timeout) => {
                            'ngInject';

                            if ($stateParams.testRunId) {
                                const params = {
                                    id: $stateParams.testRunId
                                };

                                return TestRunService.searchTestRuns(params)
                                    .then(function(response) {
                                        if (response.success && response.data.results && response.data.results[0]) {
                                            return response.data.results[0];
                                        } else {
                                            return $q.reject({message: 'Can\'t get test run with ID=' + $stateParams.testRunId});
                                        }
                                    })
                                    .catch(function(error) {
                                        console.log(error); //TODO: show toaster notification
                                        // Timeout to avoid digest issues
                                        $timeout(() => {
                                            $state.go('tests.runs');
                                        }, 0, false);
                                    });
                            } else {
                                // Timeout to avoid digest issues
                                $timeout(() => {
                                    $state.go('tests.runs');
                                }, 0, false);
                            }
                        },
                        configSnapshot: ($stateParams, $q) => {
                            'ngInject';

                            return $q.resolve($stateParams.configSnapshot);
                        }
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "testRunInfo" */ '../containers/test-run-info/test-run-info.module.js');

                            return $ocLazyLoad.load(mod.testRunInfoModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load testRunInfo module, ' + err);
                        }
                    }
                })
                .state('tests.sessions', {
                    url: '/sessions',
                    component: 'testsSessionsComponent',
                    data: {
                        title: 'Test sessions',
                        requireLogin: true,
                        classes: 'p-tests-sessions'
                    },
                    params: {
                        sessionId: null
                    },
                    resolve: {
                        resolvedTestSessions: function($state, testsSessionsService, $q, projectsService, messageService) {
                            'ngInject';

                            return testsSessionsService.searchSessions()
                                .then(res => {
                                    if (res.success) {
                                        return res.data;
                                    }

                                    return $q.reject(res);
                                })
                                .catch(function(err) {
                                    err && err.message && messageService.error(err.message);
                                    //if can't load with user/cached searchParams return empty data
                                    return $q.resolve([]);
                                });
                        },
                        additionalSearchParams: function(testsSessionsService) {
                            'ngInject';

                            return testsSessionsService.fetchAdditionalSearchParams()
                                .then(function (rs) {
                                    return rs.data ?? {};
                                });
                        },
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "tests-sessions" */ '../modules/tests-sessions/tests-sessions.module.js');

                            return $ocLazyLoad.load(mod.testsSessionsModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load testsSessions module, ' + err);
                        }
                    }
                })
                .state('tests.sessionLogs', {
                    url: '/sessions/:testSessionId',
                    component: 'testSessionLogsComponent',
                    data: {
                        requireLogin: true,
                        classes: 'p-test-session-logs',
                        isDynamicTitle: true,
                    },
                    resolve: {
                        testSession: function($stateParams, $q, $state, testsSessionsService, $timeout, messageService) {
                            'ngInject';

                            if ($stateParams.testSessionId) {
                                return testsSessionsService.getSessionById($stateParams.testSessionId)
                                    .then(res => {
                                        if (res.success && res.data) {
                                            return res.data;
                                        }

                                        const message = `Can't get test session with ID='${$stateParams.testSessionId}'`;
                                        // Timeout to avoid digest issues
                                        $timeout(() => {
                                            $state.go('tests.sessions');
                                        }, 0, false);
                                        messageService.error(message);

                                        return $q.reject({ message });
                                    });
                            } else {
                                // Timeout to avoid digest issues
                                $timeout(() => {
                                    $state.go('tests.sessions');
                                }, 0, false);
                                return $q.reject(false);
                            }
                        }
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "test-session-logs" */ '../modules/test-session-logs/test-session-logs.module');

                            return $ocLazyLoad.load(mod.testSessionLogsModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load testSessionLogs module, ' + err);
                        }
                    }
                })
                .state('tests.default', {
                    url: '',
                    controller: ($state, UserService) => {
                        'ngInject';

                        $state.go(`tests.${UserService.currentUser.testsView}`, {}, {
                            location: 'replace',
                        });
                    },
                })
                .state('welcomePage', {
                    url: '/welcome',
                    component: 'welcomePageComponent',
                    data: {
                        title: 'Welcome, let\'s begin',
                        requireLogin: true,
                    },
                    redirectTo: ($transition$) => {
                        const UserService = $transition$.injector().get('UserService');

                        if (!UserService.currentUser.firstLogin) {
                            return $transition$.router.stateService.target('tests.default', {}, { location: 'replace', reload: true, inherit: false })
                        }
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "welcomePage" */ '../shared/welcome-page/welcome-page.module');

                            return $ocLazyLoad.load(mod.welcomePageModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load welcomePage module, ' + err);
                        }
                    }
                })
                .state('integrations', {
                    url: '/integrations',
                    component: 'integrationsComponent',
                    data: {
                        title: 'Integrations',
                        requireLogin: true,
                        classes: 'p-integrations',
                        permissions: ['VIEW_INTEGRATIONS'],
                    },
                    resolve: {
                        toolsServicePrepare: (toolsService, $timeout, $state, messageService) => {
                            'ngInject';

                            return toolsService.getTools()
                                .catch((err) => {
                                    err && err.message && messageService.error(err.message);
                                    // Timeout to avoid digest issues
                                    $timeout(() => {
                                        $state.go('home');
                                    }, 0, false);

                                    return false;
                                });
                        }
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "integrations" */ '../_integrations/integrations.module.js');

                            return $ocLazyLoad.load(mod.integrationsModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load integrationsModule module, ' + err);
                        }
                    }
                })
                .state('404', {
                    url: '/404',
                    component: 'notFoundComponent',
                    data: {
                        title: 'Not found',
                        classes: 'body-wide body-err p-not-found'
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "not-found" */ '../modules/not-found/not-found.module.js');

                            return $ocLazyLoad.load(mod.notFoundModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load notFoundModule module, ' + err);
                        }
                    }
                })
                .state('500', {
                    url: '/500',
                    component: 'serverErrorComponent',
                    data: {
                        title: 'Server error',
                        classes: 'body-wide body-err p-server-error'
                    },
                    lazyLoad: async ($transition$) => {
                        const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                        try {
                            const mod = await import(/* webpackChunkName: "not-found" */ '../modules/server-error/server-error.module.js');

                            return $ocLazyLoad.load(mod.serverErrorModule);
                        } catch (err) {
                            throw new Error('ChunkLoadError: Can\'t load serverErrorModule module, ' + err);
                        }
                    }
                });

            $urlRouterProvider
                .when('/', '/dashboards')
                .when('', '/dashboards')
                .otherwise('/404');

        });
})();
