import { map } from 'fp-ts/lib/Either';

export const AuthService = (
    $rootScope,
    RequestService,
) => {
    'ngInject';

    return {
        login,
        handleLogin,
    };

    function login(username, password) {
        return RequestService.post('/api/auth/login', { username, password })
            .then(res => map(res => ({ data: res.data, firstLogin: res.headers()['first-login'] }))(res));
    }

    // Make needed redirect
    function handleLogin(payload) {
        $rootScope.$broadcast('event:auth-loginSuccess', payload);
    }
}
