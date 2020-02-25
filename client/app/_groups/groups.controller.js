'use strict';

const GroupsController = function GroupsController(
    $scope,
    $mdDialog,
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
                GroupService.groups = rs.data;
            }
        });
    };

    function getGroupsCount() {
        GroupService.getGroupsCount().then(function (rs) {
            if (rs.success) {
                vm.count = rs.data;
            }
            else {
                messageService.error(rs.message);
            }
        });
    };

    function initController() {
        getGroupsCount();
        getAllGroups(false);
    };

    // **************************************************************************
    function GroupController($scope, $mdDialog, GroupService, PermissionService, UtilService, group, messageService) {

        'ngInject';

        $scope.UtilService = UtilService;
        $scope.group = group ? angular.copy(group) : {};
        $scope.blocks = {};
        $scope.roles = [];
        $scope.group.users = $scope.group.users || [];
        $scope.showGroups = false;
        $scope.getRoles = function () {
            GroupService.getRoles().then(function (rs) {
                if (rs.success) {
                    $scope.roles = rs.data;
                }
                else {
                    messageService.error(rs.message);
                }
            });
        };
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
                    $scope.aggregatePermissionsByBlocks(rs.data);
                    collectPermissions();
                }
                else {
                    messageService.error(rs.message);
                }
            });
        };
        $scope.createGroup = function (group) {
            group.permissions = $scope.permissions.filter(function (permission) {
                return permission.value;
            });
            GroupService.createGroup(group).then(function (rs) {
                if (rs.success) {
                    $scope.cancel(rs.data);
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
            group.permissions = $scope.permissions.filter(function (permission) {
                return permission.value;
            });
            GroupService.updateGroup(group).then(function (rs) {
                if (rs.success) {
                    $scope.cancel(rs.data);
                    messageService.success('Group updated');
                }
                else {
                    messageService.error(rs.message);
                }
            });
        };

        $scope.aggregatePermissionsByBlocks = function (permissions) {
            permissions.forEach(function (p, index) {
                if (!$scope.blocks[p.block]) {
                    $scope.blocks[p.block] = {};
                    $scope.blocks[p.block].selected = [];
                    $scope.blocks[p.block].permissions = [];
                }
                $scope.blocks[p.block].permissions.push(p);
            })
        };

        function collectPermissions() {
            if ($scope.group.permissions) {
                $scope.group.permissions.forEach(function (p) {
                    if ($scope.blocks[p.block].selected) {
                        $scope.blocks[p.block].selected = [];
                    }
                    $scope.blocks[p.block].permissions.forEach(function (perm) {
                        if (perm.id === p.id) {
                            perm.value = true;
                        }
                    });
                });
            }
            $scope.getCheckedBlocks();
        };

        $scope.getCheckedBlocks = function() {
            $scope.blocksChecked = {};
            for (let block in $scope.blocks) {
                $scope.blocksChecked[block] = $scope.isCheckedBlock(block);
            }
        }

        $scope.isCheckedBlock = function (blockName) {
            return $scope.getCheckedPermissions(blockName).length !== 0;
        };

        $scope.getCheckedPermissions = function (blockName) {
            return $scope.blocks[blockName].permissions.filter(function (permission) {
                return permission.value;
            })
        };

        $scope.setPermissionsValue = function (blockName, value) {
            $scope.blocks[blockName].permissions.forEach(function (permission) {
                permission.value = value;
            })
        };

        $scope.toggleAllPermissions = function (blockName) {
            if (!$scope.blocksChecked[blockName]) {
                $scope.setPermissionsValue(blockName, false);
            } else {
                $scope.setPermissionsValue(blockName, true);
            }
        };

        $scope.isIndeterminateBlock = function (blockName) {
            var checkedPermissionsCount = $scope.getCheckedPermissions(blockName).length;
            return (checkedPermissionsCount !== 0 && checkedPermissionsCount !== $scope.blocks[blockName].permissions.length);
        };

        $scope.clearPermissions = function () {
            $scope.permissions.forEach(function (permission) {
                delete permission.value;
            })
        };
        $scope.hide = function () {
            $mdDialog.hide();
        };
        $scope.cancel = function (group) {
            $mdDialog.cancel(group);
        };
        (function initController() {
            $scope.getRoles();
            $scope.getAllPermissions();
        })();
    }
};

export default GroupsController;
