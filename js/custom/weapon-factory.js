/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  /**
   * @constructor
   */
  stg.WeaponFactory = function(game) {
    if (!(this instanceof stg.WeaponFactory)) {
      throw new Error('This is a constructor, call it using new !');
    }
    this.game = game;
  };

  /**
   * Weapons are not NOT sprite and are not drawn. Associate a weapon to an
   * enemy to make it destructible.
   */
  stg.Weapon = function(game, options) {
    if (!(this instanceof stg.Weapon)) {
      throw new Error('This is a constructor, call it using new !');
    }
    this.game = game;

    this.xOffset = options.xOffset;
    this.yOffset = options.yOffset;

    this.bulletPool = options.bulletPool;

    if (options.bulletFrequencyMs !== undefined) {
      var that = this;
      var reloader1 = new stg.RegularIntervalCaller(game, function() {
        that.shoot();
      }, options.bulletFrequencyMs, options.bulletReloadMs);
      if (options.bulletFrequency2Ms !== undefined && options.bulletsConsecutiveCount !== undefined) {
        this.reloader = new stg.RegularIntervalPauser(game, reloader1, options.bulletsConsecutiveCount, options.bulletFrequency2Ms, options.bulletReload2Ms);
      } else {
        this.reloader = reloader1;
      }
    }

    if (options.bulletVx !== undefined && options.bulletVy !== undefined) {
      this.bulletVx = options.bulletVx;
      this.bulletVy = options.bulletVy;
      this.shootFunction = this.shootSimple;
    } else if (options.aimTarget && options.bulletSpeed !== undefined) {
      this.aimTarget = options.aimTarget;
      this.bulletSpeed = options.bulletSpeed;
      this.aimOffsetDeg = options.aimOffsetDeg;
      this.shootFunction = this.shootAimed;
    } else if (options.bulletSpeed !== undefined) {
      // In this case the shot angle is assumed to be set manually.
      this.bulletSpeed = options.bulletSpeed;
      // Initialize the angle, default angle is shoot up (bottom to top).
      this.angleDeg = options.angleDeg ? options.angleDeg : -90;
      this.setAngleDeg(this.angleDeg);
      this.shootFunction = this.shootSimple;
    } else {
      alert("Impossible weapon options " + options);
    }
    if (options.bulletStrengthHp !== undefined) {
      this.bulletStrengthHp = options.bulletStrengthHp;
    } else {
      // A good default is 10, so you can still go below for rapid fire weapons
      // like lazers or vulcan (otherwise they will be overpowered).
      this.bulletStrengthHp = 10;
    }
    if (options.bulletPassThrough !== undefined) {
      this.bulletPassThrough = options.bulletPassThrough;
    } else {
      // Default is null.
      this.bulletPassThrough = null;
    }

    this.parentSprite = null; // This will be set later.
  };

  /**
   * This is the default and will always whatever the action is.
   */
  stg.Weapon.prototype.update = function() {
    if (this.reloader) {
      return this.reloader.update();
    }
    return false;
  };

  /**
   * This variant allows to give more control by passing a boolean.
   */
  stg.Weapon.prototype.updateManual = function(doIt) {
    if (this.reloader) {
      return this.reloader.updateManual(doIt);
    }
    return false;
  };

  stg.Weapon.prototype.shoot = function() {
    // I have seen some code using countDead(), but this is inefficient as it is
    // not cached.
    // On the opposite, get first exists will break at the first item found
    // (much faster).weaponFactory
    var bullet = this.bulletPool.getFirstExists(false);

    // getFirstDead is very similar to getFirstExists, but it is not used in the
    // examples.
    // var bullet = this.bulletPool.getFirstDead();

    if (bullet) {
      var parentSprite = this.parentSprite;
      var x = parentSprite.x + this.xOffset;
      var y = parentSprite.y + this.yOffset;
      bullet.reset(x, y, 1); // x, y, health (1 default)
      bullet.strengthHp = this.bulletStrengthHp;
      bullet.passThrough = this.bulletPassThrough;
      this.shootFunction(bullet);
    }
  };

  stg.Weapon.prototype.shootAimed = function(bullet) {
    if (this.aimOffsetDeg) {
      var anglePerfectRad = this.game.physics.arcade.angleToXY(bullet, this.aimTarget.x, this.aimTarget.y);
      var angleOffsetDeg = Phaser.Math.radToDeg(anglePerfectRad) + this.aimOffsetDeg;
      this.game.physics.arcade.velocityFromAngle(angleOffsetDeg, this.bulletSpeed, bullet.body.velocity);
    } else {
      this.game.physics.arcade.moveToObject(bullet, this.aimTarget, this.bulletSpeed);
    }
  };

  stg.Weapon.prototype.angleDegIncrease = function(toAddDeg) {
    this.angleDeg += toAddDeg;
    this.setAngleDeg(this.angleDeg);
  };

  stg.Weapon.prototype.setAngleDeg = function(newAngleDeg) {
    // Create a minimal velocity object in order to use velocityFromAngle.
    var velocity = {
      vx : this.bodyVx,
      vy : this.bodyVy,
      setTo : function(vx, vy) {
        this.vx = vx;
        this.vy = vy;
      }
    };
    if (newAngleDeg > 360 || newAngleDeg < 360) {
      // This avoids the angle to become larger and larger...
      newAngleDeg = newAngleDeg % 360;
    }
    this.angleDeg = newAngleDeg;
    this.game.physics.arcade.velocityFromAngle(newAngleDeg, this.bulletSpeed, velocity);
    this.bulletVx = velocity.vx;
    this.bulletVy = velocity.vy;
  };

  stg.Weapon.prototype.shootSimple = function(bullet) {
    bullet.body.velocity.x = this.bulletVx;
    bullet.body.velocity.y = this.bulletVy;
    // * (Math.random(1) - 0.5);
  };

  stg.WeaponFactory.prototype.createWeapon = function(options) {
    var item = new stg.Weapon(this.game, options);
    return item;
  };

}(window.stg = window.stg || {}));