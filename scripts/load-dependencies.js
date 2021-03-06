/* global $, _, console, location */

/*
 
 http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML
 cookies-0.3.1.min.js 
 http://d3js.org/d3.v3.min.js

 viz.js
 codemirror/codemirror.js
 codemirror/scheme.js
 codemirror/matchbrackets.js

 webchurch.js

 nav.js
 injector.js
 cosmetics.js

 */

_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

(function() {
  // NB: path is relative to main content directory
  // for simplicity, don't allow // retrievals

  var mathJaxPaths = {
    file: "http://cdn.mathjax.org/mathjax/latest/MathJax.js",
    http: "http://cdn.mathjax.org/mathjax/latest/MathJax.js",
    https: "https://c328740.ssl.cf1.rackcdn.com/mathjax/latest/MathJax.js"
  };
  
  var libs = {
    mathjax: {
      paths: [mathJaxPaths[location.protocol.replace(":","")] + "?config=TeX-AMS-MML_HTMLorMML"]
    },
    periodicalupdater: {
      paths: ["scripts/jquery.periodicalupdater.js"]
    },
    webchurch: {
      //paths: ["scripts/webchurch.js"]
      paths: ["webchurch/online/webchurch.js"]
    },
    cm: {
      paths: ["codemirror/codemirror.js"]
    },
    cmscheme: {
      paths: ["codemirror/church.js"],
      parents: ["cm"]
    },
    cmbrackets: {
      paths: ["codemirror/matchbrackets.js"],
      parents: ["cm"]
    },
    cmclosebrackets: {
      paths: ["codemirror/closebrackets.js"],
      parents: ["cm"] 
    },
    cmcomments: {
        paths: ["codemirror/comments.js"],
        parents: ["cm"]
    },
    cmfoldcode: {
        paths: ["codemirror/foldcode.js"],
        parents: ["cm"]
    },
    md5: {
      paths: ["scripts/md5.js"]
    },
    nav: {
      paths: ["scripts/nav.js"]
    }, 
    cosmetics: {
      paths: ["scripts/cosmetics.js"]
    },
    d3: {
      paths: ["scripts/d3.v3.min.js"]
    },
    viz: {
      paths: ["scripts/viz.js"],
      parents: ["d3", "webchurch"]
    },
    phys: {
      paths: ["scripts/phys.js"],
      parents: ["box2dweb", "webchurch"]
    },
    box2dweb: {
      paths: ["scripts/Box2dWeb-2.1.a.3.js"]
    },
    plinko: {
      paths: ["scripts/plinko.js"],
      parents: ["box2dweb"]
    },
    injector: {
      paths: ["scripts/injector.js"],
      parents: ["webchurch", "cm", "cmscheme", "cmbrackets", "periodicalupdater", "viz", "cmclosebrackets", "md5"]
    }
  };

  // explicitly fill in the parent, child relationships
  // in the libs object
  for (var name in libs) {
    var props = libs[name];
    props.name = name;
    
    if (typeof props.parents == "undefined") {
      props.parents = [];
    }
    props.unloadedParents = _(props.parents).clone();

    var parents = props.parents;
    
    _(parents).each(function(parentName) {
      var parent = libs[parentName];

      if (typeof parent.children == "undefined") {
        parent.children = [name];
      } else {
        parent.children.push(name);
      } 
    });

    // create a loader. on successful load,
    // remove this library from the list of
    // unloadedParents for all its children
    // if, afterward, any children don't have
    // any unloadedParents

    var isLocal = location.protocol.match(/file/) || false,
        loadStrategy = isLocal ? "head" : "ajax";
    
    props.load = _.bind(
      function() {
        console.log("try loading " + this.name);
        // TODO: implement fall-back paths
        var path = this.paths[0],
            loadedLibName = this.name,
            children = this.children;

        if (this.name != "mathjax") {
            path += "?" + (new Date()).getTime();
        }

        if (typeof children == "undefined") {
          children = [];
        }

        var success = function(script, textStatus) {
          if (loadedLibName == "injector") {
            console.log((new Date()).getTime() - startTime);
          }

          console.log("("+ loadStrategy + ") OKAY loading " + loadedLibName);
          _(children).each(function(childName) {
            var childLib = libs[childName];
            childLib.unloadedParents = _(childLib.unloadedParents).without(loadedLibName);
            if (childLib.unloadedParents.length == 0) {
              console.log( "-- all dependencies for " + childName + " satisfied");
              childLib.load();
            }
          });
        };

        var failure = function() {
          var failString = '(' + loadStrategy + ') FAIL loading ' + loadedLibName + '. Try refreshing';
          alert(failString);
        };

        if (isLocal) {
          var script = document.createElement('script'); 
          script.src = path;
          script.async = true;
          // not quite IE-ready
          // see http://blog.lexspoon.org/2009/12/detecting-download-failures-with-script.html
          // for guidance
          script.onerror = function() {
            failure();
          };
          
          script.onload = function() {
            success();
          };
          document.getElementsByTagName('head')[0].appendChild(script); 
        } else {
          // try loading three times and then give up
          var ajaxLoader = function() {
            $.getScript(path)
              .done( success )
              .fail(function() {
                if (!props.tries) {
                  props.tries = 0;
                }
                props.tries++;

                if (props.tries < 3) { 
                  console.log('(ajax) RETRY loading ' + loadedLibName);
                  setTimeout(ajaxLoader, 100);
                } else {
                  failure();
                }
              });
            };
          ajaxLoader();
        }
          
      },
      props); 
  }

  // doesn't matter; we do it manually
  $.ajaxSetup({cache: false});

  window.libs = libs;
  var startTime = (new Date()).getTime();
  // load all the parentless libraries
  _(libs).each(function(props, names) {
    if (props.parents.length == 0) {
      props.load();
    }
  });
  
  
})();
