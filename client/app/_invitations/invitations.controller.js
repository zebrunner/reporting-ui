'use strict';

import inviteUserModalTpl from '../shared/modals/invitation-modal/invitation-modal.html';
import inviteUserModalCtrl from '../shared/modals/invitation-modal/invitation-modal.controller';

const InvitationsController = function InvitationsController(
    $location,
    $mdDialog,
    authService,
    GroupService,
    InvitationService,
    toolsService,
    messageService,
    pageTitleService,
) {

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
        copyLink: copyLink,
        userHasAnyPermission: authService.userHasAnyPermission,

        get currentTitle() { return pageTitleService.pageTitle; },
        get groups() {return GroupService.groups;},
    };

    vm.$onInit = initController;

    return vm;

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

    function copyLink(invite) {
        invite.url.copyToClipboard();
        messageService.success('Link copied to clipboard');
    }

    function takeOff(invite, index) {
        InvitationService.deleteInvitation(invite.id).then(function (rs) {
            if (rs.success) {
                vm.sr.results.splice(index, 1);
                messageService.success('Invitation was taken off successfully.');
            } else {
                messageService.error(rs.message);
            }
        });
    };

    function retryInvite(invite, index) {
        InvitationService.retryInvite(invite).then(function (rs) {
            if (rs.success) {
                vm.sr.results.splice(index, 1, rs.data);
                messageService.success('Invitation was sent successfully.');
            } else {
                messageService.error(rs.message);
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
                messageService.error(rs.message);
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
        if (!GroupService.groups.length) {
            getAllGroups(true);
        }
    }
};

export default InvitationsController;
