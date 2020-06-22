'use strict';

const IssuesModalController = function IssuesModalController(
    $scope,
    $mdDialog,
    $mdMedia,
    $interval,
    TestService,
    test,
    isNewIssue,
    toolsService,
    messageService,
) {
    'ngInject';

    const vm = {
        isNewIssue: isNewIssue,
        issueJiraIdInputIsChanged: false,
        selectedIssue: false,
        issueJiraIdExists: false,
        issueTabDisabled: true,
        isIssueFound: true,
        isIssueClosed: false,
        test: angular.copy(test),
        issues: [],
        ticketStatuses: ['TO DO', 'OPEN', 'NOT ASSIGNED', 'IN PROGRESS', 'FIXED', 'REOPENED', 'DUPLICATE'],
        assignIssue: assignIssue,
        unassignIssue: unassignIssue,
        initIssueSearch: initIssueSearch,
        hide: hide,
        cancel: cancel,
        isToolConnected: toolsService.isToolConnected,
        get isConnectedToJira() { return toolsService.isToolConnected('JIRA'); },
        get isMobile() { return $mdMedia('xs'); },
    };

    vm.$onInit = initController;

    return vm;

    function initController() {
        getJiraClosedStatusName();
        initAttachedWorkItems();
        initNewIssue();
        getIssues();
        bindEvents();
    }

    function updateWorkItemList(workItem) {
        const issueToDelete = vm.issues.find(({ jiraId }) => jiraId === workItem.jiraId);

        if (issueToDelete) {
            deleteWorkItemFromList(issueToDelete, workItem);
        } else {
            vm.issues.push(workItem);
        }
        unlinkOldTicket();
        vm.test.workItems.push(workItem);
    }

    function unlinkOldTicket() {
        vm.test.workItems = vm.test.workItems.filter(({ type }) => type !== 'BUG');
    }

    function deleteWorkItemFromList(workItem, itemToAdd) {
        const issueIndex = vm.issues.findIndex(({ jiraId }) => jiraId === workItem.jiraId);

        if (issueIndex !== -1) {
            vm.issues.splice(issueIndex, 1, itemToAdd);
        }
        deleteWorkItemFromTestWorkItems(workItem);
    }

    function deleteWorkItemFromTestWorkItems(workItem) {
        const workItemIndex = vm.test.workItems.findIndex(({ jiraId }) => jiraId === workItem.jiraId);

        if (workItemIndex !== -1) {
            vm.test.workItems.splice(workItemIndex, 1);
        }
    }

    /** ISSUE functionality */

    /* Assigns issue to the test */

    function assignIssue(issue, keyWord) {
        if (!issue.testCaseId) {
            issue.testCaseId = test.testCaseId;
        }
        issue.type = 'BUG';
        TestService.createTestWorkItem(test.id, issue)
            .then((rs) => {
                const workItemType = issue.type;
                const jiraId = issue.jiraId;
                let message;

                if (rs.success) {
                    var messageWord;
                    switch (keyWord) {
                        case 'SAVE':
                            messageWord = issue.id ? 'updated' : 'created';
                            break;
                        case 'LINK':
                            messageWord = 'linked';
                            break;
                    }
                    message = generateActionResultMessage(workItemType, jiraId, messageWord, true);
                    vm.newIssue = angular.copy(rs.data);
                    updateWorkItemList(rs.data);
                    vm.initIssueSearch(false);
                    initAttachedWorkItems();
                    vm.isNewIssue = jiraId !== vm.attachedIssue.jiraId;
                    messageService.success(message);
                } else {
                    if (vm.isNewIssue) {
                        message = generateActionResultMessage(workItemType,
                            jiraId, 'assign', false);
                    } else {
                        message = generateActionResultMessage(workItemType,
                            jiraId, 'update', false);
                    }
                    messageService.error(message);
                }
            });
    }

    /* Unassignes issue from the test */

    function unassignIssue(workItem) {
        TestService.deleteTestWorkItem(test.id, workItem.id)
            .then(function(rs) {
                let  message;

                if (rs.success) {
                    message = generateActionResultMessage(workItem.type, workItem.jiraId, "unlinked", true);
                    deleteWorkItemFromTestWorkItems(workItem);
                    initAttachedWorkItems();
                    initNewIssue();
                    vm.selectedIssue = false;
                    messageService.success(message);
                } else {
                    message = generateActionResultMessage(workItem.type,
                        workItem.jiraId, 'unassign', false);
                    messageService.error(message);
                }
                vm.issueJiraIdExists = false;
            });
    }

    function initIssueSearch(isInvalid) {
        vm.newIssue.description = '';
        vm.newIssue.status = null;
        vm.newIssue.assignee = null;
        vm.newIssue.reporter = null;
        vm.newIssue.blocker = null;
        if (isInvalid) {
            return;
        }
        vm.issueJiraIdExists = false;
        vm.issueJiraIdInputIsChanged = true;
        vm.newIssue.id = null;
        vm.isIssueClosed = false;
        vm.isIssueFound = false;
        vm.isNewIssue = true;
        const existingIssue = vm.issues.find(foundIssue => foundIssue.jiraId === vm.newIssue.jiraId);
        if (existingIssue) {
            vm.newIssue = Object.assign({}, existingIssue);
        }
    };

    /* Writes all attached to the test workitems into scope variables.
    Used for initialization and reinitialization */

    function initAttachedWorkItems() {
        var attachedWorkItem = {};
        attachedWorkItem.jiraId = '';
        vm.attachedIssue = attachedWorkItem;
        var workItems = vm.test.workItems;
        for (var i = 0; i < workItems.length; i++) {
            switch (workItems[i].type) {
                case 'BUG':
                    vm.attachedIssue = workItems[i];
                    break;
            }
        }
    }

    /* Searches issue in Jira by Jira ID */

    function searchIssue(issue) {
        vm.isIssueFound = false;
        TestService.getJiraTicket(issue.jiraId).then(function(rs) {
            if (rs.success) {
                var searchResultIssue = rs.data;
                vm.isIssueFound = true;
                if (searchResultIssue === '') {
                    vm.isIssueClosed = false;
                    vm.issueJiraIdExists = false;
                    vm.issueTabDisabled = false;
                    return;
                }
                vm.issueJiraIdExists = true;
                vm.isIssueClosed = vm.closedStatusName.toUpperCase() ===
                    searchResultIssue.status.toUpperCase();
                vm.newIssue.description = searchResultIssue.summary;
                vm.newIssue.assignee = searchResultIssue.assigneeName || '';
                vm.newIssue.reporter = searchResultIssue.reporterName || '';
                vm.newIssue.status = searchResultIssue.status.toUpperCase();
                vm.isNewIssue = vm.newIssue.jiraId !== vm.attachedIssue.jiraId;
                vm.issueTabDisabled = false;
            }
        });
    }

    /*  Checks whether conditions for issue search in Jira are fulfilled */

    function isIssueSearchAvailable(jiraId) {
        if (vm.isToolConnected('JIRA') && jiraId) {
            if (vm.issueTabDisabled || vm.issueJiraIdInputIsChanged) {
                vm.issueJiraIdInputIsChanged = false;
                return true;
            }
        } else {
            vm.isIssueFound = true;
            return false;
        }
    }

    /* Initializes empty issue */

    function initNewIssue(isInit) {
        if (isInit) {
            vm.isNewIssue = isNewIssue;
        } else {
            vm.isNewIssue = true;
        }
        vm.newIssue = {};
        vm.newIssue.type = "BUG";
        vm.newIssue.testCaseId = test.testCaseId;
    }

    /* Gets issues attached to the testcase */

    function getIssues() {
        TestService.getTestCaseWorkItemsByType(test.id, 'BUG').
            then(function(rs) {
                if (rs.success) {
                    vm.issues = rs.data;
                    if (test.workItems.length && vm.attachedIssue) {
                        angular.copy(vm.attachedIssue, vm.newIssue);
                    }
                } else {
                    messageService.error(rs.message);
                }
            });
    }

    /* Gets from DB JIRA_CLOSED_STATUS name for the current project*/

    function getJiraClosedStatusName() {
        toolsService.fetchIntegrationOfTypeByName('TEST_CASE_MANAGEMENT')
            .then(rs => {
                if (rs.success) {
                    const jira = rs.data.find((data) => data.name === 'JIRA');
                    const setting = jira.settings.find((setting) => setting.param.name === 'JIRA_CLOSED_STATUS');

                    if (setting) {
                        vm.closedStatusName = setting.value ? setting.value.toUpperCase() : null;
                    }
                } else {
                    messageService.error(rs.message);
                }
            });
    }

    /* On Jira ID input change makes search if conditions are fulfilled */

    /* Closes search interval when the modal is closed */
    function bindEvents() {
        let workItemSearchInterval = $interval(function() {
            if (vm.issueJiraIdInputIsChanged) {
                if (isIssueSearchAvailable(vm.newIssue.jiraId)) {
                    searchIssue(vm.newIssue);
                }
            }
        }, 2000);

        $scope.$on('$destroy', function() {
            if (workItemSearchInterval)
                $interval.cancel(workItemSearchInterval);
        });

        let issueOnModalOpenSearch = $interval(function() {
            if (angular.element(document.body).hasClass('md-dialog-is-showing')) {
                if (!isIssueSearchAvailable(vm.newIssue.jiraId)) {
                    vm.issueTabDisabled = false;
                } else {
                    searchIssue(vm.newIssue);
                }
                $interval.cancel(issueOnModalOpenSearch);
            }
        }, 500);
    }

    /* Generates result message for action comment (needed to be stored into DB and added in UI alert) */
    function generateActionResultMessage(item, id, action, success) {
        if (success) {
            return 'Issue ' + id + ' was ' + action;
        } else {
            return 'Failed to ' + action + ' ' + item.toLowerCase();
        }
    }

    function hide() {
        $mdDialog.hide(test);
    }

    function cancel() {
        $mdDialog.cancel(vm.test);
    }
};

export default IssuesModalController;
