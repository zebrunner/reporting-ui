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
                    var index = vm.groups.indexOfField('id', group.id);
                    if (index >= 0) {
                        vm.groups.splice(index, 1, group);
                    } else {
                        vm.groups.push(group);
                    }
                }
            });
    };

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
                messageService.success('User "' + user.username + '" was added to group "' + group.name + '"');
            }
            else {
                messageService.error(rs.message);
            }
        });
    };

    function deleteUserFromGroup(user, group) {
        UserService.deleteUserFromGroup(user.id, group.id).then(function (rs) {
            if (rs.success) {
                messageService.success('User "' + user.username + '" was deleted from group "' + group.name + '"');
            }
            else {
                messageService.error(rs.message);
            }
        });
    };

    function querySearch(criteria, group) {
        vm.usersSearchCriteria.query = criteria;

        return UserService.searchUsersWithQuery(vm.usersSearchCriteria, criteria)
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

        $scope.getGroupsCount = function () {
            GroupService.getGroupsCount().then(function (rs) {
                if (rs.success) {
                    $scope.count = rs.data;
                }
                else {
                    messageService.error(rs.message);
                }
            });
        };

        $scope.getAllPermissions = function () {
            PermissionService.getAllPermissions().then(function (rs) {
                if (rs.success) {
                    $scope.permissions = rs.data;
                    $scope.createPermissionArr(rs.data);
                }
                else {
                    messageService.error(rs.message);
                }
            });
        };

        $scope.createGroup = function (group) {
            group.permissions = $scope.allAvaliablePermissions.filter((permission) => permission.value).map((permission) => permission.name);

            GroupService.createGroup(group).then(function (rs) {
                if (rs.success) {
                    const index = vm.groups.indexOfField('id', group.id);
                    const newGroup = {...vm.groups[index], ...rs.data};

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
            group.permissions = $scope.allAvaliablePermissions.filter((permission) => permission.value).map((permission) => permission.name);

            GroupService.updateGroup(group, group.id).then(function (rs) {
                if (rs.success) {
                    $scope.cancel({...vm.groups[vm.groups.indexOfField('id', group.id)], ...rs.data});
                    messageService.success('Group updated');
                }
                else {
                    messageService.error(rs.message);
                }
            });
        };

        $scope.createPermissionArr = function(permissions) {
            permissions.forEach((item) => {
                const permissionObj = {};

                permissionObj.name = item;
                permissionObj.value = !!$scope.group?.permissions?.find((permission) => permission === item) || false;
                $scope.allAvaliablePermissions.push(permissionObj);
            });
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
