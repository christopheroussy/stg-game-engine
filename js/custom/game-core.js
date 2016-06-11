/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  // Extend PHASER with extra functionality.
  // TODO REALLY, not sure if this is a good idea, except for rare cases.
  Phaser.Game.prototype.gofull = function() {
    // document.addEventListener("fullscreenchange", function() {
    // console.log("f");
    // }, false);
    // $(document).on('webkitfullscreenchange mozfullscreenchange
    // fullscreenchange MSFullscreenChange', function() {
    //
    // });

    var game = this;
    var scale = game.scale;

    // Stretch to fill
    // scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;

    // Keep original size
    // scale.fullScreenScaleMode = Phaser.ScaleManager.NO_SCALE;

    // Maintain aspect ratio
    // It makes sense to keep the aspect ratio, especially for pixelart !
    scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;

    if (scale.isFullScreen) {
      scale.stopFullScreen();
    } else {
      // if (!game.paused) {
      // game.paused = true;
      // }
      scale.startFullScreen(false); // antialias boolean <optional>
      // Changes the anti-alias feature of the canvas before jumping in to
      // fullscreen (false = retain pixel art, true = smooth art). If not
      // specified then no change is made. Only works in CANVAS mode.

      // scale.setScreenSize(true);
    }
    // scale.refresh();
    return false;
  };

  // Spark like explosion, stars.
  stg.startSpark = function(game, x, y) {
    // TODO use a spark pool, it is probably worth it.
    var image = game.add.image(x + Math.random(), y + Math.random(), 'img-spark-spritesheet');
    image.anchor.setTo(0.5, 0.5);
    image.animations.add('animation-on');
    image.animations.play('animation-on', 30, false, true); // FPS.
  };

  stg.buildShotLoadedLoop = function(game, x, y) {
    var image = game.add.image(x, y, 'img-shot-loaded-spritesheet');
    image.anchor.setTo(0.5, 0.5);
    image.animations.add('animation-on');
    image.animations.play('animation-on', 10, true, false); // FPS.
    return image;
  };

  stg.startExplosionSmall = function(game, x, y) {
    // TODO use an explosion pool.
    var image = game.add.image(x, y, 'img-explosion-spritesheet');
    image.anchor.setTo(0.5, 0.5);
    image.animations.add('animation-on');
    image.animations.play('animation-on', 22, false, true); // FPS.
  };

  /**
   * @param x
   * @param y
   * @param sizeFactor
   *            a number between > 0 and <= 1.
   * @memberOf stg.StateGame
   */
  stg.startExplosion = function(game, x, y, width, height) {
    stg.startSpark(game, x, y);

    var executionFps = 22; // FPS. The more the faster the animation.
    var maxExplosions = 2 + (width + height) / 32;
    for (var i = 0; i < maxExplosions; i++) {
      var effectExplosion = game.add.image(

      x + (-0.5 + Math.random()) * width * 0.8,

      y + (-0.5 + Math.random()) * height * 0.8, 'img-explosion-spritesheet');

      effectExplosion.anchor.setTo(0.5, 0.5);
      effectExplosion.animations.add('animation-on');
      effectExplosion.animations.play('animation-on', executionFps + Math.random() * 8, false, true); // FPS.
    }
    stg.startSpark(game, x + (-0.5 + Math.random()) * width * 0.6, y + (-0.5 + Math.random()) * height * 0.6);

    var effectExplosionRadius = game.add.image(x, y, 'img-explosion-radius-spritesheet');
    effectExplosionRadius.anchor.setTo(0.5, 0.5);
    effectExplosionRadius.animations.add('animation-on');
    effectExplosionRadius.animations.play('animation-on', executionFps + 4, false, true); // FPS.

    // emitterRock.x = x;
    // emitterRock.y = y;
    // // .........explode(lifespan, quantity)
    // emitterRock.explode(2000 * sizeFactor, 40 * sizeFactor);
    //
    // emitterFire.x = x;
    // emitterFire.y = y;
    // // .........explode(lifespan, quantity)
    // emitterFire.explode(2000 * sizeFactor, 40 * sizeFactor);
  };

  /**
   * @param funct
   *            Function to call after the delay.
   * 
   * @memberOf stg
   */
  stg.startDelayedMs = function(game, sprite, delayMs, funct) {
    game.time.events.add(delayMs, funct, sprite);
  };

  /**
   * @memberOf stg
   * @param game
   * @param poolSize
   * @param spriteId
   */
  stg.createBulletPool = function(game, poolSize, spriteId) {
    var bulletPool = new Phaser.Group(game, null, spriteId + '-bullets');

    // Enable physics to the whole sprite group.
    bulletPool.enableBody = true;
    bulletPool.physicsBodyType = Phaser.Physics.ARCADE;

    // Add 100 'bullet' sprites in the group.
    // By default this uses the first frame of the sprite sheet and
    // sets the initial state as non-existing (i.e. killed/dead)
    bulletPool.createMultiple(poolSize, spriteId);

    bulletPool.setAll('alive', false);

    // Sets anchors of all sprites.
    bulletPool.setAll('anchor.x', 0.5);
    bulletPool.setAll('anchor.y', 0.5);

    bulletPool.setAll('outOfBoundsKill', false);
    bulletPool.setAll('checkWorldBounds', false);

    bulletPool.setAll('body.allowRotation', false);
    bulletPool.setAll('body.allowGravity', false);
    bulletPool.setAll('body.immovable', true);

    bulletPool.setAll('body.mass', 0);

    bulletPool.setAll('body.customSeparateX', true);
    bulletPool.setAll('body.customSeparateY', true);

    return bulletPool;
  };

  stg.RegularIntervalCaller = function(game, action, frequencyMs, reloadMs) {
    this.game = game;
    this.action = action;
    this.frequencyMs = frequencyMs;
    this.reloadMs = reloadMs ? reloadMs : 0; // Init.
  };

  stg.RegularIntervalCaller.prototype.update = function() {
    var elapsedMs = this.game.time.physicsElapsedMS;
    if (this.reloadMs >= this.frequencyMs) {
      this.action();
      this.reloadMs = 0;
      return true;
    } else {
      this.reloadMs += elapsedMs;
    }
    return false;
  };

  stg.RegularIntervalCaller.prototype.updateManual = function(doIt) {
    var elapsedMs = this.game.time.physicsElapsedMS;
    // This allow to control the action (example: shoot).
    if (doIt) {
      if (this.reloadMs >= this.frequencyMs) {
        this.action();
        this.reloadMs = 0;
        return true;
      }
    }
    if (this.reloadMs < this.frequencyMs) {
      this.reloadMs += elapsedMs;
    }
    return false;
  };

  stg.RegularIntervalPauser = function(game, regularIntervalCaller, count, frequencyMs, reloadMs) {
    this.game = game;
    this.regularIntervalCaller = regularIntervalCaller;
    this.count = count;
    this.counter = 0;
    this.frequencyMs = frequencyMs;
    this.reloadMs = reloadMs ? reloadMs : 0; // Init.
  };

  stg.RegularIntervalPauser.prototype.update = function() {
    var elapsedMs = this.game.time.physicsElapsedMS;
    if (this.counter < this.count) {
      if (this.regularIntervalCaller.update()) {
        this.counter++;
      }
    } else {
      if (this.reloadMs >= this.frequencyMs) {
        this.counter = 0;
        this.reloadMs = 0;
        return true;
      }
      this.reloadMs += elapsedMs;
    }
    return false;
  };

  stg.RegularIntervalPauser.prototype.updateManual = function(doIt) {
    var elapsedMs = this.game.time.physicsElapsedMS;
    if (this.counter < this.count) {
      if (this.regularIntervalCaller.updateManual(doIt)) {
        this.counter++;
      }
    } else {
      if (this.reloadMs >= this.frequencyMs) {
        this.counter = 0;
        this.reloadMs = 0;
      } else {
        this.reloadMs += elapsedMs;
      }
    }
  };

}(window.stg = window.stg || {}));
