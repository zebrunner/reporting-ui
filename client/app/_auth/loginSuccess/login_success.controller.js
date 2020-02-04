'use strict';

const loginSuccessController = function loginSuccessController(
    $scope,
    $location,
) {
    'ngInject';

    const vm = {

    };

    vm.$onInit = function () {
        const token = $location.search().authToken;
        localStorage.setItem("authToken", token);
    };

    return vm;
};
export default loginSuccessController;
