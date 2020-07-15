'use strict';

const uploadImageModalController = ($mdDialog, UploadService, UserService, UtilService, urlHandler, keyHandler, 
                                    fileTypes, messageService) => {
    'ngInject';

    const local = {
        FILE_TYPES: fileTypes || 'ORG_ASSET',
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
                    const url = `${window.location.origin}/${rs.data.key}`;
                    urlHandler(url).then((result) => {
                        result && $mdDialog.hide();
                    });
                } else if (keyHandler) {
                    keyHandler(rs.data.key).then((result) => {
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
