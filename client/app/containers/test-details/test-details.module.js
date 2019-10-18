import testDetailsComponent from './test-details.component';
import statusButtons from './status-buttons/status-buttons.directive';
import imageIcon from '../../../assets/images/_icons_artifacts/image.svg';
import pdfIcon from '../../../assets/images/_icons_artifacts/pdf.svg';
import apkIcon from '../../../assets/images/_icons_artifacts/apk.svg';
import exeIcon from '../../../assets/images/_icons_artifacts/exe.svg';
import docIcon from '../../../assets/images/_icons_artifacts/doc.svg';
import xlsIcon from '../../../assets/images/_icons_artifacts/xls.svg';
import txtIcon from '../../../assets/images/_icons_artifacts/txt.svg';
import binIcon from '../../../assets/images/_icons_artifacts/bin.svg';

export const testDetailsModule = angular.module('app.testDetails', [])
    .directive({ statusButtons })
    .component({ testDetailsComponent })
    .config(function ($mdIconProvider) {
        'ngInject';
        
        $mdIconProvider
            .icon('artifacts:image', imageIcon)
            .icon('artifacts:pdf', pdfIcon)
            .icon('artifacts:apk', apkIcon)
            .icon('artifacts:exe', exeIcon)
            .icon('artifacts:doc', docIcon)
            .icon('artifacts:xls', xlsIcon)
            .icon('artifacts:txt', txtIcon)
            .icon('artifacts:bin', binIcon);
    });

