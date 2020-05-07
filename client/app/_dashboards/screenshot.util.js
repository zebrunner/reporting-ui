'use strict';

import html2canvas from 'html2canvas';

const ScreenshotService = function ScreenshotService(
    $q,
) {
    'ngInject';

    return {
        take: (locator, name = guid()) => {
            return crop(locator)
                .then(function (canvasObj) {
                    const formData = new FormData();

                    formData.append('file', dataURItoBlob(canvasObj.dataURL), name + '.png');

                    return formData;
                });
        }
    };

    function crop(elemSelector) {
        const deferred = $q.defer();
        const elem = document.querySelector(elemSelector);

        if (!elem) {
            deferred.reject({ message: `Unable to create screenshot: can't find an element with selector ${elemSelector}` });
        } else {
            const bodyClass = 'widgets-cropping';
            const gridClass = 'grid-stack-one-column-mode';
            const gridElem = document.querySelector('.grid-stack');
            const needRestoreClass = gridElem && gridElem.classList.contains(gridClass);

            document.body.classList.add(bodyClass);
            if (needRestoreClass) {
                gridElem.classList.remove(gridClass);
            }
            //force layout/reflow
            window.getComputedStyle(document.querySelector('div'));
            //to make sure that reflow is finished
            window.requestAnimationFrame(() => {
                html2canvas(elem)
                    .then(canvas => {
                        document.body.classList.remove(bodyClass);

                        if (needRestoreClass) {
                            gridElem.classList.add(gridClass);
                        }

                        deferred.resolve({
                            canvas,
                            dataURL: canvas.toDataURL('image/png'),
                        });
                    })
                    .catch(() => {
                        deferred.reject({ message: 'Unable to create screenshot' });
                    });
            });
        }

        return deferred.promise;
    }

    function dataURItoBlob(dataURI) {
        const binary = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]; // TODO: refactoring: use RegExp
        const array = [];

        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }

        return new Blob([new Uint8Array(array)], {type: mimeString});
    }

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

};

export default ScreenshotService;
