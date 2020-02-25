'use strict';

import 'brace';
import 'brace/mode/json';
import 'brace/theme/eclipse';
import 'angular-ui-ace';

const CiHelperController = function CiHelperController(
    $scope,
    $rootScope,
    $q,
    toolsService,
    $window,
    $mdDialog,
    $timeout,
    $interval,
    windowWidthService,
    LauncherService,
    UserService,
    ScmService,
    AuthService,
    messageService,
    UtilService,
    API_URL,
    $http
) {
    'ngInject';

    let isMultitenant = false;
    let prevLauncher;
    let prevFolder;
    let gitHubPopUp;
    let onAddNewGithubRepoClose; //TODO: seems like unused
    let zafiraWebsocket;
    let subscriptions = {};
    const TENANT = $rootScope.globals.auth.tenant;
    const newGithubRepoCloseClass = 'zf-button-close';
    const newGithubRepoRevertCloseClass = 'zf-button-close-revert';
    const providersPriority =  {
        'SELENIUM': 1,
        'ZEBRUNNER': 2,
        'MCLOUD': 3,
        'AEROKUBE': 4,
        'BROWSERSTACK': 5,
        'SAUCELABS': 6,
        'LAMBDATEST': 7,
        'default': 100,
    };
    // TODO: use json-configs service
    const providersConfigURL = 'https://zebrunner.s3-us-west-1.amazonaws.com/common/moon/providers.json';
    const vm = {
        platforms: [],
        platformModel: {},
        providers: [],
        platformsConfig: null,
        providersFail: false,
        loadingScm: true,
        cardNumber: 0,
        creatingLauncher: false,

        onProviderSelect,
        onPlatformSelect,
        selectProviderOnChipsInit,
        cancelFolderManaging,
        shouldBeDisplayed,
        AuthService,

        get isMobile() { return windowWidthService.isMobile(); },
    };

    vm.$onInit = initController;

    $scope.ciOptions = {};
    $scope.editor = {
        text: ''
    };

    $scope.testSuites = [];
    $scope.currentServerId = null;
    $scope.scmAccounts = [];
    $scope.scmAccount = {};
    $scope.launcherScan = {
        branch: 'master'
    };

    $scope.launcherLoaderStatus = {
        determinateValue: 20,
        started: false,
        finished: false,
        buildNumber: null,
        rescan: false
    };

    $scope.jsonModel = {};

    $scope.aceOptions = {
        useWrapMode: false,
        showGutter: false,
        theme: 'eclipse',
        mode: 'json',
        firstLineNumber: 5,
        rendererOptions: {
            fontSize: '14px'
        }
    };

    $scope.onLoad = function (editor) {
    };

    $scope.onChange = function (server) {
        $scope.currentServerId = server.id;
        $scope.needServer = false;
    };

    $scope.DEFAULT_TEMPLATES = {
        model: {},
        variants: [
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

    $scope.states = {};
    $scope.states.addGitRepo = false;

    $scope.switchFolder = function (e, element, forceExpand) {
        const expandFolderClassName = 'expand-folder';
        const expandFolderFinishClassName = 'expand-folder_finish';
        const switchFolderElement = element ? element : angular.element(e.target);
        const folderElement = angular.element(switchFolderElement.closest('.folder-container'));

        if (folderElement.hasClass(expandFolderClassName) && ! forceExpand) {
            folderElement.addClass(expandFolderFinishClassName);
            folderElement.removeClass(expandFolderClassName);
            $timeout(function () {
                folderElement.removeClass(expandFolderFinishClassName);
            }, 150);
        } else {
            folderElement.addClass(expandFolderClassName);
        }
    };

    $scope.switchFolderMobile = function (event, scmAccountId) {
        $scope.switchFolder(event);
        //$scope.highlightFolder(scmAccountId);
        $scope.launcher = {};
    };

    $scope.addNewGithubRepo = function (element, forceClose) {
        $scope.states.addGitRepo = forceClose ? false : !$scope.states.addGitRepo;
        if ($scope.states.addGitRepo) {
            $scope.connectToGitHub().then(function () {
                if (element) {
                    addNewGithubRepoCssApply(element, $scope.states.addGitRepo);
                }
            }, function () {
                $scope.states.addGitRepo = false;
            });
        } else {
            addNewGithubRepoCssApply(element, $scope.states.addGitRepo);
            if (gitHubPopUp) {
                gitHubPopUp.close();
            }
        }
    };

    function addNewGithubRepoCssApply(element, isAdd) {
        var el = angular.element(element).closest('button');
        if (isAdd) {
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
        if (template) {
            $scope.launcher.model = $scope.launcher.model && $scope.launcher.model.isJsonValid() ? $scope.launcher.model : '{}';
            $scope.launcher.model = JSON.stringify(/*angular.merge(json, template)*/template, null, 2);
        }
    };

    $scope.builtLauncher = {
        model: {},
        type: {}
    };

    $scope.applyBuilder = function (launcher, isPhone) {
        applyBuilder(launcher);
        vm.cardNumber = isPhone ? 3 : 2;
    };

    function applyBuilder(launcher) {
        $scope.jsonModel = {};
        $scope.builtLauncher = { model: {}, type: {} };
        $scope.jsonModel = launcher.model.toJson();
        angular.forEach($scope.jsonModel, function (value, key) {
            var type = $scope.getType(value);
            var val = type === 'array' && value.length ? value[0] : type === 'int' ? +value : value;
            $scope.builtLauncher.model[key] = val;
            $scope.builtLauncher.type[key] = type;
        });
    }

    $scope.getType = function (value) {
        return angular.isArray(value) ? 'array' : typeof value === "boolean" ? 'boolean' : Number.isInteger(+value) ? 'int' : typeof value === 'string' || value instanceof String ? 'string' : 'none';
    };

    $scope.getElement = function (item) {
        var result;
        if (angular.isArray(item)) {
            result = 'select'
        } else if (item === true || item === false) {
            result = 'checkbox'
        } else {
            result = 'input';
        }
        return result;
    };

    $scope.addTemplate = function () {
        vm.cardNumber = 2;
        $scope.launcher = {};
        $scope.DEFAULT_TEMPLATES.model = {};
    };

    $scope.addRepo = function () {
        $scope.repo = {};
        if ($scope.clientId) {
            $scope.connectToGitHub()
                .then(() => {
                    clearPrevLauncherElement();
                    clearPrevFolderElement();
                    vm.cardNumber = 1;
                    $scope.needServer = false;
                    $scope.currentServerId = null;
                });
        }
    };

    $scope.highlightFolder = function (id) {
        clearPrevLauncherElement();
        clearPrevFolderElement();
        chooseFolderElement(id);
    };

    $scope.manageFolder = function (scmAccount, isCreating) {
        vm.creatingLauncher = !!isCreating;
        $scope.scmAccount = scmAccount;
        $scope.needServer = true;
        $scope.currentServerId = getCurrentServerId(scmAccount);
        if (scmAccount.id !== $scope.scmAccount.id) {
            getScmAccountDefaultBranchName(scmAccount.id);
        }
        clearLauncher();
        $scope.highlightFolder(scmAccount.id);
        vm.cardNumber = 2;
        $scope.launcher.scmAccountType = scmAccount;
    };

    function getCurrentServerId(scmAccount) {
        if (scmAccount.launchers && scmAccount.launchers.length) {
            return scmAccount.launchers[0].job.automationServerId ? scmAccount.launchers[0].job.automationServerId : getDefaultServerId();
        }
    }

    function getDefaultServerId() {
        return $scope.servers.find((server) => {
            return server.default;
        }).id;
    }

    $scope.addLauncher = function (launcher) {
        $scope.createLauncher(launcher)
            .then(function (l) {
                appendLauncher(l);
                clearLauncher();
                vm.creatingLauncher = false;
                $scope.chooseLauncher(l);
            });
    };

    $scope.toEditLauncher = function (launcher) {
        //cache previously selected provider to restore after edition mode
        if (vm.chipsCtrl) {
            vm.lastSelectedProvider = vm.chipsCtrl.selectedChip;
        }
        vm.cardNumber = 2;
    };

    function getScmAccountDefaultBranchName(id) {
        ScmService.getDefaultBranch(id).then(function (rs) {
            if (rs.success) {
                $scope.launcherScan.branch = rs.data;
            }
        });
    };

    $scope.onFilterSearchChange = function (value) {
        $timeout(function () {
            const emptySearchClassName = '__empty-search';
            //find all folder elements
            const folders = angular.element('.folder-container');
            angular.forEach(folders, function (folder) {
                folder = angular.element(folder);
                // if search value is not empty hide folders without elements and expand needed
                // else if search value is empty show all hidden folders
                if (value) {
                    const hasItems = !!folder.find(".folder-container_item_list_item").length;
                    if (!hasItems) {
                        folder.addClass(emptySearchClassName);
                    } else {
                        folder.removeClass(emptySearchClassName);
                        const folderIcons = folder.find(".folder-container_folder_icon");
                        angular.forEach(folderIcons, function (folderIcon) {
                            $scope.switchFolder(null, folderIcon, true);
                        });
                    }
                } else {
                    if (folder.hasClass(emptySearchClassName)) {
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
    }

    $scope.editLauncher = function (launcher) {
        $scope.launcher = angular.copy(launcher);
        vm.cardNumber = 2;
        closeConnectGithubBlock();
    };


    $scope.chooseLauncher = function (launcher, skipBuilderApply) {
        if ($scope.launcher) {
            //do nothing if clicked on active launcher
            if ($scope.launcher.id === launcher.id) { return; }
            //reset provider selection on choosing another launcher
            if (vm.chipsCtrl) {
                $timeout(() => { handleProviderSelection(vm.providers[0]); });
            }
        }
        highlightLauncher(launcher.id);
        $scope.launcher = angular.copy(launcher);
        $scope.needServer = false;
        $scope.currentServerId = null;
        $scope.DEFAULT_TEMPLATES.model = {};
        if (!skipBuilderApply) {
            switchToLauncherPreview(launcher);
        }
    };

    function switchToLauncherPreview(launcher) {
        $scope.applyBuilder(launcher);
        vm.cardNumber = 3;
    }

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
        if (prevLauncher) {
            prevLauncher.removeClass(chosenLauncherClass);
        }
    };

    function clearPrevFolderElement() {
        const chosenFolderClass = 'chosen-launcher';
        if (prevFolder) {
            prevFolder.removeClass(chosenFolderClass);
        }
    };

    $scope.chooseLauncherPhone = function (launcher) {
        vm.cardNumber = 3;
    };

    $scope.navigateBack = function () {
        vm.cardNumber = 0;
    };

    $scope.createLauncher = function (launcher) {
        return $q(function (resolve, reject) {
            LauncherService.createLauncher(launcher, $scope.currentServerId).then(function (rs) {
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

    $scope.updateLauncher = function (launcher) {
        var index = $scope.launchers.indexOfField('id', launcher.id);
        LauncherService.updateLauncher(launcher).then(function (rs) {
            if (rs.success) {
                const l = rs.data;
                $scope.launchers.splice(index, 1, l);
                const indexScmAccount = $scope.scmAccounts.indexOfField('id', l.scmAccountType.id);
                if (indexScmAccount !== -1) {
                    const scmAccount = $scope.scmAccounts[indexScmAccount];
                    const scmAccountLauncherIndex = scmAccount.launchers.indexOfField('id', l.id);
                    scmAccount.launchers.splice(scmAccountLauncherIndex, 1, l);
                }
                $timeout(function () {
                    switchToLauncherPreview(l);
                }, 0, false);
                messageService.success('Launcher was updated');
            } else {
                messageService.error(rs.message);
            }
            $scope.applyBuilder(launcher);
        });
    };

    $scope.deleteLauncher = function (id) {
        if (id) {
            var index = $scope.launchers.indexOfField('id', id);
            LauncherService.deleteLauncherById(id).then(function (rs) {
                if (rs.success) {
                    $scope.launchers.splice(index, 1);
                    cancelFolderManaging();

                    const l = $scope.launchers[index];
                    const indexScmAccount = $scope.scmAccounts.indexOfField('id', l.scmAccountType.id);
                    if (indexScmAccount !== -1) {
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

    $scope.deleteRepository = function (scmAccountId) {
        ScmService.deleteScmAccount(scmAccountId).then(function (rs) {
            if (rs.success) {
                const scmAccountIndex = $scope.scmAccounts.indexOfField('id', scmAccountId);

                clearPrevLauncherElement();
                clearPrevFolderElement();
                cancelFolderManaging();
                $scope.scmAccounts.splice(scmAccountIndex, 1);
                messageService.success('Repository was deleted');
            } else {
                messageService.error(rs.message);
            }
        });
    };

    $scope.saveLauncher = function (launcher) {
        launcher.errorMessage = buildError(launcher);
        if (!launcher.errorMessage && !launcher.errorMessage.length) {
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
        if (launcherScan && launcherScan.branch && $scope.scmAccount.id) {
            initWebsocket();
            launcherScan.scmAccountId = $scope.scmAccount.id;
            launcherScan.rescan = !!rescan;
            LauncherService.scanRepository(launcherScan, $scope.currentServerId)
                .then(function (rs) {
                    if (rs.success) {
                        const queueItemUrl = rs.data.queueItemUrl;

                        $scope.launcherLoaderStatus.rescan = launcherScan.rescan;
                        $scope.launcherLoaderStatus.started = true;
                        getBuildNumber(queueItemUrl);
                    } else {
                        $scope.launcherLoaderStatus.started = false;
                        messageService.error(rs.message);
                    }
                });
        }
    };

    function getBuildNumber(queueItemUrl) {
        LauncherService.getBuildNumber(queueItemUrl).then(function (rs) {
            if (rs.success) {
                $scope.launcherLoaderStatus.buildNumber = rs.data
            }
        });
    };

    $scope.cancelScanRepository = function () {
        const buildNumber = $scope.launcherLoaderStatus.buildNumber;
        const scmAccountId = $scope.scmAccount.id;
        const rescan = $scope.launcherLoaderStatus.rescan;
        LauncherService.abortScanRepository(buildNumber, scmAccountId, rescan).then(function (rs) {
            disconnectWebsocket();
            if (rs.success) {
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
            if ($scope.launcherLoaderStatus.determinateValue === 100) {
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
        return launchers && !!launchers.find(function (launcher) {
            return launcher.autoScan;
        });
    };

    function buildError(launcher) {
        var messages = [];
        var errorMessage = '';
        if (!launcher.model) {
            messages.push('code');
        }
        if (!launcher.name) {
            messages.push('name');
        }
        if (!launcher.scmAccountType || !launcher.scmAccountType.id) {
            messages.push('repository');
        }
        if (messages.length) {
            errorMessage = 'Set ';
            messages.forEach(function (message, index) {
                errorMessage += message;
                errorMessage = index !== messages.length - 1 ? errorMessage + ', ' : errorMessage;
            });
            errorMessage += ' for template to save.';
        } else if (!launcher.model.isJsonValid(true)) {
            errorMessage = 'Code is not valid.';
        }
        return errorMessage;
    };

    $scope.cancelLauncher = function () {
        vm.cardNumber = 3;
    };

    function getAllLaunchers() {
        return LauncherService.getAllLaunchers()
            .then(rs => {
                if (rs.success) {
                    return rs.data;
                } else {
                    rs.message && messageService.error(rs.message);
                    return [];
                }
            });
    }

    // $scope.updateLauncher = function(launcher, index) {
    //     LauncherService.updateLauncher(launcher).then(function (rs) {
    //         if(rs.success) {
    //             $scope.launchers.splice(index, 1, rs.data);
    //         } else {
    //             messageService.error(rs.message);
    //         }
    //     });
    // };

    $scope.deleteLauncherById = function (id, index) {
        LauncherService.deleteLauncherById(id).then(function (rs) {
            if (rs.success) {
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
                if (rs.success) {
                    resolve(rs.data);
                }
            });
        });
    };

    function getTenantInfo() {
        return $q(function (resolve, reject) {
            AuthService.getTenant().then(function (rs) {
                if (rs.success) {
                    resolve(rs.data);
                } else {
                    reject();
                    messageService.error(rs.message);
                }
            });
        });
    };

    $scope.clientId = '';

    $scope.connectToGitHub = function () {
        return $q(function (resolve, reject) {
            if ($scope.clientId) {
                var host = $window.location.host;
                var tenant = host.split('\.')[0];
                const servletPath = $window.location.pathname.split('/tests/runs')[0];
                var redirectURI = isMultitenant ?
                    $window.location.protocol + "//" + host.replace(tenant, 'api') + "/github/callback/" + tenant
                    : $window.location.protocol + "//" + host + servletPath + "/scm/callback";
                var url = 'https://github.com/login/oauth/authorize?client_id=' + $scope.clientId + '&scope=user%20repo%20readAorg&redirect_uri=' + redirectURI;
                var height = 650;
                var width = 450;
                var location = getCenterWindowLocation(height, width);
                var gitHubPopUpProperties = 'toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0,width=' + width + ', height=' + height + ', top=' + location.top + ', left=' + location.left;
                gitHubPopUp = $window.open(url, 'GithubAuth', gitHubPopUpProperties);

                var localStorageWatcher = $interval(function () {
                    var code = localStorage.getItem('code');
                    if (code) {
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

    $scope.getOrganizations = function () {
        ScmService.getOrganizations($scope.scmAccount.id).then(function (rs) {
            if (rs.success) {
                $scope.organizations = rs.data;
            }
        });
    };

    $scope.getRepositories = function (organization) {
        $scope.repositories = {};
        const organizationName = organization ? organization : '';
        ScmService.getRepositories($scope.scmAccount.id, organizationName).then(function (rs) {
            if (rs.success) {
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
            if (rs.success) {
                $scope.scmAccounts.push(rs.data);
                $scope.scmAccount = rs.data;
                $scope.launcher.scmAccountType = rs.data;
                $scope.organizations = [];
                $scope.repositories = [];
                vm.cardNumber = 0;

                // switch folder if new
                $timeout(function () {
                    const newScmAccountElement = angular.element('.folder-container-' + rs.data.id + ' .folder-container_folder_icon');
                    $scope.manageFolder($scope.scmAccount);
                    $scope.switchFolder(null, newScmAccountElement, true);
                    $scope.needServer = true;
                    $scope.$apply();
                }, 0, false);
            } else {
                messageService.error(rs.message);
            }
        });
    };

    function initAccessToken(code) {
        return $q(function (resolve, reject) {
            ScmService.exchangeCode(code).then(function (rs) {
                if (rs.success) {
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
        return { 'top': top, 'left': left };
    }

    $scope.build = function (launcher, launcher_form) {
       if (launcher_form.$invalid) {
            Object.keys(launcher_form.$error).forEach(key => {
                launcher_form.$error[key].forEach(errEl => errEl.$touched = true)
            });

            return;
        }

        const selectedProvider = getSelectedProvider();
        let providerId;

        extractPlatformSelections();

        if (selectedProvider && vm.integrations) {
            const selectedIntegration = vm.integrations.find(({ name }) => name.toLowerCase() === selectedProvider.name.toLowerCase())

            if (selectedIntegration) {
                providerId = selectedIntegration.id;
            }
        }

        launcher.model = JSON.stringify($scope.builtLauncher.model, null, 2);

        LauncherService.buildLauncher(launcher, providerId).then(function (rs) {
            if (rs.success) {
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

    function initWebsocket() {
        const wsName = 'zafira';

        zafiraWebsocket = Stomp.over(new SockJS(API_URL + '/api/websockets'));
        zafiraWebsocket.debug = null;
        zafiraWebsocket.ws.close = function() {};
        zafiraWebsocket.connect({ withCredentials: false }, function () {
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

            if (UserService.currentUser.id === userId && success) {
                //remove all launchers of current scm account, except of defaults ones
                if (Array.isArray($scope.scmAccount.launchers) && $scope.scmAccount.launchers.length) {
                    $scope.launchers = $scope.launchers.filter(launcher => {
                        //skip default Zafira's demo launchers to keep them in data collection
                        if (launcher.job && launcher.job.name === 'launcher') {
                            return true;
                        }

                        return !$scope.scmAccount.launchers.find(l => l.id === launcher.id);
                    });
                }
                //add new scanned launchers
                $scope.launchers = [...$scope.launchers, ...event.launchers];
                //update current scm account
                $scope.scmAccount.launchers = $scope.launchers.filter(({ scmAccountType }) => scmAccountType.id === $scope.scmAccount.id);
            } else {
                messageService.error('Unable to scan repository');
            }
            $scope.onScanRepositoryFinish();
            $scope.$apply();
        });
    }

    function getEventFromMessage(message) {
        return JSON.parse(message.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    };

    function disconnectWebsocket() {
        if (zafiraWebsocket && zafiraWebsocket.connected) {
            subscriptions.launchers && subscriptions.launchers.unsubscribe();
            $timeout(function () {
                zafiraWebsocket.disconnect();
            }, 0, false);
            UtilService.websocketConnected('zafira');
        }
    };

    $scope.$on('$destroy', function () {
        disconnectWebsocket();
    });

    $scope.hide = function (testRun) {
        $mdDialog.hide(testRun);
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    function initController() {
        clearLauncher();
        const launchersPromise = getAllLaunchers()
            .then(function (launchers) {
                return $scope.launchers = launchers;
            });
        toolsService.fetchIntegrationOfTypeByName('AUTOMATION_SERVER').then((res) => {
            $scope.servers = res.data;
            if($scope.servers.length > 1) {
                $scope.needServer = true;
            }
        });
        getTenantInfo().then(function (tenant) {
            isMultitenant = tenant.multitenant;
            getClientId()
                .then(clientId => {
                    $scope.clientId = clientId;
                });
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
        const providersConfigPromise = getProvidersConfig();

        $q.all([launchersPromise, scmAccountsPromise, providersConfigPromise])
            .then(function (data) {
                $scope.scmAccounts.forEach(function (scmAccount) {
                    scmAccount.launchers = $scope.launchers.filter(({ scmAccountType }) => scmAccountType.id === scmAccount.id);
                });
            })
            .finally(() => {
                vm.loadingScm = false;
            });
    }

    function initPlatforms(data) {
        if (!data || !data.rootKey) { return; }

        vm.platformsConfig = data;
        vm.platforms = [...vm.platformsConfig.data[vm.platformsConfig.rootKey]]
            //any platform can be disabled in the config using 'disabled' field
            .filter(platform => !platform.disabled);

        //if launcher has defined type, select first platform with the same type in 'job' field of the config
        if ($scope.launcher.type) {
            // if type has '-web' postfix it should be used as 'web'
            const type = (/-web$/i).test($scope.launcher.type) ? 'web' : $scope.launcher.type;

            vm.platforms.some(platform => {
                if (Array.isArray(platform.job) && platform.job.includes(type)) {
                    vm.platformModel[vm.platformsConfig.rootKey] = platform;
                    onPlatformSelect();

                    return true;
                }

                return false;
            });
        }
    }

    function onPlatformSelect() {
        //we need to reset models because $scope.jsonModel can be modified by platform selection
        applyBuilder($scope.launcher);
        clearPlatformControlsData();
        resetPlatformModel(vm.platformModel[vm.platformsConfig.rootKey]);
        if (vm.platformModel[vm.platformsConfig.rootKey] && vm.platformModel[vm.platformsConfig.rootKey].child) {
            prepareChildControl(vm.platformModel[vm.platformsConfig.rootKey]);
        }
    }

    function prepareChildControl(parentItem) {
        const data = parentItem.child;
        let defaultItem;
        const key = data.key;
        let childControl;

        data.type = data.type ? data.type : 'select';
        data.label = data.label ? data.label : key;
        childControl = {
            type: data.type,
            key,
            label: data.label,
            index: vm.platformControls.length,
            data,
        };

        vm.platformControls = [...vm.platformControls, childControl];
        if (Array.isArray(vm.platformsConfig.data[key])) {
            childControl.items = vm.platformsConfig.data[key].filter(child => Array.isArray(data.variants) && data.variants.includes(child.id));
            defaultItem = getDefaultControl(childControl);
        }
        if (data.type === 'select') {
            childControl.onChange = onPlatformControlSelect;
            if (defaultItem) {
                vm.platformModel[key] = defaultItem;
                if (data.versions) {
                    prepareVersionsControl(defaultItem, data);
                } else if (defaultItem.child) {
                    prepareChildControl(defaultItem);
                }
            }
        } else if (data.type === 'input') {
            if (!defaultItem) {
                defaultItem = {
                    value: getControlDefaultValue(data.key),
                }
            }
            vm.platformModel[key] = defaultItem;
            if (defaultItem.child) {
                prepareChildControl(defaultItem);
            }
        }
    }

    function prepareVersionsControl(parentItem, data) {
        let defaultItem;
        const key = `${data.key}-versions`;
        const items = vm.platformsConfig.data[key].filter(child => data.versions.includes(child.id) && child.id.includes(parentItem.id));
        const childControl = {
            key,
            items,
            onChange: onPlatformControlSelect,
            index: vm.platformControls.length,
            data,
        };

        vm.platformControls = [...vm.platformControls, childControl];
        defaultItem = getDefaultVersionControl(childControl);
        defaultItem && (vm.platformModel[key] = defaultItem);
    }

    function onPlatformControlSelect(control) {
        if (!control) { return; }
        //we need to reset models because $scope.jsonModel can be modified by platform controls selection
        applyBuilder($scope.launcher);
        const parentItem = vm.platformModel[control.key];
        const versionsData = parentItem.versions ? parentItem : control.data.versions ? control.data : undefined;

        vm.platformControls = vm.platformControls.slice(0, control.index + 1);
        filterPlatformModel();

        if (versionsData && !control.key.includes('-versions')) {
            prepareVersionsControl(parentItem, versionsData);
        } else if (parentItem.child) {
            prepareChildControl(parentItem);
        }
    }

    function getDefaultControl(childControl) {
        let defaultItem;

        if (!childControl.items.length) {
            return  defaultItem;
        }

        //if we have in the launcher model ($scope.jsonModel) property with the same name as this control's key, try to find appropriate item in childControl
        //and remove that property from launcher model to prevent duplication
        if ($scope.jsonModel[childControl.key]) {
            if (typeof $scope.jsonModel[childControl.key] === 'string') {
                defaultItem = childControl.items.find((item) => {
                    return item.value === $scope.jsonModel[childControl.key];
                });
            } else if (Array.isArray($scope.jsonModel[childControl.key])) {
                defaultItem = childControl.items.find((item) => {
                    return $scope.jsonModel[childControl.key].includes(item.value);
                });
            }

            delete $scope.jsonModel[childControl.key];
        }
        //select by job (launcher type)
        if (!defaultItem && $scope.launcher.type) {
            defaultItem = childControl.items.find(item => Array.isArray(item.job) && item.job.includes($scope.launcher.type));
        }
        //select by config's default value
        if (!defaultItem && childControl.data.default) {
            defaultItem = childControl.items.find(item => item.id === childControl.data.default);
        }
        //select first item in array
        if (!defaultItem) {
            defaultItem = childControl.items[0];
        }

        return defaultItem;
    }

    //TODO: looks like we can get rid of this 'versions' configs because its functionality can be covered by common approach (variants)
    function getDefaultVersionControl(childControl) {
        let defaultItem;

        if (!childControl.items.length) {
            return  defaultItem;
        }

        //if we have in the launcher model ($scope.jsonModel) property with the same name as this control's key, try to find appropriate item in childControl
        //and remove that property from launcher model to prevent duplication
        if ($scope.jsonModel[childControl.key]) {
            if (typeof $scope.jsonModel[childControl.key] === 'string') {
                defaultItem = childControl.items.find((item) => {
                    return item.value === $scope.jsonModel[childControl.key];
                });
            } else if (Array.isArray($scope.jsonModel[childControl.key])) {
                defaultItem = childControl.items.find((item) => {
                    return $scope.jsonModel[childControl.key].includes(item.value);
                });
            }

            delete $scope.jsonModel[childControl.key];
        }
        //select by job (launcher type)
        if (!defaultItem && $scope.launcher.type) {
            defaultItem = childControl.items.find(item => Array.isArray(item.job) && item.job.includes($scope.launcher.type));
        }
        //select by config's default value
        if (!defaultItem && childControl.data['default-versions']) {
            if (typeof childControl.data['default-versions'] === 'string') {
                defaultItem = childControl.items.find(item => item.id === childControl.data['default-versions']);
            } else {
                defaultItem = childControl.items.find(item =>  childControl.data['default-versions'].includes(item.id));
            }
        }
        //select first item in array
        if (!defaultItem) {
            defaultItem = childControl.items[0];
        }

        return defaultItem;
    }

    function getControlDefaultValue(key) {
        let value = '';

        if ($scope.jsonModel[key]) {
            value = $scope.jsonModel[key];
            delete $scope.jsonModel[key];
        }

        return value;
    }

    function filterPlatformModel() {
        const keys = vm.platformControls.map(control => control.key);
        const newModel = {};

        newModel[vm.platformsConfig.rootKey] = vm.platformModel[vm.platformsConfig.rootKey];

        vm.platformModel = keys.reduce((out, key) => {
            out[key] = vm.platformModel[key];

            return out;
        }, newModel);
    }

    function extractPlatformSelections() {
        Object.keys(vm.platformModel).forEach(key => {
            if (vm.platformModel[key]) {
                $scope.builtLauncher.model[key] = vm.platformModel[key].value;
            }
        });
    }

    function clearPlatforms() {
        resetPlatformModel();
        vm.platforms = [];
        vm.platformsConfig = null;
        clearPlatformControlsData();
    }

    function clearPlatformControlsData() {
        vm.platformControls = [];
    }

    function resetPlatformModel(platform) {
        vm.platformModel = {};

        if (platform) {
            vm.platformModel[vm.platformsConfig.rootKey] = platform;

            // if launcher has appropriate param we need to use this value
            if ($scope.jsonModel && $scope.jsonModel[vm.platformsConfig.rootKey]) {
                vm.platformModel[vm.platformsConfig.rootKey].value = getControlDefaultValue(vm.platformsConfig.rootKey);
            }
        }
    }

    function getBrowsersConfig(url) {
        return $http.get(`${url}?timestamp=${Date.now()}`);
    }

    function onProviderSelect(selectedProvider) {
        if (vm.chipsCtrl.selectedChip === -1 || selectedProvider !== vm.chipsCtrl.items[vm.chipsCtrl.selectedChip]) {
            handleProviderSelection(selectedProvider);
        } else {
            handleProviderDeselection();
        }
    }

    function handleProviderSelection(provider) {
        if (!vm.chipsCtrl || !provider) { return; }

        const index = vm.chipsCtrl.items.findIndex(({ id }) => {
            return provider.id === id;
        });

        clearPlatforms();
        vm.failedProvider = provider.failed;
        vm.chipsCtrl.selectedChip = index;
        provider.data && initPlatforms(provider.data);
    }

    function handleProviderDeselection() {
        clearPlatforms();
        vm.chipsCtrl && (vm.chipsCtrl.selectedChip = -1);
    }

    function getSelectedProvider() {
        if (!vm.chipsCtrl || vm.chipsCtrl.selectedChip === -1) { return; }

        return vm.chipsCtrl.items[vm.chipsCtrl.selectedChip];
    }

    //handle initial provider selection after chips were rendered
    function selectProviderOnChipsInit(index, ctrl) {
        //save link to chips controller on first chip initialization
        if (index === 0) {
            vm.chipsCtrl = ctrl;
        }
        if (vm.providers.length - 1 === index) {

            if (!isNaN(vm.lastSelectedProvider)) {
                //restore previous selected provider otherwise keep deselected
                if (vm.lastSelectedProvider !== -1) {
                    handleProviderSelection(vm.providers[vm.lastSelectedProvider]);
                }
                vm.lastSelectedProvider = null;
            } else { //if we don't have cached selection we should select first provider
                handleProviderSelection(vm.providers[0]);
            }
        }
    }

    function getProvidersConfig() {
        return $http.get(`${providersConfigURL}?timestamp=${Date.now()}`)
            .then(response => {
                const url = new URL(providersConfigURL);
                const path = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
                const data = response.data || {};
                let providers = data.default || [];

                //merge default and tenant specific providers
                if (Array.isArray(data[TENANT])) {
                    const defaultProviders = providers.reduce((out, provider) => {out[provider.id] = provider; return out;}, {});
                    const specificProviders = data[TENANT].reduce((out, provider) => {out[provider.id] = provider; return out;}, {});
                    const mergedProviders = {...defaultProviders, ...specificProviders};

                    providers = Object.values(mergedProviders);
                }

                return toolsService.fetchIntegrationOfTypeByName('TEST_AUTOMATION_TOOL')
                    .then((res) => {
                        if (res.success) {
                            let integrationNames;

                            vm.integrations = (res.data || []);

                            integrationNames = vm.integrations
                                .filter(integration => integration.enabled)
                                .map(item => item.name.toLowerCase());

                            vm.providers = providers
                                //filter providers by available integrations
                                .filter(provider => integrationNames.includes(provider.name.toLowerCase()))
                                //sort providers by priority
                                .sort((a, b) => {
                                    const aPriority = providersPriority[a.name] || providersPriority.default;
                                    const bPriority = providersPriority[b.name] || providersPriority.default;

                                    if (aPriority < bPriority) {
                                        return -1;
                                    }
                                    if (aPriority > bPriority) {
                                        return 1;
                                    }

                                    return 0;
                                });

                            return vm.providers.map(config => {
                                if (config.configFile) {
                                    url.pathname = path + config.configFile;

                                    return getBrowsersConfig(url.href)
                                        .then(res => {
                                            config.data = res.data;
                                        })
                                        .catch(() => {
                                            console.error(`Unable to load ${config.name} provider config`);
                                            config.failed = true;
                                        });
                                }

                                return $q.resolve();
                            });
                        } else {
                            console.error('Unable to get integrations');
                        }
                    })
            })
            .catch(() => {
                console.error('Unable to load the providers config');
                vm.providersFail = true;
            });
    }

    function cancelFolderManaging() {
        vm.creatingLauncher = false;
        vm.cardNumber = 0;
        $scope.scmAccount = {};
        $scope.needServer = false;
        $scope.currentServerId = null;
        $scope.DEFAULT_TEMPLATES.model = {};
        clearLauncher();
    }

    function shouldBeDisplayed(section) {
        switch (section) {
            case 'helper':
                return !vm.isMobile || vm.cardNumber === 0;
            case 'launcher':
                return vm.cardNumber === 3;
            case 'welcome':
                return vm.cardNumber === 0;
            case 'waiting':
                return $scope.launcherLoaderStatus && ($scope.launcherLoaderStatus.started || $scope.launcherLoaderStatus.finished);
            case 'add-repo':
                return vm.cardNumber === 1 && !$scope.needServer;
            case 'scan-repo':
                return vm.cardNumber === 2 && !vm.creatingLauncher && (!$scope.needServer || ($scope.scmAccount && $scope.scmAccount.launchers && $scope.scmAccount.launchers.length)) && !($scope.launcher && $scope.launcher.id);
            case 'edit-launcher':
                return vm.cardNumber === 2 && (!$scope.needServer || ($scope.scmAccount && $scope.scmAccount.launchers && $scope.scmAccount.launchers.length)) && $scope.launcher && $scope.launcher.id;
            case 'create-launcher':
                return vm.cardNumber === 2 && vm.creatingLauncher && (!$scope.needServer || ($scope.scmAccount && $scope.scmAccount.launchers && $scope.scmAccount.launchers.length)) && !($scope.launcher && $scope.launcher.id);
            case 'server-select':
                return $scope.needServer && vm.cardNumber !== 0 && !($scope.scmAccount && $scope.scmAccount.launchers && $scope.scmAccount.launchers.length);
            default:
                return false;
        }
    }

    return vm;
};

export default CiHelperController;
