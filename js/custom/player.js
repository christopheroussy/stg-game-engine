/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  // TODO only use the sprite ?
  /**
   * @constructor
   */
  stg.Player = function(game, sprite) {
    if (!(this instanceof stg.Player)) {
      throw new Error('This is a constructor, call it using new !');
    }

    this.game = game;
    this.sprite = sprite;

    if (game.customTint !== 0xffffff) {
      this.sprite.tint = game.customTint;
    }
    // Set 'center of gravity'.
    // TODO maybe adapt to graphics of ship...
    this.sprite.anchor.setTo(0.5, 0.5);

    // Ship speed, player speed, player ship speed.

    // var shipSpeed = 0.096; // Slow
    // var shipSpeed = 0.105; // Precise, but a bit slow.
    // var shipSpeed = 0.11; // Good
    // var shipSpeed = 0.12; // Fast

    this.sprite.speedSlow = 0.1;
    this.sprite.speedFast = 0.125;

    this.sprite.speedX = this.sprite.speedFast;
    this.sprite.speedY = this.sprite.speedFast;

    // Immortal, invincible.
    var difficultyFactor = game.customDifficultyFactor;
    var isEasy = difficultyFactor < 1;

    this.sprite.customMortal = true;
    // this.sprite.customMortal = false;

    this.sprite.events.onKilled.add(this.killed, this);

    game.physics.enable(this.sprite, Phaser.Physics.ARCADE);
    var body = this.sprite.body;
    body.collideWorldBounds = false;
    body.drag.set(0);

    // Default: false, An immovable Body will not receive any impacts from other
    // bodies.
    body.immovable = true;
    body.allowGravity = false;
    body.allowRotation = false;

    body.customSeparateX = true;
    body.customSeparateY = true;

    // Collision mask, hitbox, hit box
    var maskFactor = isEasy ? 0.25 : 0.5;
    body.setSize(Math.round(body.sourceWidth * maskFactor), Math.round(body.sourceHeight * maskFactor), 0, 0);

    // Many players want to see the hitbox.
    // this.hitboxRectangle = new Phaser.Rectangle(this.sprite.x, this.sprite.y,
    // Math.round(body.sourceWidth * maskFactor), Math.round(body.sourceHeight *
    // maskFactor));

    var fireRateMultiplier = 1;

    this.plasmaFireEveryMs = 250 / fireRateMultiplier;
    this.plasmaFireReloadMs = 0;

    this.cursorImage = stg.buildShotLoadedLoop(this.game, this.sprite.x, this.sprite.y - 30);
    this.cursorImage.animations.currentAnim.stop();
    this.cursorImage.visible = false;

    this.customScore = 0;
    this.setChainCount(0);
    this.customChainLast = null;
    this.customChainTimeMs = 0;

    this.bulletPoolPlasma = stg.createBulletPool(game, 16, 'bullet-plasma');
    this.bulletPoolDouble = stg.createBulletPool(game, 16, 'bullet-side');
    this.bulletPoolLaser = stg.createBulletPool(game, 32, 'bullet-laser');

    // TODO, could skip non-equipped pools for performance...
    this.bulletPools = [ this.bulletPoolPlasma, this.bulletPoolLaser, this.bulletPoolDouble ];

    this.cursorKeys = null;
    this.setupControls();

    if (game.customTint !== 0xffffff) {
      this.tint = game.customTint;
    }

    // Calibration formula for weapon power:
    // In theory: Power is (1000/frequency) * strengthHp
    // THE THEORY ABOVE IS WRONG BECAUSE A HIT = DESTRUCTION OF THE BULLET.

    // PLASMA: 2 * 10 * 1000/250 = 80

    // LASER: 1.4 * 1000/16.66 ~= 1.4 * 60 = 84
    // 84 is close to the pulse weapon which has 80 but more range and extra
    // 'reload' shot

    this.weaponLaser = new stg.Weapon(game, {
      xOffset : 0,
      yOffset : -18,
      bulletPool : this.bulletPoolLaser,
      // Under a certain frequency it will max out to
      // the update frequency.
      bulletFrequencyMs : 16,
      bulletSpeed : 800,

      // bulletFrequency2Ms : 250,
      // bulletsConsecutiveCount : 3,
      // bulletVx : 0,
      // bulletVy : -800,
      bulletStrengthHp : 3,
      bulletPassThrough : 0.2
    });
    this.weaponLaser.parentSprite = this.sprite;

    this.weaponDoubleShotA = new stg.Weapon(game, {
      xOffset : 6,
      yOffset : -10,
      bulletPool : this.bulletPoolDouble,
      bulletFrequencyMs : 250 / fireRateMultiplier,
      // bulletFrequency2Ms : 250,
      // bulletsConsecutiveCount : 3,
      bulletVx : 250,
      bulletVy : -180,
      bulletStrengthHp : 12,
      bulletPassThrough : 0.2
    });
    this.weaponDoubleShotA.parentSprite = this.sprite;

    this.weaponDoubleShotB = new stg.Weapon(game, {
      xOffset : -6,
      yOffset : -10,
      bulletPool : this.bulletPoolDouble,
      bulletFrequencyMs : 250 / fireRateMultiplier,
      // bulletFrequency2Ms : 250,
      // bulletsConsecutiveCount : 3,
      bulletVx : -250,
      bulletVy : -180,
      bulletStrengthHp : 12,
      bulletPassThrough : 0.2
    });
    this.weaponDoubleShotB.parentSprite = this.sprite;

    this.equippedWeapons = [ 'plasma', 'double' ];
    // this.equippedWeapons = ['plasma', 'laser'];

    // Select first equipped weapon by default.
    this.weaponIndex = 0;
    this.selectedWeapon = this.equippedWeapons[this.weaponIndex];
  };

  stg.Player.prototype.killed = function() {
    console.log("onKilled event for player " + this.cursorImage.visible);

    // TODO do better than this, too much duplication here.
    // TODO Respawn player ? Go back to checkpoint ?

    this.plasmaFireReloadMs = 0;

    this.cursorImage.kill();

    this.customScore = 0;
    this.setChainCount(0);
    this.customChainLast = null;
    this.customChainTimeMs = 0;

    console.log("onKilled done.");

    // Delay it a bit so the player can see himself die ...and learn from it.
    var self = this;
    setTimeout(function() {
      self.restart();
    }, 1800);

  };

  stg.Player.prototype.switchWeapon = function() {
    if (this.weaponIndex < this.equippedWeapons.length - 1) {
      this.weaponIndex++;
    } else {
      this.weaponIndex = 0;
    }
    var game = this.game;
    if (!game.soundSwitch.isPlaying) {
      if (!game.sound.mute) {
        game.soundSwitch.play();
      }
    }
    this.selectedWeapon = this.equippedWeapons[this.weaponIndex];
    this.cursorImage.visible = this.selectedWeapon === 'plasma';
  };

  stg.Player.prototype.incrementScore = function(scoreInc) {
    this.customScore += scoreInc;
    this.game.domElementScore.innerHTML = this.customScore;
    this.game.domElementLatestScore.innerHTML = Math.floor(scoreInc);
  };

  stg.Player.prototype.setChainCount = function(chainCount) {
    this.customChainCount = chainCount;
    var text;
    if (chainCount === 0) {
      text = "-";
    } else if (chainCount === 1) {
      text = "*";
    } else if (chainCount === 2) {
      text = "**";
    } else if (chainCount === 3) {
      text = "***";
    }
    this.game.domElementChain.innerHTML = text;
  };

  stg.Player.prototype.update = function() {
    if (!this.sprite.alive) {
      return; // TODO only use sprite as player.
    }
    var game = this.game;
    var sprite = this.sprite;

    sprite.xPast = sprite.x;
    sprite.yPast = sprite.y;

    var elapsedMs = game.time.physicsElapsedMS;

    // To listen to buttons from a specific pad listen directly on that pad
    // game.input.gamepad.padX, where X = pad 1-4
    var pad1 = game.input.gamepad.pad1;
    if (game.input.gamepad.supported && game.input.gamepad.active && pad1.connected) {
      var sprite = this.sprite;

      // See
      // https://github.com/photonstorm/phaser/blob/v2.4.4/src/input/Gamepad.js
      // https://w3c.github.io/gamepad/#remapping

      // IMPORTANT: DPAD = axis and not a button.
      if (pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_LEFT) || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) < -0.1) {
        sprite.x -= sprite.speedX * elapsedMs;
      } else if (pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_RIGHT) || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) > 0.1) {
        sprite.x += sprite.speedX * elapsedMs;
      }
      if (pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_UP) || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) < -0.1) {
        sprite.y -= sprite.speedY * elapsedMs;
      } else if (pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_DOWN) || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) > 0.1) {
        sprite.y += sprite.speedY * elapsedMs;
      }

      if (pad1.justPressed(Phaser.Gamepad.XBOX360_X)) {
        this.controlShootHeld = true;
        this.sprite.speedX = this.sprite.speedSlow;
        this.sprite.speedY = this.sprite.speedSlow;
      }
      if (pad1.justReleased(Phaser.Gamepad.XBOX360_X)) {
        this.controlShootHeld = false;
        this.sprite.speedX = this.sprite.speedFast;
        this.sprite.speedY = this.sprite.speedFast;
      }
      if (pad1.justPressed(Phaser.Gamepad.XBOX360_RIGHT_TRIGGER)) {
        // TRIGGER are the 'gun trigger' like buttons on top of the controller.
        // In Firefox this is 'Start'... why did they not agree...why...?!!!
        this.controlShootHeld = true;
        this.sprite.speedX = this.sprite.speedSlow;
        this.sprite.speedY = this.sprite.speedSlow;
      }
      if (pad1.justReleased(Phaser.Gamepad.XBOX360_RIGHT_TRIGGER)) {
        // TRIGGER are the 'gun trigger' like buttons on top of the controller.
        this.controlShootHeld = false;
        this.sprite.speedX = this.sprite.speedFast;
        this.sprite.speedY = this.sprite.speedFast;
      }

      if (pad1.justPressed(Phaser.Gamepad.XBOX360_A)) {
        if (!this.pressedSwitchButton) {
          this.pressedSwitchButton = true;
          this.switchWeapon();
        }
      }
      if (pad1.justReleased(Phaser.Gamepad.XBOX360_A)) {
        if (this.pressedSwitchButton) {
          this.pressedSwitchButton = false;
        }
      }
      if (pad1.justPressed(Phaser.Gamepad.XBOX360_RIGHT_BUMPER)) {
        // BUMPER are the buttons on top of the controller.
        if (!this.pressedSwitchButton2) {
          this.pressedSwitchButton2 = true;
          this.switchWeapon();
        }
      }
      if (pad1.justReleased(Phaser.Gamepad.XBOX360_RIGHT_BUMPER)) {
        // BUMPER are the buttons on top of the controller.
        if (this.pressedSwitchButton2) {
          this.pressedSwitchButton2 = false;
        }
      }
      // if (pad1.justPressed(Phaser.Gamepad.XBOX360_START)) {
      // In FireFox this is mapped to left stick pressed aka
      // 'XBOX360_STICK_LEFT_BUTTON'
      // this.restart();
      // }
      if (pad1.justPressed(Phaser.Gamepad.XBOX360_BACK)) {
        // In FireFox this is mapped to central button aka button 15
        this.restart();
      }
      if (pad1.justPressed(Phaser.Gamepad.XBOX360_STICK_RIGHT_BUTTON)) {
        this.game.paused = !this.game.paused;
      }
    }

    //
    // Movement control.
    //
    if (this.controlRightHeld) {
      sprite.x += sprite.speedX * elapsedMs;
    }
    if (this.controlLeftHeld) {
      sprite.x -= sprite.speedX * elapsedMs;
    }
    if (this.controlDownHeld) {
      sprite.y += sprite.speedY * elapsedMs;
    }
    if (this.controlUpHeld) {
      sprite.y -= sprite.speedY * elapsedMs;
    }

    if (this.cursorKeys) {
      // Arrow keys.
      if (this.cursorKeys.right.isDown) {
        this.sprite.x += this.sprite.speedX * elapsedMs;
      }
      if (this.cursorKeys.left.isDown) {
        this.sprite.x -= this.sprite.speedX * elapsedMs;
      }
      if (this.cursorKeys.up.isDown) {
        this.sprite.y -= this.sprite.speedY * elapsedMs;
      }
      if (this.cursorKeys.down.isDown) {
        this.sprite.y += this.sprite.speedY * elapsedMs;
      }
    }

    // Handle shot.
    var selectedWeapon = this.selectedWeapon;
    if (selectedWeapon === 'plasma') {
      this.handlePlasma(elapsedMs);
    } else if (selectedWeapon === 'double') {
      if (this.weaponDoubleShotA.updateManual(this.controlShootHeld)) {
        // if (!game.soundRound.isPlaying) {
        if (!game.sound.mute) {
          game.soundRound.play();
        }
        // }
        stg.startSpark(game, sprite.x + this.weaponDoubleShotA.xOffset, sprite.y + this.weaponDoubleShotA.yOffset - 4);
      }
      if (this.weaponDoubleShotB.updateManual(this.controlShootHeld)) {
        // if (!game.soundRound.isPlaying) {
        // if (!game.sound.mute) {
        // game.soundRound.play();
        // }
        // }
        stg.startSpark(game, sprite.x + this.weaponDoubleShotB.xOffset, sprite.y + this.weaponDoubleShotB.yOffset - 4);
      }
    } else if (selectedWeapon === 'laser') {
      this.weaponLaser.updateManual(this.controlShootHeld);
    }
  };

  stg.Player.prototype.handlePlasma = function(elapsedMs) {
    // Shot.
    if (this.controlShootHeld) {
      if (this.plasmaFireReloadMs > this.plasmaFireEveryMs) {

        var fireReloadDiff = this.plasmaFireReloadMs - this.plasmaFireEveryMs;
        this.plasmaFireReloadMs = 0;

        var game = this.game;

        // if (!game.soundLaser.isPlaying) {
        if (!game.sound.mute) {
          game.soundLaser.play();
        }
        // }

        // Left fire.
        var bullet = this.bulletPoolPlasma.getFirstExists(false);
        if (bullet) {
          // Reset (revive) the sprite and place it in a new location
          bullet.reset(this.sprite.x - 3, this.sprite.y - 12, 1);
          bullet.strengthHp = 10;
          bullet.body.velocity.y = -400;
          bullet.body.velocity.x = 0;
          stg.startSpark(game, bullet.x, bullet.y - 4);
        }

        // Right fire.
        bullet = this.bulletPoolPlasma.getFirstExists(false);
        if (bullet) {
          // Reset (revive) the sprite and place it in a new location
          bullet.reset(this.sprite.x + 3, this.sprite.y - 12, 1);
          bullet.strengthHp = 10;
          bullet.body.velocity.y = -400;
          bullet.body.velocity.x = 0;
          stg.startSpark(game, bullet.x, bullet.y - 4);
        }

        // Extra fire.
        if (fireReloadDiff > 1000) {
          bullet = this.bulletPoolPlasma.getFirstExists(false);
          if (bullet) {
            // Reset (revive) the sprite and place it in a new location
            bullet.reset(this.sprite.x, this.sprite.y - 14, 1);
            bullet.strengthHp = 10;
            bullet.body.velocity.y = -400;
            bullet.body.velocity.x = 0;

            this.cursorImage.visible = false;
            this.cursorImage.animations.currentAnim.stop();
          }
        }
      }
    }
    if (this.plasmaFireReloadMs > this.plasmaFireEveryMs) {
      var fireReloadDiff = this.plasmaFireReloadMs - this.plasmaFireEveryMs;
      if (fireReloadDiff > 1000) {
        if (!this.cursorImage.visible) {
          // Show that extra fire is ready (charge shot).
          this.cursorImage.animations.currentAnim.restart();
          this.cursorImage.visible = true;

          if (!this.game.soundCharged.isPlaying) {
            if (!this.game.sound.mute) {
              this.game.soundCharged.play();
            }
          }
        }
        // Always update the position.
        this.cursorImage.x = this.sprite.x;

        // TODO this depends on player ship graphics...
        this.cursorImage.y = this.sprite.y - 24;
      }
    }
    // Always reload.
    this.plasmaFireReloadMs += elapsedMs;
  };

  stg.Player.prototype.setupControls = function() {
    console.debug('Setting up player controls.');

    this.cursorKeys = this.game.input.keyboard.createCursorKeys();
    this.game.input.gamepad.start();

    this.doControlLeftDown = function() {
      this.controlLeftHeld = true;
      // this.controlRightHeld = false;
    };
    this.doControlLeftUp = function() {
      this.controlLeftHeld = false;
    };

    this.doControlRightDown = function() {
      this.controlRightHeld = true;
      // this.controlLeftHeld = false;
    };
    this.doControlRightUp = function() {
      this.controlRightHeld = false;
    };

    this.doControlDownDown = function() {
      this.controlDownHeld = true;
      // this.controlUpHeld = false;
    };
    this.doControlDownUp = function() {
      this.controlDownHeld = false;
    };

    this.doControlUpDown = function() {
      this.controlUpHeld = true;
      // this.controlDownHeld = false;
    };
    this.doControlUpUp = function() {
      this.controlUpHeld = false;
    };

    this.doControlShootDown = function() {
      this.controlShootHeld = true;
      this.sprite.speedX = this.sprite.speedSlow;
      this.sprite.speedY = this.sprite.speedSlow;
    };
    this.doControlShootUp = function() {
      this.controlShootHeld = false;
      this.sprite.speedX = this.sprite.speedFast;
      this.sprite.speedY = this.sprite.speedFast;
    };

    var keyboard = this.game.input.keyboard;

    // // Movement: WASD (not as good as ESDF)
    // keyboard.addKey(Phaser.Keyboard.A).onDown.add(this.doControlLeftDown,
    // this);
    // keyboard.addKey(Phaser.Keyboard.A).onUp.add(this.doControlLeftUp, this);
    //
    // keyboard.addKey(Phaser.Keyboard.D).onDown.add(this.doControlRightDown,
    // this);
    // keyboard.addKey(Phaser.Keyboard.D).onUp.add(this.doControlRightUp, this);
    //
    // keyboard.addKey(Phaser.Keyboard.S).onDown.add(this.doControlDownDown,
    // this);
    // keyboard.addKey(Phaser.Keyboard.S).onUp.add(this.doControlDownUp, this);
    //
    // keyboard.addKey(Phaser.Keyboard.W).onDown.add(this.doControlUpDown,
    // this);
    // keyboard.addKey(Phaser.Keyboard.W).onUp.add(this.doControlUpUp, this);

    // Movement: ESDF (No issues with azerty), got bump on F key.
    keyboard.addKey(Phaser.Keyboard.S).onDown.add(this.doControlLeftDown, this);
    keyboard.addKey(Phaser.Keyboard.S).onUp.add(this.doControlLeftUp, this);

    keyboard.addKey(Phaser.Keyboard.F).onDown.add(this.doControlRightDown, this);
    keyboard.addKey(Phaser.Keyboard.F).onUp.add(this.doControlRightUp, this);

    keyboard.addKey(Phaser.Keyboard.D).onDown.add(this.doControlDownDown, this);
    keyboard.addKey(Phaser.Keyboard.D).onUp.add(this.doControlDownUp, this);

    keyboard.addKey(Phaser.Keyboard.E).onDown.add(this.doControlUpDown, this);
    keyboard.addKey(Phaser.Keyboard.E).onUp.add(this.doControlUpUp, this);

    // TODO let user configure keyboard keys...

    // Shoot.
    keyboard.addKey(Phaser.Keyboard.X).onDown.add(this.doControlShootDown, this);
    keyboard.addKey(Phaser.Keyboard.X).onUp.add(this.doControlShootUp, this);

    keyboard.addKey(Phaser.Keyboard.J).onDown.add(this.doControlShootDown, this);
    keyboard.addKey(Phaser.Keyboard.J).onUp.add(this.doControlShootUp, this);

    // Switch weapon.
    keyboard.addKey(Phaser.Keyboard.K).onDown.add(function() {
      this.switchWeapon();
    }, this);
    keyboard.addKey(Phaser.Keyboard.C).onDown.add(function() {
      this.switchWeapon();
    }, this);

    // Pause:
    keyboard.addKey(Phaser.Keyboard.P).onDown.add(function() {
      this.game.paused = !this.game.paused;
    }, this);

    keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(function() {
      this.game.paused = !this.game.paused;
    }, this);

    // Player pressed number 6. Restart level.
    keyboard.addKey(Phaser.Keyboard.SIX).onDown.add(function() {
      this.restart();
    }, this);

    // Menu. Player pressed ESC escape key.
    // TODO escape also quits fullscreen...
    // keyboard.addKey(Phaser.Keyboard.ESC).onDown.add(function() {
    // this.game.state.start('MainMenu');
    // }, this);

    // TODO add gamepad support.
  };

  stg.Player.prototype.restart = function() {
    var currentStateKey = this.game.state.getCurrentState().key;
    console.debug("Current state key=" + currentStateKey);
    if (currentStateKey) {
      this.game.state.start(currentStateKey);
    } else {
      this.game.state.start('MainMenu');
    }
  };

}(window.stg = window.stg || {}));
