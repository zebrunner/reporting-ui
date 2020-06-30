'use strict';

const GroupsController = function GroupsController(
    $scope,
    $mdDialog,
    authService,
    UserService,
    GroupService,
    UtilService,
    messageService,
    pageTitleService,
    ) {
    'ngInject';

    const vm = {
        showGroupDialog: showGroupDialog,
        deleteGroup: deleteGroup,
        addUserToGroup: addUserToGroup,
        querySearch: querySearch,
        deleteUserFromGroup: deleteUserFromGroup,
        userHasAnyPermission: authService.userHasAnyPermission,
        usersSearchCriteria: {},
        findGroupIndex,
        refactorPermissionsData,
        count: 0,
        get groups() { return GroupService.groups; },
        get currentTitle() { return pageTitleService.pageTitle; },
    };

    vm.$onInit = initController;

    return vm;

    function showGroupDialog(event, group) {
        $mdDialog.show({
            controller: GroupController,
            template: require('./modals/group_modal.html'),
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose: true,
            fullscreen: true,
            bindToController: true,
            locals: {
                group: group
            }
        })
            .then(function () {
            }, function (group) {
                if (group) {
                    const index = findGroupIndex(group.id);
                    if (index >= 0) {
                        vm.groups.splice(index, 1, group);
                    } else {
                        vm.groups.push(group);
                    }
                }
            });
    };

    function findGroupIndex(groupId) {
        return vm.groups.findIndex((item) => item.id === groupId);
    }

    function refactorPermissionsData(permissions) {
        return permissions.filter((permission) => permission.value).map((permission) => permission.name);
    }

    function deleteGroup(group) {
        GroupService.deleteGroup(group.id).then(function (rs) {
            if (rs.success) {
                vm.groups.splice(vm.groups.indexOfField('id', group.id), 1);
                $scope.count--;
                messageService.success('Group "' + group.name + '" was deleted');
            }
            else {
                if (rs.error && rs.error.data && rs.error.data.error && rs.error.data.error.code == 403 && rs.error.data.error.message) {
                    messageService.error(rs.error.data.error.message);
                } else {
                    messageService.error(rs.message);
                }
            }
        });
    };

    function addUserToGroup(user, group) {
        UserService.addUserToGroup(user, group.id).then(function (rs) {
            if (rs.success) {
                messageService.success(`User "${user.username}" was added to group "${group.name}"`);
            }
            else {
                messageService.error(rs.message);
            }
        });
    };

    function deleteUserFromGroup(user, group) {
        UserService.deleteUserFromGroup(user.id, group.id).then(function (rs) {
            if (rs.success) {
                messageService.success(`User "${user.username}" was deleted from group "${group.name}"`);
            }
            else {
                messageService.error(rs.message);
            }
        });
    };

    function querySearch(criteria, group) {
        vm.usersSearchCriteria.query = criteria;

        return UserService.searchUsers(vm.usersSearchCriteria, criteria)
            .then(function (rs) {
                if (rs.success) {
                    return UtilService.filterUsersForSend(rs.data.results, group.users);
                } else {
                    messageService.error(rs.message);
                }
            });
    };

    function getAllGroups(isPublic) {
        GroupService.getAllGroups(isPublic).then(function (rs) {
            if(rs.success) {
                GroupService.groups = rs.data.results;
                vm.count = rs.data.totalResults;
            }
        });
    };

    function initController() {
        getAllGroups(false);
    };

    // **************************************************************************
    function GroupController($scope, $mdDialog, GroupService, PermissionService, UtilService, group, messageService) {

        'ngInject';

        $scope.UtilService = UtilService;
        $scope.group = group ? angular.copy(group) : {};
        $scope.allAvaliablePermissions = [];
        $scope.group.users = $scope.group.users || [];
        $scope.showGroups = false;

        $scope.getAllPermissions = function () {
            PermissionService.getAllPermissions().then(function (rs) {
                if (rs.success) {
                    $scope.permissions = rs.data;
                    $scope.createPermissionArray(rs.data);
                }
                else {
                    messageService.error(rs.message);
                }
            });
        };

        $scope.createGroup = function (group) {
            group.permissions = refactorPermissionsData($scope.allAvaliablePermissions);

            GroupService.createGroup(group).then(function (rs) {
                if (rs.success) {
                    const newGroup = {...vm.groups[findGroupIndex(group.id)], ...rs.data};

                    $scope.cancel(newGroup);
                    messageService.success('Group "' + group.name + '" was created');
                }
                else {
                    messageService.error(rs.message);
                }
            });
        };

        $scope.getGroup = function (id) {
            GroupService.getGroup(id).then(function (rs) {
                if (rs.success) {
                    $scope.group = rs.data;
                }
                else {
                    messageService.error(rs.message);
                }
            });
        };

        $scope.updateGroup = function (group) {
            group.permissions = refactorPermissionsData($scope.allAvaliablePermissions);

            GroupService.updateGroup(group, group.id).then(function (rs) {
                if (rs.success) {
                    $scope.cancel({...vm.groups[findGroupIndex(group.id)], ...rs.data});
                    messageService.success('Group updated');
                }
                else {
                    messageService.error(rs.message);
                }
            });
        };

        $scope.createPermissionArray = function(permissions) {
            $scope.allAvaliablePermissions = permissions.reduce((acc, item) => {
                acc.push({
                    name: item,
                    value: !!$scope.group?.permissions?.find((permission) => permission === item) || false,
                });
                return acc;
            }, []);
        };

        $scope.hide = function () {
            $mdDialog.hide();
        };
        $scope.cancel = function (group) {
            $mdDialog.cancel(group);
        };
        (function initController() {
            $scope.getAllPermissions();
        })();
    }
};

export default GroupsController;
