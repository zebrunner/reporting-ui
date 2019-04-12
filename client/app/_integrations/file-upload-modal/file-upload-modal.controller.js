'use strict';

const fileUploadModalController = ($scope, $mdDialog, toolName, settingName, UtilService, UploadService) => {
    'ngInject';

    function uploadFile(multipartFile) {
        UploadService.uploadSettingFile(multipartFile, toolName, settingName)
            .then(function (rs) {
                if (rs.success) {
                    alertify.success('File was uploaded');
                    closeModal(true);
                } else {
                    alertify.error(rs.message);
                }
            });
    }

    function closeModal(success) {
        if (success) {
            $mdDialog.hide();
        } else {
            $mdDialog.cancel();
        }
    }

    return {
        file: null,

        closeModal,
        uploadFile,
        untouchForm: UtilService.untouchForm,
    };
};

export default fileUploadModalController;
