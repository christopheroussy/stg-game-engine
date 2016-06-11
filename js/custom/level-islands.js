/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  /**
   * @constructor
   */
  stg.LevelIslands = function(game) {
    if (!(this instanceof stg.LevelIslands)) {
      throw new Error('This is a constructor, call it using new !');
    }
    this.game = game;
    this.level = null;
  };

  stg.LevelIslands.prototype.preload = function() {
    console.info("STATE: Game preload of " + this.key);

    // this.game.customTint = 0xffffff; // Dusk.

    // TODO load level json here as we only want to load related resources.
    // -> solution may be to put this directly in the state js.
    // -> anyways both the json and the js are pretty much text files.
    // -> if everything can be put in the stage js, why not use it directly ?
    // http://www.html5gamedevs.com/topic/5446-how-to-create-multiple-levels/

    // LOAD LEVEL SPECIFIC RESOURCES HERE.

    // Load music.
    // https://phaser.io/examples/v2/audio/play-music
    // Firefox doesn't support mp3 files, so use ogg.
    // this.load.audio('theMusic', [ 'music/YM2612_rock_MyLastHope.mp3',
    // 'music/YM2612_rock_MyLastHope.ogg' ]);

    this.load.image('background-deepest', 'images/background/canyon.png');
    this.load.image('background-middleLayer', 'images/background/clouds.png');
    // this.load.image('foreground-above', 'images/background/nebula.png');

    this.load.atlas('atlas-enemies', 'images/enemy/enemies.png', 'images/enemy/atlas-enemies.json');

    // TODO handle multiple tile atlases ???
    // -> In this case the level.json file is not really interesting.
    this.tileAtlasKey = 'atlas-steampunk';
    this.load.atlas(this.tileAtlasKey, 'images/background/' + this.tileAtlasKey + '.png', 'images/background/' + this.tileAtlasKey + '.json');
  };

  stg.LevelIslands.prototype.create = function() {
    console.info("STATE: Game create of " + this.key);
    this.stage.backgroundColor = '#000';

    var game = this.game;
    // ================== ~ 1000 / 60 = 100 / 6 = 16.666666666666668
    // game.customMsPerFrame = 1000 / game.time.desiredFps;

    // this.cache._text['someData'].data =
    // JSON.parse(this.cache.getText('someData'));
    // alert(game.cache.getText('level-islands-text'));

    this.level = new stg.Level(game, this, this.tileAtlasKey, this.key);
    var level = this.level;
    level.parallaxScrolling = function(cameraAppliedDeltaY) {
      level.middleLayer.tilePosition.y += cameraAppliedDeltaY / 3;
    };
    level.readLevelFromFiles('level-islands');

    console.debug('Game create done.');
  };

  /**
   * Update is called each frame. Game logic runs here.
   */
  stg.LevelIslands.prototype.update = function() {
    this.level.update();
    // --- End of update code.
  };

  stg.LevelIslands.prototype.shutdown = function() {
    // REMOVE ONLY LEVEL SPECIFIC DATA !
    // Here you should destroy anything you no longer need.
    // Stop music, delete sprites, purge caches, free resources, all that good
    // stuff.
    console.debug("shutdown called for " + this.key);

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
