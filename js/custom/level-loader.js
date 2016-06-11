/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  /**
   * @constructor
   */
  stg.LevelLoader = function() {
    if (!(this instanceof stg.LevelLoader)) {
      throw new Error('This is a constructor, call it using new !');
    }
  };

  /**
   * Load a level by level text string, but the level json config file must
   * still be provided.
   */
  stg.LevelLoader.prototype.loadLevelInternalText = function(levelName, levelText, callback) {
    readTextFile('levels/' + levelName + '/' + levelName + '.json', function readConfigTextCallback(jsonAsText) {
      var levelConfig = JSON.parse(jsonAsText);
      var levelData = parseLevelText(levelText, levelConfig);
      callback(levelData, levelConfig);
      levelConfig = null; // For GC.
    });
  };

  /**
   * Load a level by filename (this expects a specific folder structure).
   * 
   * @param {string}
   *            levelName - the level name without file extension !
   * @param {function}
   *            callback
   */
  stg.LevelLoader.prototype.loadLevel = function(levelName, callback) {
    readTextFile('levels/' + levelName + '/' + levelName + '.json', function readConfigTextCallback(jsonAsText) {
      var levelConfig = JSON.parse(jsonAsText);
      readTextFile('levels/' + levelName + '/' + levelName + '.txt', function readLevelTextCallback(levelText) {
        var levelData = parseLevelText(levelText, levelConfig);
        callback(levelData, levelConfig);
        levelConfig = null; // For GC.
      });
    });
  };

  /**
   * Read level text (characters) and fill an easy to read line/scroll matrix
   * with it.
   * 
   * @param {string}
   *            levelText - the level data as a javascript string.
   */
  function parseLevelText(levelText, levelConfig) {
    var maxChars = 15;
    var annotationsByLine = {};
    var levelLines = levelText.split('\n');
    var levelLineCount = levelLines.length;
    var linesArray = new Array(levelLineCount);

    // Performance: Use contiguous keys starting at 0 for Arrays
    linesArray[0] = null;

    var playerLine = null, playerCol = null;
    for (var lineCounter = 0; lineCounter < levelLineCount; lineCounter++) {
      var levelLine = levelLines[lineCounter];
      if (lineCounter === levelLineCount - 1 && levelLine.length === 0) {
        // Some text editors add a new line at the bottom of files, ignore it.
        continue;
      }
      var lineArray = [];

      // Performance: Use contiguous keys starting at 0 for Arrays
      lineArray[0] = {
        character : '-'
      };

      // A text file is read top-down, but a level is loaded bottom-up.
      // So lines need to be added at the start of the lines array !
      var levelLineCountInversed = levelLineCount - 1 - lineCounter;

      var strictMode = levelConfig.strictMode;
      for (var charCounter = 0; charCounter < maxChars; charCounter++) {
        var character = levelLine.charAt(charCounter);

        if (strictMode) {
          if (character.toLowerCase() === character) {
            // Check tiles.
            var tile = levelConfig.textureByChar[character];
            if (!tile && character !== '-' && character !== ' ' && character !== '$' && character !== '€' && character !== '£' && character !== 'p') {
              alert('Unknown tile char ' + character + ' at line ' + (lineCounter + 1) + ', char ' + (charCounter + 1));
            }
          } else {
            // Check enemy.
            var enemy = levelConfig.enemyByChar[character];
            if (!enemy) {
              alert('Unknown enemy char ' + character + ' at line ' + (lineCounter + 1) + ', char ' + (charCounter + 1));
            }
          }
        }
        if (!character) {
          alert('Missing char at line ' + (lineCounter + 1) + ', char ' + (charCounter + 1));
          // lineArray.push(null); // -> Sparse array, less memory, slower
          // lookup ?
          character = '-'; // Dense array, faster lookup by index ? (opposite
          // of using null)
        }
        if (character === 'p' && !playerCol) {
          // We found a player start position (first one found will take over).
          playerLine = levelLineCountInversed;
          playerCol = charCounter;
        }
        lineArray[charCounter] = {
          character : character
        };
      }

      if ('@' === levelLine.charAt(maxChars)) {
        var jsonAnnotation = levelLine.substring(maxChars + 1, levelLine.length);
        // Parse annotations early to fail fast !
        annotationsByLine[levelLineCountInversed] = JSON && JSON.parse(jsonAnnotation);
      }
      linesArray[levelLineCountInversed] = lineArray;
    }
    if (playerLine === null && playerCol === null) {
      console.log("Did not find player position 'p', falling back to default start position.");
    } else {
      console.log("Found player start position at line " + playerLine + " col: " + playerCol);
    }

    var levelData = {
      annotationsByLine : annotationsByLine,
      linesArray : linesArray,
      playerLine : playerLine,
      playerCol : playerCol
    };
    return levelData;
  }

  function readTextFile(file, callback) {
    var xhr = new XMLHttpRequest();

    // Override the mime type, do not let the browser decide.
    xhr.overrideMimeType('text/plain; charset=UTF-8');

    var async = true; // Sync has been deprecated !
    // https://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/
    // The FACT of having this if condition breaks FireFox, WTF ?
    // if (chrome !== undefined && chrome.extension) {
    // TODO this works in Chrome, but need to add it to Phaser too ...
    // https://developer.chrome.com/extensions/xhr
    // xhr.open("GET", chrome.extension.getURL(file), async);
    // } else {
    xhr.open("GET", file, async);
    // }
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          var text = xhr.responseText;
          callback(text);
        }
        if (xhr.status === 304) {
          alert('Requested file but got cached copy.');
        }
      }
    };
    // The null parameter indicates that no body content is needed for the GET
    // request.
    xhr.send(null); // Fails in Chrome (even with extension).
  }

}(window.stg = window.stg || {}));