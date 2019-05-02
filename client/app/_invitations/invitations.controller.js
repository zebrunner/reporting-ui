'use strict';

const InvitationsController = function InvitationsController($scope, $rootScope, $location, $state, $mdDialog,
                                                   UserService, GroupService, InvitationService,
                                                   AuthService, toolsService) {

    'ngInject';

    let DEFAULT_SC = {
        page: 1,
        pageSize: 20,
        query: null,
        orderBy: null,
        sortOrder: null
    };

    const vm = {
        showInviteUsersDialog: showInviteUsersDialog,
        takeOff: takeOff,
        retryInvite: retryInvite,
        searchUser: searchUser,
        isFiltered: false,
        sc: angular.copy(DEFAULT_SC),
        sr: {},
        search: search,
        reset: reset,
        get tools() {return toolsService.tools;},
        get groups() {return GroupService.groups;},
    };

    vm.$onInit = initController;

    return vm;

    function showInviteUsersDialog(event) {
        $mdDialog.show({
            controller: InviteController,
            template: require('./modals/invitation_modal.html'),
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose: false,
            fullscreen: true,
            locals: {
                groups: GroupService.groups,
                isLDAPConnected: vm.tools['LDAP']
            }
        })
            .then(function (invitations) {
            }, function (invitations) {
                if (invitations) {
                    invitations.forEach(function (invite) {
                        vm.sr.results.push(invite);
                    });
                }
            });
    };

    function takeOff(invite, index) {
        InvitationService.deleteInvitation(invite.id).then(function (rs) {
            if (rs.success) {
                vm.sr.results.splice(index, 1);
                alertify.success('Invitation was taken off successfully.');
            } else {
                alertify.error(rs.message);
            }
        });
    };

    function retryInvite(invite, index) {
        InvitationService.retryInvite(invite).then(function (rs) {
            if (rs.success) {
                vm.sr.results.splice(index, 1, rs.data);
                alertify.success('Invitation was sent successfully.');
            } else {
                alertify.error(rs.message);
            }
        });
    };

    function searchUser(invite) {
        $location.url('/users');
        $location.search('email', invite.email);
    };

    function getAllGroups(isPublic) {
        GroupService.getAllGroups(isPublic).then(function (rs) {
            if(rs.success) {
                GroupService.groups = rs.data;
            }
        });
    };

    function search() {
        var requestVariables = $location.search();
        if (requestVariables) {
            angular.forEach(requestVariables, function (value, key) {
                if(vm.sc[key] !== undefined) {
                    vm.sc[key] = value;
                }
            });
        }
        InvitationService.search(vm.sc).then(function (rs) {
            if (rs.success) {
                vm.sr = rs.data;
            } else {
                alertify.error(rs.message);
            }
        });
        vm.isFiltered = true;
    };

    function reset() {
        if(vm.isFiltered) {
            vm.sc = angular.copy(DEFAULT_SC);
            search();
            vm.isFiltered = false;
        }
    };

    function initController() {
        search();
        if(! GroupService.groups.length) {
            getAllGroups(true);
        }
    };

    // **************************************************************************
    function InviteController($scope, $mdDialog, InvitationService, UtilService, groups, isLDAPConnected) {
        'ngInject';

        $scope.isLDAPConnected = isLDAPConnected;

        $scope.source = null;

        $scope.tryInvite = false;
        $scope.emails = [];
        $scope.groups = angular.copy(groups);
        $scope.userGroup = undefined;

        $scope.SOURCES = ['INTERNAL', 'LDAP'];

        var startedEmail;

        $scope.initMdChipsCtrl = function () {
            var chipsCtrlWatcher = $scope.$watch(function () {
                return getChipsCtrl();
            }, function (newVal, oldVal) {
                if(newVal) {
                    $scope.chipCtrl = newVal;
                    chipsCtrlWatcher();
                }
            });
        };

        function getChipsCtrl() {
            return angular.element("md-chips[name = 'email'] md-chips-wrap").scope().$mdChipsCtrl;
        }

        $scope.invite = function (emails, form) {
            if ($scope.chipCtrl.chipBuffer) {
                startedEmail = $scope.chipCtrl.chipBuffer;
            }
            if (emails && emails.length > 0) {
                $scope.tryInvite = true;
                var invitationTypes = toInvite(emails, $scope.userGroup, $scope.source);
                InvitationService.invite(invitationTypes).then(function (rs) {
                    if (rs.success) {
                        var message = emails.length > 1 ? "Invitations were sent." : "Invitation was sent.";
                        alertify.success(message);
                        if (!startedEmail) {
                            $scope.cancel(rs.data);
                        } else {
                            $scope.emails = [];
                            $scope.emails.push(startedEmail);
                            startedEmail = undefined;
                            $scope.chipCtrl.chipBuffer = '';
                        }
                    } else {
                        UtilService.resolveError(rs, form, 'validationError', 'email').then(function (rs) {
                        }, function (rs) {
                            alertify.error(rs.message);
                        });
                    }
                    $scope.tryInvite = false;
                });
            }
        };

        function toInvite(emails, groupId, source) {
            return {
                invitationTypes: emails.map(function (email) {
                    return { 'email': email, 'groupId': groupId, 'source': source && $scope.SOURCES.indexOf(source) >= 0 ? source : 'INTERNAL' };
                })
            };
        };

        $scope.checkAndTransformRecipient = function (email) {
            if (email.trim().indexOf(' ') >= 0) {
                var emailsArr = email.split(' ');
                $scope.emails = $scope.emails.concat(emailsArr.filter(function (value, index, self) {
                    return emailsArr.indexOf(value) === index && $scope.emails.indexOf(value) == -1 && value.trim();
                }));
            }
        };

        $scope.removeRecipient = function (email) {
            delete $scope.emails[email];
        };

        $scope.hide = function () {
            $mdDialog.hide();
        };
        $scope.cancel = function (invitations) {
            $mdDialog.cancel(invitations);
        };
        (function initController() {

        })();
    }

};

export default InvitationsController;
