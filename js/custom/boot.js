/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  stg.setup = function(gameDivId) {
    try {
      // WebGL is only good on Chrome (at least in 2015), force canvas on other
      // browsers.
      var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      console.debug("isChrome=" + isChrome);

      // QVGA, vertical orientation, 240x320, x:y is 4:3, because it has good
      // performance in the browser canvas (few pixels) and can run in small
      // displays.
      var game = new Phaser.Game(240, 320, isChrome ? Phaser.AUTO : Phaser.CANVAS, gameDivId);

      // Hack to make game instance available in UI.
      window.gameInst = game;

      // Add the States your game has.
      // You don't have to do this in the html, it could be done in your Boot
      // state too, but for simplicity I'll keep it here.
      game.state.add('Boot', stg.Boot);
      game.state.add('Preloader', stg.Preloader);
      game.state.add('MainMenu', stg.MainMenu);

      game.state.add('LevelIslands', stg.LevelIslands);
      game.state.add('LevelSpace', stg.LevelSpace);
      game.state.add('LevelForest', stg.LevelForest);

      game.loadImageIntoCache = function(key, imgUrl) {
        var file = {
          type : 'image',
          key : key,
          url : imgUrl,
          data : null,
          error : false,
          loaded : false
        };

        file.data = new Image();
        file.data.name = file.key;

        file.data.onload = function() {
          file.loaded = true;
          this.cache.addImage(file.key, file.url, file.data);
        };

        file.data.onerror = function() {
          file.error = true;
        };

        file.data.crossOrigin = '';
        file.data.src = file.url;
      };

      window.addEventListener("beforeunload", function(e) {
        console.debug("beforeunload called. Destroying game.");
        if (window.gameInst) {
          // This may force the browser to free resources...
          window.gameInst.destroy();
        }
        return false;
      }, false);

      game.state.start('Boot');
    } catch (e) {
      console.error(e);
      if (e.stack) {
        console.error(e.stack);
      }
    }
  };

  /**
   * @constructor
   */
  stg.Boot = function(game) {
    if (!(this instanceof stg.Boot)) {
      throw new Error('This is a constructor, call it using new !');
    }
  };

  stg.Boot.prototype = {
    init : function() {
      // Round pixels is good for pixelart.
      this.game.renderer.renderSession.roundPixels = true;
    },

    preload : function() {
      // Here we load the assets required for our preloader (in this case a
      // background and a loading bar)
      // this.game.loadImageIntoCache('preloaderBackground',
      // 'images/background/cabinet.png');
      // this.load.image('preloaderBackground',
      // 'images/background/cabinet.png');
      // this.load.image('preloaderBar', 'images/preloader_bar.png');
    },

    create : function() {
      // Unless you specifically know your game needs to support multi-touch I
      // would recommend setting this to 1.
      // EXPERIMENTAL, try 0.
      this.input.maxPointers = 0; // 1;

      // Phaser will automatically pause if the browser tab the game is in loses
      // focus. You can disable that here:
      this.stage.disableVisibilityChange = false;

      // Smoothing is not good for pixelart (no blur).
      this.stage.smoothed = false;

      var game = this.game;
      var scale = game.scale;

      // Stretch to fill
      // scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;

      // Keep original size
      // scale.scaleMode = Phaser.ScaleManager.NO_SCALE;

      // Maintain aspect ratio
      // It makes sense to keep the aspect ratio, especially for pixelart !
      scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

      // scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
      // scale.scaleMode = Phaser.ScaleManager.RESIZE;

      // PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST; // DOES NOT DO
      // MUCH...

      // Using a very low resolution helps a lot with performance...
      scale.minWidth = 240;
      scale.minHeight = 320;

      scale.maxWidth = this.scale.minWidth * 4;
      scale.maxHeight = this.scale.minHeight * 4;

      // game.scale.setUserScale(3, 3, 0, 0); // Use with Phaser.ScaleManager.USER_SCALE

      // Center the game display (canvas).
      scale.pageAlignHorizontally = true;
      scale.pageAlignVertically = true;

      // setScreenSize causes trouble with recent Phaser versions.
      // "Phaser v2.4.2 | Pixi.js v2.2.8 | Canvas | WebAudio | http://phaser.io"
      // phaser.min.js:12
      // 17:09:58.476 TypeError: scale.setScreenSize is not a function
      // See: http://phaser.io/download/release/2.4.0, it is deprecated
      // scale.setScreenSize(true);

      if (game.device.desktop) {
        // Desktop specific settings.
        console.debug("Desktop mode.");
      } else {
        // Mobile settings.
        console.debug("Mobile mode.");
        // scale.forceLandscape = false;
      }

      scale.refresh();

      // By this point the preloader assets have loaded to the cache, we've set
      // the game settings.
      this.state.start('Preloader');
    }
  };
}(window.stg = window.stg || {}));
