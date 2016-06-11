/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  /**
   * @constructor
   */
  stg.LevelSpace = function(game) {
    if (!(this instanceof stg.LevelSpace)) {
      throw new Error('This is a constructor, call it using new !');
    }
    this.game = game;
    this.level = null;
  };

  stg.LevelSpace.prototype.preload = function() {
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
    // this.load.audio('theMusic', [ 'music/Omegatronics.mp3',
    // 'music/Omegatronics.ogg' ]);

    // game.customTint = 0xddffff; // Neutral, daylight.

    game.customTint = 0xffffff; // Neutral, daylight.
    // game.customTint = 0xffbbee; // Dusk.
    // game.customTint = 0xccddff; // Night.
    // game.customTint = 0x000011; // Alone in the dark.

    // game.customTint = 0xff66ff; // Magenta.

    // game.customTint = 0xffbb77; // Fireish, very hot
    // game.customTint = 0xffcc99; // Fireish, hotter
    // game.customTint = 0xffddaa; // Fireish, hot
    // game.customTint = 0xffeecc; // Fireish

    // game.customTint = 0xddffee; // Greenish.

    // game.customTint = 0xaaccff; // Blueish, cold, ice, night
    // game.customTint = 0x88aadd; // Blueish, cold, ice, dark.

    // var deepest = 'canyon';
    // var deepest = 'nebula';
    // var deepest = 'dark-forest';
    // var deepest = 'inferno';
    var deepest = 'stars';
    // var deepest = 'rocks';
    // var deepest = 'rocks-underwater';
    // var deepest = 'abyss';

    // var middle = 'cave';
    // var middle = 'cave2';
    // var middle = 'clouds';
    // var middle = 'dark-forest';
    var middle = 'corridor';

    this.load.image('background-deepest', 'images/background/' + deepest + '.png');
    this.load.image('background-middleLayer', 'images/background/' + middle + '.png');

    this.load.atlas('atlas-enemies', 'images/enemy/enemies.png', 'images/enemy/atlas-enemies.json');

    // TODO handle multiple tile atlases ???
    // -> In this case the level.json file is not really interesting.
    this.tileAtlasKey = 'atlas-spacebase';
    this.load.atlas(this.tileAtlasKey, 'images/background/' + this.tileAtlasKey + '.png', 'images/background/' + this.tileAtlasKey + '.json');
  };

  stg.LevelSpace.prototype.create = function() {
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

    level.readLevelFromFiles('level-space');

    // Load level music.
    // game.music = game.add.audio('theMusic');
    // game.music.play('', 0, 1, true); // Loop true.
  };

  /**
   * Update is called each frame. Game logic runs here.
   */
  stg.LevelSpace.prototype.update = function() {
    this.level.update();
  };

  // Looks like quitGame is now called 'shutdown' ?!
  stg.LevelSpace.prototype.shutdown = function() {
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

  // ---

  // When a State is added to Phaser it automatically has the following
  // properties set on it, even if they already exist:

  // this.game; // a reference to the currently running game
  // this.add; // used to add sprites, text, groups, etc
  // this.camera; // a reference to the game camera
  // this.cache; // the game cache
  // this.input; // the global input manager (you can access
  // this.input.keyboard,
  // // this.input.mouse, as well from it)
  // this.load; // for preloading assets
  // this.math; // lots of useful common math operations
  // this.sound; // the sound manager - add a sound, play one, set-up markers,
  // etc
  // this.stage; // the game stage
  // this.time; // the clock
  // this.tweens; // the tween manager
  // this.state; // the state manager
  // this.world; // the game world
  // this.particles; // the particle manager
  // this.physics; // the physics manager
  // this.rnd; // the repeatable random number generator

  // You can use any of these from any function within this State.
  // But do consider them as being 'reserved words', i.e. don't create a
  // property for your own game called "world" or you'll over-write the world
  // reference.
}(window.stg = window.stg || {}));
