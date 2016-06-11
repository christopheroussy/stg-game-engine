/**
 * @module stg
 * @author Christophe Roussy
 * @copyright 2015
 */
/**
 * @function
 */
(function(stg, undefined) {
  "use strict";

  /**
   * This is implements parts of the interface of Phaser.State
   * 
   * @constructor
   */
  stg.LevelForest = function(game) {
    if (!(this instanceof stg.LevelForest)) {
      throw new Error('This is a constructor, call it using new !');
    }
    this.game = game;
    this.level = null;
  };

  stg.LevelForest.prototype.preload = function() {
    console.info("STATE: Game preload of " + this.key);

    var game = this.game;

    // TODO load level json here as we only want to load related resources.
    // -> solution may be to put this directly in the state js.
    // -> anyways both the json and the js are pretty much text files.
    // -> if everything can be put in the stage js, why not use it directly ?
    // http://www.html5gamedevs.com/topic/5446-how-to-create-multiple-levels/

    // LOAD LEVEL SPECIFIC RESOURCES HERE.

    // Load music.
    // https://phaser.io/examples/v2/audio/play-music
    // Firefox doesn't support mp3 files, so use ogg.
    // this.load.audio('theMusic', [ 'music/YM2612_Starway_to_Eldorian.mp3',
    // 'music/YM2612_Starway_to_Eldorian.ogg' ]);

    game.customTint = 0xffffff; // Neutral, daylight.

    // game.customTint = 0xffbbee; // Dusk.
    // game.customTint = 0xccddff; // Night.

    // Could be used in crazy 'blind mode'
    // game.customTint = 0x000011; // Alone in the dark.

    // game.customTint = 0xff66ff; // Magenta.
    // game.customTint = 0xffddff; // Magenta softer.

    // game.customTint = 0xffbb77; // Fireish, very hot
    // game.customTint = 0xffcc99; // Fireish, hotter
    // game.customTint = 0xffddaa; // Fireish, hot
    // game.customTint = 0xffeecc; // Fireish

    // game.customTint = 0xddffee; // Greenish.

    // game.customTint = 0xddeeff; // Blueish, cold, ice, night
    // game.customTint = 0xaaccff; // Blueish, cold, ice, night
    // game.customTint = 0x88aadd; // Blueish, cold, ice, dark.

    // var deepest = null;
    // var deepest = 'canyon';
    // var deepest = 'nebula';
    var deepest = 'dark-forest';
    // var deepest = 'cave2';
    // var deepest = 'inferno';
    // var deepest = 'stars';
    // var deepest = 'clouds';
    // var deepest = 'rocks';
    // var deepest = 'rocks-underwater';
    // var deepest = 'abyss';

    // var middle = null;
    // var middle = 'cave';
    var middle = 'cave2';
    // var middle = 'nebula';
    // var middle = 'clouds';
    // var middle = 'dark-forest';
    // var middle = 'corridor';

    var foreground = 'nebula';

    if (deepest) {
      this.load.image('background-deepest', 'images/background/' + deepest + '.png');
    }
    if (middle) {
      this.load.image('background-middleLayer', 'images/background/' + middle + '.png');
    }
    if (foreground) {
      this.load.image('foreground-above', 'images/background/' + foreground + '.png');
    }
    this.load.atlas('atlas-enemies-forest', 'images/enemy/enemies-forest.png', 'images/enemy/atlas-enemies-forest.json');

    // TODO handle multiple tile atlases ???
    // -> In this case the level.json file is not really interesting.
    this.tileAtlasKey = 'atlas-forest';
    this.load.atlas(this.tileAtlasKey, 'images/background/' + this.tileAtlasKey + '.png', 'images/background/' + this.tileAtlasKey + '.json');
  };

  stg.LevelForest.prototype.create = function() {
    console.info("STATE: Game create of " + this.key);
    this.stage.backgroundColor = '#000';

    var game = this.game;
    // ================== ~ 1000 / 60 = 100 / 6 = 16.666666666666668
    // game.customMsPerFrame = 1000 / game.time.desiredFps;

    // this.cache._text['someData'].data =
    // JSON.parse(this.cache.getText('someData'));
    // alert(game.cache.getText('level1-text'));

    this.level = new stg.Level(game, this, this.tileAtlasKey, this.key);
    var level = this.level;

    level.parallaxScrolling = function(cameraAppliedDeltaY) {
      if (level.middleLayer) {
        level.middleLayer.tilePosition.y += cameraAppliedDeltaY / 3;
      }

      // EXPERIMENTAL: verdict ? Not worth it. Just switch level to switch
      // background...
      // if (this.game.camera.y > 18700) {
      // level.middleLayer.visible = false;
      // level.middleLayer.fixedToCamera = false;
      // } else {
      // level.middleLayer.visible = true;
      // if (this.game.camera.y > (18700 - 320)) {
      // level.middleLayer.y = 18700 - 320 - this.game.camera.y;
      // } else {
      // level.middleLayer.y = 0;
      // level.middleLayer.tilePosition.y += cameraAppliedDeltaY / 3;
      // }
      // level.middleLayer.fixedToCamera = true;
      // }
    };
    level.trigger42 = function(x, y) {
      // TODO tttt experiment with line triggers.
      // TODO should ONLY activate when player reaches line.
      // TODO create trigger on line from annotation
      // TODO remove trigger once used ?
      // this.player.sprite.y -= 50;
      // console.log("trigger42 !!!");
    };

    // this.createGenerated('level-forest');

    level.readLevelFromFiles('level-forest');

    // Load level music.
    // game.music = game.add.audio('theMusic');
    // game.music.play('', 0, 1, true); // Loop true.
  };

  /**
   * Update is called each frame. Game logic runs here.
   */
  stg.LevelForest.prototype.update = function() {
    this.level.update();
  };

  // Looks like quitGame is now called 'shutdown' ?!
  stg.LevelForest.prototype.shutdown = function() {
    // REMOVE ONLY LEVEL SPECIFIC DATA !
    // Here you should destroy anything you no longer need.
    // Stop music, delete sprites, purge caches, free resources, all that good
    // stuff.
    console.debug("shutdown called for " + this.key);

    // use ...sprite...destroy();

    this.level.shutdown();
    this.level = null;

    // Then let's go back to the main menu.
    // this.state.start('MainMenu');
  };

  // // Keep a local reference to these pure functions, it is probably faster
  // than
  // // using the prototype.
  // var random = Math.random;
  // var chance = stg.generatorStatic.chance;
  // var chanceLeftRight = stg.generatorStatic.chanceLeftRight;
  // var chanceTopBottom = stg.generatorStatic.chanceTopBottom;
  // var chanceAroundCross = stg.generatorStatic.chanceAroundCross;
  // var isCellEmpty = stg.generatorStatic.isCellEmpty;
  // // var isCellEmptyAvailable = stg.generatorStatic.isCellEmptyAvailable;
  // var cellPutInFront = stg.generatorStatic.cellPutInFront;
  //
  // stg.LevelForest.prototype.createGenerated = function(levelName) {
  // var game = this.game;
  // var level = this.level;
  //
  // console.debug("Generating level " + levelName);
  // // IMPORTANT: TEST MOST EXTREME VALUES.
  //
  // var gen = new stg.Generator(game);
  // var difficultyFactor = game.customDifficultyFactor;
  // var lineCount = 20 * 14;
  // var offsetTop = 25;
  // var offsetBottom = 10;
  // var linesFloat;
  // if (difficultyFactor > 1) {
  // linesFloat = gen.generateTerrain(lineCount, 2 + Math.round(Math.random() *
  // 2), 0.98);
  // } else {
  // linesFloat = gen.generateTerrain(lineCount, 4 + Math.round(Math.random() *
  // 3), 0.94 + Math.random() * 0.1);
  // }
  // console.debug("Generated terrain (raw). Found lines: " +
  // linesFloat.length);
  //
  // // var linesFloat = generateTerrain(200, 3, 1);
  // var lines = transformFloatTerrainToLinesArray(linesFloat, offsetTop,
  // offsetBottom);
  // console.debug("Generated terrain (text). Found lines: " +
  // linesFloat.length);
  //
  // // Now we got both the original float value and the char.
  // decorateTerrain(linesFloat, lines, offsetTop, offsetBottom,
  // difficultyFactor);
  // console.debug("Decorated terrain (text). Found lines: " + lines.length);
  // linesFloat = null;
  //
  // var levelText = gen.linesArrayToText(lines);
  // lines = null;
  //
  // console.debug("Transforming level to big text.");
  // level.readLevelInternal(levelName, levelText);
  // };
  //
  // /**
  // * @memberOf stg.LevelForest
  // * @private
  // */
  // function isRock(chr) {
  // return chr === 'c' || chr === 'e' || chr === 'f' || chr === 's' || chr ===
  // 'h' || chr === 'B';
  // }
  //
  // /**
  // * @memberOf stg.LevelForest
  // * @private
  // */
  // function transformFloatTerrainToLinesArray(linesFloat, offsetTop,
  // offsetBottom) {
  // // Create a 2D array for convenience and performance reasons.
  // var lines = [];
  //
  // if (offsetTop > 1) {
  // // Place boss on top of level.
  // for (var l = 0; l < offsetTop; l++) {
  // var line = [];
  // var lineFloat = linesFloat[l];
  // for (var c = 0; c < lineFloat.length; c++) {
  // line.push('-');
  // }
  // lines.push(line);
  // }
  // lines[6][Math.round(15 / 2)] = 'Z'; // The boss.
  // }
  //
  // // TODO implement rest/empty areas...
  // // TODO maybe some caves should have more of one enemy and less of another
  // // to give it a 'style/theme'
  // var lenLinesFloat = linesFloat.length;
  // var lenMinOffsetBottom = lenLinesFloat - offsetBottom;
  // for (var l = offsetTop - 1; l < lenMinOffsetBottom; l++) {
  // var lineFloat = linesFloat[l];
  // var line = [];
  // var lenChar = lineFloat.length;
  // for (var c = 0; c < lenChar; c++) {
  // var v = lineFloat[c];
  // if (v > 0.567) {
  // if (chance(2)) {
  // line.push('d');
  // } else {
  // line.push('f');
  // }
  // } else if (v > 0.52) {
  // line.push('e');
  // } else if (v > 0.5) {
  // if (linesFloat[l - 1][c] > 0.5 && linesFloat[l + 1][c] < 0.5) {
  // // 'Underhang' terrain.
  // if (chance(50)) {
  // // Stalagmite, it just looks good :)
  // line.push('s');
  // } else if (chance(40)) {
  // line.push('h');
  // } else {
  // line.push('c');
  // }
  // } else if (chance(2)) {
  // line.push('d');
  // } else if (chance(5)) {
  // line.push('e');
  // } else {
  // line.push('c');
  // }
  // } else {
  // line.push('-');
  // // if (v < 0.4 && v > 0.36 && chance(20)) {
  // // // This creates some blocks in the middle of nowhere.
  // // // Small islands in the middle of the tunnel, good for protection,
  // // // the player can hide in it like fish in a reef.
  // // // In extreme cases it even splits the tunnel into two, offering
  // // // choice.
  // // if (chance(6)) {
  // // line.push('d');
  // // } else if (chance(10)) {
  // // line.push('B');
  // // } else {
  // // // This is outside.
  // // line.push('c');
  // // }
  // // } else {
  // // line.push('-');
  // // }
  // }
  // }
  // lines.push(line);
  // }
  //
  // // Fill bottom with empty lines for player start.
  // for (var l = lenMinOffsetBottom; l < lenLinesFloat; l++) {
  // var line = [];
  // var lineFloat = linesFloat[l];
  // for (var c = 0; c < lineFloat.length; c++) {
  // line.push('-');
  // }
  // lines.push(line);
  // }
  //
  // return lines;
  // }
  //
  // /**
  // * Modifies the EXISTING array of lines (each line is an array of chars).
  // *
  // * @memberOf stg.LevelForest
  // * @private
  // */
  // function decorateTerrain(linesFloat, charArrays, offsetTop, offsetBottom,
  // difficultyFactor) {
  //
  // // TODO rock carving ? Example: rotaline could remove rocks around...
  // // TODO maybe have some enemies which only exist next to a given tile
  // // (temple tile, water...)
  //
  // //
  // // Do some local mapping of chars, this is much more readable and
  // // maintainable !
  // //
  // var emptyReserved = '.'; // Reserved: signals this is empty and shoud
  // // remain so.
  // var emptyAvailable = '-';
  //
  // var towerSimple = 'T';
  // var towerSpread = 'U';
  // var sideShooter = 'H'; // TODO add one with spread shot (various...)
  // var leftToRight = 'E'; // Parametrize the speed. TODO add one where it goes
  // // righttoleft...
  // // walks around blocks...
  // var blockDestructible = 'B';
  // var waterfall = 'w';
  // var seeker = 'X';
  // var octopus = 'L';
  // var spiral = 'A';
  // var blinker = 'S'; // Aka shield.
  // var mine = 'M'; // TODO add a diagonal mine ;)
  // var rotaline = 'R'; // Parametrize the speed, rotation direction, segment
  // // count and such...
  // var collectibleCoin = '$';
  // var collectibleCoinBig = '€';
  // var collectibleAnkh = '£';
  //
  // var enemyLineWeight = 0;
  //
  // offsetTop = Math.max(1, offsetTop);
  // offsetBottom = Math.max(0, offsetBottom);
  //
  // var decorateLen = charArrays.length - offsetBottom;
  // for (var l = offsetTop; l < decorateLen; l++) {
  // // var lineFloat = linesFloat[l];
  // var charArray = charArrays[l];
  // var lineAbove = charArrays[l - 1];
  // var lineBelow = charArrays[l + 1];
  //
  // var lenRow = charArray.length;
  // for (var c = 1; c < lenRow - 1; c++) {
  // var t = charArray[c];
  // if (isRock(t)) {
  // // Create opportunities to go through thin walls. Also clears some
  // // otherwise impossible passages.
  // if (isCellEmpty(lineAbove[c]) && isCellEmpty(lineBelow[c])) {
  // var percent = 70;
  // if (isRock(charArray[c - 1])) {
  // percent += 14;
  // }
  // if (isRock(charArray[c + 1]) && charArray[c + 1] !== blockDestructible) {
  // percent += 14;
  // }
  // if (chance(percent)) {
  // charArray[c] = blockDestructible;
  // }
  // } else if (isCellEmpty(charArray[c - 1]) && isCellEmpty(charArray[c + 1]))
  // {
  // if (chance(80)) {
  // charArray[c] = blockDestructible;
  // }
  // } else if (isRock(lineAbove[c]) && !isRock(lineBelow[c])
  //
  // && isRock(charArray[c - 1]) && isRock(charArray[c + 1])
  //
  // && isRock(charArrays[l + 2][c]) && isRock(charArrays[l + 3][c])) {
  // if (chance(90)) {
  // // TODO make the waterfall more a structural element, a 16x16
  // // block
  // charArray[c] = waterfall;
  // if (chance(33 * difficultyFactor)) {
  // lineBelow[c] = collectibleCoinBig;
  // } else {
  // lineBelow[c] = emptyReserved;
  // }
  // charArrays[l + 2][c] = emptyReserved;
  // }
  // }
  // }
  //
  // if (t !== emptyAvailable) {
  // continue; // Skip. Let it be.
  // }
  //
  // var charAbove = lineAbove[c];
  // var charBelow = lineBelow[c];
  // var charLeft = charArray[c - 1];
  // var charRight = charArray[c + 1];
  //
  // // var f = lineFloat[c];
  //
  // var isRockAbove = isRock(charAbove);
  // var isRockLeft = isRock(charLeft);
  // var isRockRight = isRock(charRight);
  // var isRockBelow = isRock(charBelow);
  //
  // // var isCenterSpace = c > 2 && c < 13 && f < 0.5;
  // var isCenterSpace = c > 2 && c < 13;
  //
  // // 1. Look for a spatial feature based on neighbor cells
  // // 2. Populate it with some rule
  //
  // // Concept: each thing is a like a mini game/challenge, and combination
  // // of the all is great.
  //
  // //
  // // ANYWHERE.
  // //
  //
  // if (chance(0.3)) {
  // charArray[c] = blockDestructible;
  // } else if (chance(0.4)) {
  // charArray[c] = collectibleCoin;
  // } else if (chance(0.7)) {
  // charArray[c] = mine;
  // if (isCellEmpty(lineBelow[c])) {
  // if (chance(10)) {
  // lineBelow[c] = blinker;
  // } else if (chance(10)) {
  // lineBelow[c] = blockDestructible;
  // } else if (!isRockRight && chance(10)) {
  // charArray[c + 1] = mine;
  // } else if (!isRockLeft && chance(10)) {
  // charArray[c - 1] = mine;
  // }
  // }
  // }
  //
  // if (isRockAbove) {
  // //
  // // 'Underhang' terrain.
  // //
  //
  // // charArray[c] = towerSpread;
  // // charArray[c] = collectibleCoin;
  // // if (isRock(charBelow)) {
  // if (isRockLeft !== isRockRight) {// Either rock left or right.
  // if (isRock(charBelow)) {
  // // Harder to reach. A + B + L ^ R
  // if (isRock(lineBelow[c - 1]) && isRock(lineBelow[c + 1])) {
  // // Hard to reach. A + B + L ^ R + BR ^ BL
  // if (chance(90 * difficultyFactor)) {
  // charArray[c] = collectibleAnkh;
  // }
  // } else if (chance(90 * difficultyFactor)) {
  // charArray[c] = sideShooter;
  // } else if (chance(30 * difficultyFactor)) {
  // charArray[c] = collectibleCoinBig;
  // }
  // } else if (chance(20 * difficultyFactor)) {
  // charArray[c] = collectibleCoin;
  // } else if (chance(10 * difficultyFactor)) {
  // charArray[c] = towerSimple;
  // if (chance(15)) {
  // lineBelow[c] = blinker;
  // } else if (chance(15)) {
  // lineBelow[c] = blockDestructible;
  // } else if (chance(15)) {
  // lineBelow[c] = leftToRight;
  // } else if (chance(15)) {
  // lineBelow[c] = mine;
  // } else {
  // lineBelow[c] = emptyReserved;
  // }
  // } else if (difficultyFactor >= 1 && chance(3 * difficultyFactor *
  // difficultyFactor)) {
  // charArray[c] = towerSpread;
  // lineBelow[c] = emptyReserved;
  // // No shield this tower is powerful enough already !
  // }
  // }
  // } else {
  // //
  // // No rock above.
  // //
  //
  // if (isRockLeft !== isRockRight) {// Either rock left or right.
  // // 'Cliff' on the smooth sides.
  // if (chance(4)) {
  // charArray[c] = leftToRight;
  // if (chance(20)) {
  // cellPutInFront(charArrays, c, l, leftToRight, Math.round(random() * 2) +
  // 1);
  // } else {
  // if (isRockLeft && chance(20)) {
  // charArray[c + 1] = leftToRight;
  // } else if (chance(25)) {
  // charArray[c - 1] = leftToRight;
  // }
  // }
  //
  // }
  // }
  // }
  //
  // if (isCenterSpace && t === emptyAvailable
  //
  // && !isRockAbove && !isRockBelow && !isRockLeft && !isRockRight &&
  // !isRock(charArrays[l + 2][c])) {
  // //
  // // 'Open space', available space.
  // //
  // if (chance(0.18 * difficultyFactor)) {
  // charArray[c] = seeker;
  // } else if (chance(0.4)) {
  // // Annoyingly good, requires good short term memory and timing to
  // // avoid.
  // charArray[c] = blinker;
  // } else if (chance(0.15)) {
  // // Difficult if many are around...
  // charArray[c] = octopus;
  // cellPutInFront(charArrays, c, l, emptyReserved, 2);
  // chanceAroundCross(90, charArrays, c, l, emptyReserved);
  // } else if (difficultyFactor >= 1 && chance(0.04 * difficultyFactor *
  // difficultyFactor)) {
  // charArray[c] = spiral;
  // // TODO increment current 'weight' of enemies, decrement when
  // // adding none.
  // // TODO reserve more space around !
  // cellPutInFront(charArrays, c, l, emptyReserved, 2);
  // chanceAroundCross(10, charArrays, c, l, blockDestructible);
  // } else if (chance(0.1)) {
  // // Difficult if many are around...
  // // TODO parametrize enemy !
  // charArray[c] = rotaline;
  // chanceAroundCross(90, charArrays, c, l, emptyReserved);
  // chanceLeftRight(50 * difficultyFactor, charArrays, c, l, collectibleCoin);
  // chanceTopBottom(10 * difficultyFactor, charArrays, c, l,
  // collectibleCoinBig);
  // }
  // }
  //
  // }
  // }
  // }

  // /**
  // * This uses a simple random algorithm to generate some kind of simple
  // cavern
  // * passage.
  // */
  // function generateLevelLines(levelLineCount) {
  // var lines = [];
  // var charPerLineCount = 15;
  // var weightRand = 1 + random() * 5;
  // var weightPrev = 1 + random() * 2;
  // // Generate the empty level.
  // for (var l = 0; l < levelLineCount; l++) {
  // // Add empty lines.
  // lines.push([ '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-',
  // '-', '-', '-' ]);
  // }
  // var borderDivLeft, borderDivRight, bdlp = 10, bdrp = 10, line, nextLine, l,
  // c;
  // // Modify the empty level.
  // for (l = 10; l < levelLineCount - 22; l++) {
  // line = lines[l];
  // nextLine = lines[l + 1];
  //
  // borderDivLeft = (Math.max(2.2, random() * 7) * weightRand + bdlp *
  // weightPrev) / (weightPrev + weightRand);
  // bdlp = borderDivLeft;
  //
  // borderDivRight = (Math.max(2.2, random() * 7) * weightRand + bdrp *
  // weightPrev) / (weightPrev + weightRand);
  // bdrp = borderDivRight;
  //
  // for (c = 0; c < charPerLineCount; c++) {
  // if (line[c] !== '-') {
  // continue;
  // }
  // if (random() > (c / charPerLineCount * borderDivLeft) ||
  //
  // +random() > ((charPerLineCount - 1 - c) / charPerLineCount *
  // borderDivRight)) {
  // // Place blocks on the borders.
  // if (c > 3 && c < charPerLineCount - 3) {
  // line[c] = 'c';
  // } else if (c > 1 && c < charPerLineCount - 1) {
  // line[c] = 'e';
  // } else {
  // line[c] = 'f';
  // }
  // }
  // if (c > 1 && c < charPerLineCount - 1) {
  // if (c === 7) {
  // if (random() > 0.99) {
  // line[c] = 'B';
  // }
  // } else if (random() > 0.982) {
  // if (c > 4 && c < charPerLineCount - 4) {
  // line[c] = 'c';
  // } else {
  // line[c] = 'd';
  // }
  // if (random() > 0.8) {
  // line[c] = 'B';
  // }
  // }
  //
  // if (random() > 0.99) {
  // line[c] = '$';
  // } else if (random() > 0.999) {
  // line[c] = '€';
  // } else if (random() > 0.994) {
  // line[c] = 'T';
  // if (random() > 0.8) {
  // // Give it a shield.
  // nextLine[c] = 'S';
  // }
  // } else if (random() > 0.994) {
  // line[c] = 'H';
  // if (random() > 0.9) {
  // // Protect it with a block.
  // nextLine[c] = 'B';
  // }
  // } else if (random() > 0.9994) {
  // line[c] = 'U';
  // } else if (random() > 0.997) {
  // line[c] = 'E';
  // } else if (random() > 0.999) {
  // line[c] = 'F';
  // } else if (borderDivLeft > 5 && borderDivRight > 5 && c > 5 && c < 10 &&
  // random() > 0.99) {
  // line[c] = 'L';
  // } else if (borderDivLeft > 5 && borderDivRight > 5 && c > 5 && c < 10 &&
  // random() > 0.99) {
  // line[c] = 'R';
  // } else if (random() > 0.992) {
  // line[c] = 'M';
  // }
  // }
  // }
  // }
  // return lines;
  // }

}(window.stg = window.stg || {}));
