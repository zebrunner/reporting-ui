'use strict';

const uploadImageModalController = (
    $httpMock,
    $mdDialog,
    UploadService,
    UtilService,
    urlHandler,
    fileTypes,
    messageService,
) => {
    'ngInject';

    const local = {
        FILE_TYPES: fileTypes || 'ORG_ASSET',
    };

    return {
        closeModal,
        untouchForm: UtilService.untouchForm,
        uploadImage,
    };

    function uploadImage(multipartFile) {
        UploadService.upload(multipartFile, local.FILE_TYPES)
            .then((rs) => {
                if (rs.success) {
                    messageService.success('Image was uploaded successfully');
                    if (urlHandler) {
                        const url = rs.data.key[0] !== '/' ? `/${rs.data.key}` : rs.data.key;

                        urlHandler(url)
                            .then((result) => {
                                if (result) {
                                    $mdDialog.hide(result);
                                }
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
};

export default uploadImageModalController;
