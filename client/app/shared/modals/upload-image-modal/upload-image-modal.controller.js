'use strict';

const uploadImageModalController = ($mdDialog, UploadService, UserService, UtilService, urlHandler,
                                    fileTypes, messageService) => {
    'ngInject';

    const local = {
        FILE_TYPES: fileTypes || 'COMMON',
    };

    const vm = {
        closeModal,
        untouchForm: UtilService.untouchForm,
        uploadImage,
    };

    function uploadImage(multipartFile) {
        UploadService.upload(multipartFile, local.FILE_TYPES).then(function (rs) {
            if (rs.success) {
                messageService.success('Image was uploaded');
                if (urlHandler) {
                    urlHandler(rs.data.url).then((result) => {
                        result && $mdDialog.hide();
                    });
                }
            } else {
                messageService.error(rs.message);
            }
        });
    }

    function closeModal() {
        $mdDialog.cancel();
    }

    return vm;
};

export default uploadImageModalController;
