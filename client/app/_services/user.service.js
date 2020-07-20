(function () {
    'use strict';

    angular
        .module('app.services')
        .service('UserService', UserService);

    function UserService($httpMock, UtilService, $q, messageService, $httpParamSerializer) {
        'ngInject';

        let _currentUser = null;
        let _userFullDataFetchPromise = null;
        const service = {
            getUserProfileByName,
            getUserProfileById,
            getUserPreferences,
            fetchFullUserData,
            updateStatus,
            searchUsers,
            searchUsersWithQuery,
            updateUserProfile,
            updateUserPassword,
            createUser,
            addUserToGroup,
            deleteUserFromGroup,
            getDefaultPreferences,
            updateUserPreferences,
            resetUserPreferencesToDefault,
            deleteUserPreferences,
            initCurrentUser,
            clearCurrentUser,
            setDefaultPreferences,
            updateUserPreference,

            get currentUser() {
                return _currentUser;
            },
            set currentUser(user) {
                _currentUser = user;
            }
        };

        return service;

        function getUserProfileByName(name) {
            return $httpMock.get(`${$httpMock.apiHost}/api/iam/v1/users?username=${name}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get user profile'));
        }

        function getUserProfileById(id) {
            return $httpMock.get(`${$httpMock.apiHost}/api/iam/v1/users/${id}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get user profile'));
        }

        function getUserPreferences(id) {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/users/${id}/preferences/extended`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get user preferences'));
        }

        function fetchFullUserData() {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/users/profile/extended`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get extended user profile'));
        }

        function updateStatus(user) {
            return $httpMock.patch(`${$httpMock.apiHost}/api/iam/v1/users/status`, user)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to change user status'));
        }

        function searchUsers(sc) {
            const path = $httpParamSerializer({query: sc.query, status: sc.status, page: sc.page, pageSize: sc.pageSize, orderBy: sc.orderBy, sortOrder: sc.sortOrder});

            return $httpMock.get(`${$httpMock.apiHost}/api/iam/v1/users?${path}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to search users'));
        }

        function searchUsersWithQuery(searchCriteria, criteria) {
            return $httpMock.post(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/users/search?public=true`, searchCriteria, {params: {q: criteria}})
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to search users'));
        }

        /**
         * updated users profile data
         * @param {Number} userId - user's identifier
         * @param {Object} profileData - user's profile data. Required fields are: username, firstName, lastName
         * @returns {Promise<T | {success: boolean, message: string, error: *}>}
         */
        function updateUserProfile(userId, profileData) {
            return $httpMock.patch(`${$httpMock.apiHost}/api/iam/v1/users/${userId}`, profileData)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update user profile'));
        }

        function updateUserPassword(id, password) {
            return $httpMock.post(`${$httpMock.apiHost}/api/iam/v1/users/${id}/password`, password)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update user password'));
        }

        function createUser(user){
            return $httpMock.post(`${$httpMock.apiHost}/api/iam/v1/users`, user)
                .then(UtilService.handleSuccess, UtilService.handleError('Failed to create user'));
        }

        function addUserToGroup(user, groupId){
            return $httpMock.put(`${$httpMock.apiHost}/api/iam/v1/users/${user.id}/groups/${groupId}`, user)
                .then(UtilService.handleSuccess, UtilService.handleError('Failed to add user to group'));
        }

        function deleteUserFromGroup(idUser, idGroup){
            return $httpMock.delete(`${$httpMock.apiHost}/api/iam/v1/users/${idUser}/groups/${idGroup}`)
                .then(UtilService.handleSuccess, UtilService.handleError('Failed to delete user from group'));
        }

        function getDefaultPreferences() {
            return $httpMock.get(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/users/preferences`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to get default preferences'));
        }

        function updateUserPreference(userId, params) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/users/${userId}/preference`, null, { params })
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update user preference'));
        }

        function updateUserPreferences(userId, preferences) {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/users/${userId}/preferences`, preferences)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update user preferences'));
        }

        function deleteUserPreferences(userId) {
            return $httpMock.delete(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/users/${userId}/preferences`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to delete user preferences'));
        }
        function resetUserPreferencesToDefault() {
            return $httpMock.put(`${$httpMock.apiHost}${$httpMock.reportingPath}/api/users/preferences/default`)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to reset user preferences to default'));
        }

        function initCurrentUser(force, userId) {
            if (service.currentUser && !force) {
                return $q.resolve(service.currentUser);
            }

            if (_userFullDataFetchPromise && !force) {
                return _userFullDataFetchPromise;
            }

            const getUserProfile = getUserProfileById(userId);
            const getUserPref = getUserPreferences(userId);

            _userFullDataFetchPromise = $q.all([getUserProfile, getUserPref])
                .then((results) => {
                    const error = results.find(({ success }) => !success);

                    if (error) {
                        return $q.reject(error);
                    }

                    return results;
                })
                .then((results) => {
                    _userFullDataFetchPromise = null;
                    const userData = results.reduce((acc, value) => ({...acc, ...value.data}), {});
                    const authData = JSON.parse(localStorage.getItem('zeb-auth'));
                    service.currentUser = userData;
                    service.currentUser.permissions = authData.permissionsSuperset;

                    setDefaultPreferences(service.currentUser.preferences);

                    service.currentUser.pefrDashboardId = userData['performanceDashboardId'];
                    if (!service.currentUser.pefrDashboardId) {
                        messageService.error('\'User Performance\' dashboard is unavailable!');
                    }

                    service.currentUser.personalDashboardId = userData['personalDashboardId'];
                    if (!service.currentUser.personalDashboardId) {
                        messageService.error('\'Personal\' dashboard is unavailable!');
                    }

                    service.currentUser.stabilityDashboardId = userData['stabilityDashboardId'];

                    service.currentUser.defaultDashboardId = userData['defaultDashboardId'];
                    if (!service.currentUser.defaultDashboardId) {
                        messageService.warning('Default Dashboard is unavailable!');
                    }

                    return service.currentUser;
                });

            return _userFullDataFetchPromise;
        }

        function clearCurrentUser() {
            service.currentUser = null;

            return service.currentUser;
        }

        function setDefaultPreferences(userPreferences) {
            if (!Array.isArray(userPreferences)) {
                return;
            }

            userPreferences.forEach((userPreference) => {
                switch(userPreference.name) {
                    case 'DEFAULT_DASHBOARD':
                        service.currentUser.defaultDashboard = userPreference.value;
                        break;
                    case 'REFRESH_INTERVAL':
                        service.currentUser.refreshInterval = parseInt(userPreference.value, 10);
                        break;
                    case 'THEME':
                        service.currentUser.theme = userPreference.value;
                        break;
                    case 'DEFAULT_TEST_VIEW':
                        service.currentUser.testsView = userPreference.value;
                        break;
                    default:
                        break;
                }
            });
        }
    }
})();
