export const ValidationsService = () => {
    const userNameMinLength = 3;
    const userNameMaxLength = 50;

    const passwordMinLength = 8;
    const passwordMaxLength = 50;

    const validations = {
        username: [
            {
                name: 'minlength',
                message: `Username must be between ${userNameMinLength} and ${userNameMaxLength} characters`,
                value: userNameMinLength,
            },
            {
                name: 'maxlength',
                message: `Username must be between ${userNameMinLength} and ${userNameMaxLength} characters`,
                value: userNameMaxLength,
            },
            {
                name: 'pattern',
                message: 'Username must have only latin letters, numbers and special characters',
                value: /^[A-Za-z0-9_-]+$/,
                additional: '_-',
            },
            {
                name: 'required',
                message: 'Username required',
            },
        ],
        password: [
            {
                name: 'minlength',
                message: `Password must be between ${passwordMinLength} and ${passwordMaxLength} characters`,
                value: passwordMinLength,
            },
            {
                name: 'maxlength',
                message: `Password must be between ${passwordMinLength} and ${passwordMaxLength} characters`,
                value: passwordMaxLength,
            },
            {
                name: 'pattern',
                message: 'Password must have only latin letters, numbers or special symbols',
                additional: '_@!#"$%&\'()*+,-./:;<>=?@[]^_`{}|~',
                value: /^[A-Za-z0-9_@!#&quot;\$%&'()*+,-.\/:;<>=\?@\[\]\\^_`{}|~]+$/,
            },
            {
                name: 'required',
                message: 'Password required',
            },
        ],
        confirmPassword: [
            {
                name: 'minlength',
                message: `Password must be between ${passwordMinLength} and ${passwordMaxLength} characters`,
                value: passwordMinLength,
            },
            {
                name: 'maxlength',
                message: `Password must be between ${passwordMinLength} and ${passwordMaxLength} characters`,
                value: passwordMaxLength,
            },
            {
                name: 'required',
                message: 'Password required',
            },
            {
                name: 'identicalTo',
                message: 'Password does not match',
            },
        ],
    };

    return {
        get,
        getValidations,
        getValue,
        getMessage,
    };

    function getValidations(name) {
        return validations[name];
    }

    function get(name, type) {
        return getValidations(name)?.find(({ name: currentName }) => currentName === type) ?? null;
    }

    function getValue(name, type) {
        return get(name, type)?.value ?? null;
    }

    function getMessage(name, type) {
        return get(name, type)?.message ?? null;
    }
}
