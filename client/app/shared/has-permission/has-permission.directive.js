'use strict';

const hasPermissionDirective = function(
    $animate,
    $compile,
    authService,
) {
    'ngInject';

    return {
        multiElement: true,
        priority: 601,
        transclude: 'element',
        restrict: 'A',
        $$tlb: true,
        link: function($scope, $element, $attr, ctrl, $transclude) {
            let block, childScope, previousElements;

            $attr.$observe('hasPermission', function(value){

            // $scope.$watch($attr.hasPermission, function hasPermissionWatchAction(value) {
                console.log(value);
                console.log(value.split(/,\s*/));
                console.log(authService.userHasAnyPermission(value.split(/,\s*/)));
                if (value && authService.userHasAnyPermission($attr.hasPermission.split(/,\s*/))) {
                    if (!childScope) {
                        $transclude(function(clone, newScope) {
                            childScope = newScope;
                            clone[clone.length++] = $compile.$$createComment('end hasPermission', $attr.hasPermission);
                            // Note: We only need the first/last node of the cloned nodes.
                            // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                            // by a directive with templateUrl when its template arrives.
                            block = {
                                clone: clone
                            };
                            $animate.enter(clone, $element.parent(), $element);
                        });
                    }
                } else {
                    if (previousElements) {
                        previousElements.remove();
                        previousElements = null;
                    }
                    if (childScope) {
                        childScope.$destroy();
                        childScope = null;
                    }
                    if (block) {
                        previousElements = getBlockNodes(block.clone);
                        $animate.leave(previousElements).done(function(response) {
                            if (response !== false) {
                                previousElements = null;
                            }
                        });
                        block = null;
                    }
                }
            });
        }
    };

    function getBlockNodes(nodes) {
        // TODO(perf): update `nodes` instead of creating a new object?
        var node = nodes[0];
        var endNode = nodes[nodes.length - 1];
        var blockNodes;

        for (var i = 1; node !== endNode && (node = node.nextSibling); i++) {
            if (blockNodes || nodes[i] !== node) {
                if (!blockNodes) {
                    console.log(nodes);
                    blockNodes = angular.element(slice.call(nodes, 0, i));
                }
                blockNodes.push(node);
            }
        }

        return blockNodes || nodes;
    }
};


//     function (
//     authService,
// ) {
//     'ngInject';
//
//     return {
//         restrict: 'A',
//         link: function(scope, elem, attrs) {
//             elem.hide();
//
//             scope.$watch(() => authService.isLoggedIn, function(newVal) {
//                 if (newVal && authService.userHasAnyPermission(attrs.hasAnyPermission.split(/,\s*/))) {
//                     elem.show();
//                 } else {
//                     elem.hide();
//                 }
//             });
//         }
//     };
// };

export default hasPermissionDirective;
