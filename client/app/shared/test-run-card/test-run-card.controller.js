'use strict';

const testRunCardController = function testRunCardController(
    $interval,
    $mdDialog,
    $mdMedia,
    $mdToast,
    $rootScope,
    $state,
    $timeout,
    authService,
    DownloadService,
    messageService,
    notificationService,
    TestRunService,
    testsRunsService,
    toolsService,
    UserService,
    UtilService,
) {
        'ngInject';

        const local = {
            currentUser: UserService.currentUser,
        };
        const vm = {
            testRun: null,
            singleMode: false,
            singleWholeInfo: false,
            showNotificationOption: false,
            showBuildNowOption: false,
            showDeleteTestRunOption: false,
            isNotificationAvailable: false,

            addToSelectedTestRuns,
            showDetails: showDetails,
            openMenu: openMenu,
            openTestRun: openTestRun,
            copyLink: copyLink,
            markAsReviewed: markAsReviewed,
            showCommentsDialog: showCommentsDialog,
            sendAsEmail: sendAsEmail,
            exportTestRun: exportTestRun,
            sendNotification,
            buildNow: buildNow,
            abort: abort,
            rerun: rerun,
            onTestRunDelete: onTestRunDelete,
            checkFilePresence: checkFilePresence,
            downloadApplication: downloadApplication,
            goToTestRun: goToTestRun,
            isToolConnected: toolsService.isToolConnected,
            userHasAnyPermission: authService.userHasAnyPermission,
            isButtonVisible,

            get isMobile() { return $mdMedia('xs'); },
            get currentOffset() { return $rootScope.currentOffset; },
            get formattedModel() {
                let jsonModel = JSON.parse(vm.testRun.model);
                let formattedModel = '';

                for (let key in jsonModel) {
                    if (jsonModel[key]) {
                        formattedModel += key + ':' + jsonModel[key] + ' / ';
                    }
                }

                return formattedModel.slice(0, -2);
            },
        };

        return vm;

        function addToSelectedTestRuns() {
            vm.onSelect && vm.onSelect(vm.testRun);
        }

        function showDetails() {
            vm.singleWholeInfo = !vm.singleWholeInfo;
        }

        function initMenuRights() {
            vm.showNotificationOption = (vm.isNotificationAvailable && vm.testRun.channels) && vm.testRun.reviewed;
            vm.showDeleteTestRunOption = true;
        }

        function openMenu($event, $msMenuCtrl) {
            initMenuRights();
            UtilService.setOffset($event);
            $timeout(function() {
                $msMenuCtrl.open($event);
            });
        }

        function openTestRun() {
            const url = $state.href('tests.runDetails', {testRunId: vm.testRun.id});

            window.open(url,'_blank');
        }

        function goToTestRun() {
            $state.go('tests.runDetails', {testRunId: vm.testRun.id});
        }

        function copyLink() {
            const url = $state.href('tests.runDetails', {testRunId: vm.testRun.id}, {absolute : true});

            url.copyToClipboard();
        }

        function markAsReviewed() {
            showCommentsDialog();
        }

        function sendAsEmail(event) {
            showEmailDialog([vm.testRun], event);
        }

        function showCommentsDialog(event) {
            $mdDialog.show({
                controller: 'CommentsController',
                template: require('../../components/modals/comments/comments.html'),
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose:true,
                fullscreen: true,
                locals: {
                    testRun: vm.testRun,
                    isNotificationAvailable: vm.isNotificationAvailable,
                }
            }).then(function(answer) {
                vm.testRun.reviewed = answer.reviewed;
                vm.testRun.comments = answer.comments;
            });
        }

        function showEmailDialog(testRuns, event) {
            $mdDialog.show({
                controller: 'EmailController',
                template: require('../../components/modals/email/email.html'),
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose:true,
                fullscreen: true,
                controllerAs: '$ctrl',
                locals: {
                    testRuns: testRuns
                }
            });
        }

        function exportTestRun() {
            TestRunService.exportTestRunResultsHTML(vm.testRun.id).then(function(rs) {
                if (rs.success && rs.data) {
                    downloadFromByteArray(vm.testRun.testSuite.name.split(' ').join('_') + '.html', rs, 'html');
                } else {
                    if (!rs.data) {
                        rs.message = "Unable to get test run results HTML";
                    }
                    messageService.error(rs.message);
                }
            });
        }

        function downloadFromByteArray(filename, array, contentType) {
            const blob = new Blob([array.data], {type: contentType ? contentType : array.headers('Content-Type')});
            const link = document.createElement('a');

            link.style = 'display: none';
            document.body.appendChild(link);
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            link.click();

            //remove link after 10sec
            $timeout(() => {
                link && document.body.removeChild(link);
            }, 10000);
        }

        function sendNotification() {
            notificationService.triggerReviewNotif(vm.testRun.id);
        }

        function buildNow(event) {
            showBuildNowDialog(event);
        }

        function rerun(event) {
            showRerunDialog(event);
        }

        function showRerunDialog(event) {
            $mdDialog.show({
                controller: 'TestRunRerunController',
                template: require('../../components/modals/rerun/rerun.html'),
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: true,
                fullscreen: true,
                locals: {
                    testRun: vm.testRun,
                }
            });
        }

        function showBuildNowDialog(event) {
            $mdDialog.show({
                controller: 'BuildNowController',
                template: require('../../components/modals/build-now/build-now.html'),
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose:true,
                fullscreen: true,
                locals: {
                    testRun: vm.testRun
                }
            });
        }

        function abort() {
            if (vm.isToolConnected('JENKINS')) {
                TestRunService.abortCIJob(vm.testRun.id, vm.testRun.ciRunId).then(function (rs) {
                    if(!rs.success){
                        messageService.error(rs.message);
                    }
                    const abortCause = {};

                    abortCause.comment = 'Aborted by ' + local.currentUser.username;
                    TestRunService.abortTestRun(vm.testRun.id, vm.testRun.ciRunId, abortCause).then(function(rs) {
                        if (rs.success){
                            vm.testRun.status = 'ABORTED';
                            messageService.success('Testrun ' + vm.testRun.testSuite.name + ' is aborted');
                        } else {
                            messageService.error(rs.message);
                        }
                    });

                });
            } else {
                messageService.error('Unable connect to jenkins');
            }
        }

        function onTestRunDelete() {
            if (vm.singleMode) {
                deleteTestRun();
            } else {
                vm.onDelete && vm.onDelete(vm.testRun);
            }
        }

        function deleteTestRun() {
            const confirmation = confirm('Do you really want to delete "' + vm.testRun.testSuite.name + '" test run?');

            if (confirmation) {
                const id = vm.testRun.id;
                TestRunService.deleteTestRun(id).then(function(rs) {
                    const messageData = rs.success ? {success: rs.success, id: id, message: 'Test run{0} {1} removed'} : {id: id, message: 'Unable to delete test run{0} {1}'};

                    UtilService.showDeleteMessage(messageData, [id], [], []);
                    if (rs.success) {
                        $timeout(function() {
                            testsRunsService.clearDataCache();
                            $state.go('tests.runs');
                        }, 1000);
                    }
                });
            }
        }

        function checkFilePresence() {
            if (!vm.testRun.appVersionValid) {
                vm.testRun.appVersionLoading = true;
                DownloadService.check(vm.testRun.config.appVersion).then(function (rs) {
                    if (rs.success) {
                        vm.testRun.appVersionValid = rs.data;
                    }
                    vm.testRun.appVersionLoading = false;

                    return rs.data;
                });
            }
        }

        function downloadApplication() {
            const appVersion = vm.testRun.config.appVersion;

            DownloadService.download(appVersion).then(function (rs) {
                if (rs.success) {
                    downloadFromByteArray(appVersion, rs.res);
                } else {
                    messageService.error(rs.message);
                }
            });
        }

        function isButtonVisible(name) {
            const defaultRight = vm.userHasAnyPermission(['TEST_RUNS_CI']) && vm.isToolConnected('JENKINS') && vm.testRun?.job?.name !== 'local';

            switch(name) {
                case 'buildNow':
                    return defaultRight;
                case 'abort':
                    return defaultRight && vm.testRun.status === 'IN_PROGRESS';
                case 'rebuild':
                    return defaultRight && vm.testRun.status !== 'IN_PROGRESS';
                default:
                    return false;
            }
        }
    };

export default testRunCardController;
