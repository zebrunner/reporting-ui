'use strict';

const fileUploadModalController = ($scope, $mdDialog, $location, toolName, settingName, UtilService, toolsService, messageService) => {
    'ngInject';

    function uploadFile(multipartFile) {
        toolsService.uploadSettingFile(multipartFile, toolName, settingName)
            .then(function (rs) {
                if (rs.success) {
                    messageService.success('File was uploaded');
                    const url = `${window.location.origin}/${rs.data}`;
                    closeModal(url);
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
