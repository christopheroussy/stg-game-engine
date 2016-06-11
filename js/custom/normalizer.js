/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(undefined) {
  "use strict";
  if (console === undefined) {
    // Useful in browsers when there is no console.
    window.console = {
      error : function() {
        //
      },
      warn : function() {
        //
      },
      info : function() {
        //
      },
      debug : function() {
        //
      },
      log : function() {
        //
      }
    };
  } else {
    if (console.log) {
      if (console.error === undefined) {
        console.error = console.log;
      }
      if (console.warn === undefined) {
        console.warn = console.log;
      }
      if (console.info === undefined) {
        console.info = console.log;
      }
      if (console.debug === undefined) {
        console.debug = console.log;
      }
    } else {
      throw Error("console log is not supported.");
    }
  }
  window.onerror = function(errorMsg, url, lineNumber, column, errorObj) {
    var msg = 'Window onerror: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber;
    msg += ' Column: ' + column + ' StackTrace: ' + errorObj;
    console.error(msg);
  };
})();