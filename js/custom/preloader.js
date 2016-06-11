/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  /**
   * @constructor
   */
  stg.Preloader = function(game) {
    if (!(this instanceof stg.Preloader)) {
      throw new Error('This is a constructor, call it using new !');
    }
    this.background = null;
    this.preloadBar = null;
    this.ready = false;
  };

  stg.Preloader.prototype = {

    init : function() {
      var game = this.game;
      game.domElementFps = document.getElementById('game-fps');
      game.domElementScore = document.getElementById('game-score');
      game.domElementLatestScore = document.getElementById('game-latest-score');
      game.domElementChain = document.getElementById('game-chain');
      game.domElementCurrentLine = document.getElementById('game-current-line');

      game.time.advancedTiming = true;

      // game.time.desiredFps = 15;
      // game.time.desiredFps = 30;
      // game.time.desiredFps = 54;
      game.time.desiredFps = 60;
      // game.time.desiredFps = 120;
      console.info("Desired FPS: " + game.time.desiredFps);

      // game.forceSingleUpdate = true;

      game.physics.startSystem(Phaser.Physics.ARCADE);

      // There is no need for a quad tree as updating the quad tree will cost
      // more
      // than simple collision detection.
      game.physics.arcade.skipQuadTree = true;

      // New in Phaser 2, 1D sort to optimize collision detection. BOTTOM_TOP is
      // recommended for vertical shmups (it sorts all objects above and can
      // bail
      // out quickly).
      // game.physics.arcade.sortDirection = Phaser.Physics.Arcade.BOTTOM_TOP;
      // I have not found this 'sort' to help much, worse: sorting is costly, a
      // bit like the quadtree... It probably works well with many static
      // objects.
      game.physics.arcade.sortDirection = Phaser.Physics.Arcade.SORT_NONE;
    },

    preload : function() {
      // These are the assets we loaded in Boot.js
      // A nice sparkly background and a loading progress bar
      // this.background = this.add.image(0, 0, 'preloaderBackground');
      // this.preloadBar = this.add.image(300, 400, 'preloaderBar');

      // This sets the preloadBar sprite as a loader sprite.
      // What that does is automatically crop the sprite from 0 to full-width
      // as the files below are loaded in.
      // this.load.setPreloadSprite(this.preloadBar);

      // Here we load the rest of the assets our game needs.
      // As this is just a Project Template I've not provided these assets, swap
      // them for your own.
      // this.load.image('titlepage', 'images/title.jpg');
      // this.load.atlas('playButton', 'images/play_button.png',
      // 'images/play_button.json');
      // this.load.audio('titleMusic', [ 'audio/main_menu.mp3' ]);

      // this.load.bitmapFont('caslon', 'fonts/caslon.png', 'fonts/caslon.xml');
      // + lots of other required assets here

      // LOAD ONLY ---COMMON--- GAME RESOURCES HERE, NOTHING LEVEL SPECIFIC !

      this.load.onLoadComplete.addOnce(function() {
        console.debug("preloader: Load complete");
      }, this);

      console.debug("preloader: Loading...");

      // this.load.crossOrigin = "Anonymous";

      this.load.image('ship', 'images/player/ship.png');
      this.load.image('bullet-side', 'images/bullet/bullet-side.png');
      this.load.image('bullet-plasma', 'images/bullet/plasma.png');
      this.load.image('bullet-laser', 'images/bullet/laser.png');

      this.load.image('bullet-orange', 'images/bullet/bullet-orange.png');
      this.load.image('bullet-purple', 'images/bullet/bullet-purple.png');
      this.load.image('bullet-green', 'images/bullet/bullet-green.png');

      this.load.spritesheet('img-explosion-spritesheet', 'images/effects/explosion.png', 12, 16, 13);
      this.load.spritesheet('img-explosion-radius-spritesheet', 'images/effects/explosion-radius.png', 16, 16, 8);
      this.load.spritesheet('img-explosion-combo-spritesheet', 'images/effects/explosion-radius-blue.png', 16, 16, 8);
      this.load.spritesheet('img-spark-spritesheet', 'images/effects/spark.png', 16, 16, 6);

      this.load.spritesheet('img-shot-loaded-spritesheet', 'images/effects/loaded.png', 16, 16, 2);

      this.load.atlas('atlas-collectibles', 'images/collectible/collectibles.png', 'images/collectible/atlas-collectibles.json');

      // Sfx, sound effects.
      this.load.audio('laser', 'sfx/lasershort.ogg');
      this.load.audio('explosion', 'sfx/explosion.ogg');
      this.load.audio('combo', 'sfx/gradius-bonus.ogg');
      this.load.audio('charged', 'sfx/bonus.ogg');
      this.load.audio('explosion-short', 'sfx/explosion-short.ogg');
      this.load.audio('switch', 'sfx/beep.ogg');
      this.load.audio('round', 'sfx/round.ogg');
      this.load.audio('coin', 'sfx/pickup-coin.ogg');

      // Only add COMMON resources here.

      var game = this.game;
      game.sound.volume = 1;
      game.soundLaser = game.add.audio("laser", 0.7, false);
      game.soundExplosion = game.add.audio("explosion", 0.2, false);
      game.soundExplosionShort = game.add.audio("explosion-short", 0.2, false);
      game.soundCharged = game.add.audio("charged", 0.4, false);
      game.soundCombo = game.add.audio("combo", 0.3, false);
      game.soundSwitch = game.add.audio("switch", 0.1, false);
      game.soundRound = game.add.audio("round", 0.2, false);
      game.soundCoin = game.add.audio("coin", 0.1, false);
    },

    create : function() {
      console.debug("preloader: Starting main menu state.");
      this.state.start('MainMenu');
    }

  // update : function() {
  // "use strict";
  // // You don't actually need to do this, but I find it gives a much smoother
  // // game experience.
  // // Basically it will wait for our audio file to be decoded before
  // proceeding
  // // to the MainMenu.
  // // You can jump right into the menu if you want and still play the music,
  // // but you'll have a few
  // // seconds of delay while the mp3 decodes - so if you need your music to be
  // // in-sync with your menu
  // // it's best to wait for it to decode here first, then carry on.
  //
  // // If you don't have any music in your game then put the game.state.start
  // // line into the create function and delete
  // // the update function completely.
  //
  // if (this.cache.isSoundDecoded('titleMusic') && !this.ready) {
  // this.ready = true;
  // this.state.start('MainMenu');
  // }
  // }
  };
}(window.stg = window.stg || {}));
