import { map } from 'fp-ts/lib/Either';

export const AuthService = (
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

    function handleLogin(payload) {
        console.log(payload);
    }
}
