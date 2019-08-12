'use strict';

import RFB from 'vendors/novnc';

const ArtifactService = function ArtifactService($window, $q, $timeout, UtilService, toolsService, messageService, DownloadService) {
    'ngInject';

    var service = {};
    var display;
    var ratio;
    var container;
    var containerHeightProperty = 'offsetHeight';
    var containerWidthProperty = 'offsetWidth';

    service.connectVnc = connectVnc;
    service.resize = resize;
    service.provideLogs = provideLogs;
    service.downloadAll = downloadAll;

    return service;

    function connectVnc(containerElement, heightProperty, widthProperty, wsURL, disconnectFunc) {
        container = containerElement;
        containerHeightProperty = heightProperty;
        containerWidthProperty = widthProperty;
        var rfb = new RFB(angular.element('#vnc')[0], wsURL, { shared: true, credentials: { password: 'selenoid' } });

        //rfb._viewOnly = true;
        rfb.addEventListener("connect",  connected);
        rfb.addEventListener("disconnect",  disconnectFunc ? disconnectFunc : disconnected);
        rfb.scaleViewport = true;
        rfb.resizeSession = true;
        display = rfb._display;
        display._scale = 1;
        angular.element($window).bind('resize', function(){
            autoscale(display, ratio, container);
        });

        return rfb;
    };

    //TODO: looks like unused method
    function provideLogs(rabbitmq, testRun, test, logsContainer, needReconnect, func) {
        return $q(function (resolve, reject) {
            if (toolsService.isToolConnected('RABBITMQ')) {
                var wsName = 'logs';
                var testLogsStomp = Stomp.over(new SockJS(rabbitmq.ws));
                testLogsStomp.debug = null;
                testLogsStomp.connect(rabbitmq.user, rabbitmq.pass, function () {

                    UtilService.websocketConnected(wsName);

                    testLogsStomp.subscribe("/exchange/logs/" + testRun.ciRunId, function (data) {
                        if((test && (testRun.ciRunId + "_" + test.id) == data.headers['correlation-id'] || (data.headers['correlation-id'].includes(testRun.ciRunId + "_" + test.id + '_') && data.headers['correlation-id'].startsWith(testRun.ciRunId)))
                            || (! test && data.headers['correlation-id'].startsWith(testRun.ciRunId))) {
                            var log = JSON.parse(data.body.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
                            func.call(this, log);
                            if(logsContainer) {
                                scrollLogsOnBottom(logsContainer);
                            }
                        }
                    });
                    resolve({stomp: testLogsStomp, name: wsName});
                }, function () {
                    if(needReconnect) {
                        UtilService.reconnectWebsocket(wsName, provideLogs);
                    }
                });
            }
        });
    };

    function downloadAll(test) {
        if (!test.imageArtifacts.length) { return; }

        const promises = test.imageArtifacts.map((artifact) => {
            return DownloadService.plainDownload(artifact.link)
                .then(response => {
                    if (response.success) {
                        const filename = getUrlFilename(artifact.link);
                        artifact.extension = getUrlExtension(artifact.link);
                        return {
                            fileName: `${artifact.name}_${filename}.${artifact.extension}`,
                            fileData: response.res.data,
                        };
                    }

                    return $q.reject(false);
                });
        });

        $q.all(promises)
            .then(data => {
                const name = test.id + '. ' + test.name;
                const formattedData = data.reduce((out, item) => {
                    out[item.fileName] = item.fileData;

                    return out;
                }, {});

                downloadZipFile(name, formattedData);
            })
            .catch(() => {
                messageService.error('Unable to download all files, please try again.');
            });
    };

    function downloadZipFile(name, data) {
        const zip = new JSZip();
        const folder = zip.folder(name);

        angular.forEach(data, function (blob, blobName) {
            folder.file(blobName.getValidFilename(), blob, { base64: true });
        });
        zip.generateAsync({ type: "blob" }).then(function (content) {
            content.download(name + '.zip');
        });
    }

    function getUrlExtension(url) {
        return url.split(/\#|\?/)[0].split('.').pop().trim();
    };

    function getUrlFilename(url) {
        const urlSlices = url.split(/\#|\?/)[0].split('/');
        return urlSlices[urlSlices.length - 1].split('.')[0].trim();
    };

    function scrollLogsOnBottom(logsContainer) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
    };

    function connected(e) {
        var canvas = document.getElementsByTagName("canvas")[0];
        ratio = canvas.width / canvas.height;
        autoscale(display, ratio, container);

    };

    function disconnected(e) {
    };

    function autoscale(display, ratio, window) {
        var size = calculateSize(window, ratio);
        display.autoscale(size.width, size.height, false);
    };

    function calculateSize(window, ratio) {
        var height;
        var width;
        if(ratio > 1) {
            width = window[containerWidthProperty];
            height = width / ratio;
        } else {
            height = window[containerHeightProperty];
            width = height * ratio;
        }
        return {height: height, width: width};
    };

    function resize(element, rfb) {
        container = element;
        display = rfb._display;
        connected();
    };
};

export default ArtifactService;
