'use strict';

const UsersController = function UserViewController($scope, $rootScope, $location, $state, $mdDialog, $mdDateRangePicker,
                                                    UserService, GroupService, InvitationService,
                                                    AuthService, toolsService) {
    'ngInject';

    let DEFAULT_SC = {
        page: 1,
        pageSize: 20,
        query: null,
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
        sc: angular.copy(DEFAULT_SC),
        onSearchChange: onSearchChange,
        search: search,
        isEqualDate: isEqualDate,
        reset: reset,
        showEditProfileDialog: showEditProfileDialog,
        showChangePasswordDialog: showChangePasswordDialog,
        showCreateUserDialog: showCreateUserDialog,
        usersSearchCriteria: {},
        searchValue: {
            selectedRange: {
                showTemplate: null
            }
        },
        pick: pick,
        get tools() {
            return toolsService.tools;
        },
        get currentUser() { return UserService.currentUser; },
    };

    vm.$onInit = initController;

    return vm;

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
                vm.sr = rs.data;
            }
            else {
                alertify.error(rs.message);
            }
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
            controller: function ($scope, $mdDialog, UtilService) {
                'ngInject';

                $scope.UtilService = UtilService;
                $scope.createUser = function () {
                    UserService.createOrUpdateUser($scope.user).then(function (rs) {
                        if (rs.success) {
                            $scope.hide(rs.data);
                            alertify.success('User created');
                        }
                        else {
                            alertify.error(rs.message);
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
                    let index = vm.sr.results.findIndex(({id}) => data.id === id);

                    if (index !== -1) {
                        vm.sr.results[index] = {...vm.sr.results[index], ...data};
                    } else {
                        vm.sr.results.push(data);
                    }
                }
            }, function () {
            });
    };

    $scope.UtilService = UtilService;
    $scope.DashboardService = DashboardService;

    $scope.users = [];
    $scope.order = 'username';

    var tmpToday = new Date();

    $scope.sc = angular.copy(DEFAULT_SC);

    $scope.tabs[$scope.tabs.indexOfField('name', 'Users')].countFunc = function () {
        return $scope.source && $scope.source.totalResults ? $scope.source.totalResults : 0;
    };

    function isEqualDate() {
        if (vm.searchValue.selectedRange.dateStart && vm.searchValue.selectedRange.dateEnd) {
            return vm.searchValue.selectedRange.dateStart.getTime() === vm.searchValue.selectedRange.dateEnd.getTime();
        }
    };

    $scope.isDateChosen = true;
    $scope.isDateBetween = false;

    $scope.changePeriod = function () {
        switch(vm.searchValue.period) {
            case 'between':
                $scope.isDateChosen = true;
                $scope.isDateBetween = true;
                break;
            case 'before':
            case 'after':
            case '':
                $scope.isDateChosen = true;
                $scope.isDateBetween = false;
                break;
            default:
                $scope.isDateChosen = true;
                $scope.isDateBetween = false;
                break;
        }
    };

    function pick($event, showTemplate) {
        vm.searchValue.selectedRange.showTemplate = showTemplate;
        $mdDateRangePicker.show({
            targetEvent: $event,
            model: vm.searchValue.selectedRange
        }).then(function (result) {
            if (result) {
                $scope.searchAct = true;
                vm.searchValue.selectedRange = result;
            }

        })
    };

    function showChangePasswordDialog($event, user) {
        $mdDialog.show({
            controller: function ($scope, $mdDialog, UtilService) {
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
                                alertify.success('Password changed');
                            }
                            else {
                                alertify.error(rs.message);
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
            controller: function ($scope, $mdDialog, UtilService) {

                'ngInject';

                $scope.UtilService = UtilService;
                $scope.user = angular.copy(user);
                $scope.updateStatus = function (user, status) {
                    user.status = status;
                    UserService.updateStatus(user).then(function (rs) {
                        if (rs.success) {
                            $scope.cancel(rs.data.status);
                        } else {
                            alertify.error(rs.message);
                        }
                    });
                };
                $scope.updateUser = function () {
                    UserService.createOrUpdateUser($scope.user).then(function (rs) {
                        if (rs.success) {
                            $scope.hide(rs.data);
                            alertify.success('Profile changed');
                        }
                        else {
                            alertify.error(rs.message);
                        }
                    });
                };
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
                    let active = vm.sr.results.find(function(res) {
                        return res.id === answer.id;
                    })
                    let actIndex = vm.sr.results.indexOf(active);

                    if(actIndex > -1) {
                        vm.sr.results[actIndex] = {...vm.sr.results[actIndex], ...answer};
                    }
                }
            }, function (status) {
                if (status) {
                    vm.sr.results[index].status = status;
                }
            });
    };

    function initController() {
        vm.search(1);
    }

};

export default UsersController;
