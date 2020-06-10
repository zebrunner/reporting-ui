'use strict';

import inviteUserModalTpl from '../shared/modals/invitation-modal/invitation-modal.html';
import inviteUserModalCtrl from '../shared/modals/invitation-modal/invitation-modal.controller';

const UsersController = function UserViewController(
    $scope,
    $location,
    $state,
    $mdDialog,
    $mdMedia,
    authService,
    UserService,
    messageService,
    GroupService,
    toolsService,
    pageTitleService,
) {
    'ngInject';

    let DEFAULT_SC = {
        page: 1,
        pageSize: 20,
        query: null,
        status: null,
        selectedRange: {
            selectedTemplate: null,
            selectedTemplateName: null,
            dateStart: null,
            dateEnd: null,
            showTemplate: false,
            fullscreen: false
        }
    };

    const vm = {
        sr: [],
        searchActive: false,
        isFiltered: false,
        activeTab: null,
        totalResults: 0,
        sc: angular.copy(DEFAULT_SC),
        onSearchChange: onSearchChange,
        search: search,
        isEqualDate: isEqualDate,
        reset: reset,
        showEditProfileDialog: showEditProfileDialog,
        showChangePasswordDialog: showChangePasswordDialog,
        showCreateUserDialog: showCreateUserDialog,
        showInviteUsersDialog,
        userHasAnyPermission: authService.userHasAnyPermission,
        usersSearchCriteria: {},
        allUserStatuses: ['active', 'inactive', null],
        filterByStatusInAction: false,
        changeSelectedStatus,
        isUsersEmpty,
        searchValue: {
            selectedRange: {
                showTemplate: null
            }
        },
        get currentTitle() { return pageTitleService.pageTitle; },
        get currentUser() { return UserService.currentUser; },
        get isTabletSm() { return !$mdMedia('gt-sm'); },
    };

    vm.$onInit = initController;

    return vm;

    function isUsersEmpty() {
        return vm.sr && !vm.sr?.length;
    }

    function changeSelectedStatus(status) {
        if (vm.sc?.status?.toLowerCase() === status || (!vm.sc.status && !status)) { return; }

        vm.filterByStatusInAction = true;
        if (!status) {
            vm.sc.status = null;
        } else {
            vm.sc.status = status.toUpperCase();
        }

        search(1);
    }

    function onSearchChange(fields) {
        vm.searchActive = false;
        fields.forEach( function (field) {
            if (field.$modelValue || field.$modelValue === 0) {
                vm.searchActive = true;
            }
        })
    };

    function search(page) {
        vm.sc.date = null;
        vm.sc.toDate = null;
        vm.sc.fromDate = null;

        if (page) {
            vm.sc.page = page;
        }

        if (vm.sc.selectedRange.dateStart && vm.sc.selectedRange.dateEnd) {
            if (!isScEqualDate()) {
                vm.sc.fromDate = vm.sc.selectedRange.dateStart;
                vm.sc.toDate = vm.sc.selectedRange.dateEnd;
            }
            else {
                vm.sc.date = vm.sc.selectedRange.dateStart;
            }
        }

        var requestVariables = $location.search();
        if (requestVariables) {
            for (var key in requestVariables) {
                if (key && requestVariables[key]) {
                    vm.sc[key] = requestVariables[key];
                }
            }
        }

        UserService.searchUsers(vm.sc).then(function (rs) {
            if (rs.success) {
                vm.sr = rs.data?.results || [];
                vm.totalResults = rs.data?.totalResults || 0;
            }
            else {
                messageService.error(rs.message);
            }
            vm.filterByStatusInAction = false;
        });
        vm.isFiltered = true;
    };

    function isScEqualDate() {
        if (vm.sc.selectedRange.dateStart && vm.sc.selectedRange.dateEnd) {
            return vm.sc.selectedRange.dateStart.getTime() === vm.sc.selectedRange.dateEnd.getTime();
        }
    };

    function reset() {
        if(vm.isFiltered) {
            vm.sc = angular.copy(DEFAULT_SC);
            search();
            vm.searchActive = false;
            vm.isFiltered = false;
        }
    };

    function showCreateUserDialog(event) {
        $mdDialog.show({
            controller: function ($scope, $mdDialog, UtilService, messageService) {
                'ngInject';

                $scope.UtilService = UtilService;
                $scope.createUser = function () {
                    UserService.createUser($scope.user).then(function (rs) {
                        if (rs.success) {
                            $scope.hide(rs.data);
                            messageService.success('User created');
                        }
                        else {
                            messageService.error(rs.message);
                        }
                    });
                };
                $scope.hide = function (data) {
                    $mdDialog.hide(data);
                };
                $scope.cancel = function () {
                    $mdDialog.cancel(false);
                };
            },
            template: require('./modals/create_modal.html'),
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose: true,
            fullscreen: true
        })
            .then(function (data) {
                if (data) {
                    let index = vm.sr.findIndex(({id}) => data.id === id);

                    if (index !== -1) {
                        vm.sr[index] = {...vm.sr[index], ...data};
                    } else {
                        vm.sr.push(data);
                    }
                }
            }, function () {
            });
    };

    function showInviteUsersDialog(event) {
        $mdDialog.show({
            controller: inviteUserModalCtrl,
            template: inviteUserModalTpl,
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true,
            locals: {
                groups: GroupService.groups,
                isLDAPConnected: toolsService.isToolConnected('LDAP'),
            }
        });
    }

    function isEqualDate() {
        if (vm.searchValue.selectedRange.dateStart && vm.searchValue.selectedRange.dateEnd) {
            return vm.searchValue.selectedRange.dateStart.getTime() === vm.searchValue.selectedRange.dateEnd.getTime();
        }
    }

    function showChangePasswordDialog($event, user) {
        $mdDialog.show({
            controller: function ($scope, $mdDialog, UtilService, messageService) {
                'ngInject';

                $scope.UtilService = UtilService;
                $scope.user = user;
                $scope.changePassword = { 'userId': user.id };
                $scope.updateUserPassword = function (changePassword) {
                    UserService.updateUserPassword(changePassword)
                        .then(function (rs) {
                            if (rs.success) {
                                $scope.changePassword = {};
                                $scope.hide();
                                messageService.success('Password changed');
                            }
                            else {
                                messageService.error(rs.message);
                            }
                        });
                };
                $scope.hide = function () {
                    $mdDialog.hide(true);
                };
                $scope.cancel = function () {
                    $mdDialog.cancel(false);
                };
            },
            template: require('./modals/password_modal.html'),
            parent: angular.element(document.body),
            targetEvent: $event,
            clickOutsideToClose: true,
            fullscreen: true
        })
            .then(function (answer) {
                if (answer) {
                    $state.reload();
                }
            }, function () {
            });
    };



    function showEditProfileDialog(event, user, index) {
        $mdDialog.show({
            controller: function ($scope, $mdDialog, UtilService, messageService) {

                'ngInject';

                $scope.UtilService = UtilService;
                $scope.user = angular.copy(user);
                $scope.updateStatus = function (user, status) {
                    user.status = status;
                    UserService.updateStatus(user).then(function (rs) {
                        if (rs.success) {
                            $scope.cancel(rs.data.status);
                        } else {
                            messageService.error(rs.message);
                        }
                    });
                };
                $scope.updateUser = function updateUserProfile() {
                    const { username, firstName, lastName, email } = $scope.user;

                    UserService.updateUserProfile($scope.user.id, { username, firstName, lastName, email })
                        .then(rs => {
                            if (rs.success) {
                                $scope.user = { ...$scope.user, ...rs.data };

                                if (UserService.currentUser.id === $scope.user.id) {
                                    UserService.currentUser.firstName = firstName;
                                    UserService.currentUser.lastName = lastName;
                                    UserService.currentUser.email = email;
                                }
                                $scope.hide(rs.data);
                                messageService.success('Profile changed');
                            } else {
                                messageService.error(rs.message);
                            }
                        });
                }

                $scope.hide = function (res) {
                    $mdDialog.hide(res);
                };
                $scope.cancel = function (status) {
                    $mdDialog.cancel(status);
                };
            },
            template: require('./modals/edit_modal.html'),
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose: true,
            fullscreen: true
        })
            .then(function (answer) {
                if (answer) {
                    let active = vm.sr.find(function(res) {
                        return res.id === answer.id;
                    })
                    let actIndex = vm.sr.indexOf(active);

                    if(actIndex > -1) {
                        vm.sr[actIndex] = {...vm.sr[actIndex], ...answer};
                    }
                }
            }, function (status) {
                if (status) {
                    vm.sr[index].status = status;
                }
            });
    }

    function getAllGroups(isPublic) {
        GroupService.getAllGroups(isPublic)
            .then((rs) => {
                if (rs.success) {
                    GroupService.groups = rs.data || [];
                }
            });
    }

    function initController() {
        vm.search(1);
        if (!GroupService.groups.length) {
            getAllGroups(true);
        }
    }

};

export default UsersController;
