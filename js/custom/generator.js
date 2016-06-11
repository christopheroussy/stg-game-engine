/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  var random = Math.random;
  // const random = Math.random;

  /**
   * @constructor
   */
  stg.Generator = function(game) {
    if (!(this instanceof stg.Generator)) {
      throw new Error('This is a constructor, call it using new !');
    }
    // TODO use difficulty factor in generation process ?
    this.game = game;
  };
  

  /**
   * Generates a (hopefully) passable cave like terrain.
   * 
   * @param {int}
   *            lineCount
   * @param {number}
   *            transformPasses - Smoother if larger, 3 is OK, 2 is too random,
   *            if larger structure and spaces will be larger but there will be
   *            less detail (less niches). Anything above 10 is very empty and
   *            boring. Smaller is usually harder.
   * @param {number}
   *            narrownessFactor - 1 is OK, more open if lower. Avoid higher.
   */
  stg.Generator.prototype.generateTerrain = function(lineCount, transformPasses, narrownessFactor) {
    var linesFloat = [];
    var charPerLineCount = 15;
    var min = 5, max = min + 3;
    var tmpMin, tmpMax;
    // TODO vary fill depending on line (do special sections...)
    // Fill the array with something to start with...
    // Usually with random noise.
    for (var l = 0; l < lineCount; l++) {
      var lineFloat = [];
      // Meander randomly through the noise...
      min += Math.round((random() * 3) - 1.5);
      min = Math.max(3, Math.min(10, min));
      tmpMin = min - Math.round(random() * 4);

      max = min + 2;
      tmpMax = max + Math.round(random() * 4);

      for (var c = 0; c < charPerLineCount; c++) {
        var v;
        if (chance(50)) {
          // Randomly force something non-random :)
          // The trick is that the mean random value is 0.5, but here we use
          // something slightly lower to randomly carve the rock.
          // IMPORTANT: it is safer to carve than to add rock (safe passage).
          v = 0.4835;
        } else if (c > tmpMin - 1 && c < tmpMax + 1) {
          // This add some chaos to the otherwise quite regular tunnel edge.
          // It also serves as a transition.
          v = 0.384 + random() * 0.1;
        } else if (c > tmpMin && c < tmpMax) {
          // There must be more space in the middle in order to pass.
          // Carve a 'tunnel'/'passage' in the terrain.
          v = 0; // Dig strong !
        } else {
          // Other randomness: brings interesting features to the mix.
          // Here the formula involves c and creates some interesting values.
          var otherRand = Math.abs(Math.cos((3.141592 * 2) / ((c + 1) / 16)));

          // v = (random() + otherRand) / 2; // Less linear: harder
          v = (random() * 2 + otherRand) / 3; // More linear
          // v = (random() * 3 + otherRand) / 4; // Even more linear
          // v = 0.55;
          // v = random();
          // v = otherRand;
        }
        lineFloat.push(v * narrownessFactor);
      }
      linesFloat.push(lineFloat);
    }

    // Use a cellular automata to generate some less random data.
    for (var t = 0; t < transformPasses; t++) {
      for (var l = 1; l < linesFloat.length; l++) {
        var lineFloat = linesFloat[l];
        for (var c = 1; c < lineFloat.length; c++) {
          // transformCells(lineFloat, c, lineFloat, c + 1);
          transformCells(lineFloat, c, lineFloat, c - 1);

          transformCells(lineFloat, c, linesFloat[l - 1], c);
          // transformCells(lineFloat, c, linesFloat[l - 1], c + 1);
          // transformCells(lineFloat, c, linesFloat[l - 1], c - 1);

          // transformCells(lineFloat, c, linesFloat[l + 1], c);
          // transformCells(lineFloat, c, linesFloat[l + 1], c - 1);
          // transformCells(lineFloat, c, linesFloat[l + 1], c + 1);
        }
      }
    }
    return linesFloat;
  };

  stg.Generator.prototype.linesArrayToText = function(lines) {
    var linesAsText = [];
    for (var l = 0; l < lines.length; l++) {
      linesAsText.push(lines[l].join(''));
    }
    var levelText = linesAsText.join("\n");
    return levelText;
  };

  function chance(percent) {
    return random() < (percent / 100);
  }

  /**
   * Left or right.
   */
  function chanceLeftRight(percent, charArrays, c, l, chr) {
    if (chance(percent)) {
      charArrays[l][c - 1] = chr;
    }
    if (chance(percent)) {
      charArrays[l][c + 1] = chr;
    }
  }

  /**
   * Top or bottom.
   */
  function chanceTopBottom(percent, charArrays, c, l, chr) {
    if (chance(percent)) {
      charArrays[l - 1][c] = chr;
    }
    if (chance(percent)) {
      charArrays[l + 1][c] = chr;
    }
  }

  /**
   * Top, left, bottom or right.
   */
  function chanceAroundCross(percent, charArrays, c, l, chr) {
    if (chance(percent)) {
      charArrays[l][c - 1] = chr;
    }
    if (chance(percent)) {
      charArrays[l][c + 1] = chr;
    }
    if (chance(percent)) {
      charArrays[l - 1][c] = chr;
    }
    if (chance(percent)) {
      charArrays[l + 1][c] = chr;
    }
  }

  function isCellAvailable(chr) {
    return chr === '-';
  }

  function isCellEmpty(chr) {
    return chr === '-' || chr === '.';
  }

  /**
   * Fills available in front.
   */
  function cellPutInFront(charArrays, c, l, chr, count) {
    for (var i = 1; i < count; i++) {
      if (isCellAvailable(charArrays[l + i][c])) {
        charArrays[l + i][c] = chr;
      }
    }
  }

  function transformCells(ref1, ind1, ref2, ind2) {
    // Cheap interpolation...
    var mean = (ref1[ind1] + ref2[ind2]) / 2;
    ref1[ind1] = mean;
    ref2[ind2] = mean;
  }

  stg.generatorStatic = {
    chance : chance,
    chanceAroundCross : chanceAroundCross,
    chanceLeftRight : chanceLeftRight,
    chanceTopBottom : chanceTopBottom,
    cellPutInFront : cellPutInFront,
    isCellEmpty : isCellEmpty,
    isCellAvailable : isCellAvailable
  };

}(window.stg = window.stg || {}));
