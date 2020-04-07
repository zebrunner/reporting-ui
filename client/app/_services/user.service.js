(function () {
    'use strict';

    angular
        .module('app.services')
        .service('UserService', UserService);

    function UserService($httpMock, UtilService, API_URL, $q, messageService) {
        'ngInject';

        let _currentUser = null;
        let _userFullDataFetchPromise = null;
        const service = {
            getUserProfile,
            fetchFullUserData,
            updateStatus,
            searchUsers,
            searchUsersWithQuery,
            updateUserProfile,
            updateUserPassword,
            createOrUpdateUser,
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

        function getUserProfile() {
        	return $httpMock.get(API_URL + '/api/users/profile').then(UtilService.handleSuccess, UtilService.handleError('Unable to get user profile'));
        }

        function fetchFullUserData() {
            return $httpMock.get(API_URL + '/api/users/profile/extended').then(UtilService.handleSuccess, UtilService.handleError('Unable to get extended user profile'));
        }

        function updateStatus(user) {
            return $httpMock.put(API_URL + '/api/users/status', user).then(UtilService.handleSuccess, UtilService.handleError('Unable to change user status'));
        }

        function searchUsers(criteria) {
        	return $httpMock.post(API_URL + '/api/users/search', criteria).then(UtilService.handleSuccess, UtilService.handleError('Unable to search users'));
        }

        function searchUsersWithQuery(searchCriteria, criteria) {
            return $httpMock.post(API_URL + '/api/users/search?public=true', searchCriteria, {params: {q: criteria}}).then(UtilService.handleSuccess, UtilService.handleError('Unable to search users'));
        }

        /**
         * updated users profile data
         * @param {Number} userId - user's identifier
         * @param {Object} profileData - user's profile data. Required fields are: username, firstName, lastName
         * @returns {Promise<T | {success: boolean, message: string, error: *}>}
         */
        function updateUserProfile(userId, profileData) {
        	return $httpMock.put(`${API_URL}/api/users/${userId}`, profileData)
                .then(UtilService.handleSuccess, UtilService.handleError('Unable to update user profile'));
        }

        function updateUserPassword(password) {
        	return $httpMock.put(API_URL + '/api/users/password', password).then(UtilService.handleSuccess, UtilService.handleError('Unable to update user password'));
        }

        function createOrUpdateUser(user){
            return $httpMock.put(API_URL + '/api/users', user).then(UtilService.handleSuccess, UtilService.handleError('Failed to update user'));
        }

        function addUserToGroup(user, id){
            return $httpMock.put(API_URL + '/api/users/group/' + id, user).then(UtilService.handleSuccess, UtilService.handleError('Failed to add user to group'));
        }

        function deleteUserFromGroup(idUser, idGroup){
            return $httpMock.delete(API_URL + '/api/users/' + idUser + '/group/' + idGroup).then(UtilService.handleSuccess, UtilService.handleError('Failed to delete user from group'));
        }

        function getDefaultPreferences() {
            return $httpMock.get(API_URL + '/api/users/preferences').then(UtilService.handleSuccess, UtilService.handleError('Unable to get default preferences'));
        }

        function updateUserPreference(userId, params) {
        	return $httpMock.put(`${API_URL}/api/users/${userId}/preference`, null, { params }).then(UtilService.handleSuccess, UtilService.handleError('Unable to update user preference'));
        }

        function updateUserPreferences(userId, preferences) {
            return $httpMock.put(API_URL + '/api/users/' + userId + '/preferences', preferences).then(UtilService.handleSuccess, UtilService.handleError('Unable to update user preferences'));
        }

        function deleteUserPreferences(userId) {
            return $httpMock.delete(API_URL + '/api/users/' + userId + '/preferences').then(UtilService.handleSuccess, UtilService.handleError('Unable to delete user preferences'));
        }
        function resetUserPreferencesToDefault() {
            return $httpMock.put(API_URL + '/api/users/preferences/default').then(UtilService.handleSuccess, UtilService.handleError('Unable to reset user preferences to default'));
        }

        function initCurrentUser(force) {
            if (service.currentUser && !force) {
                return $q.resolve(service.currentUser);
            }

            if (_userFullDataFetchPromise && !force) {
                return _userFullDataFetchPromise;
            }

            _userFullDataFetchPromise = fetchFullUserData()
                .then(function(rs) {
                    _userFullDataFetchPromise = null;
                    if (rs.success) {
                        service.currentUser = rs.data['user'];
                        service.currentUser.isAdmin = service.currentUser.roles.indexOf('ROLE_ADMIN') >= 0;
                        // Set fallback value if 'DEFAULT_TEST_VIEW' is apsent
                        service.currentUser.testsView = 'runs';
                        setDefaultPreferences(service.currentUser.preferences);

                        service.currentUser.pefrDashboardId = rs.data['performanceDashboardId'];
                        if (!service.currentUser.pefrDashboardId) {
                            messageService.error('\'User Performance\' dashboard is unavailable!');
                        }

                        service.currentUser.personalDashboardId = rs.data['personalDashboardId'];
                        if (!service.currentUser.personalDashboardId) {
                            messageService.error('\'Personal\' dashboard is unavailable!');
                        }

                        service.currentUser.stabilityDashboardId = rs.data['stabilityDashboardId'];

                        service.currentUser.defaultDashboardId = rs.data['defaultDashboardId'];
                        if (!service.currentUser.defaultDashboardId) {
                            messageService.warning('Default Dashboard is unavailable!');
                        }

                        return service.currentUser;
                    } else {
                        return $q.reject(rs);
                    }
                });

            return _userFullDataFetchPromise;
        }

        function clearCurrentUser() {
            service.currentUser = null;

            return service.currentUser;
        }

        function setDefaultPreferences(userPreferences){
            userPreferences.forEach(function(userPreference) {
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
