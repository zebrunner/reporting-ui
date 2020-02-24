'use strict';

import '../styles/main.scss';
import 'intersection-observer';
import progressbarInterceptor from './http-interceptors/progressbar.interceptor';
import jenkinsIcon from '../assets/images/_icons_tools/jenkins.svg';
import { TutorialsModule } from './modules/tutorials';
import sessionSwitcherComponent from './shared/sessions-switcher/sessions-switcher.component';

const isProd = __PRODUCTION__; // __PRODUCTION__ variable will be replaced by webpack
const ngModule = angular.module('app', [
    // Core modules
    'app.core',
    // Custom Feature modules
    'app.page',
    'app.services',
    'app.view',
    'app.appSidebar',
    'app.appHeader',
    'app.common',
    'app.testRunCard',
    // 3rd party feature modules
    'ngImgCrop',
    'md.data.table',
    'timer',
    'ngSanitize',
    'textAngular',
    'ngMaterialDateRangePicker',
    'angular-jwt',
    'oc.lazyLoad',
    TutorialsModule,
])
.component('sessionsSwitcher', sessionSwitcherComponent)
.config((TutorialsProvider) => {
    'ngInject';

    // Set a link to the json with data
    TutorialsProvider.setUrl(`https://zebrunner.s3-us-west-1.amazonaws.com/common/tutorials/contents.json?timestamp=${Date.now()}`);
    TutorialsProvider.setMinWidth(768);
})

