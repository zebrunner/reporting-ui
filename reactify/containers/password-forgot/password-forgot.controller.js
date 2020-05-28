import { getVersions, getApplicationConfig } from '@zebrunner/core/store';

export default (
    $ngRedux,
) => {
    'ngInject';

    let unsubscribe;

    return {
        credentials: null,

        $onInit,
        $onDestroy,
    };

    function $onInit() {
        const mapStateToThis = state => ({
            versions: getVersions(state),
            application: getApplicationConfig(state),
        });

        unsubscribe = $ngRedux.connect(mapStateToThis, {})(this);
    }

    function $onDestroy() {
        if (unsubscribe) {
            unsubscribe();
        }
    }
};
