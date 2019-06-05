'use strict';

import 'brace';
import 'brace/mode/json';
import 'brace/theme/eclipse';
import 'angular-ui-ace';

const CiHelperController = function CiHelperController($scope, $rootScope, $q, $window, $mdDialog, $timeout, $interval, windowWidthService, LauncherService, UserService, ScmService, messageService, UtilService, API_URL) {
    'ngInject';

    $scope.ciOptions = {};

    $scope.editor = {
        text: ''
    };

    $scope.testSuites = [];
    $scope.scmAccounts = [];
    $scope.scmAccount = {};
    $scope.launcherScan = {
        branch: 'master'
    };
    $scope.isMobile = windowWidthService.isMobile();

    const TENANT = $rootScope.globals.auth.tenant;

    $scope.launcherLoaderStatus = {
        determinateValue: 20,
        started: false,
        finished: false,
        buildNumber: null,
        rescan: false
    };

    $scope.jsonModel = {};

    $scope.aceOptions = {
        useWrapMode : true,
        showGutter: false,
        theme:'eclipse',
        mode: 'json',
        firstLineNumber: 5,
        rendererOptions: {
            fontSize: '14px'
        }
    };

    let prevLauncher;
    let prevFolder;

    $scope.onLoad = function(editor) {
    };

    $scope.onChange = function(editor) {
    };

    let gitHubPopUp;

    $scope.DEFAULT_TEMPLATES = {
        model: {},
        variants:[
            {
                name: 'Web',
                json: {
                    "browser": [
                        "chrome",
                        "firefox"
                    ],
                    "thread_count": 5,
                    "branch": "*/master",
                    "email_list": "demo@qaprosoft.com",
                    "suite": "web"
                }
            },
            {
                name: 'Mobile',
                json: {
                    "platform": "ANDROID",
                    "thread_count": 5,
                    "branch": "*/master",
                    "email_list": "demo@qaprosoft.com",
                    "suite": "android"
                }
            },
            {
                name: 'API',
                json: {
                    "platform": "API",
                    "thread_count": 5,
                    "branch": "*/master",
                    "email_list": "demo@qaprosoft.com",
                    "suite": "api"
                }
            }
        ]
    };

    var newGithubRepoCloseClass = 'zf-button-close';
    var newGithubRepoRevertCloseClass = 'zf-button-close-revert';

    $scope.states = {};
    $scope.states.addGitRepo = false;

    var onAddNewGithubRepoClose;

    $scope.switchFolder = function(e, element, forceExpand) {
        const expandFolderClassName = 'expand-folder';
        const expandFolderFinishClassName = 'expand-folder_finish';
        const switchFolderElement = element ? element : angular.element(e.target);
        const folderElement = angular.element(switchFolderElement.closest('.folder-container'));
        if(folderElement.hasClass(expandFolderClassName) && ! forceExpand) {
            folderElement.addClass(expandFolderFinishClassName);
            folderElement.removeClass(expandFolderClassName);
            $timeout(function () {
                folderElement.removeClass(expandFolderFinishClassName);
            }, 150);
        } else {
            folderElement.addClass(expandFolderClassName);
        }
    };

    $scope.switchFolderMobile = function(event, scmAccountId) {
        $scope.switchFolder(event);
        //$scope.highlightFolder(scmAccountId);
        $scope.launcher = {};
    };

    $scope.addNewGithubRepo = function(element, forceClose) {
        $scope.states.addGitRepo = forceClose ? false : ! $scope.states.addGitRepo;
        if($scope.states.addGitRepo) {
            $scope.connectToGitHub().then(function () {
                if(element) {
                    addNewGithubRepoCssApply(element, $scope.states.addGitRepo);
                }
            }, function () {
                $scope.states.addGitRepo = false;
            });
        } else {
            addNewGithubRepoCssApply(element, $scope.states.addGitRepo);
            if(gitHubPopUp) {
                gitHubPopUp.close();
            }
        }
    };

    function addNewGithubRepoCssApply(element, isAdd) {
        var el = angular.element(element).closest('button');
        if(isAdd) {
            el.addClass(newGithubRepoCloseClass);
            onAddNewGithubRepoClose = function () {
                $scope.addNewGithubRepo(el);
                addNewGithubRepoCssApply(element, $scope.states.addGitRepo);
            }
        } else {
            el.removeClass(newGithubRepoCloseClass);
            el.addClass(newGithubRepoRevertCloseClass);
            onAddNewGithubRepoClose = undefined;
            $timeout(function () {
                el.removeClass(newGithubRepoRevertCloseClass);
            }, 500);
        }
    };

    function closeConnectGithubBlock() {
        $scope.addNewGithubRepo(angular.element("#connect-github"), true);
    };

    $scope.mergeTemplate = function (template) {
        if(template) {
            $scope.launcher.model = $scope.launcher.model && $scope.launcher.model.isJsonValid() ? $scope.launcher.model : "{}";
            var json = $scope.launcher.model.toJson();
            $scope.launcher.model = JSON.stringify(/*angular.merge(json, template)*/template, null, 2);
        }
    };

    $scope.cardNumber = 0;
    $scope.builtLauncher = {
        model: {},
        type: {}
    };

    $scope.applyBuilder = function(launcher, isPhone) {
        applyBuilder(launcher);
        $scope.cardNumber = isPhone ? 3 : 2;
    };

    function applyBuilder(launcher) {
        $scope.jsonModel = {};
        $scope.builtLauncher = {model: {}, type: {}};
        $scope.jsonModel = launcher.model.toJson();
        angular.forEach($scope.jsonModel, function (value, key) {
            var type = $scope.getType(value);
            var val = type === 'array' && value.length ? value[0] : value;
            $scope.builtLauncher.model[key] = val;
            $scope.builtLauncher.type[key] = type;
        });
    };

    $scope.getType = function (value) {
        return angular.isArray(value) ? 'array' : typeof value === "boolean" ? 'boolean' : typeof value === 'string' || value instanceof String ? 'string' : Number.isInteger(value) ? 'int' : 'none';
    };

    $scope.getElement = function(item) {
        var result;
        if(angular.isArray(item)) {
            result = 'select'
        } else if(item === true || item === false) {
            result = 'checkbox'
        } else {
            result = 'input';
        }
        return result;
    };

    $scope.addTemplate = function() {
        $scope.cardNumber = 2;
        $scope.launcher = {};
        $scope.DEFAULT_TEMPLATES.model = {};
    };

    $scope.addRepo = function() {
        $scope.repo = {};
        $scope.connectToGitHub().then(function () {
            clearPrevLauncherElement();
            clearPrevFolderElement();
            $scope.cardNumber = 1;
        });
    };

    $scope.highlightFolder = function(id) {
        clearPrevLauncherElement();
        clearPrevFolderElement();
        chooseFolderElement(id);
    };

    $scope.manageFolder = function (scmAccount) {
        getScmAccountDefaultBranchName(scmAccount.id);
        clearLauncher();
        $scope.highlightFolder(scmAccount.id);
        $scope.cardNumber = 2;
        $scope.scmAccount = angular.copy(scmAccount);
        $scope.launcher.scmAccountType = angular.copy(scmAccount);
    };

    $scope.addLauncher = function(launcher) {
        $scope.createLauncher(launcher).then(function (l) {
            appendLauncher(l);
            clearLauncher();
            $scope.chooseLauncher(l);
        });
    };

    $scope.toEditLauncher = function(launcher) {
        //clearLauncher();
        //$scope.launcher = angular.copy(launcher);
        $scope.cardNumber = 2;
    };

    function getScmAccountDefaultBranchName(id) {
        ScmService.getDefaultBranch(id).then(function (rs) {
            if(rs.success) {
                $scope.launcherScan.branch = rs.data;
            }
        });
    };

    $scope.onFilterSearchChange = function(value) {
        $timeout(function () {
            const emptySearchClassName = '__empty-search';
            //find all folder elements
            const folders = angular.element('.folder-container');
            angular.forEach(folders, function (folder) {
                folder = angular.element(folder);
                // if search value is not empty hide folders without elements and expand needed
                // else if search value is empty show all hidden folders
                if(value) {
                    const hasItems = !! folder.find(".folder-container_item_list_item").length;
                    if(! hasItems) {
                        folder.addClass(emptySearchClassName);
                    } else {
                        folder.removeClass(emptySearchClassName);
                        const folderIcons = folder.find(".folder-container_folder_icon");
                        angular.forEach(folderIcons, function (folderIcon) {
                            $scope.switchFolder(null, folderIcon, true);
                        });
                    }
                } else {
                    if(folder.hasClass(emptySearchClassName)) {
                        folder.removeClass(emptySearchClassName);
                    }
                }
            });
        }, 0, false);
    };

    $scope.launchers = [];

    function clearLauncher() {
        $scope.launcher = {};
        $scope.launcher.scmAccountType = {};
    };

    $scope.editLauncher = function(launcher) {
        $scope.launcher = angular.copy(launcher);
        $scope.cardNumber = 2;
        closeConnectGithubBlock();
    };


    $scope.chooseLauncher = function(launcher, skipBuilderApply) {
        highlightLauncher(launcher.id);
        $scope.launcher = angular.copy(launcher);
        $scope.DEFAULT_TEMPLATES.model = {};
        if(! skipBuilderApply) {
            $scope.applyBuilder(launcher);
            $scope.cardNumber = 3;
        }
    };

    $scope.selectLauncher = function (launcher) {
        $scope.chooseLauncher(launcher, true);
        applyBuilder(launcher);
    };

    function highlightLauncher(launcherId) {
        $timeout(function () {
            clearPrevLauncherElement();
            clearPrevFolderElement();
            chooseLauncherElement(launcherId);
        }, 0, false);
    };

    function chooseLauncherElement(launcherId) {
        const chosenLauncherClass = 'chosen-launcher';
        const launcherElement = angular.element('.launcher-' + launcherId);
        prevLauncher = launcherElement;
        launcherElement.addClass(chosenLauncherClass)
    };

    function chooseFolderElement(folderId) {
        const chosenFolderClass = 'chosen-launcher';
        const folderElement = angular.element('.folder-container-' + folderId + ' .folder-container_folder_name');
        prevFolder = folderElement;
        folderElement.addClass(chosenFolderClass)
    };

    function clearPrevLauncherElement() {
        const chosenLauncherClass = 'chosen-launcher';
        if(prevLauncher) {
            prevLauncher.removeClass(chosenLauncherClass);
        }
    };

    function clearPrevFolderElement() {
        const chosenFolderClass = 'chosen-launcher';
        if(prevFolder) {
            prevFolder.removeClass(chosenFolderClass);
        }
    };

    $scope.chooseLauncherPhone = function(launcher) {
        $scope.chooseLauncher(launcher, true);
        $scope.cardNumber = 3;
    };

    $scope.navigateBack = function() {
        $scope.cardNumber = 0;
    };

    $scope.createLauncher = function(launcher) {
        return $q(function (resolve, reject) {
            LauncherService.createLauncher(launcher).then(function (rs) {
                if (rs.success) {
                    $scope.launcher = rs.data;
                    $scope.launchers.push(rs.data);
                    messageService.success('Launcher was created');
                    resolve($scope.launcher);
                } else {
                    messageService.error(rs.message);
                    reject();
                }
                $scope.applyBuilder(launcher);
            });
        });
    };

    $scope.updateLauncher = function(launcher) {
        var index = $scope.launchers.indexOfField('id', launcher.id);
        LauncherService.updateLauncher(launcher).then(function (rs) {
            if (rs.success) {
                const l = rs.data;
                $scope.launchers.splice(index, 1, l);
                const indexScmAccount = $scope.scmAccounts.indexOfField('id', l.scmAccountType.id);
                if(indexScmAccount !== -1) {
                    const scmAccount = $scope.scmAccounts[indexScmAccount];
                    const scmAccountLauncherIndex = scmAccount.launchers.indexOfField('id', l.id);
                    scmAccount.launchers.splice(scmAccountLauncherIndex, 1, l);
                }
                messageService.success('Launcher was updated');
            } else {
                messageService.error(rs.message);
            }
            $scope.applyBuilder(launcher);
        });
    };

    $scope.deleteLauncher = function (id) {
        if(id) {
            var index = $scope.launchers.indexOfField('id', id);
            LauncherService.deleteLauncherById(id).then(function (rs) {
                if (rs.success) {
                    $scope.launchers.splice(index, 1);
                    $scope.launcher = {};
                    $scope.cardNumber = 0;

                    const l = $scope.launchers[index];
                    const indexScmAccount = $scope.scmAccounts.indexOfField('id', l.scmAccountType.id);
                    if(indexScmAccount !== -1) {
                        const scmAccount = $scope.scmAccounts[indexScmAccount];
                        const scmAccountLauncherIndex = scmAccount.launchers.indexOfField('id', id);
                        scmAccount.launchers.splice(scmAccountLauncherIndex, 1);
                    }

                    messageService.success('Template was deleted');
                } else {
                    messageService.error(rs.message);
                }
            });
        }
    };

    $scope.deleteRepository = function(scmAccountId) {
        ScmService.deleteScmAccount(scmAccountId).then(function (rs) {
            if(rs.success) {
                const scmAccountIndex = $scope.scmAccounts.indexOfField('id', scmAccountId);
                $scope.cardNumber = 0;
                clearPrevLauncherElement();
                clearPrevFolderElement();
                clearLauncher();
                $scope.scmAccounts.splice(scmAccountIndex, 1);
                messageService.success('Repository was deleted');
            } else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.saveLauncher = function (launcher) {
        launcher.errorMessage = buildError(launcher);
        if(! launcher.errorMessage && !launcher.errorMessage.length) {
            if (launcher.id) {
                var index = $scope.launchers.indexOfField('id', launcher.id);
                LauncherService.updateLauncher(launcher).then(function (rs) {
                    if (rs.success) {
                        $scope.launchers.splice(index, 1, rs.data);
                    } else {
                        messageService.error(rs.message);
                    }
                });
            } else {
                LauncherService.createLauncher(launcher).then(function (rs) {
                    if (rs.success) {
                        $scope.launcher = rs.data;
                        $scope.launchers.push(rs.data);
                    } else {
                        messageService.error(rs.message);
                    }
                });
            }
            $scope.applyBuilder(launcher);
        }
    };

    $scope.scanRepository = function (launcherScan, rescan) {
        if(launcherScan && launcherScan.branch && $scope.scmAccount.id) {
            initWebsocket();
            launcherScan.scmAccountId = $scope.scmAccount.id;
            launcherScan.rescan = !! rescan;
            LauncherService.scanRepository(launcherScan).then(function (rs) {
                if (rs.success) {
                    $scope.launcherLoaderStatus.buildNumber = rs.data;
                    $scope.launcherLoaderStatus.rescan = launcherScan.rescan;
                    $scope.launcherLoaderStatus.started = true;
                } else {
                    $scope.launcherLoaderStatus.started = false;
                    messageService.error(rs.message);
                }
            });
        }
    };

    $scope.cancelScanRepository = function() {
        const buildNumber = $scope.launcherLoaderStatus.buildNumber;
        const scmAccountId = $scope.scmAccount.id;
        const rescan = $scope.launcherLoaderStatus.rescan;
        LauncherService.abortScanRepository(buildNumber, scmAccountId, rescan).then(function (rs) {
            disconnectWebsocket();
            if(rs.success) {
                $scope.launcherLoaderStatus.started = false;
                $scope.launcherLoaderStatus.finished = false;
                messageService.success('Repository scan was stopped');
            } else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.onScanRepositoryFinish = function () {
        disconnectWebsocket();
        runPseudoDeterminateProgress(150, 5);
        $scope.launcherLoaderStatus.started = false;
        $scope.launcherLoaderStatus.finished = true;
        $scope.launcherLoaderStatus.determinateValue = 20;
    };

    function runPseudoDeterminateProgress(millisToLoad, step) {
        const timeout = Math.round(millisToLoad * step / (100 - $scope.launcherLoaderStatus.determinateValue));
        const interval = $interval(function () {
            if($scope.launcherLoaderStatus.determinateValue === 100) {
                $interval.cancel(interval);
                return;
            }
            $scope.launcherLoaderStatus.determinateValue += step;
        }, timeout, 0, true);
    };

    $scope.backToLaunchersList = function () {
        $scope.launcherLoaderStatus.finished = false;
    };

    $scope.backToLaunchersList = function () {
        $scope.launcherLoaderStatus.finished = false;
    };

    $scope.hasAutoScannedLaunchers = function (launchers) {
        return launchers && !! launchers.find(function (launcher) {
            return launcher.autoScan;
        });
    };

    function buildError(launcher) {
        var messages = [];
        var errorMessage = '';
        if(! launcher.model) {
            messages.push('code');
        }
        if(! launcher.name) {
            messages.push('name');
        }
        if(! launcher.scmAccountType || ! launcher.scmAccountType.id) {
            messages.push('repository');
        }
        if(messages.length) {
            errorMessage = 'Set ';
            messages.forEach(function (message, index) {
                errorMessage += message
                errorMessage = index !== messages.length - 1 ? errorMessage + ', ' : errorMessage;
            });
            errorMessage += ' for template to save.';
        } else if(! launcher.model.isJsonValid(true)) {
            errorMessage = 'Code is not valid.';
        }
        return errorMessage;
    };

    $scope.cancelLauncher = function () {
        $scope.cardNumber = 3;
    };

    function getAllLaunchers() {
        return $q(function (resolve, reject) {
            LauncherService.getAllLaunchers().then(function (rs) {
                if(rs.success) {
                    resolve(rs.data);
                } else {
                    messageService.error(rs.message);
                    reject();
                }
            });
        });
    };

    // $scope.updateLauncher = function(launcher, index) {
    //     LauncherService.updateLauncher(launcher).then(function (rs) {
    //         if(rs.success) {
    //             $scope.launchers.splice(index, 1, rs.data);
    //         } else {
    //             messageService.error(rs.message);
    //         }
    //     });
    // };

    $scope.deleteLauncherById = function(id, index) {
        LauncherService.deleteLauncherById(id).then(function (rs) {
            if(rs.success) {
                $scope.launchers.splice(index, 1);
            } else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.repositories = [];
    $scope.organizations = [];
    $scope.scmAccount = {};

    function getClientId() {
        return $q(function (resolve, reject) {
            ScmService.getClientId().then(function (rs) {
                if(rs.success) {
                    resolve(rs.data);
                }
            });
        });
    };
    $scope.clientId = '';

    $scope.connectToGitHub = function() {
        return $q(function (resolve, reject) {
            if($scope.clientId) {
                var host = $window.location.host;
                var tenant = host.split('\.')[0];
                var redirectURI = $window.location.protocol + "//" + host.replace(tenant, 'api') + "/github/callback/" + tenant;
                var url = 'https://github.com/login/oauth/authorize?client_id=' + $scope.clientId + '&scope=user%20repo%20readAorg&redirect_uri=' + redirectURI;
                var height = 650;
                var width = 450;
                var location = getCenterWindowLocation(height, width);
                var gitHubPopUpProperties = 'toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0,width=' + width + ', height=' + height + ', top=' + location.top + ', left=' + location.left;
                gitHubPopUp = $window.open(url, 'GithubAuth', gitHubPopUpProperties);

                var localStorageWatcher = $interval(function () {
                    var code = localStorage.getItem('code');
                    if(code) {
                        resolve();
                        codeExchange(code);
                        localStorage.removeItem('code');
                        $interval.cancel(localStorageWatcher);
                    }
                }, 200);

                if (window.focus) {
                    gitHubPopUp.focus();
                }
            }
        });
    };

    function codeExchange(code) {
        if (code) {
            initAccessToken(code).then(function (scmAccount) {
                $scope.scmAccount = scmAccount;
                $scope.getOrganizations();
            });
        }
    };

    $scope.getOrganizations = function() {
        ScmService.getOrganizations($scope.scmAccount.id).then(function (rs) {
            if(rs.success) {
                $scope.organizations = rs.data;
            }
        });
    };

    $scope.getRepositories = function() {
        $scope.repositories = {};
        var organizationName = $scope.scmAccount.organizationName ? $scope.scmAccount.organizationName : '';
        ScmService.getRepositories($scope.scmAccount.id, organizationName).then(function (rs) {
            if(rs.success) {
                $scope.repositories = rs.data;
            }
        });
    };

    $scope.addScmAccount = function (scmAccount) {
        scmAccount.organizationName = scmAccount.organization.name;
        scmAccount.avatarURL = scmAccount.organization.avatarURL;
        scmAccount.repositoryName = scmAccount.repository.name;
        scmAccount.repositoryURL = scmAccount.repository.url;
        ScmService.updateScmAccount(scmAccount).then(function (rs) {
            if(rs.success) {
                $scope.scmAccounts.push(rs.data);
                $scope.launcher.scmAccountType = rs.data;
                $scope.organizations = [];
                $scope.repositories = [];
                $scope.cardNumber = 0;

                // switch folder if new
                $timeout(function () {
                    const newScmAccountElement = angular.element('.folder-container-' + rs.data.id + ' .folder-container_folder_icon');
                    $scope.switchFolder(null, newScmAccountElement, true);
                }, 0, false);
            } else {
                messageService.error(rs.message);
            }
        });
    };

    function initAccessToken(code) {
        return $q(function (resolve, reject) {
            ScmService.exchangeCode(code).then(function (rs) {
                if(rs.success) {
                    resolve(rs.data);
                }
            });
        });
    };

    function getCenterWindowLocation(height, width) {
        var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
        var dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
        var w = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
        var h = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
        var left = ((w / 2) - (width / 2)) + dualScreenLeft;
        var top = ((h / 2) - (height / 2)) + dualScreenTop;
        return {'top': top, 'left': left};
    }

    $scope.build = function(launcher) {
        launcher.model = JSON.stringify($scope.builtLauncher.model, null, 2);
        LauncherService.buildLauncher(launcher).then(function (rs) {
            if(rs.success) {
                messageService.success("Job is in progress");
                $scope.hide();
            } else {
                messageService.error(rs.message);
            }
        });
    };

    function appendLauncher(launcher) {
        $scope.launchers.push(launcher);
        const scmAccountIndex = $scope.scmAccounts.indexOfField('id', launcher.scmAccountType.id);
        const scmAccount = $scope.scmAccounts[scmAccountIndex];
        scmAccount.launchers = scmAccount.launchers || [];
        scmAccount.launchers.push(launcher);
    };

    let zafiraWebsocket;
    let subscriptions = {};

    function initWebsocket() {
        const wsName = 'zafira';

        zafiraWebsocket = Stomp.over(new SockJS(API_URL + '/api/websockets'));
        zafiraWebsocket.debug = null;
        zafiraWebsocket.connect({withCredentials: false}, function () {
            subscriptions.launchers = subscribeLaunchersTopic();
            UtilService.websocketConnected(wsName);
        }, function () {
            UtilService.reconnectWebsocket(wsName, initWebsocket);
        });
    };

    function subscribeLaunchersTopic() {
        return zafiraWebsocket.subscribe('/topic/' + TENANT + '.launchers', function (data) {
            const event = getEventFromMessage(data.body);

            const success = event.success;
            const userId = event.userId;
            if(UserService.currentUser.id === userId && success) {
                if($scope.scmAccount.launchers) {
                    $scope.scmAccount.launchers.forEach(function (l) {
                        const index = $scope.launchers.indexOfField('id', l.id);
                        $scope.launchers.splice(index, 1);
                    });
                }
                Array.prototype.push.apply($scope.launchers, event.launchers);
                const scmIndex = $scope.scmAccounts.indexOfField('id', $scope.scmAccount.id);
                $scope.scmAccounts[scmIndex].launchers = event.launchers;
            } else {
                messageService.error('Unable to scan repository');
            }
            $scope.onScanRepositoryFinish();
            $scope.$apply();
        });
    };

    function getEventFromMessage(message) {
        return JSON.parse(message.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    };

    function disconnectWebsocket() {
        if(zafiraWebsocket && zafiraWebsocket.connected) {
            subscriptions.launchers && subscriptions.launchers.unsubscribe();
            zafiraWebsocket.disconnect();
            UtilService.websocketConnected('zafira');
        }
    };

    $scope.$on('$destroy', function () {
        disconnectWebsocket();
    });

    $scope.hide = function(testRun) {
        $mdDialog.hide(testRun);
    };

    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    (function initController() {
        clearLauncher();
        const launchersPromise = getAllLaunchers().then(function (launchers) {
            return $q(function (resolve, reject) {
                $scope.launchers = launchers;
                resolve();
            });
        });
        getClientId().then(function (clientId) {
            $scope.clientId = clientId;
        });
        const scmAccountsPromise = ScmService.getAllScmAccounts().then(function (rs) {
            return $q(function (resolve, reject) {
                if (rs.success) {
                    if (rs.data && rs.data.length) {
                        $scope.scmAccounts = rs.data.filter(function (scmAccount) {
                            return scmAccount.repositoryURL;
                        });
                    }
                    resolve();
                } else {
                    messageService.error(rs.message);
                    reject();
                }
            });
        });
        $q.all([launchersPromise, scmAccountsPromise]).then(function (data) {
            $scope.scmAccounts.forEach(function (scmAccount) {
                $scope.launchers.forEach(function (launcher) {
                    if(launcher.scmAccountType.id === scmAccount.id) {
                        scmAccount.launchers = scmAccount.launchers || [];
                        scmAccount.launchers.push(launcher);
                    }
                });
            });
        });
    })();
};

export default CiHelperController;
