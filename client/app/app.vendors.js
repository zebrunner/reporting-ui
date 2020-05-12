'use strict';

import '../styles/vendors.scss';

require('angular');
require('angular-aria');
require('angular-animate');
require('angular-cookies');
require('angular-messages');
require('angular-sanitize');
require('@uirouter/angularjs');
require('angular-jwt');
require('angular-material-data-table');
window.moment = require('moment');
require('angular-moment');
require('angular-material');
require('oclazyload');
require('ng-file-upload');

window.SockJS = require('vendors/sockjs-1.3.0.min');
require('vendors/stomp.min');
window.humanizeDuration = require('humanize-duration');
require('vendors/angular-timer'); //TODO: This file is changed locally, see generated patch in this angular project root directory
if (!angular.lowercase) { //https://github.com/textAngular/textAngular/issues/1608
    angular.lowercase = str => angular.isString(str) ? str.toLowerCase() : str;
}
require('textangular/dist/textAngular-sanitize.min');
require('textangular');

require('angular-scroll');
require('ng-img-crop/compile/minified/ng-img-crop');
require('md-date-range-picker');

import hljs from 'highlight.js/lib/highlight';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
window.hljs = hljs;
