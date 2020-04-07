import testRunInfoComponent from './test-run-info.component';
import elasticsearchService from './elasticsearch.service';
import checkedListIcon from '../../../assets/images/check_list.svg';

export const testRunInfoModule = angular.module('app.testRunInfo', [])
    .factory({ elasticsearchService })
    .component({ testRunInfoComponent })
    .config(function ($mdIconProvider) {
        'ngInject';
        
        $mdIconProvider
            .icon('artifacts:checkedList', checkedListIcon);
    });
