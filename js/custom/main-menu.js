/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  /**
   * @constructor
   */
  stg.MainMenu = function(game) {
    if (!(this instanceof stg.MainMenu)) {
      throw new Error('This is a constructor, call it using new !');
    }
    this.music = null;
    this.playButton = null;
  };

  stg.MainMenu.prototype = {
    create : function() {
      // We've already preloaded our assets, so let's kick right into the Main
      // Menu itself.

      // There are issues with sound in Phaser 2.4 and the browsers I use.
      // It used to work in 2.3.0, it uses WebAudio and 2.4 does too.
      // I suppose the loaders do not work for local assets anymore ?! I hope
      // not...
      // Experimental: turn off sound, also check for this boolean before
      // playing a sound (as muting was not enough to prevent bugs).
      var muteSound = false;

      this.game.sound.mute = muteSound;
      this.game.sound.noAudio = muteSound;

      console.info("Mute sound = " + this.game.sound.mute);

      // this.music = this.add.audio('titleMusic');
      // if (!game.sound.mute) {
      // this.music.play();
      // }

      // this.add.image(0, 0, 'titlepage');

      // this.playButton = this.add.button(0, 0, 'playButton', this.startGame,
      // this, 'buttonOver', 'buttonOut',
      // 'buttonOver');

      var game = this.game;

      // DIFFICULTY.
      // Avoid any changes which may affect score ?! (like HP, amount of
      // enemies,
      // ...) -> should be avoided but cannot compare score anyways...

      var net = new Phaser.Net(game);
      var difficultyValueFromUrl = net.getQueryString("difficulty");
      if (difficultyValueFromUrl && difficultyValueFromUrl > 0) {
        game.customDifficultyFactor = Number(difficultyValueFromUrl);
      } else {
        // Mild (aka easy).
        // game.customDifficultyFactor = 0.85;

        // Normal, ALWAYS TUNE TOWARDS THIS !
        game.customDifficultyFactor = 1;

        // Spicy
        // game.customDifficultyFactor = 1.1;

        // Very hot (super hard, for super players only)
        // game.customDifficultyFactor = 1.15;
      }

      console.info("DifficultyFactor=" + game.customDifficultyFactor);

      console.debug('MainMenu: attempting to start game.');

      // Remove loading message.
      document.getElementById("loadingMessage").innerHTML = "";

      // Can unpause the game now.
      game.paused = false;

      // this.state.start('LevelSpace');
      this.state.start('LevelIslands');
      // this.state.start('LevelForest');
    },

    update : function() {
      // Do some nice funky main menu effect here
    }

  // ,startGame : function(pointer) {
  // "use strict";
  // // Ok, the Play Button has been clicked or touched, so let's stop the music
  // // (otherwise it'll carry on playing)
  // // this.music.stop();
  //
  // // And start the actual game
  // this.state.start('Game');
  // }
  };
}(window.stg = window.stg || {}));
