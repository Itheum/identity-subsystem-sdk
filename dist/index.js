System.register(["./Identity", "./IdentityFactory"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function exportStar_1(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exports_1(exports);
    }
    return {
        setters: [
            function (Identity_1_1) {
                exportStar_1(Identity_1_1);
            },
            function (IdentityFactory_1_1) {
                exportStar_1(IdentityFactory_1_1);
            }
        ],
        execute: function () {
        }
    };
});
