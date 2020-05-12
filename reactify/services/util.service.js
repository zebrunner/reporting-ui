export function UtilService() {
    'ngInject';

    return {
        untouchForm,
    };

    function untouchForm(form) {
        form.$setPristine();
        form.$setUntouched();
    }
}