.config(function($httpProvider, $anchorScrollProvider, $qProvider, $locationProvider, $mdAriaProvider, $mdIconProvider) {
    'ngInject';

    //Enable $location HTML5 mode (hashless)
    $locationProvider.html5Mode({
        enabled: true,
    });

    // Globally disables all ARIA warnings.
    $mdAriaProvider.disableWarnings();

    $anchorScrollProvider.disableAutoScrolling();
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    // hide "Possibly unhandled rejection" error notification on production
    $qProvider.errorOnUnhandledRejections(!isProd);

    //define custom icons
    $mdIconProvider
        .icon('tools:jenkins', jenkinsIcon, 64);

    Array.prototype.indexOfId = function(id) {
        for (var i = 0; i < this.length; i++)
            if (this[i].id === id)
                return i;
        return -1;
    };
    Array.prototype.indexOfName = function(name) {
        for (var i = 0; i < this.length; i++)
            if (this[i].name === name)
                return i;
        return -1;
    };
    Object.size = function(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                size++;
            }
        }
        return size;
    };
    String.prototype.copyToClipboard = function() {
        var node = document.createElement('pre');
        node.textContent = this;
        document.body.appendChild(node);

        var selection = getSelection();
        selection.removeAllRanges();

        var range = document.createRange();
        range.selectNodeContents(node);
        selection.addRange(range);

        document.execCommand('copy');
        selection.removeAllRanges();
        document.body.removeChild(node);
    };
    String.prototype.format = function(){
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(m,n){
            return args[n] ? args[n] : m;
        });
    };
    String.prototype.isJsonValid = function(pretty) {
        var json = this;
        if(pretty) {
            //json = json.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
            json = json.replace(/\'/g, "\"");
        }
        try {
            JSON.parse(json);
        } catch (e) {
            return false;
        }
        return true;
    };
    String.prototype.isJson = function() {
        var json = this;
        try {
            JSON.parse(json);
        } catch (e) {
            return false;
        }
        return true;
    };
    String.prototype.toJson = function() {
        //var jsonText = this.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
        var jsonText = this.replace(/\'/g, "\"");
        return JSON.parse(jsonText);
    };

    Array.prototype.indexOfField = function(fieldName, fieldValue) {
        var path = fieldName.split('.');
        fieldName = path[path.length - 1];
        for (var i = 0; i < this.length; i++) {
            var item = this[i];
            for (var j = 0; j < path.length - 1; j++) {
                item = item[path[j]];
            }
            if (item && item[fieldName] === fieldValue) {
                return i;
            }
        }
        return -1;
    };
    Array.prototype.indexOfContainsField = function(fieldName, fieldValue) {
        for (var i = 0; i < this.length; i++) {
            var field = this[i];
            if (field && field[fieldName].includes(fieldValue)) {
                return i;
            }
        }
        return -1;
    };
    Array.prototype.equalsByField = function(arrayToCompare, fieldName) {
        if(this.length != arrayToCompare.length)
            return false;
        for(var arrArgIndex = 0; arrArgIndex < this.length; arrArgIndex++) {
            var arrArg = this[arrArgIndex];
            if(arrayToCompare.indexOfField(fieldName, arrArg[fieldName]) == -1)
                return false;
        }
        return true;
    };
    Blob.prototype.download = function (filename) {
        var link = angular.element('<a>')
            .attr('style', 'display: none')
            .attr('href', window.URL.createObjectURL(this))
            .attr('download', filename.getValidFilename())
            .appendTo('body');
        link[0].click();
        link.remove();
    };
    String.prototype.getValidFilename = function () {
        return this.replace(/[/\\?%*:|"<>]/g, '-');
    };

    $httpProvider.interceptors.push(progressbarInterceptor);
})
.directive('ngReallyClick', [function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('click', function(e) {
                e.stopPropagation();
                var message = attrs.ngReallyMessage;
                if (message && confirm(message)) {
                    scope.$apply(attrs.ngReallyClick);
                }
            });
        }
    }
}])
.directive('nonautocomplete', function () {
    return {
        restrict: 'A',
        link:function($scope, element, attrs) {
            var firstDivElement = element.parent().closest('div');
            angular.element('<input type="password" name="password" class="hide"/>').insertBefore(firstDivElement);
        }
    };
})
.filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if (typeof value === 'number') { value += ''; }
        if (typeof value !== 'string' || !value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace !== -1) {
              //Also remove . and , so its gives a cleaner result.
              if (value.charAt(lastspace-1) === '.' || value.charAt(lastspace-1) === ',') {
                lastspace = lastspace - 1;
              }
              value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
})
.directive('showMore', ['$location', '$anchorScroll', '$timeout', function(location, anchorScroll, timeout) {
    return {
        restrict: 'AE',
        replace: true,
        scope: {
            text: '=?',
            textInline: '@?',
            limit:'=',
            elementId: '='
        },

        template: '<div class="wrap"><div ng-show="largeText"> {{ textToEdit | limitTo :end :0 }}.... <a href="javascript:;" ng-click="showMore()" id="more{{ elementId }}" ng-show="isShowMore">Show&nbsp;more</a><a href="javascript:;" id="less{{ elementId }}" ng-click="showLess()" ng-hide="isShowMore">Show&nbsp;less </a></div><div ng-hide="largeText">{{ textToEdit }}</div></div> ',

        link: function(scope, iElement, iAttrs) {

            anchorScroll.yOffset = 100;

            scope.end = scope.limit;
            scope.isShowMore = true;
            scope.largeText = true;

            var showMoreOffset = 0;
            var showMoreElementId = 'more' + scope.elementId;
            var showLessElementId = 'less' + scope.elementId;

            scope.$watchGroup(['text', 'textInline'], function (newValues) {
                if(newValues[0] || newValues[1]) {
                    scope.textToEdit = scope.text ? scope.text : scope.textInline;

                    if (scope.textToEdit.length <= scope.limit) {
                        scope.largeText = false;
                    }
                }
            });

            scope.showMore = function() {
                showMoreOffset = angular.element('#' + showMoreElementId).offset().top;
                scope.end = scope.textToEdit.length;
                scope.isShowMore = false;
            };

            scope.showLess = function(elementId) {

                scope.end = scope.limit;
                scope.isShowMore = true;

                timeout(function () {
                    if (window.pageYOffset > showMoreOffset) {
                        /*if (location.hash() !== showMoreElementId) {
                            location.hash(showMoreElementId);
                        } else {*/
                        anchorScroll(showMoreElementId);
                        /*}*/
                    }
                }, 80);
            };
        }
    };
}])
.directive('showPart', function() {
    return {
        restrict: 'E',
        template: '<span class="zf-show-part"><span>{{ text.substring(0, limit + 1) }}<span ng-if="text.length > limit" ng-transclude></span></span><span ng-if="text.length > limit">{{ symbols }}</span></span>',
        replace: true,
        transclude: true,
        scope: {
            text: '=',
            limit: '=',
            symbols: '=?'
        },

        compile: function(element, attrs){
            return {
                pre: function preLink(scope, iElement, iAttrs, controller) {
                    if (!attrs.symbols) { scope.symbols = '....'; }
                },
                post: function postLink(scope, iElement, iAttrs, controller) {
                }
            }
        }
    };
})
.directive('identicalTo', function () {
    return {
        require: 'ngModel',
        restrict: 'A',
        scope: {
            otherModelValue: "=identicalTo"
        },
        link: function(scope, element, attributes, ngModel) {
            ngModel.$validators.identicalTo = function(modelValue) {
                return modelValue === scope.otherModelValue;
            };
            scope.$watch("otherModelValue", function() {
                ngModel.$validate();
            });
        }
    };
})
.directive('codeTextarea', ['$timeout', '$interval', '$rootScope', function ($timeout, $interval, $rootScope) {
    return {
        restrict: 'E',
        template: '<span>' +
            '<i style="float: right" data-ng-click="refreshHighlighting()" class="fa fa-refresh" data-toggle="tooltip" title="Highlight code syntax" aria-hidden="true"></i>' +
            '<i style="float: right" data-ng-click="showWidget()" data-ng-if="codeClass != sql" class="fa fa-pie-chart" data-toggle="tooltip" title="Show widget preview" aria-hidden="true">&nbsp&nbsp</i>' +
            '<i style="float: right" data-ng-click="executeSQL()" data-ng-if="codeClass != sql" class="fa fa-flash" data-toggle="tooltip" title="Execute SQL query " aria-hidden="true">&nbsp&nbsp</i>' +
            '<pre class="code"><code data-ng-class="{{ codeClass }}" ng-dblclick="refreshHighlighting()" ng-transclude contenteditable="true">{{ codeData }}</code></pre><hr style="margin-top: 0"></span>',
        replace: true,
        require: 'ngModel',
        transclude: true,
        scope: {
            ngModel: '=',
            codeData: '@',
            codeClass: '@'
        },
        link: function (scope, iElement, iAttrs, ngModel) {

            var initHighlight = function() {
                var myScope = scope.codeClass;
                hljs.configure({
                    tabReplace: '    '
                });
                scope.refreshHighlighting();
            };

            scope.refreshHighlighting = function () {
                $('pre code').each(function(i, block) {
                    hljs.highlightBlock(block);
                });
            };

            scope.executeSQL = function () {
                $rootScope.$broadcast('$event:executeSQL');
            };

            scope.showWidget = function () {
                $rootScope.$broadcast('$event:showWidget');
            };

            $timeout(initHighlight, 100);

            iElement.bind("blur keyup change", function() {
                ngModel.$setViewValue(iElement[0].innerText.trim());
            });
        }
    };
}])
.directive('zafiraBackgroundTheme', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'A',
        link:function($scope, iElement, attrs) {

            var element = attrs.zafiraBackgroundTheme;

            var darkThemes = $rootScope.darkThemes;

            var addTheme = function (mainSkinValue) {
                iElement.addClass(getTheme(mainSkinValue));
            };

            var getTheme = function (mainSkinValue) {
                var themeBackgroundClass;
                switch (element) {
                    case 'header':
                        themeBackgroundClass = darkThemes.indexOf(mainSkinValue) >= 0 ? 'background-darkgreen' : 'background-green';
                        break;
                    case 'graph':
                        themeBackgroundClass = darkThemes.indexOf(mainSkinValue) >= 0 ? 'gray-container' : 'background-clear-white';
                        break;
                    case 'table':
                        themeBackgroundClass = darkThemes.indexOf(mainSkinValue) >= 0 ? 'gray-container' : 'background-clear-white';
                        break;
                    case 'modal':
                        themeBackgroundClass = darkThemes.indexOf(mainSkinValue) >= 0 ? 'gray-container' : 'background-clear-white';
                        break;
                    case 'pagination':
                        themeBackgroundClass = darkThemes.indexOf(mainSkinValue) >= 0 ? 'gray-container' : 'background-clear-white';
                        break;
                    default:
                        themeBackgroundClass = darkThemes.indexOf(mainSkinValue) >= 0 ? 'gray-container' : 'background-clear-white';
                        break;
                }
                return themeBackgroundClass;
            };

            $scope.$watch("main.skin",function(newValue,oldValue) {
                if ($rootScope.main) {
                    if(!newValue && !oldValue) {
                        newValue = $rootScope.main.skin;
                        oldValue = $rootScope.main.skin;
                    } else {
                        $rootScope.main.skin = newValue;
                        $rootScope.main.isDark = darkThemes.indexOf(newValue) >= 0;
                        $scope.main.theme = $rootScope.main.isDark ? 'dark' : '';
                        $scope.main.default = $rootScope.main.isDark ? 'default' : 'default';
                    }
                }
                iElement[0].classList.remove(getTheme(oldValue));
                addTheme(newValue);
            });
        }
    };
}])
.directive('sortItem', function () {
    return {
        restrict: 'A',
        template: '<span ng-transclude></span><md-icon class="md-sort-icon" md-svg-icon="arrow-up.svg"></md-icon>',
        replace: false,
        transclude: true,
        scope: {
            sortItem: '@'
        },
        link: function (scope, iElement, iAttrs) {
            iElement.bind("click",function() {
                switchMode();
            });

            scope.$watch('sortItem', function (newVal) {
                if(newVal) {
                    switchMode();
                }
            });

            function switchMode() {
                var classToAdd = scope.sortItem === 'true' ? 'md-asc' : 'md-desc';
                var classToDelete = scope.sortItem === 'true' ? 'md-desc' : 'md-asc';
                iElement.children('md-icon')[0].classList.remove(classToDelete);
                iElement.children('md-icon').addClass(classToAdd);
            };
        }
    };
})
.directive('formErrorValidation', function($q, $timeout, $compile) {
    'ngInject';

    return {
        require: 'ngModel',
        transclusion: true,
        restrict: 'A',
        scope: {
            ngModel: '=',
            formErrorValidation: '='
        },
        link: function(scope, elm, attrs, ctrl) {

            var dataArray = angular.copy(eval(scope.formErrorValidation));
            dataArray.splice(dataArray.indexOfName(scope.ngModel), 1);

            ctrl.$asyncValidators[elm[0].name] = function(modelValue, viewValue) {

                if (ctrl.$isEmpty(modelValue)) {
                    return $q.resolve();
                }

                var def = $q.defer();
                $timeout(function() {
                    if (dataArray.indexOfName(modelValue) === -1) {
                        def.resolve();
                    } else {
                        def.reject();
                    }
                }, 200);
                return def.promise;
            };
        }
    };
})
.directive('photoUpload', ['$timeout', '$rootScope', function ($timeout, $rootScope) {
    return {
        restrict: 'E',
        template: '<div class="profile-container">\n' +
            '                    <div class="profile-container_container">\n' +
            '                        <div class="bottom-block" md-ink-ripple="grey">\n' +
            '                            <input type="file" id="fileInput" class="content-input" ng-class="{\'not-empty\': myImage}"/>\n' +
            '                            <div ng-if="!fileName || !fileName.length" class="upload-zone-label">Click or drop here</div>' +
            '                            <div ng-if="fileName && fileName.length" class="upload-zone-label">{{fileName}}</div>\n' +
            '                            <img-crop image="myImage" ng-show="otherType == undefined" result-image="myCroppedImage" change-on-fly="true" area-type="{{areaType}}" on-change="onChange()" on-load-done="onDone()"></img-crop>\n' +
            '                        </div>\n' +
            '                    </div>\n' +
            '                </div>',
        require: 'ngModel',
        replace: true,
        transclude: true,
        scope: {
            ngModel: '=',
            areaType: '@',
            otherType: '@'
        },
        link: function ($scope, iElement, iAttrs, ngModel) {
            $scope.myImage = '';
            $scope.myCroppedImage = '';
            $scope.fileName = '';
            var canRecognize = false;

            var otherType = $scope.otherType != undefined;

            var handleFileSelect=function(evt) {
                var file=evt.currentTarget.files[0];
                $scope.fileName = file.name;
                var reader = new FileReader();
                if(! otherType) {
                    reader.onload = function (evt) {
                        $scope.imageLoading = true;
                        $scope.$apply(function($scope){
                            $scope.myImage=evt.target.result;
                        });
                        $scope.imageLoading = false;
                    };
                    reader.readAsDataURL(file);
                } else {
                    reader.onload = function (evt) {
                        $scope.$apply(function($scope){
                            $scope.file=evt.target.result;
                        });
                        $scope.fileName = file.name;
                        ngModel.$setViewValue(fileToFormData(file));
                    };
                    reader.readAsText(file);
                }
            };

            $timeout(function () {
                angular.element('#fileInput').on('change',handleFileSelect);
            }, 100);

            function dataURItoBlob(dataURI) {
                var binary = atob(dataURI.split(',')[1]);
                var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
                var array = [];
                for(var i = 0; i < binary.length; i++) {
                    array.push(binary.charCodeAt(i));
                }
                return new Blob([new Uint8Array(array)], {type: mimeString});
            }

            function textToBlob(data) {
                return new Blob([data], { type: 'application/json' });
            }

            function blobToFormData() {
                var formData = new FormData();
                var croppedImage = dataURItoBlob($scope.myCroppedImage);
                formData.append("file", croppedImage, $scope.fileName);
                return formData;
            };

            function fileToFormData(file) {
                var formData = new FormData();
                var blobFile = textToBlob(file);
                formData.append('file', blobFile, $scope.fileName);
                return formData;
            };

            $scope.onChange = function (event) {
                if(canRecognize) {
                    $timeout(function () {
                        ngModel.$setViewValue(blobToFormData());
                    }, 0);
                }
            };

            $scope.onDone = function () {
                canRecognize = true;
                $scope.onChange();
            };
        }
    };
}])
.directive('fieldError', function($q, $timeout, $compile) {
    'ngInject';

    return {
        require: 'ngModel',
        transclusion: true,
        restrict: 'A',
        scope: {
            ngModel: '=',
            fieldError: '=',
            responseField: '@'
        },
        link: function(scope, elm, attrs, ctrl) {


            scope.$watch('fieldError', function (newValue, oldValue) {
                if(newValue) {
                    var result;
                    newValue.error.data.validationErrors.forEach(function(error) {
                        if(error.field == scope.responseField)
                            result = error;
                    });
                    if(result) {
                        ctrl.$setValidity(scope.responseField, false);
                    }
                }
            })

            scope.$watch('ngModel', function (newVal) {
                ctrl.$setValidity(scope.responseField, true);
            })
        }
    };
})
.directive('profilePhoto', ['$rootScope', function ($rootScope) {
    return {
        restrict: 'E',
        template: require('./shared/profile-photo.directive.html'),
        require: 'ngModel',
        replace: true,
        transclude: true,
        scope: {
            ngModel: '=',
            size: '=?',
            autoResize: '=?',
            icon: '@',
            iconVisible: '=?',
            label: '@',
            rotateHorisontal: '=?',
            src: '@',
            squared: '=?',
            chip: '=?',
        },
        compile: function(element, attrs){
            return {
                pre: function preLink(scope, iElement, iAttrs, controller) {
                    if (!attrs.size) { scope.size = 120; }
                    if (!attrs.icon && ! attrs.src) { scope.icon = 'account_circle'; }
                    if (!attrs.icon && ! attrs.src && attrs.squared && !attrs.chip) { scope.icon = 'person'; }
                    if (!attrs.iconVisible) { scope.iconVisible = true; }
                    if (!attrs.autoResize) { scope.autoResize = true; }
                    if (!attrs.squared) { scope.squared = false; }
                    if (!attrs.chip) { scope.chip = false; }
                    if (!attrs.rotateHorisontal) { scope.rotateHorisontal = false; } else { scope.autoResize = scope.autoResize == 'true' }

                    scope.imageSize = scope.autoResize ? scope.size - 4 : scope.size;
                },
                post: function postLink(scope, iElement, iAttrs, controller) {
                }
            }
        }
    };
}])
.directive('autoHeight', ['$window', function ($window) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {

            function isMin() {
                return angular.element('.nav-collapsed-min').length != 0;
            };

            var mouseOnElement = false;
            var elementClicked = false;

            var wasInit = false;

            var initOn = attrs.autoHeight;

            var trigger = angular.element('*[auto-height-trigger=\'' + initOn + '\']')[0];
            trigger.onmouseenter = function () {
                mouseOnElement = true;
            };
            trigger.onmouseleave = function () {
                mouseOnElement = false;
            };

            trigger.onclick = function (event) {
                elementClicked = !elementClicked;
                var isMin = angular.element('.nav-collapsed-min').length != 0;
                if(! isMin && elementClicked && wasInit) {
                    // timeout need to content animation complete waiting
                    setTimeout(function () {
                        if(elementClicked) {
                            initHeight(element[0]);
                        }
                    }, 500);
                }
            };

            function initHeight(el) {
                var windowHeight = $window.innerHeight;
                var boundingBox = el.getBoundingClientRect();
                el.style['height'] = (boundingBox.top + boundingBox.height) > windowHeight ? windowHeight - boundingBox.top - 65 + 'px' : boundingBox.height >= 65 ? boundingBox.height + 'px' : '65px';
                el.style['overflow-y'] = 'auto';
            };

            if(initOn) {
                scope.$watch(initOn, function (newVal, oldVal) {
                    var isMin = angular.element('.nav-collapsed-min').length != 0;
                    if (newVal) {
                        wasInit = true;
                        if (isMin) {
                            if (mouseOnElement) {
                                initHeight(element[0]);
                            }
                        }
                    }

                });

            }
        }
    };
}])
.directive('resize', ['$window', function ($window) {
    return {
        restrict: 'A',
        scope: {
            onResizeCallback: '='
        },
        link: function(scope, element, attrs) {

            var DIRECTIONS = {
                top: {
                    min: 65,
                    func: resizeTop
                },
                bottom: {
                    min: 0,
                    func: resizeBottom
                },
                right: {
                    min: 0,
                    func: resizeRight
                },
                left: {
                    min: 60,
                    func: resizeLeft
                }
            };

            var resizeDirection = attrs.resizeDirection;

            var DIRECTION = DIRECTIONS[resizeDirection];

            var rightElementStart;
            var topElementStart;
            var bottomElementStart;
            var leftElementStart;

            setTimeout(function () {
                getDirectionParameters();
                var resizeIcon = angular.element('#' + attrs.resize)[0];
                resizeIcon.onmousedown = function (mousedownevent) {
                    element[0].style.position = 'absolute';
                    element[0].style.right = '0';
                    $window.onmousemove = function (mouseoverevent) {
                        DIRECTION.func.call(this, element[0], mouseoverevent);
                        scope.onResizeCallback.call();
                    }
                };
                $window.onmouseup = function () {
                    $window.onmousemove = undefined;
                };
            }, 2000);

            function getDirectionParameters() {
                var elementRect = element[0].getBoundingClientRect();
                rightElementStart = $window.innerWidth - elementRect.right;
                topElementStart = elementRect.top;
                bottomElementStart = $window.innerHeight - elementRect.bottom;
                leftElementStart = elementRect.left;

            };

            function resizeRight(element, event) {
                if(event.clientX <= DIRECTION.min) {
                    element.style.width = event.clientX - $window.innerWidth + leftElementStart + 'px';
                }
            };

            function resizeBottom(element, event) {
                if(event.clientY <= DIRECTION.min) {
                    element.style.height = event.clientY - $window.innerHeight + topElementStart + 'px';
                }
            };

            function resizeTop(element, event) {
                if(event.clientY >= DIRECTION.min) {
                    element.style.height = $window.innerHeight - event.clientY - bottomElementStart + 'px';
                }
            };

            function resizeLeft(element, event) {
                if(event.clientX >= DIRECTION.min) {
                    element.style.width = $window.innerWidth - event.clientX - rightElementStart + 'px';
                }
            };
        }
    };
}])
.directive('tableLoupe', function () {
    return {
        restrict: 'A',
        scope: {
            tableLoupe: '=',
            tableLoupeTrigger: '='
        },
        link: function(scope, element, attrs) {

            var currentLoupeElement;

            scope.$watch('tableLoupe', function (newVal, oldValue) {
                if(newVal) {
                    if(newVal != oldValue) {
                        if(currentLoupeElement) {
                            currentLoupeElement.removeClass('table-loupe-target');
                        }
                        currentLoupeElement = doAction(newVal);
                    }
                }
            });

            scope.$watch('tableLoupeTrigger', function (newVal, oldValue) {
                if(newVal) {
                    element.addClass('table-loupe');
                } else {
                    element.removeClass('table-loupe');
                }
            });

            var tableBody = element[0].getElementsByTagName('tbody')[0];

            function doAction(index) {
                var logRowElement = angular.element(element.find('tbody tr')[index]);
                var logRowElementRect = logRowElement[0].getBoundingClientRect();
                var elementRect = tableBody.getBoundingClientRect();
                var containerMiddlePoint = elementRect.height / 2;
                if(logRowElementRect.top > (elementRect.top + containerMiddlePoint) || (logRowElementRect.top - containerMiddlePoint) < tableBody.scrollTop) {
                    tableBody.scrollTop = logRowElement[0].offsetTop - containerMiddlePoint;
                }
                logRowElement.addClass('table-loupe-target');
                return logRowElement;
            };
        }
    };
})
.directive('passwordEye', function () {
    return {
        restrict: 'A',
        replace: false,
        transclude: false,
        link: function (scope, iElement, iAttrs, ngModel) {

            var eyeElement = angular.element('<i style="position: absolute; right: 20px; bottom: 60%;" class="fa fa-eye"></i>');
            iElement.after(eyeElement);

            var currentMode = 'password';

            var actions = iAttrs.passwordEye.split('-');
            if(actions.length == 2) {
                eyeElement.on(actions[1].trim(), function () {
                    iElement[0].type = 'password';
                });
                eyeElement.on(actions[0].trim(), function () {
                    iElement[0].type = 'text';
                });
            }
            eyeElement.on(iAttrs.passwordEye, function () {
                currentMode = currentMode == 'text' ? 'password' : 'text';
                iElement[0].type = currentMode;
            });
        }
    };
})
.directive('windowWidth', function ($window, windowWidthService) {
    'ngInject';

    return {
        restrict: 'A',
        link: function($scope) {
            angular.element($window).on('resize', function() {
                windowWidthService.windowWidth = $window.innerWidth;
                windowWidthService.windowHeight = $window.innerHeight;

                $scope.$digest();

                $scope.$emit('resize.getWindowSize', {
                    innerWidth: windowWidthService.windowWidth,
                    innerHeight: windowWidthService.windowHeight
                });
            });
        }
    };
})
.directive('loadOnScroll', ($timeout) => {
    'ngInject';

    return {
        restrict: 'A',
        scope: {
            handler: '&loadOnScrollHandler',
            item: '=loadOnScroll',
        },
        bindToController: true,
        controller: () => {},
        link: (scope, element, attrs, controller) => {
            let onDestroyCallback;

            if (typeof controller.handler === 'function') {
                controller.$postLink = () => {
                    const $data = {
                        element: element[0],
                        test: controller.item,
                        isLast: scope.$last || scope.$parent.$last,
                        isFirst: scope.$first || scope.$parent.$first,
                    }

                    onDestroyCallback = controller.handler({ $data });
                }
            }

            scope.$on('$destroy', () => {
                controller.item.isInView = false;
                onDestroyCallback && typeof onDestroyCallback === 'function' && onDestroyCallback();
            });
        }
    }
})
.filter('orderObjectBy', ['$sce', function($sce) {
    var STATUSES_ORDER = {
        'PASSED': 0,
        'FAILED': 1,
        'SKIPPED': 2,
        'IN_PROGRESS': 3,
        'ABORTED': 4,
        'QUEUED': 5
    };
    return function(items, field, reverse) {
        if(field) {
            var filtered = [];
            angular.forEach(items, function (item) {
                filtered.push(item);
            });
            filtered.sort(function (a, b) {
                var aValue = a;
                var bValue = b;
                // cause field has a complex structure (with '.')
                field.split('.').forEach(function(item) {
                    aValue = aValue[item];
                    bValue = bValue[item];
                });
                // cause field is html - we should to compare by inner text
                try {
                    $sce.parseAsHtml(aValue);
                    $sce.parseAsHtml(bValue);
                } catch(e) {
                    aValue = aValue ? String(aValue).replace(/<[^>]+>/gm, '') : '';
                    bValue = bValue ? String(bValue).replace(/<[^>]+>/gm, '') : '';
                }

                if(aValue == null || bValue == null) {
                    return aValue == null ? -1 : 1;
                }

                return field == 'status' ? (STATUSES_ORDER[aValue] > STATUSES_ORDER[bValue] ? 1 : -1) :
                    typeof aValue == 'string' ? (aValue.toLowerCase() > bValue.toLowerCase() ? 1 : -1) : (aValue > bValue ? 1 : -1);
            });
            if (reverse) filtered.reverse();
            return filtered;
        }
        return items
    };
}])
.filter('isEmpty', [function() {
    return function(object) {
        return angular.equals({}, object);
    }
}])
// __ZAFIRA_UI_VERSION__ variable will be replaced by webpack
.constant('UI_VERSION', __ZAFIRA_UI_VERSION__)
.config($uiRouterProvider => {
    'ngInject';

    const rejectTypes = { // https://ui-router.github.io/ng1/docs/latest/enums/transition.rejecttype.html
        ABORTED: 3,
        ERROR: 6,
        IGNORED: 5,
        INVALID: 4,
        SUPERSEDED: 2,
    };
    const _defaultErrorHandler = $uiRouterProvider.stateService._defaultErrorHandler;

    $uiRouterProvider.stateService.defaultErrorHandler((rejection) => {
        // ignore SUPERSEDED and IGNORED transition rejections
        switch (rejection.type) {
            case rejectTypes.SUPERSEDED:
            case rejectTypes.IGNORED:
                return;
        }

        _defaultErrorHandler(rejection);
    });
})
.run(($transitions, AuthService, $document, UserService, messageService, $state, $rootScope, AuthIntercepter, $q, pageTitleService) => {
    'ngInject';

    $rootScope.pageTitleService = pageTitleService;
    window.isProd = isProd;
    function redirectToSignin(payload) {
        const params = {};

        payload && payload.location && (params.location = payload.location);
        AuthService.ClearCredentials();
        $state.go(
            'signin',
            params,
        );
    };

    $rootScope.$on('event:auth-loginCancelled', function (e, payload) {
        redirectToSignin(payload);
    });

    $rootScope.$on('event:auth-loginRequired', function (e, payload) {
        if (AuthService.hasValidToken()) {
            AuthService.RefreshToken($rootScope.globals.auth.refreshToken)
                .then(function (rs) {
                    if (rs.success) {
                        AuthService.SetCredentials(rs.data);
                        AuthIntercepter.loginConfirmed(payload);
                    } else if ($state.current.name !== 'signup') {
                        AuthIntercepter.loginCancelled(payload);
                    }
                });
        } else {
            AuthIntercepter.loginCancelled(payload);
        }
    });

    function fetchUserData() {
        return UserService.initCurrentUser()
            .then(currentUser => {
                //return rejection if returned user is epmty by some reason
                if (!currentUser) {
                    return $.reject();
                }

                return currentUser;
            })
            .catch(() => {
                messageService.error(`Couldn't get profile data. Try to login once again.`);
                //If user isAuthorized but we can't get profile data and therefore can't redirect to dashboard, lets logout
                AuthIntercepter.loginCancelled();

                return false;
            });
    }

    function authGuard(transition) {
        if (AuthService.hasValidToken()) {
            //try to fetch user's data, cause it's required by next steps
            return fetchUserData()
                .then((currentUser) => {
                    const toState = transition.to();
                    const requiresPermissions = toState.data && toState.data.permissions;

                    //if transition requires any permissions, check it
                    if (currentUser && requiresPermissions && requiresPermissions.length) {
                        return permissionsGuard(requiresPermissions, transition);
                    }

                    //if user data is fetched successfully transition will be continued, otherwise cancelled
                    return !!currentUser;
                });
        }

        console.error('You are not authorized to view this page.');
        //if user is not authorized and current page isn't the signin page, we need to redirect to it
        if (transition.from().name !== 'signin') {
            return $q.resolve(transition.router.stateService.target('signin', { location: window.location.href }));
        }

        //otherwise just cancel transition
        return $q.resolve(false);
    }

    function guestGuard(transition) {
        //transition needs to be cancelled if user is authiruzed
        if (AuthService.hasValidToken()) {
            //on page reload we don't have referrer URL, so we need to redirect to default user's page
            if (!transition.from().name) {
                return $q.resolve(transition.router.stateService.target('home'));
            }

            //cancel transition
            return $q.resolve(false);
        }

        //continue transition
        return $q.resolve(true);
    }

    function permissionsGuard(permissions, transition) {
        const access = AuthService.UserHasAnyPermission(permissions);

        if (!access) {
            console.error('You don\'t have permission to view this page');
            if (!transition.from().name) {
                return transition.router.stateService.target('404');
            }
        }

        return access;
    }

    $transitions.onBefore({}, function(trans) {
        const toStateData = trans.to().data;
        const loginRequired = !!(toStateData && toStateData.requireLogin);
        const onlyGuests = !!(toStateData && toStateData.onlyGuests);
        let access = true;

        if (loginRequired) {
            access = authGuard(trans)

        } else if (onlyGuests) {
            access = guestGuard(trans);
        }

        return access;
    });
    $transitions.onSuccess({}, function() {
        pageTitleService.setTitle($state.current.data?.title);
        
        $document.scrollTo(0, 0);
    });
})
.config($provide => {
    'ngInject';
    // return a decorated delegate of the $mdDialog service
      $provide.decorator('$mdDialog', ($delegate, $timeout, $rootElement, $document, $window) => {
          'ngInject';
        // if a mobile IOS platform
          if ((/iPhone|iPad|iPod/i).test(navigator.userAgent)) {
            const delegate = new mdDialogDelegate($delegate, $timeout, $rootElement, $document, $window);
            // decorate delegate
              return delegate.decorate();
          }
          return $delegate;
      })
});

