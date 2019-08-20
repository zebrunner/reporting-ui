import testDetailsComponent from './test-details.component';
import statusButtons from './status-buttons/status-buttons.directive';
import chipsArray from './chips-array/chips-array.directive';
import ArtifactService from '../test-run-info/artifact.service';

export const testDetailsModule = angular.module('app.testDetails', [])
    .directive({ statusButtons })
    .directive({ chipsArray })
    .factory({ ArtifactService })
    .component({ testDetailsComponent });

