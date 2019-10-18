'use strict';

import RFB from 'vendors/novnc';

const JSZip = require('jszip');
const ArtifactService = function ArtifactService($window, $q, UtilService, toolsService, messageService, DownloadService) {
    'ngInject';

    const service = {
        connectVnc,
        resize,
        provideLogs,
        downloadArtifacts,
        extractImageArtifacts,
    };
    let display;
    let ratio;
    let container;
    let containerHeightProperty = 'offsetHeight';
    let containerWidthProperty = 'offsetWidth';

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

    function provideLogs(rabbitmq, testRun, test, logsContainer, needReconnect, func) {
        return $q(function (resolve, reject) {
            if (toolsService.isToolConnected('RABBITMQ')) {
                var wsName = 'logs';
                var testLogsStomp = Stomp.over(new SockJS(rabbitmq.ws));
                testLogsStomp.debug = null;
                testLogsStomp.ws.close = function() {};
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

    function extractImageArtifacts(tests) {
        tests.forEach(test => {
            const imageArtifacts = test.artifacts.reduce((collected, artifact) => {
                const name = artifact.name.toLowerCase();
    
                if (!name.includes('live') && !name.includes('video')) {
                    const links = artifact.link.split(' ');
                    const url = new URL(links[0]);
    
                    artifact.extension = url.pathname.split('/').pop().split('.').pop();
                    if (artifact.extension === 'png') {
                        if (links[1]) {
                            artifact.link = links[0];
                            artifact.thumb = links[1];
                        }
                        collected.push(artifact);
                    }
                }
    
                return collected;
            }, []);

            if (imageArtifacts) {
                test.imageArtifacts = imageArtifacts;
            }
        });
    }

    function downloadArtifacts({ data = [], field = 'artifacts', name: archiveName = 'artifacts' }) {
        if (!data.length) { return; }
        const zip = new JSZip();

        // if there is only one test, name of the archive should be the same as folder name
        if (data.length === 1 && archiveName === 'artifacts') {
            const test = data[0];

            archiveName = `${test.id}. ${test.name}`;
        }

        data
            .filter(test => (test[field] && test[field].length))
            .forEach(test => {
                const name = normilizeName(`${test.id}. ${test.name}`.replace(/[^a-z0-9]/gi, '_'));
                const folder = zip.folder(name);

                test[field].forEach(artifact => {
                    const fileName = getUrlFilename(artifact.link);
                    const formattedFileName = `${artifact.name}_${fileName}.${artifact.extension}`.getValidFilename();
                    const options = { base64: true };
                    const contentPromise = DownloadService.plainDownload(artifact.link)
                        .then(response => {
                            if (response.success) {
                                return response.res.data;
                            }
        
                            //broken artifact will be an empty file
                            return '';
                        });

                    folder.file(formattedFileName, contentPromise, options);
                });
            });

        zip
            .generateAsync({ type: "blob" })
            .then(function (content) {
                content.download(archiveName + '.zip');
            })
            .catch(err => {
                console.log('downloadArtifacts is failed:');
                console.error(err);
            });
    }

    function getUrlExtension(url) {
        return url.split(/\#|\?/)[0].split('.').pop().trim();
    };

    function normilizeName(str) {
        const maxLength = 256;

        if (str.length > maxLength) {
            return str.slice(0, maxLength - 3) + '...';
        }

        return str;
    }

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

