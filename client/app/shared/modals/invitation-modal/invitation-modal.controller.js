'use strict';

const inviteModalController = (
    $scope,
    $mdDialog,
    InvitationService,
    UtilService,
    groups,
    isLDAPConnected,
    messageService,
    $mdConstant
) => {
    'ngInject';

    $scope.isLDAPConnected = isLDAPConnected;

    $scope.source = null;

    $scope.tryInvite = false;
    $scope.emails = [];
    $scope.groups = angular.copy(groups);
    $scope.userGroup = undefined;

    $scope.SOURCES = ['INTERNAL', 'LDAP'];
    $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.TAB, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SEMICOLON, $mdConstant.KEY_CODE.SPACE];
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
                    messageService.success(message);
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
                        messageService.error(rs.message);
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
    }

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
};

export default inviteModalController;
