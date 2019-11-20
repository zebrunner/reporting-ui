import html2canvas from 'html2canvas';

const ScreenshotService = function ScreenshotService($q, $timeout) {
    'ngInject';

    var body = angular.element('body');

    return {
        take: function (locator, name = guid()) {
            return $q(function (resolve, reject) {
                crop(locator).then(function (canvasObj) {
                    var formData = new FormData();
                    formData.append("file", dataURItoBlob(canvasObj.dataURL), name + ".png");
                    resolve(formData);
                })
            });
        }
    };

    function crop(locator) {
        return $q(function (resolve, reject) {
            body.addClass('widgets-cropping');
            var grid = angular.element('.grid-stack');
            var classesToAdd = {};
            if(grid.hasClass('grid-stack-one-column-mode')) {
                classesToAdd['grid-stack-one-column-mode'] = grid;
                grid.removeClass('grid-stack-one-column-mode');
            }
            $timeout(function () {
                const element = angular.element(locator);
                if (element && element.length) {
                    html2canvas(element[0]).then(function (canvas) {
                        body.removeClass('widgets-cropping');
                        angular.forEach(classesToAdd, function (element, key) {
                            element.addClass(key);
                        });
                        classesToAdd = {};
                        resolve({canvas: canvas, dataURL: canvas.toDataURL("image/png")});
                    });
                }
            }, 0, false);
        });
    };

    function dataURItoBlob(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        var array = [];
        for(var i = 0; i < binary.length; i++) {
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
