/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  /**
   * @param {stg.Level}
   *            level
   * @constructor
   */
  stg.EnemyFactory = function(game, level) {
    if (!(this instanceof stg.EnemyFactory)) {
      throw new Error('This is a constructor, call it using new !');
    }
    if (!level) {
      var msg = "Expecting level but got " + level;
      throw new Error(msg);
    }
    this.game = game;

    var weaponFactory = new stg.WeaponFactory(game);
    this.weaponFactory = weaponFactory;
    this.level = level;
  };

  stg.Enemy = function(options) {
    this.options = options;
    this.weapons = [];
    this.customFsm = null; // This can be set later.
    this.customMoveCounterMs = 0;
    this.customMoveState = null;
  };

  stg.Enemy.prototype = Object.create(Phaser.Sprite.prototype);
  stg.Enemy.prototype.constructor = stg.Enemy;

  stg.Enemy.prototype.addWeapon = function(weapon) {
    weapon.parentSprite = this;
    this.weapons.push(weapon);
  };

  stg.Enemy.prototype.shootWeapons = function() {
    var weaponsLength = this.weapons.length;
    if (weaponsLength == 1) {
      this.weapons[0].shoot();
    } else {
      for (var i = 0; i < weaponsLength; i++) {
        var weapon = this.weapons[i];
        weapon.shoot();
      }
    }
  };

  stg.Enemy.prototype.updateWeapons = function() {
    var weapons = this.weapons;
    var weaponsLength = weapons.length;
    if (weaponsLength == 1) {
      weapons[0].update();
    } else {
      for (var i = 0; i < weaponsLength; i++) {
        var weapon = weapons[i];
        weapon.update();
      }
    }
  };

  stg.Enemy.prototype.customMoveCounterInc = function(maxMilliSeconds) {
    if (this.customMoveCounterMs < maxMilliSeconds) {
      this.customMoveCounterMs += this.game.time.physicsElapsedMS;
      return true;
    }
    this.customMoveCounterMs = 0;
    return false;
  };

  stg.Enemy.prototype.customMoveStop = function() {
    var body = this.body;
    body.velocity.x = 0;
    body.velocity.y = 0;
    body.acceleration.x = 0;
    body.acceleration.y = 0;
  };

  stg.Enemy.prototype.customMoveReset = function() {
    this.body.reset(this.x, this.y);
  };

  stg.Enemy.prototype.customAngleDeg = function(angleDeg) {
    // In Phaser the angle in degrees is calculated in clockwise positive
    // direction (down = 90 degrees positive, right = 0 degrees positive, up =
    // 90 degrees negative). I guess this is because it was originally developed
    // for a horizontal platformer.
    this.customAngleDeg = angleDeg;
  };

  stg.Enemy.prototype.customTurnLeft = function(angleDeg) {
    this.customAngleDeg = this.customAngleDeg - angleDeg;
  };

  stg.Enemy.prototype.customTurnRight = function(angleDeg) {
    this.customAngleDeg = this.customAngleDeg + angleDeg;
  };

  stg.Enemy.prototype.customMoveForward = function() {
    var speed = this.body.speed;
    if (speed !== 0) {
      this.game.physics.arcade.velocityFromAngle(this.customAngleDeg, speed, this.body.velocity);
    }
  };

  stg.Enemy.prototype.customMoveBackward = function() {
    var speed = this.body.speed;
    if (speed !== 0) {
      this.game.physics.arcade.velocityFromAngle(-this.customAngleDeg, speed, this.body.velocity);
    }
  };

  stg.Enemy.prototype.update = function() {
    if (!this.alive) {
      return;
    }
    // var elapsedMs = this.game.time.physicsElapsedMS;
    if (this.customFsm) {
      this.customFsm.update();
    } else {
      // The default behavior is to shoot all weapons...
      this.updateWeapons();
    }
    if (this.customUpdate) {
      this.customUpdate();
    }
  };

  stg.EnemyFactory.prototype.createEnemy = function(x, y, options) {
    var game = this.game;
    var item = new stg.Enemy(options);

    // After Sprite.call the item will be a sprite.
    // TODO check if atlas really exists.
    Phaser.Sprite.call(item, game, x, y, options.atlasName, options.atlasFrameString);
    item.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;

    // Center the sprite but compensate to align on grid.
    // There are many other ways to do it, but this one respects central level
    // symmetry.
    item.x = item.x + 8; // 8 = 16 / 2

    // + 16, compensate to align on grid.
    // - item.height / 2 to load from bottom to top (solves issue of large
    // sprites).
    item.y = item.y + 16 - item.height / 2;

    if (game.customTint !== 0xffffff) {
      item.tint = game.customTint;
    }
    item.anchor.setTo(0.5, 0.5);
    item.health = options.hp;

    item.customName = options.atlasName + "-" + options.atlasFrameString;
    item.customHealthOriginal = options.hp;
    item.customPlayerImpass = options.customPlayerImpass;
    item.customEnemyImpass = options.customEnemyImpass;
    item.customEnemyBulletImpass = options.customEnemyBulletImpass;
    item.customScoreBonus = options.customScoreBonus ? options.customScoreBonus : 0;

    item.checkWorldBounds = false;
    item.outOfBoundsKill = false;

    this.addPhysicsTo(item);
    return item;
  };

  stg.EnemyFactory.prototype.addPhysicsTo = function(sprite) {
    var game = this.game;
    game.physics.enable(sprite, Phaser.Physics.ARCADE);
    var body = sprite.body;

    body.bounce.setTo(1, 1);
    body.drag.set(0);

    // Default: false, An immovable Body will not receive any impacts from other
    // bodies.
    body.immovable = true;
    body.allowGravity = false;
    body.allowRotation = false;

    // Enemy collision mask. Enemy hit box.
    var pixelsLess = 1; // Using 1 px avoids collision with immediate neighbors.
    body.setSize(Math.round(body.sourceWidth - pixelsLess), Math.round(body.sourceHeight - pixelsLess), 0, 0);

    // TODO approximate enemy shape using rectangles/circles.
    // TODO allow to set rectangle with 'except/exclude these other rectangles'.
  };

  function fireSuicideBullet(game, bulletPool, count, sprite) {
    var bullet, i;
    for (i = 0; i < count; i++) {
      bullet = bulletPool.getFirstExists(false);
      if (bullet) {
        // There is some randomness but not too much.
        bullet.reset(sprite.x + (Math.random() - 0.5) * (sprite.width / 2), sprite.y - 6 - Math.random() * 3, 1);
        // A bit of randomness looks more organic.
        bullet.body.velocity.x = 16 * (0.5 - Math.random());
        bullet.body.velocity.y = 80 + Math.random() * 10;
      }
    }
  }

  // ---

  /**
   * @param {number}
   *            x
   * @param {number}
   *            y
   * @param {number}
   *            randomness
   * @param {number}
   *            minDifficultyFactor
   * @param {Phaser.Sprite}
   *            playerSprite The player
   */
  stg.EnemyFactory.prototype.buildEnemy = function(parentLevel, enemyInfo, x, y, randomness, minDifficultyFactor) {
    // TODO maybe restrict randomness to the hard mode ?
    var ok = randomness === null || (Math.random() < randomness);
    var difficultyFactor = this.game.customDifficultyFactor;
    ok = ok && (minDifficultyFactor === null || (minDifficultyFactor <= difficultyFactor));
    if (!ok) {
      return null;
    }
    var difficultyMultiplier = Math.round((difficultyFactor - 1) * 12) + 1;
    var enemyType = enemyInfo.type;
    var enemyAtlas = enemyInfo.atlas;

    if (!enemyType) {
      var msg = "Missing enemy type for atlas=" + enemyAtlas;
      throw new Error(msg);
    }
    if (!enemyAtlas) {
      msg = "Missing enemy atlas for type=" + enemyType;
      throw new Error(msg);
    }

    var enemy, enemyParts, weapon, enemyOptions, shotFrequencyMs;
    var game = this.game;

    var level = this.level;
    var playerSprite = level.player.sprite;
    var enemyBulletPoolByName = level.enemyBulletPoolByName;
    var enemyGroup = level.enemyGroup;
    // TODO use this for non-aimed bullets.
    var enemyBulletPoolStandard = enemyBulletPoolByName.standard;
    // TODO use this ONLY for aimed bullets.
    var enemyBulletPoolSecondary = enemyBulletPoolByName.secondary;

    var context = {
      x : x,
      y : y,
      difficultyFactor : difficultyFactor,
      difficultyMultiplier : difficultyMultiplier,
      enemyType : enemyInfo.type,
      enemyAtlas : enemyInfo.atlas,
      enemyGroup : enemyGroup,
      enemyBulletPoolStandard : enemyBulletPoolStandard,
      enemyBulletPoolSecondary : enemyBulletPoolSecondary,
      enemyBulletPoolByName : enemyBulletPoolByName,
      playerSprite : playerSprite,
      randomness : randomness
    };

    var self = this;
    var enemyBuilderById = {
      'tower-simple' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-tower',
          hp : 10
        };
        var enemy = enemyFact.createEnemy(x, y, enemyOptions);

        // Turret, tower, aimed shot...
        weapon = enemyFact.weaponFactory.createWeapon({
          xOffset : 0,
          yOffset : 0,
          bulletPool : enemyBulletPoolSecondary,
          bulletFrequencyMs : Math.round((2 - difficultyFactor) * 1000),
          bulletSpeed : Math.round(difficultyFactor * 170),
          aimTarget : playerSprite
        });
        enemy.addWeapon(weapon);

        enemy.body.allowRotation = true;
        enemy.customUpdate = function() {
          rotateToFollowTarget(this, playerSprite);
        };

        if (difficultyFactor >= 1) {
          var level = enemyFact.level;
          enemy.customDoWhenDestroyed = function() {
            if (Math.random() > 0.94) {
              level.addCollectibleCoinBig(this.x, this.y);
            }
            fireSuicideBullet(game, enemyBulletPoolStandard, difficultyMultiplier, this);
          };
        }
        return [ enemy ];
      },
      'tower-spread' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-tower',
          hp : 30
        };
        var enemy = enemyFact.createEnemy(x, y, enemyOptions);

        // Aims at enemy and spreads.
        weapon = enemyFact.weaponFactory.createWeapon({
          xOffset : 0,
          yOffset : 0,
          bulletPool : enemyBulletPoolSecondary,
          bulletFrequencyMs : Math.round((2 - difficultyFactor) * 1600),
          bulletSpeed : Math.round(difficultyFactor * 120),
          aimTarget : playerSprite
        });
        enemy.addWeapon(weapon);

        weapon = enemyFact.weaponFactory.createWeapon({
          xOffset : 0,
          yOffset : 0,
          bulletPool : enemyBulletPoolSecondary,
          bulletFrequencyMs : Math.round((2 - difficultyFactor) * 1600),
          bulletSpeed : Math.round(difficultyFactor * 120),
          aimTarget : playerSprite,
          aimOffsetDeg : 30
        });
        enemy.addWeapon(weapon);

        weapon = enemyFact.weaponFactory.createWeapon({
          xOffset : 0,
          yOffset : 0,
          bulletPool : enemyBulletPoolSecondary,
          bulletFrequencyMs : Math.round((2 - difficultyFactor) * 1600),
          bulletSpeed : Math.round(difficultyFactor * 120),
          aimTarget : playerSprite,
          aimOffsetDeg : -30
        });
        enemy.addWeapon(weapon);

        enemy.body.allowRotation = true;
        enemy.customUpdate = function() {
          rotateToFollowTarget(this, playerSprite);
        };

        enemy.customDoWhenDestroyed = function() {
          if (Math.random() > 0.6) {
            level.addCollectibleCoin(this.x, this.y);
          } else if (Math.random() > 0.7) {
            level.addCollectibleCoinBig(this.x, this.y);
          } else if (Math.random() > 0.96) {
            level.addCollectibleAnkh(this.x, this.y);
          }
        };
        return [ enemy ];
      },
      'tower-triple' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-tower',
          hp : 20
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);

        weapon = enemyFact.weaponFactory.createWeapon({
          xOffset : 0,
          yOffset : 0,
          bulletPool : enemyBulletPoolSecondary,
          bulletFrequencyMs : Math.round((2 - difficultyFactor) * 100),
          bulletFrequency2Ms : Math.round((2 - difficultyFactor) * 1000),
          bulletsConsecutiveCount : 3,
          bulletSpeed : difficultyFactor * 190,
          aimTarget : playerSprite
        });
        enemy.addWeapon(weapon);

        enemy.body.allowRotation = true;
        enemy.customUpdate = function() {
          rotateToFollowTarget(this, playerSprite);
        };

        return [ enemy ];
      },
      'side' : function(enemyFact) {
        // Side shooter.
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-sider',
          hp : 20
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);

        weapon = enemyFact.weaponFactory.createWeapon({
          xOffset : +8,
          yOffset : 0,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : 1200, // Keep it constant
          bulletVx : difficultyFactor * 80,
          bulletVy : 0
        });
        enemy.addWeapon(weapon);

        weapon = enemyFact.weaponFactory.createWeapon({
          xOffset : -8,
          yOffset : 0,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : Math.round((2 - difficultyFactor) * 1200),
          bulletVx : -difficultyFactor * 80,
          bulletVy : 0
        });
        enemy.addWeapon(weapon);

        enemy.customDoWhenDestroyed = function() {
          if (Math.random() > 0.9) {
            level.addCollectibleCoinBig(this.x, this.y);
          }
        };
        return [ enemy ];
      },
      'mine' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-mine',
          hp : 10,
          customPlayerImpass : true
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);
        enemy.customDoWhenDestroyed = function() {
          if (Math.random() > 0.8) {
            // Mines are risky, reward the player.
            level.addCollectibleCoinBig(this.x, this.y);
          }
          //
          // A good bomber-man like explosion :)
          //
          var bulletSpeed = Math.round(difficultyFactor * 200); // Quite fast.
          // Explode before 'death'. Suicide bullets.
          var bullet = enemyBulletPoolStandard.getFirstExists(false);
          if (bullet) {
            bullet.reset(enemy.x, enemy.y, 1);
            bullet.body.velocity.x = bulletSpeed;
            bullet.body.velocity.y = 0;
          }
          bullet = enemyBulletPoolStandard.getFirstExists(false);
          if (bullet) {
            bullet.reset(enemy.x, enemy.y, 1);
            bullet.body.velocity.x = 0;
            bullet.body.velocity.y = bulletSpeed;
          }
          bullet = enemyBulletPoolStandard.getFirstExists(false);
          if (bullet) {
            bullet.reset(enemy.x, enemy.y, 1);
            bullet.body.velocity.x = -bulletSpeed;
            bullet.body.velocity.y = 0;
          }
          bullet = enemyBulletPoolStandard.getFirstExists(false);
          if (bullet) {
            bullet.reset(enemy.x, enemy.y, 1);
            bullet.body.velocity.x = 0;
            bullet.body.velocity.y = -bulletSpeed;
          }
        };
        return [ enemy ];
      },
      'enemy-block-destructible' : function(enemyFact) {
        // Rock/stone.
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-block-destructible',
          hp : 50,
          customPlayerImpass : true,
          customEnemyImpass : false,
          customEnemyBulletImpass : true
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);
        var level = enemyFact.level;
        enemy.customDoWhenDestroyed = function() {
          if (Math.random() > 0.8) {
            level.addCollectibleCoin(this.x, this.y);
          } else if (Math.random() > 0.85) {
            level.addCollectibleCoinBig(this.x, this.y);
          } else if (Math.random() > 0.96) {
            level.addCollectibleAnkh(this.x, this.y);
          }
        };
        return [ enemy ];
      },
      'enemy-shield' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-shield',
          hp : 30,
          customPlayerImpass : true,
          customEnemyImpass : false,
          customEnemyBulletImpass : false
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);
        var reg = new stg.RegularIntervalCaller(game, function() {
          enemy.visible = !enemy.visible;
          enemy.alive = !enemy.alive;
        }, 1000, 0);
        enemy.update = function() {
          reg.update();
        };
        return [ enemy ];
      },
      'enemy-forward' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-forward',
          hp : 10
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);
        // This enemy just moves forward.
        enemy.body.velocity.y = 32;

        if (difficultyFactor >= 1) {
          enemy.customDoWhenDestroyed = function() {
            fireSuicideBullet(game, enemyBulletPoolStandard, difficultyMultiplier, this);
          };
        }
        return [ enemy ];
      },
      'enemy-spiral' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-mine',
          hp : 10
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);

        var weapon = enemyFact.weaponFactory.createWeapon({
          xOffset : 0,
          yOffset : 0,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : Math.round((2 - difficultyFactor) * 80),
          bulletSpeed : 100,
          angleDeg : Math.random() * 20
        });

        enemy.addWeapon(weapon);

        enemy.body.allowRotation = true;

        // Do a spiral shot.
        enemy.customUpdate = function() {
          // The smaller the angle increment the smoother the spirtal.
          // Note that this is also related to the shot frequency...
          weapon.angleDegIncrease(game.time.physicsElapsedMS / 3);

          // Rotate with the same angle as the shot (because it looks good).
          this.body.rotation = weapon.angleDeg;
        };

        if (difficultyFactor >= 1) {
          enemy.customDoWhenDestroyed = function() {
            fireSuicideBullet(game, enemyBulletPoolStandard, difficultyMultiplier, this);
          };
        }
        return [ enemy ];
      },
      'enemy-octopus' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-octopus',
          hp : 50
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);

        enemy.customFsm = new stg.Fsm({
          name : 'shoot-and-move',
          initialStateKey : 'moveLeft',
          stateMap : {
            moveLeft : {
              onEnter : function() {
                enemy.body.velocity.x = -16;
              },
              update : function() {
                if (!enemy.customMoveCounterInc(700)) {
                  enemy.shootWeapons();
                  enemy.customFsm.transition('moveRight');
                }
              }
            },
            moveRight : {
              onEnter : function() {
                enemy.body.velocity.x = 16;
              },
              update : function() {
                if (!enemy.customMoveCounterInc(700)) {
                  enemy.shootWeapons();
                  enemy.customFsm.transition('moveLeft');
                }
              }
            }
          }
        });

        shotFrequencyMs = Math.round((2 - difficultyFactor) * 100);
        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : -3,
          yOffset : 10,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : shotFrequencyMs,
          bulletFrequency2Ms : 900,
          bulletsConsecutiveCount : 3,
          bulletVx : -30,
          bulletVy : Math.round(difficultyFactor * 160)
        }));
        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : 3,
          yOffset : 8,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : shotFrequencyMs,
          bulletReloadMs : shotFrequencyMs / 2,
          bulletFrequency2Ms : 900,
          bulletsConsecutiveCount : 3,
          bulletVx : 30,
          bulletVy : Math.round(difficultyFactor * 160)
        }));

        if (difficultyFactor >= 1) {
          var level = enemyFact.level;
          enemy.customDoWhenDestroyed = function() {
            if (Math.random() > 0.8) {
              level.addCollectibleCoinBig(this.x, this.y);
            }
            fireSuicideBullet(game, enemyBulletPoolStandard, difficultyMultiplier, this);
          };
        }
        return [ enemy ];
      },
      'enemy-in-out' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-forward',
          hp : 10
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);

        enemy.customFsm = new stg.Fsm({
          name : 'move-down-and-enemyPartsshoot',
          initialStateKey : 'moveDown',
          stateMap : {
            moveUp : {
              onEnter : function() {
                enemy.body.velocity.y = -24;
              },
              update : function() {
                if (!enemy.customMoveCounterInc(500)) {
                  enemy.customFsm.transition('moveDown');
                }
              }
            },
            moveDown : {
              onEnter : function() {
                enemy.body.velocity.y = 24;
              },
              update : function() {
                if (!enemy.customMoveCounterInc(500)) {
                  enemy.shootWeapons();
                  enemy.customFsm.transition('moveUp');
                }
              }
            }
          }
        });

        shotFrequencyMs = Math.round((2 - difficultyFactor) * 500);
        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : -3,
          yOffset : 10,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : shotFrequencyMs,
          bulletVx : -5,
          bulletVy : Math.round(difficultyFactor * 150)
        }));
        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : 3,
          yOffset : 8,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : shotFrequencyMs,
          bulletVx : 5,
          bulletVy : Math.round(difficultyFactor * 150)
        }));
        return [ enemy ];
      },
      'wing-small2' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-wing-small2',
          hp : 20
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);

        shotFrequencyMs = Math.round((2 - difficultyFactor) * 900);
        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : -8,
          yOffset : 8,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : shotFrequencyMs,
          bulletVx : 0,
          bulletVy : Math.round(difficultyFactor * 128)
        }));
        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : 8,
          yOffset : 8,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : shotFrequencyMs,
          bulletReloadMs : shotFrequencyMs / 2,
          bulletVx : 0,
          bulletVy : Math.round(difficultyFactor * 128)
        }));

        // var origVy = -42;
        // enemy.body.velocity.y = origVy;

        // What we want it something like:
        // enemy.chain = new
        // stg.commandChain(true).move(500).wait(100).shoot(1).wait(100).shoot(2);
        // stg.commandChain(true).moveAndShoot(500, 1).waitAndShoot(100,
        // 2).move(-1);

        // SMALL DSL, CONCISE, MINIMAL API
        // CLOSER TO HUMAN THOUGHT
        // REUSABLE NAMED CHAINABLE BLOCKS
        // COMPOSITION

        // Logo/Turtle like commands.
        // left(deg) // lt
        // right(deg) // rt
        // angle(deg)
        // forward(ms) // fd
        // back(ms) // bk
        // toPlayer() // tp
        // fromPlayer() // fp
        // reset() // rs
        // wait() // wt

        // 1. Declare the small command blocks (custom naming of existing
        // commands):
        // 'waitShort' : {'stopMove', 500},
        // 'waitLong' : {'wait', 1000},
        // 'shootAll' : {'shoot', ['laser', 'gun']},
        // 'shootGun' : {'shoot', ['gun']},
        // 'shootLaser' : {'shoot', ['laser']},
        // 'moveLeft' : {'move', 'left', -100},
        // 'moveRight' : {'move', 'right', 100},

        // 2. Compose bigger command blocks:
        // Chained blocks.
        // chain1 = comChain('shoots', ['shootGun', 'shootLaser', 'wait']);
        // chain2 = comChain('moves', ['moveRight', 'moveLeft']);
        // chain3 = comChain('shootAndMoves', ['doShoot', 'doMove']);

        // Parallel blocks.
        // para1 = comPara('shootAndMove', ['shootGun', 'moveRight']);

        // 2. Compose largest command blocks:
        // actions = comChain('shootAndMove');

        enemy.body.speed = 100;
        enemy.customAngleDeg(0);

        enemy.customUpdate = function() {
          this.customTurnLeft(4);
          this.customMoveForward();
          // this.customMoveBackward();
          // this.customMoveStop();
        };

        // enemy.customFsm = new stg.fsm({
        // name : 'shoot-and-move',
        // initialStateKey : 'move',
        // stateMap : {
        // wait : {
        // elapsedMsCount : null,
        // onEnter : function() {
        // this.elapsedMsCount = 0;
        // enemy.body.velocity.y = 0;
        // },
        // update : function() {
        // var elapsedMs = game.time.physicsElapsedMS;
        // if (this.elapsedMsCount < 200) {
        // this.elapsedMsCount += elapsedMs;
        // } else {
        // enemy.shootWeapons();
        // enemy.customFsm.transition('move');
        // }
        // }
        // },
        // move : {
        // elapsedMsCount : null,
        // onEnter : function() {
        // enemy.body.velocity.y = origVy;
        // this.elapsedMsCount = 0;
        // },
        // update : function() {
        // var elapsedMs = game.time.physicsElapsedMS;
        // if (this.elapsedMsCount < 1000) {
        // this.elapsedMsCount += elapsedMs;
        // } else {
        // enemy.customFsm.transition('wait');
        // }
        // }
        // }
        // }
        // });
        return [ enemy ];
      },
      'wing-medium' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-wing-medium',
          hp : 100
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);
        enemy.body.velocity.y = -42;

        shotFrequencyMs = Math.round(500 * (2 - difficultyFactor));
        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : -7,
          yOffset : 8,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : shotFrequencyMs,
          bulletVx : 0,
          bulletVy : Math.round(difficultyFactor * 140)
        }));
        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : 7,
          yOffset : 8,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : shotFrequencyMs,
          bulletReloadMs : shotFrequencyMs / 2,
          bulletVx : 0,
          bulletVy : Math.round(difficultyFactor * 140)
        }));

        enemy.body.maxVelocity.x = 100;
        enemy.customUpdate = function() {
          // Follow player.
          if (this.x < playerSprite.x) {
            this.body.velocity.x += this.game.time.physicsElapsedMS / 8;
          } else {
            this.body.velocity.x -= this.game.time.physicsElapsedMS / 8;
          }
        };
        return [ enemy ];
      },
      'wing-large' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-wing-large',
          hp : 150
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);
        enemy.body.velocity.y = -42;

        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : 0,
          yOffset : 12,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : 800,
          bulletVx : 0,
          bulletVy : Math.round(difficultyFactor * 130)
        }));
        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : -26,
          yOffset : 8,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : 800,
          bulletReloadMs : 1, // Maybe a little offset can help with performance
          // (not all at once).
          bulletVx : 0,
          bulletVy : Math.round(difficultyFactor * 130)
        }));
        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : 26,
          yOffset : 8,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : 800,
          bulletReloadMs : 2, // Maybe a little offset can help with performance
          // (not all at once).
          bulletVx : 0,
          bulletVy : Math.round(difficultyFactor * 130)
        }));
        return [ enemy ];
      },
      'multi-wing-giant' : function(enemyFact) {
        enemyOptions = {
          atlasName : enemyAtlas,
          atlasFrameString : 'enemy-multi-wing-giant',
          hp : 260,
          customScoreBonus : 1000
        };
        enemy = enemyFact.createEnemy(x, y, enemyOptions);
        enemy.body.velocity.y = -30; // TODO Should depend on level speed.

        // Aimed shot.
        weapon = enemyFact.weaponFactory.createWeapon({
          xOffset : 0, // Offset from center.
          yOffset : 50, // Offset from center.
          bulletPool : enemyBulletPoolSecondary,
          bulletFrequencyMs : 100,
          bulletFrequency2Ms : 1000,
          bulletsConsecutiveCount : 3,
          bulletSpeed : Math.round(difficultyFactor * 150),
          aimTarget : playerSprite
        });
        enemy.addWeapon(weapon);

        // Front shot.
        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : -18,
          yOffset : 30,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : 1600,
          bulletVx : 0,
          bulletVy : Math.round(difficultyFactor * 130)
        }));

        // Front shot.
        enemy.addWeapon(enemyFact.weaponFactory.createWeapon({
          xOffset : +18,
          yOffset : 30,
          bulletPool : enemyBulletPoolStandard,
          bulletFrequencyMs : 1600,
          bulletVx : 0,
          bulletVy : Math.round(difficultyFactor * 130)
        }));
        return [ enemy ];
      },
      'enemy-block-to-block-mover' : function(enemyFact) {
        return self.buildBlockToBlockMover(x, y, enemyAtlas);
      },
      'enemy-seeker' : function(enemyFact) {
        return self.buildSeeker(x, y, enemyAtlas, enemyBulletPoolStandard, playerSprite, difficultyFactor, difficultyMultiplier);
      },
      'enemy-rotaline' : function(enemyFact) {
        return self.buildRotaline(x, y, enemyAtlas, difficultyFactor);
      },
      'enemy-lobster' : function(enemyFact) {
        return self.buildLobster(x, y, enemyAtlas, enemyBulletPoolStandard, difficultyFactor, difficultyMultiplier);
      },
      'enemy-lobster-boss' : function(enemyFact) {
        return self.buildLobsterBoss(x, y, enemyAtlas, enemyBulletPoolStandard, enemyBulletPoolSecondary, enemyGroup, difficultyFactor, difficultyMultiplier, playerSprite);
      }
    // '' : function(enemyFact) {
    //      
    // return [enemy];
    // },
    // '' : function(enemyFact) {
    //      
    // return [enemy];
    // }
    };

    var builder = enemyBuilderById[enemyType];
    if (builder) {
      return builder(this, context);
    }
    if (enemyParts && enemyParts.length > 0) {
      return enemyParts;
    }
    if (enemy !== null) {
      return [ enemy ];
    }
    // parentLevel(context);
    return null;
  };

  stg.EnemyFactory.prototype.buildLobsterBoss = function(x, y, enemyAtlas, enemyBulletPoolStandard, enemyBulletPoolSecondary, enemyGroup, difficultyFactor, difficultyMultiplier,
      playerSprite) {
    var eFactory = this;
    var game = this.game;
    var initialHealth = 1200;
    var maxSpawn = 3 * 10;
    var enemy = this.createEnemy(x, y, {
      atlasName : enemyAtlas,
      atlasFrameString : 'enemy-lobster-boss',
      hp : initialHealth,
      customScoreBonus : 1000
    // Juicy bonus for the boss.
    });
    enemy.body.velocity.y = 0;
    enemy.customFsm = leftRightFsm(enemy, 100, 1500);

    var weaponAimed = this.weaponFactory.createWeapon({
      xOffset : 0,
      yOffset : 32,
      bulletPool : enemyBulletPoolSecondary,
      bulletFrequencyMs : Math.round((2 - difficultyFactor) * 1000),
      bulletSpeed : Math.round(difficultyFactor * 190),
      bulletReloadMs : 1,
      aimTarget : playerSprite,
      aimOffsetDeg : 1
    });
    enemy.addWeapon(weaponAimed);

    var weaponSpiral = this.weaponFactory.createWeapon({
      xOffset : 0,
      yOffset : 50,
      bulletPool : enemyBulletPoolStandard,
      bulletSpeed : Math.round(difficultyFactor * 140),
      bulletFrequencyMs : Math.round((2 - difficultyFactor) * 18),
      bulletFrequency2Ms : Math.round((2 - difficultyFactor) * 1200),
      bulletsConsecutiveCount : 32,
      angleDeg : 0
    });
    enemy.addWeapon(weaponSpiral);

    var shotTacticState = 'spiral';
    enemy.customUpdate = function() {

      var hpRatio = enemy.health / initialHealth;
      // var xRatio = enemy.x / 240;

      // Do regular shot.
      enemy.weapons[0].update();

      // Do a spiral shot.
      // weaponSpiral.angleDegIncrease(this.game.time.physicsElapsedMS / (10 -
      // hpRatio * 10 + 0.1));
      if (shotTacticState === 'chaotic') {
        // Do a chaotic spiral.
        weaponSpiral.angleDegIncrease(this.game.time.physicsElapsedMS / 0.05);
      } else if (shotTacticState === 'spiral') {
        // Do more or less standard spiral.
        weaponSpiral.angleDegIncrease(this.game.time.physicsElapsedMS / (3 + hpRatio));
      }

      // Skip some bullets to leave gaps.
      if (hpRatio > 0.1 && hpRatio < 0.95 && Math.random() > (1.3 - difficultyFactor)) {
        if (this.weapons[1].update()) {
          // Switch tactics.
          if (shotTacticState === 'chaotic') {
            shotTacticState = 'spiral';
          } else {
            shotTacticState = 'chaotic';
          }
        }
      }

      // Add some vertical motion.
      this.y += Math.sin(this.x / 8) * 0.5;

      if (hpRatio < 0.1 && Math.random() > 0.9 + hpRatio) {
        // Suicide caviar spawn before death.
        fireSuicideBullet(game, enemyBulletPoolStandard, difficultyMultiplier, this);
      }

      if (difficultyFactor > 1) {
        if (Math.random() > 0.99) {
          fireSuicideBullet(game, enemyBulletPoolStandard, difficultyMultiplier, this);
        }
      }

      // Follow player horizontally.
      if (this.x > playerSprite.x) {
        this.x -= game.time.physicsElapsedMS / 40;
      } else {
        this.x += game.time.physicsElapsedMS / 40;
      }

      if (hpRatio < 0.75) {
        // Follow player vertically (usually goes down).
        if (this.y < playerSprite.y - 220) {
          this.y += game.time.physicsElapsedMS / 200;
        }
        if (hpRatio > 0.3 && maxSpawn > 0 && Math.random() > 0.99) {
          // Spawn seekers. This allows the player to 'milk' the boss for
          // points.
          var seeker = eFactory.buildSeeker(this.x, this.y - 40, enemyAtlas, enemyBulletPoolStandard, playerSprite, difficultyFactor, difficultyMultiplier);
          addEnemyParts(seeker, enemyGroup);
          maxSpawn--;
        }
      }
    };

    return [ enemy ];
  };

  /**
   * ALWAYS LIMIT THE SPAWNING TO SOME MAX COUNT TO AVOID INFINITE SCORES
   * EXPLOITS !
   */
  function addEnemyParts(enemyParts, enemyGroup) {
    if (enemyParts !== null) {
      for (var part = 0; part < enemyParts.length; part++) {
        var enemyPart = enemyParts[part];
        enemyGroup.add(enemyPart);
      }
    }
  }

  stg.EnemyFactory.prototype.buildSeeker = function(x, y, enemyAtlas, enemyBulletPoolStandard, playerSprite, difficultyFactor, difficultyMultiplier) {
    var game = this.game;
    var enemyParts = [];

    var enemy = this.createEnemy(x, y, {
      atlasName : enemyAtlas,
      atlasFrameString : 'enemy-octopus',
      hp : 30,
      customPlayerImpass : true
    });
    enemy.body.speed = 50 * difficultyFactor;
    enemy.customAngleDeg(0);
    // This turn feature looks like a jump from a wall.
    var turnLeft = enemy.x > (game.world.width / 2);
    enemy.customUpdate = function() {
      if (turnLeft) {
        this.customTurnLeft(3);
      } else {
        this.customTurnRight(3);
      }
      if (Math.random() > 0.7) {
        this.customMoveForward();
      }
      // this.customMoveBackward();
      // this.customMoveStop();

      var gameTime = game.time.physicsElapsedMS;

      // Follow player horizontally.
      // Be slower horizontally so player will not easily face enemy.
      if (this.x > playerSprite.x) {
        this.x -= gameTime / 40;
      } else {
        this.x += gameTime / 40;
      }
      // Follow player vertically.
      // Be fast vertically to reach player quickly.
      if (this.y > playerSprite.y) {
        this.y -= gameTime / 40; // Slow up.
      } else {
        this.y += gameTime / 16; // Fast down.
      }
    };
    if (difficultyFactor >= 1) {
      var level = this.level;
      enemy.customDoWhenDestroyed = function() {
        if (Math.random() > 0.8) {
          level.addCollectibleCoinBig(this.x, this.y);
        }
        fireSuicideBullet(game, enemyBulletPoolStandard, difficultyMultiplier, this);
      };
    }
    enemyParts.push(enemy);

    return enemyParts;
  };

  stg.EnemyFactory.prototype.buildBlockToBlockMover = function(x, y, enemyAtlas) {
    var enemyParts = [];

    var speed = 32; // Keep this constant...
    var graphics = "enemy-shield";

    var enemy = this.createEnemy(x, y, {
      atlasName : enemyAtlas,
      atlasFrameString : graphics,
      hp : 50,
      customPlayerImpass : true
    });

    enemy.body.velocity.x = speed;

    var level = this.level;
    enemy.customUpdate = function() {
      var spriteBody = this.body;
      var spriteBodyCenterX = spriteBody.center.x;
      var spriteBodyCenterY = spriteBody.center.y;

      var xAhead = spriteBodyCenterX + (this.body.velocity.x > 0 ? 8 : -8);
      var cx = Math.floor(xAhead / 16);
      var cy = Math.floor(spriteBodyCenterY / 16);
      var tile = level.tileByCellPos[cx + cy * 16];

      if (tile && tile.alive) {
        // Reverse direction if there is a block ahead.
        this.body.velocity.x = -this.body.velocity.x;
      }
    };

    enemy.body.speed = speed;
    enemyParts.push(enemy);

    return enemyParts;
  };

  stg.EnemyFactory.prototype.buildRotaline = function(x, y, enemyAtlas, difficultyFactor) {
    var enemyParts = [];

    var speed = 48 * difficultyFactor;
    var turnAngle = 3;
    var graphics = "enemy-shield";

    var enemy = this.createEnemy(x, y, {
      atlasName : enemyAtlas,
      atlasFrameString : graphics,
      hp : 80,
      customPlayerImpass : true
    });
    enemy.body.speed = 0;
    enemyParts.push(enemy);

    enemy = this.createEnemy(x, y + 16, {
      atlasName : enemyAtlas,
      atlasFrameString : graphics,
      hp : 80,
      customPlayerImpass : true
    });
    enemy.body.speed = speed;
    enemy.customAngleDeg(0);
    enemy.customUpdate = function() {
      this.customTurnLeft(turnAngle);
      this.customMoveForward();
      // this.customMoveBackward();
      // this.customMoveStop();
    };
    enemyParts.push(enemy);

    var enemy = this.createEnemy(x, y + 32, {
      atlasName : enemyAtlas,
      atlasFrameString : graphics,
      hp : 80,
      customPlayerImpass : true
    });
    enemy.body.speed = speed * 2;
    enemy.customAngleDeg(0);
    enemy.customUpdate = function() {
      this.customTurnLeft(turnAngle);
      this.customMoveForward();
      // this.customMoveBackward();
      // this.customMoveStop();
    };
    enemyParts.push(enemy);

    var enemy = this.createEnemy(x, y + 48, {
      atlasName : enemyAtlas,
      atlasFrameString : graphics,
      hp : 80,
      customPlayerImpass : true
    });
    enemy.body.speed = speed * 3;
    enemy.customAngleDeg(0);
    enemy.customUpdate = function() {
      this.customTurnLeft(turnAngle);
      this.customMoveForward();
      // this.customMoveBackward();
      // this.customMoveStop();
    };
    enemyParts.push(enemy);

    return enemyParts;
  };

  stg.EnemyFactory.prototype.buildLobster = function(x, y, enemyAtlas, enemyBulletPoolStandard, difficultyFactor, difficultyMultiplier) {
    var game = this.game;
    var level = this.level;

    // Add lobster segments.
    var enemyParts = [];

    // TODO use sine movement (more organic)

    var speedY = 0;
    var movexMs = 400 + Math.round(Math.random() * 100);

    var enemy = this.createEnemy(x, y - 68, {
      atlasName : enemyAtlas,
      atlasFrameString : 'enemy-lobster-segment-tail',
      hp : 40,
      customScoreBonus : 100
    });
    enemy.customFsm = leftRightFsm(enemy, 26, movexMs);
    enemy.body.velocity.y = speedY;
    if (difficultyFactor >= 1) {
      enemy.customDoWhenDestroyed = function() {
        if (Math.random() > 0.5) {
          // Mines are risky, reward the player.
          level.addCollectibleCoinBig(this.x, this.y);
        }
        fireSuicideBullet(game, enemyBulletPoolStandard, difficultyMultiplier, this);
      };
    }
    enemyParts.push(enemy);

    var enemyOptions = {
      atlasName : enemyAtlas,
      atlasFrameString : 'enemy-lobster-segment-center',
      hp : 20
    };
    enemy = this.createEnemy(x, y - 58, enemyOptions);
    enemy.customFsm = leftRightFsm(enemy, 18, movexMs);
    enemy.body.velocity.y = speedY;
    if (difficultyFactor >= 1) {
      enemy.customDoWhenDestroyed = function() {
        fireSuicideBullet(game, enemyBulletPoolStandard, difficultyMultiplier, this);
      };
    }
    enemyParts.push(enemy);

    enemy = this.createEnemy(x, y - 43, enemyOptions);
    enemy.customFsm = leftRightFsm(enemy, 14, movexMs);
    if (difficultyFactor >= 1) {
      enemy.customDoWhenDestroyed = function() {
        fireSuicideBullet(game, enemyBulletPoolStandard, difficultyMultiplier, this);
      };
    }
    enemy.body.velocity.y = speedY;
    enemyParts.push(enemy);

    enemy = this.createEnemy(x, y, {
      atlasName : enemyAtlas,
      atlasFrameString : 'enemy-lobster-segment-head',
      hp : 60,
      customScoreBonus : 20
    });
    enemy.customFsm = leftRightFsm(enemy, 10, movexMs);
    enemy.body.velocity.y = speedY;
    if (difficultyFactor >= 1) {
      enemy.customDoWhenDestroyed = function() {
        fireSuicideBullet(game, enemyBulletPoolStandard, difficultyMultiplier, this);
      };
    }
    enemy.addWeapon(this.weaponFactory.createWeapon({
      xOffset : 0,
      yOffset : 20,
      bulletPool : enemyBulletPoolStandard,
      bulletFrequencyMs : 1000,
      bulletVx : 0,
      bulletVy : Math.round(difficultyFactor * 60)
    }));
    enemyParts.push(enemy);

    return enemyParts;
  };

  function rotateToFollowTarget(self, target) {
    // Follow 'player' effect.
    var deltaX = self.x - target.x;
    var deltaY = self.y - target.y;
    // var dist = this.game.physics.arcade.distanceBetween(this,
    // playerSprite);
    var dist = Math.abs(deltaX) + Math.abs(deltaY); // Manhattan distance.
    // Do some cheap math to find the angle (no trigonometry).
    var baseAngle = (90 * deltaX) / dist;
    var newAngle = Math.round((deltaY < 0) ? baseAngle : 180 - baseAngle);
    self.body.rotation = newAngle;
  }

  function leftRightFsm(enemy, movePx, durationMs) {
    return new stg.Fsm({
      name : 'shoot-and-move',
      initialStateKey : 'moveLeftInit',
      stateMap : {
        moveLeftInit : {
          onEnter : function() {
            enemy.body.velocity.x = -movePx;
          },
          update : function() {
            if (!enemy.customMoveCounterInc(durationMs / 2)) {
              enemy.customFsm.transition('moveRight');
            }
          }
        },
        moveLeft : {
          onEnter : function() {
            enemy.body.velocity.x = -movePx;
          },
          update : function() {
            if (!enemy.customMoveCounterInc(durationMs)) {
              enemy.shootWeapons();
              enemy.customFsm.transition('moveRight');
            }
          }
        },
        moveRight : {
          onEnter : function() {
            enemy.body.velocity.x = movePx;
          },
          update : function() {
            if (!enemy.customMoveCounterInc(durationMs)) {
              enemy.shootWeapons();
              enemy.customFsm.transition('moveLeft');
            }
          }
        }
      }
    });
  }

}(window.stg = window.stg || {}));
