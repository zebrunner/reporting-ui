(function () {
    'use strict';

    angular.module('app').controller('CompareController', CompareController);

    function CompareController($scope, $mdDialog, $q, $location, TestService, selectedTestRuns) {
        'ngInject';

        $scope.hideIdentical = false;
        $scope.allTestsIdentical = true;
        $scope.tr = angular.copy(selectedTestRuns);

        var COMPARE_FIELDS = ['status', 'message'];
        var EXIST_FIELDS = {'name': '', 'testGroup': '', 'testClass': ''};

        function aggregateTests(testRuns) {
            return angular.forEach(collectUniqueTests(testRuns), function (test) {
                test.identical = areTestsIdentical(test.referrers, testRuns);
            });
        };

        function collectUniqueTests(testRuns) {
            return testRuns.reduce((uniqueTests, testRun) => {
                angular.forEach(testRun.tests, function(test) {
                    var uniqueTestKey = EXIST_FIELDS;
                    uniqueTestKey.name = test.name;
                    uniqueTestKey.testGroup = test.testGroup;
                    uniqueTestKey.testClass = test.testClass;
                    var stringKey = JSON.stringify(uniqueTestKey);
                    if(!uniqueTests[stringKey]) {
                        uniqueTests[stringKey] = test;
                        uniqueTests[stringKey].referrers = {};
                    }
                    if(!uniqueTests[stringKey].referrers[testRun.id]) {
                        uniqueTests[stringKey].referrers[testRun.id] = {};
                    }
                    uniqueTests[stringKey].referrers[testRun.id] = test.id;
                });

                return uniqueTests;
            }, {});
        };

        function areTestsIdentical(referrers, testRuns) {
            var value = {};
            var result = {};
            var identicalCount = 'count';

            result[identicalCount] = Object.size(referrers) === testRuns.length;

            Object.keys(referrers).forEach(testRunId => {
                const testRun = testRuns.find(({ id }) => id === +testRunId);

                if (testRun) {
                    const test = testRun.tests[referrers[testRunId]];

                    if (!Object.size(value)) {
                        COMPARE_FIELDS.forEach(field => {
                            value[field] = test[field];
                            result[field] = true;
                        });
                        result.isIdentical = true;
                    } else {
                        COMPARE_FIELDS.forEach(field => {
                            result[field] = verifyValueWithRegex(field, test[field], value[field]);
                            if (!result[field]) {
                                result.isIdentical = false;
                                $scope.allTestsIdentical = false;
                            }
                        });
                    }
                }
            });
            if(!result[identicalCount]) {
                $scope.allTestsIdentical = false;
            }
            return result;
        };

        function verifyValueWithRegex(field, value1, value2) {
            var val1 = field == 'message' && value1 ? value1
                .replace(new RegExp("\\d+","gm"), '*')
                .replace(new RegExp("\\[.*\\]","gm"), '*')
                .replace(new RegExp("\\{.*\\}","gm"), '*')
                .replace(new RegExp(".*\\b(Session ID)\\b.*","gm"), '*')
                : value1;
            var val2 = field == 'message' && value2 ? value2
                .replace(new RegExp("\\d+", "gm"), '*')
                .replace(new RegExp("\\[.*\\]", "gm"), '*')
                .replace(new RegExp("\\{.*\\}", "gm"), '*')
                .replace(new RegExp(".*\\b(Session ID)\\b.*", "gm"), '*')
                : value2;
            return ! isEmpty(value1) && ! isEmpty(value2) ? value1 == value2 : true;
        };

        function isEmpty(value) {
            return ! value || ! value.length;
        };

        $scope.getSize = function (obj) {
            return Object.size(obj);
        };

        $scope.getTest = function (testUnique, testRun) {
            var testId = testUnique.referrers[testRun.id];
            return testRun.tests[testId];
        };

        function initTestRuns() {
            const promises = $scope.tr.map(testRun => {
                return loadTests(testRun.id)
                    .then(rs => {
                        testRun.tests = {};
                        rs.results.forEach(function(test) {
                            testRun.tests[test.id] = test;
                        });
                    })
                    .catch(() => {
                        testRun.tests = {};
                    });
            });

            return $q.all(promises);
        };

        function loadTests(testRunId) {
            const testSearchCriteria = {
                'page': 1,
                'pageSize': 100000,
                'testRunId': testRunId
            };

            return TestService.searchTests(testSearchCriteria)
                .then(function (rs) {
                    if (rs.success) {
                        return angular.copy(rs.data);
                    } else {
                        console.error(rs.message);

                        return $q.reject(rs.message);
                    }
                });
        }

        $scope.openTestRun = function (testRunId) {
            if ($location.$$path != $location.$$url){
                $location.search({});
            }
            if ($location.$$absUrl.match(new RegExp(testRunId, 'gi')) == null){
                window.open($location.$$absUrl + "/" + testRunId, '_blank');
            }
        };

        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        (function initController() {
            $scope.loading = true;
            initTestRuns()
                .finally(() => {
                    $scope.uniqueTests = aggregateTests($scope.tr);
                    $scope.loading = false;
                });
        })();
    }

})();
