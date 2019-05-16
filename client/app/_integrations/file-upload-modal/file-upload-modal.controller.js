'use strict';

const fileUploadModalController = ($scope, $mdDialog, toolName, settingName, UtilService, toolsService, messageService) => {
    'ngInject';

    function uploadFile(multipartFile) {
        toolsService.uploadSettingFile(multipartFile, toolName, settingName)
            .then(function (rs) {
                if (rs.success) {
                    messageService.success('File was uploaded');
                    closeModal(rs.data);
                } else {
                    messageService.error(rs.message);
                }
            });
    }

    function closeModal(data) {
        if (data) {
            $mdDialog.hide(data);
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
