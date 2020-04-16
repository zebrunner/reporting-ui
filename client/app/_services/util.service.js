(function () {
    'use strict';

    angular
        .module('app.services')
        .factory({ UtilService });

    function UtilService($rootScope, $mdToast, $timeout, $q, $window, $httpParamSerializer, messageService, $sce) {
        'ngInject';
        var service = {
            untouchForm,
            resolveError,
            truncate,
            handleSuccess,
            handleError,
            isEmpty,
            settingsAsMap,
            reconnectWebsocket,
            websocketConnected,
            buildURL,
            setOffset,
            showDeleteMessage,
            isElementInViewport,
            sortArrayByField,
            removeRecipient,
            checkAndTransformRecipient,
            filterUsersForSend,
            isTouchDevice,
            handleDateFilter,
            getValidationValue,
            handleCreateWidgetError,
        };

        service.validations = {
            username: [
                {
                    name: 'minlength',
                    message: 'Username must be between 3 and 50 characters'
                },
                {
                    name: 'maxlength',
                    message: 'Username must be between 3 and 50 characters'
                },
                {
                    name: 'pattern',
                    message: 'Username must have only latin letters, numbers and special characters',
                    additional: '_-'
                },
                {
                    name: 'required',
                    message: 'Username required'
                }
            ],
            password: [
                {
                    name: 'minlength',
                    message: 'Password must be between 8 and 50 characters',
                    value: 8,
                },
                {
                    name: 'maxlength',
                    message: 'Password must be between 8 and 50 characters',
                    value: 50,
                },
                {
                    name: 'pattern',
                    message: 'Password must have only latin letters, numbers or special symbols',
                    additional: '_@!#"$%&\'()*+,-./:;<>=?@[]^_`{}|~',
                    value: /^[A-Za-z0-9_@!#&quot;\$%&'()*+,-.\/:;<>=\?@\[\]\\^_`{}|~]+$/,
                },
                {
                    name: 'required',
                    message: 'Password required'
                }
            ],
            confirmPwd: [
                {
                    name: 'minlength',
                    message: 'Password must be between 8 and 50 characters'
                },
                {
                    name: 'maxlength',
                    message: 'Password must be between 8 and 50 characters'
                },
                {
                    name: 'pattern',
                    message: 'Password does not match',
                },
                {
                    name: 'required',
                    message: 'Password required'
                },
                {
                    name: 'identicalTo',
                    message: 'Password does not match'
                }
            ],
            name: [
                {
                    name: 'minlength',
                    message: 'Must be between 1 and 100 characters',
                    value: 1,
                },
                {
                    name: 'maxlength',
                    message: 'Must be between 1 and 100 characters',
                    value: 100,
                },
                {
                    name: 'pattern',
                    message: 'Name can only contain letters, numbers, dashes and dots.',
                    value: /^[A-Za-z]+[0-9A-Za-z.-]*$/,
                }
            ],
            firstName: [
                {
                    name: 'required',
                    message: 'First name required'
                },
            ],
            lastName: [
                {
                    name: 'required',
                    message: 'Last name required'
                },
            ],
        };

        return service;

        function getValidationValue(objName, propName) {
            const validationsArray = service.validations[objName];
            const item = validationsArray.find(item => item.name === propName);

            return item ? item.value : null;
        }

        function untouchForm(form) {
        	form.$setPristine();
        	form.$setUntouched();
        }

        function truncate(fullStr, strLen) {
            if (fullStr == null || fullStr.length <= strLen) return fullStr;
            var separator = '...';
            var sepLen = separator.length,
                charsToShow = strLen - sepLen,
                frontChars = Math.ceil(charsToShow/2),
                backChars = Math.floor(charsToShow/2);
            return fullStr.substr(0, frontChars) +
                separator +
                fullStr.substr(fullStr.length - backChars);
        };

        function handleSuccess(res) {
            return { success: true, data: res.data };
        }

        function handleError(error) {
            return function (res) {
                if(res.status == 400 && res.data.validationErrors && res.data.validationErrors.length) {
                    error = res.data.validationErrors.map(function(validation) {
                        return validation.message;
                    }).join('\n');
                }
                return { success: false, message: error, error: res };
            };
        }

        function handleCreateWidgetError(response) {
            const message = + response.status === 400 ? 'Unable to create widget as widget with the same name exists' : 'Unable to create widget';

            return service.handleError(message)(response);
        }

        function isEmpty(obj) {
        		return jQuery.isEmptyObject(obj);
        };

        function settingsAsMap(settings) {
            const map = {};

            settings && settings.forEach(({ param, value }) => {
                    map[param.name] = value;
                });

            return map;
	    }

        // ************** Websockets **************

        function reconnectWebsocket(name, func) {
            if(! $rootScope.disconnectedWebsockets) {
                $rootScope.disconnectedWebsockets = {
                    websockets: {},
                    toastOpened: false
                };
            }
            var attempt = $rootScope.disconnectedWebsockets.websockets[name] ? $rootScope.disconnectedWebsockets.websockets[name].attempt - 1 : 3;
            $rootScope.disconnectedWebsockets.websockets[name] = {function: func, attempt: attempt};
            reconnect(name);
        };

        function reconnect (name) {
            var websocket = $rootScope.disconnectedWebsockets.websockets[name];
            if(websocket.attempt > 0) {
                var delay = 5000;
                $timeout(function () {
                    tryToReconnect(name);
                }, delay);
            } else {
                if(! $rootScope.disconnectedWebsockets.toastOpened) {
                    $rootScope.disconnectedWebsockets.toastOpened = true;
                    showReconnectWebsocketToast();
                }
            }
        };

        function websocketConnected (name) {
            if($rootScope.disconnectedWebsockets && $rootScope.disconnectedWebsockets.websockets[name]) {
                delete $rootScope.disconnectedWebsockets.websockets[name];
            }
        };

        function tryToReconnect(name) {
            if($rootScope.disconnectedWebsockets && $rootScope.disconnectedWebsockets.websockets && $rootScope.disconnectedWebsockets.websockets[name]) {
                $rootScope.$applyAsync($rootScope.disconnectedWebsockets.websockets[name].function);
            }
        };

        function showReconnectWebsocketToast() {
            $mdToast.show({
                hideDelay: 0,
                position: 'bottom right',
                scope: $rootScope,
                locals: {
                    reconnect: tryToReconnect
                },
                preserveScope: true,
                controller: 'WebsocketReconnectController',
                template: require('../components/toasts/websocket-reconnect/websocket-reconnect.html')
            });
        };

        /**
         * Errors resolver
         */

        function resolveError(rs, form, ngMessage, defaultField) {
            return $q(function (resolve, reject) {
                var errorField = getErrorField(rs, defaultField);
                if(errorField) {
                    var showMessage = callError(function () {
                        return errorField;
                    }, form, errorField, getErrorMessage(rs), ngMessage);
                    resolve(showMessage);
                } else {
                    reject(rs);
                }
            });
        };

        function getErrorMessage(rs) {
            var result;
            if(rs.error && rs.error.status == 400 && rs.error.data.error) {
                result = rs.error.data.validationErrors ? rs.error.data.validationErrors[0].message : rs.error.data.error.message;
            }
            return result;
        };

        function getErrorField(rs, defaultField) {
            var result;
            if(rs.error && rs.error.status == 400 && rs.error.data.error) {
                result = rs.error.data.error.field;
                result = result ? result : defaultField;
            }
            return result;
        };

        function callError(func, form, inputName, errorMessage, ngMessage) {
            var result = false;
            var condition = func.call();
            if (condition) {
                form[inputName].errorMessage = errorMessage;
            } else {
                result = true;
            }
            form[inputName].$setValidity(ngMessage, result);
            return result;
        };

        function buildURL(url, queryParams) {
            if(angular.isObject(queryParams)) {
                var prefix = url.indexOf('?') !== -1 ? '&' : '?';
                url += prefix + $httpParamSerializer(queryParams)
            }
            return url;
        };

        function setOffset(event) {
            const bottomHeight = $window.innerHeight - event.target.clientHeight - event.clientY;

            $rootScope.currentOffset = 0;
            if (bottomHeight < 400) {
                $rootScope.currentOffset = -250 + bottomHeight;
            }
        }

        function buildMessage(keysToDelete, results, errors) {
            const result = {};

            if (keysToDelete.length === results.length + errors.length) {
                if (results.length) {
                    let message = results.length ? results[0].message : '';
                    let ids = '';

                    results.forEach(function(result, index) {
                        ids = ids + '#' + result.id;
                        if (index !== results.length - 1) {
                            ids += ', ';
                        }
                    });
                    message = message.format(results.length > 1 ? 's' : ' ', ids);
                    result.message = message;
                }
                if (errors.length) {
                    let errorIds = '';
                    let errorMessage = errors.length ? errors[0].message : '';

                    errors.forEach(function(result, index) {
                        errorIds = errorIds + '#' + result.id;
                        if (index !== errors.length - 1) {
                            errorIds += ', ';
                        }
                    });
                    errorMessage = errorMessage.format(errors.length > 1 ? 's' : ' ', errorIds);
                    result.errorMessage = errorMessage;
                }
            }

            return result;
        }

        function showDeleteMessage(rs, keysToDelete, results, errors) {
            let message;

            if (rs.success) {
                results.push(rs);
            } else {
                errors.push(rs);
            }

            message = buildMessage(keysToDelete, results, errors);
            if (message.message) {
                messageService.success(message.message);
            }
            if(message.errorMessage) {
                messageService.error(message.errorMessage);
            }
        }

        function isElementInViewport(el) {
            const rect = el.getBoundingClientRect();

            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        }

        /**
         * Common functions for email modals
         * */

        function removeRecipient(user, recipients) {
            var index = recipients.indexOf(user.email);
            if (index >= 0) {
                recipients.splice(index, 1);
            }
        };

        function checkAndTransformRecipient(currentUser, recipients, users) {
            let user = {};

            if (typeof currentUser === 'object' && currentUser.email) {
                user = currentUser;
            } else {
                if (!isValidRecipient(currentUser)) {
                    messageService.error('Invalid email');

                    return null;
                }
                if (isDuplicatedRecipient(currentUser, users)) {
                    messageService.error('Duplicated email');

                    return null;
                }
                user.email = currentUser;
            }

            recipients.push(user.email);
            users.push(user);

            return user;
        };

        function isValidRecipient(recipient) {
            let reg = /^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;

            return (reg.test(recipient));
        }

        function isDuplicatedRecipient(recipient, users) {
            return users.find((user) => user.email === recipient)
        }

        function filterUsersForSend(usersFromDB, alreadyAddedUsers) {
            return usersFromDB.filter((userFromDB) => {
                return !alreadyAddedUsers.find((addedUser) => {
                    return addedUser.id === userFromDB.id;
                }) && userFromDB.email;
            })
        }

        /**
         * Sort array by field and by immutable way
         * */
        function sortArrayByField(data, field, reverse) {
            if (!field) { return data; }

            const STATUSES_ORDER = {
                'PASSED': 0,
                'FAILED': 1,
                'SKIPPED': 2,
                'IN_PROGRESS': 3,
                'ABORTED': 4,
                'QUEUED': 5
            };

            const sorted = [...data].sort((a, b) => {
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
                } catch (e) {
                    aValue = aValue ? String(aValue).replace(/<[^>]+>/gm, '') : '';
                    bValue = bValue ? String(bValue).replace(/<[^>]+>/gm, '') : '';
                }

                if (!aValue || !bValue) {
                    return !aValue ? -1 : 1;
                }

                return field == 'status' ? (STATUSES_ORDER[aValue] > STATUSES_ORDER[bValue] ? 1 : -1) :
                    typeof aValue == 'string' ? (aValue.toLowerCase() > bValue.toLowerCase() ? 1 : -1) : (aValue > bValue ? 1 : -1);
            });

            if (reverse) { sorted.reverse() };

            return sorted;
        }

        //based on https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
        function isTouchDevice() {
            if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
                return true;
            }

            var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
            var mq = function(query) {
                return window.matchMedia(query).matches;
            };
            // include the 'heartz' as a way to have a non matching MQ to help terminate the join
            // https://git.io/vznFH
            var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');

            return mq(query);
        }

        function handleDateFilter(selectedRange) {
            const searchParams = {};
            let isEmptySelection = false;

            if (selectedRange.dateStart && selectedRange.dateEnd) {
                //TODO: probably should use UTC version of date methods (for example 'getUTCFullYear()')
                const isSameYear = selectedRange.dateStart.getFullYear() === selectedRange.dateEnd.getFullYear();
                const isSameMonth = selectedRange.dateStart.getMonth() === selectedRange.dateEnd.getMonth();
                const isSameDay = selectedRange.dateStart.getTime() === selectedRange.dateEnd.getTime();
                const isCurrentYear = selectedRange.dateEnd.getFullYear() === new Date().getFullYear();
                const rangeDateStart = moment(selectedRange.dateStart).format('DD');
                const rangeMonthStart = !isSameMonth ? ' ' + moment(selectedRange.dateStart).format('MMM') : '';
                const rangeDateEnd = !isSameDay ? ' - ' + moment(selectedRange.dateEnd).format('DD') : '';
                const rangeMonthEnd = ' ' + moment(selectedRange.dateEnd).format('MMM');
                const rangeYearStart = !isSameYear ? ' ' + moment(selectedRange.dateStart).format('YYYY') : '';
                const rangeYearEnd = !isSameYear || !isCurrentYear ? ' ' + moment(selectedRange.dateEnd).format('YYYY') : '';

                selectedRange.selectedTemplateName = rangeDateStart + rangeMonthStart + rangeYearStart + rangeDateEnd + rangeMonthEnd + rangeYearEnd;
                searchParams.selectedTemplateName = selectedRange.selectedTemplateName;

                if (!isSameDay) {
                    searchParams.date = null;
                    searchParams.fromDate = selectedRange.dateStart;
                    searchParams.toDate = selectedRange.dateEnd;
                } else {
                    searchParams.fromDate = null;
                    searchParams.toDate = null;
                    searchParams.date = selectedRange.dateStart;
                }
            } else {
                searchParams.fromDate = null;
                searchParams.toDate = null;
                searchParams.date = null;
                searchParams.selectedTemplateName = null;
                isEmptySelection = true;
            }

            return {
                searchParams,
                selectedRange,
                isEmptySelection,
            }
        }
    }
})();
