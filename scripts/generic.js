!function e(r, n, t) {
    function o(i, c) {
        if (!n[i]) {
            if (!r[i]) {
                var s = "function" == typeof require && require;
                if (!c && s)
                    return s(i, !0);
                if (u)
                    return u(i, !0);
                var a = new Error("Cannot find module '" + i + "'");
                throw a.code = "MODULE_NOT_FOUND",
                a
            }
            var f = n[i] = {
                exports: {}
            };
            r[i][0].call(f.exports, function(e) {
                var n = r[i][1][e];
                return o(n || e)
            }, f, f.exports, e, r, n, t)
        }
        return n[i].exports
    }
    for (var u = "function" == typeof require && require, i = 0; i < t.length; i++)
        o(t[i]);
    return o
}({
    1: [function(e, r, n) {
        // "use strict";
        // var t = document.querySelector(".menu.outside");
        // t.querySelector(".toggle").addEventListener("click", function() {
        //     t.classList.toggle("show")
        // }),
        // setTimeout(function() {
        //     var e = document.createElement("script")
        //       , r = document.querySelector(".menu.inside .advert");
        //     e.async = !0,
        //     e.src = "//cdn.carbonads.com/carbon.js?zoneid=1673&serve=C6AILKT&placement=pugjsorg",
        //     e.id = "_carbonads_js",
        //     r.appendChild(e)
        // }, 500)
    }
    , {}],
    2: [function(e, r, n) {
        "use strict";
        var t = e("pug")
          , o = function(e) {
            if (e && e.__esModule)
                return e;
            var r = {};
            if (null != e)
                for (var n in e)
                    Object.prototype.hasOwnProperty.call(e, n) && (r[n] = e[n]);
            return r.default = e,
            r
        }(t);
       e("../browser/menu.js"),
        window.pug = o
    }
    , {
       "../browser/menu.js": 1,
        pug: "pug"
    }]
}, {}, [2]);