class mdDialogDelegate {
    constructor($delegate, $timeout, $rootElement, $document, $window) {
        this._$delegate = $delegate;
        this._$timeout = $timeout;
        this._$rootElement = $rootElement;
        this._$document = $document;
        this._$window = $window;
    }

    decorate() {
        // $mdDialog.show is our only point of entry that gets called when either a preset (custom or built-in) or a
        // custom object is passed as the options into the $mdDialog service.  So this is the function we need to modify.
        // Keep the original function for now.
        const cachedShowFunction = this._$delegate.show;
        // use the $mdDialog delegate to write a new show function to the $mdDialog service
        this._$delegate.show = opts => {
            // onShowing is an available callback that gets fired just before the dialog is positioned.  We need to add
            // our custom positioning logic to it in order to fix the IOS positioning bug.  In case someone else
            // implements logic in this callback somewhere else, we need to keep it.
            const cachedOnShowingFunction = opts.onShowing;
            // Custom positioning logic added to the onShowing callback
            const onShowing = (scope, element, modifiedOptions) => {
                // the parent can be passed in as a function, string, elmeent, or jqlite object
                // it needs to be assigned as a jqlite object
                let parent = modifiedOptions.parent;
                if (angular.isFunction(parent)) {
                    parent(scope, element, modifiedOptions);
                } else if (angular.isString(parent)) {
                    parent = angular.element(this._$document[0].querySelector(parent));
                } else {
                    parent = angular.element(parent);
                }

                // If parent querySelector/getter function fails, or it's just null, find a default.
                // logic derived from angular js material library
                if (!(parent || {}).length) {
                    let defaultParent;
                    if (this._$rootElement[0] && this._$rootElement[0].querySelector) {
                    defaultParent = this._$rootElement[0].querySelector(':not(svg) > body');
                    }
                    if (!defaultParent) {
                    defaultParent = this._$rootElement[0];
                    }
                    if (defaultParent.nodeName === '#comment') {
                    defaultParent = this._$document[0].body;
                    }
                    parent = angular.element(defaultParent);
                }
                // need to capture the parent top, body height, and parent height before the position dialog logic run
                // in the library
                const parentTop = angular.copy(Math.abs(parent[0].getBoundingClientRect().top));
                const bodyHeight = angular.copy(this._$document[0].body.clientHeight);
                const parentHeight = angular.copy(Math.ceil(Math.abs(parseInt(this._$window.getComputedStyle(parent[0]).height, 10))));
                // after the position dialog logic runs in the library run our custom position dialog logic
                this._$timeout(() => {
                    const parentHeightAfterDelay = angular.copy(Math.ceil(Math.abs(parseInt(this._$window.getComputedStyle(parent[0]).height, 10))));
                    // see if the body is fixed, should have been set to fixed in the library at this point
                    const isFixed = this._$window.getComputedStyle(this._$document[0].body).position === 'fixed';
                    // see if the backdrop has been prepended
                    const backdropElement = parent.find('md-backdrop');
                    // if there is a backdrop make the height of the dialog as the lesser of the body height and parent height
                    const height = backdropElement ? Math.min(bodyHeight, parentHeight, parentHeightAfterDelay) : 0;
                    // apply the top and height positioning of the dialog

                    element.css({
                        top: `${(isFixed ? parentTop : 0)}px`,
                        height: `${height ? `${height}px` : '100%'}`
                    });
                });
                // if there was additional logic added to the onShowing callback, run it
                if (angular.isFunction(cachedOnShowingFunction)) {
                    cachedOnShowingFunction(scope, element, modifiedOptions);
                }
            };
            // if a preset was used, assign it to _options, else assign it directly to the options object
            if (opts.constructor.name === 'Preset') {
                opts._options.onShowing = onShowing;
            } else {
                opts.onShowing = onShowing;
            }
            // call the original show function
            return cachedShowFunction(opts);
        };
        // return the modified delegated $mdDialog service
        return this._$delegate;
    }
}

angular.injector(['ng']).get('$http').get('./config.json')
    .then(function(response){
        // TODO: add error handler if incorrect data provided or missed
        ngModule.constant('API_URL', response.data['API_URL'] || '');

        //manually bootstrap application after we have gotten our config data
        angular.element(document).ready(function() {
            angular.bootstrap(document, ['app'], { strictDi: !isProd });
        });
    });

//Services
require('./_services/services.module');
//Modules
require('./_views/view.module');
require('./core/core.module');
require('./layout/layout.module');
require('./page/page.module');
require('./layout/commons/common.module');
require('./components/components');
