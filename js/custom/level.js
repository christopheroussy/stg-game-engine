/**
 * @author Christophe Roussy
 * @copyright 2015
 */
(function(stg, undefined) {
  "use strict";

  // The level class.
  // It is not part of Phaser.
  // It should contain only general level handling logic, nothing specific.

  /**
   * @constructor
   */
  stg.Level = function(game, parentLevel, tileAtlasKey, key) {
    if (!(this instanceof stg.Level)) {
      throw new Error('This is a constructor, call it using new !');
    }
    this.game = game;
    this.lastFps = null;
    this.lastVisibleScore = null;

    this.levelConfig = null;
    this.levelData = null;
    this.levelLineArrayIndex = 0;
    this.tileAtlasKey = tileAtlasKey;
    this.key = key; // The key is useful for error messages.
    this.levelAccuSpeedInc = 0;

    this.game.screenCellCountX = this.game.width / 16;
    this.game.screenCellCountY = this.game.height / 16;
    // this.game.customTint = 0xffffff; // Neutral, daylight.
    
    this.parentLevel = parentLevel;
  };

  function callBackAfterLevelLoaded(game, that, levelData, levelConfig) {
    console.info("Entering level load callback.");
    that.levelConfig = levelConfig;
    that.levelData = levelData;

    // TODO more checking of color.

    that.initAfterLevelLoad(that.levelData.linesArray[1].length, that.levelData.linesArray.length);

    // Recommended chars.
    // ~ for water
    // 0 for center and 1234 for corners
    // http://www.utf8-chartable.de/
    that.textureByChar = that.levelConfig.textureByChar;
    that.enemyByChar = that.levelConfig.enemyByChar;

    // This is the default. IT CAN BE OVERRIDDEN BY LEVEL ANNOTATIONS !
    game.customLevelSpeed = 61; // game.time.desiredFps;

    // TODO use level.levelConfig, how can we only load the atlas at this
    // point ???
    // -> Solution: load level json and text in preload.
    that.loadLines(1, game.screenCellCountY);
    console.debug('Initial level lines loaded.');
    game.paused = false;
  }

  /**
   * This allows loading levels directly from javascript text string. For
   * example it could be used to load internally procedurally generated level
   * text !
   * 
   * @param {string}
   *            levelName - name of the level without the file extension or
   *            folder.
   * 
   * @param {string}
   *            levelText - the level data as a javascript string.
   */
  stg.Level.prototype.readLevelInternal = function(levelName, levelText) {
    var game = this.game;
    game.paused = true;

    var that = this;
    console.info("Attempting to load level from internal data: " + levelName);
    var levelLoader = new stg.LevelLoader();
    levelLoader.loadLevelInternalText(levelName, levelText, function(levelData, levelConfig) {
      callBackAfterLevelLoaded(game, that, levelData, levelConfig);
      console.info("Loaded level from internal data: " + levelName);
      levelLoader = null; // For GC.
    });
  };

  /**
   * Loads level from files (uses folder conventions).
   * 
   * @param {string}
   *            levelName - name of the level without the file extension or
   *            folder.
   */
  stg.Level.prototype.readLevelFromFiles = function(levelName) {
    var game = this.game;
    game.paused = true;

    var that = this;
    console.info("Attempting to load level from files: " + levelName);
    var levelLoader = new stg.LevelLoader();
    levelLoader.loadLevel(levelName, function(levelData, levelConfig) {
      callBackAfterLevelLoaded(game, that, levelData, levelConfig);
      console.info("Loaded level: " + levelName);
      levelLoader = null; // For GC.
    });
  };

  stg.Level.prototype.initAfterLevelLoad = function(levelCellWidth, levelCellHeight) {
    if (levelCellWidth < this.game.screenCellCountX || levelCellHeight < this.game.screenCellCountY) {
      alert("Incorrect level width or height !");
      return;
    }
    var game = this.game;

    // The game world is starting on top-left and ends on bottom right.
    // 
    // x,y ---------------------> x, game.world.width
    // |
    // |
    // |
    // |
    // |
    // \/ game.world.height
    // y
    //

    // USE THE CUSTOM BOUNDS BECAUSE IT SEEMS THAT THE WORLD BOUNDS CAN CHANGE
    // OVER
    // TIME, THEY GET ENLARGED...weird...
    game.customBounds = new Phaser.Rectangle(0, 0, levelCellWidth * 16, levelCellHeight * 16);
    game.world.setBounds(game.customBounds.x, game.customBounds.y, game.customBounds.width, game.customBounds.height);
    game.camera.x = 0;

    // This seems to be the 'Phaser way' of doing it.
    // http://www.html5gamedevs.com/topic/10203-camera-follow-when-world-bounds-are-changed/
    // The only problem with this approach is that checking world bound
    // collisions will not work for a traditional shmup.
    game.camera.y = game.world.height - game.height;

    if (!game.customTint) {
      game.customTint = 0xffffff; // Neutral, daylight.
    }

    if (game.cache.checkImageKey('background-deepest')) {
      // Canvas. Maybe this is OpenGL mipmapping ?
      // this.background1 = game.add.tileSprite(0, 0, this.game.width,
      // this.game.height, 'background-deepest');
      this.background = game.add.image(0, 0, 'background-deepest');
      this.background.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
      this.background.fixedToCamera = true; // THIS BACKGROUND WILL NOT MOVE.
      if (game.customTint !== 0xffffff) {
        this.background.tint = game.customTint;
      }
    } else {
      this.background = null;
    }

    // TODO this is LEVEL SPECIFIC: move it out !
    // A TileSprite is a Sprite that has a repeating texture.
    if (game.cache.checkImageKey('background-middleLayer')) {
      this.middleLayer = game.add.tileSprite(0, 0, game.width, game.height, 'background-middleLayer');
      this.middleLayer.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
      this.middleLayer.fixedToCamera = true;
      // PIXI.blendModes = {
      // NORMAL:0,
      // ADD:1,
      // MULTIPLY:2,
      // SCREEN:3,
      // OVERLAY:4,
      // DARKEN:5,
      // LIGHTEN:6,
      // COLOR_DODGE:7,
      // COLOR_BURN:8,
      // HARD_LIGHT:9,
      // SOFT_LIGHT:10,
      // DIFFERENCE:11,
      // EXCLUSION:12,
      // HUE:13,
      // SATURATION:14,
      // COLOR:15,
      // LUMINOSITY:16
      // };
      // this.middleLayer.blendMode = PIXI.blendModes.SCREEN;
      // this.middleLayer.blendMode = PIXI.blendModes.LUMINOSITY;
      if (game.customTint !== 0xffffff) {
        // Unable to tint a tileSprite for now:
        // https://github.com/photonstorm/phaser/issues/1658
        // Do it anyways for later.
        this.middleLayer.tint = game.customTint;
      }
    } else {
      this.middleLayer = null;
    }

    this.tileGroupBelow = new Phaser.Group(game, null, 'group-tiles-below');
    this.tileGroupBelow.enableBody = false;

    this.tileGroupBelow = new Phaser.Group(game, null, 'group-tiles');
    this.tileGroupBelow.enableBody = false;

    this.tileGroupCollidable = new Phaser.Group(game, null, 'group-tiles-collidable');
    // Enable physics to the whole sprite group.
    this.tileGroupCollidable.enableBody = true;
    this.tileGroupCollidable.physicsBodyType = Phaser.Physics.ARCADE;

    this.tileByCellPos = {};

    // Top most. Top-most.
    this.tileGroupAbove = new Phaser.Group(game, null, 'group-tiles-above');
    this.tileGroupAbove.enableBody = false;

    // TODO !!! use the basic template as a best practice.
    // https://github.com/photonstorm/phaser/tree/master/resources/Project%20Templates/Basic

    // TODO player variable should be a sprite, easier to manage in Phaser...

    var playerX, playerY;
    if (this.levelData.playerLine !== null && this.levelData.playerCol !== null) {
      // This allows to place the player if the 'p' char was found in the level.
      playerX = this.levelData.playerCol * 16 + 8;
      playerY = game.world.height - this.levelData.playerLine * 16 + 8;
      this.levelLineArrayIndex = this.levelData.playerLine;
      game.camera.y = playerY - game.screenCellCountY * 0.5 * 16;
    } else {
      // Center the player horizontally.
      playerX = (game.world.width / 2.0);
      // Place the player on the bottom of the level (tradition).
      playerY = game.world.height - 32;
    }

    // Create the player.
    var playerSprite = new Phaser.Sprite(game, playerX, playerY, 'ship');
    this.player = new stg.Player(game, playerSprite);
    var player = this.player;

    // The game keeps a reference to the player so we can access it anywhere.
    this.game.player = player;

    this.collectibleGroup = new Phaser.Group(game, null, 'group-collectible');
    this.collectibleGroup.enableBody = true;
    this.collectibleGroup.physicsBodyType = Phaser.Physics.ARCADE;

    this.enemyGroup = new Phaser.Group(game, null, 'group-enemy');

    this.enemyBulletPools = [];
    this.enemyBulletPoolByName = {};

    var enemyBulletStandardTextureId = this.levelConfig.enemyBulletStandardTextureId;
    var enemyBulletPoolStandardTmp = stg.createBulletPool(game, 64, enemyBulletStandardTextureId ? enemyBulletStandardTextureId : 'bullet-orange');
    this.enemyBulletPoolByName['standard'] = enemyBulletPoolStandardTmp;
    this.enemyBulletPools.push(enemyBulletPoolStandardTmp);

    var enemyBulletSecondaryTextureId = this.levelConfig.enemyBulletSecondaryTextureId;
    var enemyBulletPoolSecondaryTmp = stg.createBulletPool(game, 64, enemyBulletSecondaryTextureId ? enemyBulletSecondaryTextureId : 'bullet-purple');
    this.enemyBulletPoolByName['secondary'] = enemyBulletPoolSecondaryTmp;
    this.enemyBulletPools.push(enemyBulletPoolSecondaryTmp);

    var enemyFactory = new stg.EnemyFactory(game, this);
    this.enemyFactory = enemyFactory;

    //
    // Layers.
    //

    // The add ORDER will determine the draw order. Ordering. z-index

    game.add.existing(this.tileGroupBelow);
    game.add.existing(this.collectibleGroup);
    game.add.existing(this.tileGroupCollidable);
    game.add.existing(this.enemyGroup);
    game.add.existing(player.sprite);

    // Player bullets.
    for (var pbp = 0; pbp < player.bulletPools.length; pbp++) {
      var pool = player.bulletPools[pbp];
      game.add.existing(pool);
    }

    // Some decorative tiles that are above other tiles (arches, ...)
    game.add.existing(this.tileGroupAbove);

    if (game.cache.checkImageKey('foreground-above')) {
      this.foreground = game.add.image(0, 0, 'foreground-above');
      this.foreground.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
      this.foreground.blendMode = PIXI.blendModes.SCREEN;
      this.foreground.fixedToCamera = true; // THIS BACKGROUND WILL NOT MOVE.
      if (game.customTint !== 0xffffff) {
        this.background.tint = game.customTint;
      }
    } else {
      this.foreground = null;
    }

    // Enemy bullets.
    for (var p = 0; p < this.enemyBulletPools.length; p++) {
      var pool = this.enemyBulletPools[p];
      game.add.existing(pool);
    }

    // ----------------------------

    var keyboard = game.input.keyboard;
    // Only need to prevent keys that are not already added to the game
    // inputs.
    var preventedKeys = [ Phaser.Keyboard.SPACEBAR, Phaser.Keyboard.SHIFT, Phaser.Keyboard.ENTER, Phaser.Keyboard.CONTROL ];
    keyboard.addKeyCapture(preventedKeys);

    console.debug('initAfterLevelLoad done.');
  };

  stg.Level.prototype.parallaxScrolling = function() {
    // if (this.middleLayer) {
    // this.middleLayer.tilePosition.y += cameraAppliedDeltaY / 3;
    // }
  };

  stg.Level.prototype.moveLevel = function() {
    var game = this.game;
    // var levelCellLength = this.levelData.linesArray.length;

    // Load some lines in advance.
    // The issue is that if you load just-in-time slow bullets or animations
    // will
    // start late and a fast player can simply pass them by staying on top of
    // the screen.
    // WARNING: changing this value changes the whole gameplay (patterns) !
    var cameraLineIndex = 5 + Math.round((game.world.height - game.camera.y) / 16);

    // Using 0 advance can be useful for debugging.
    // var cameraLineIndex = 0 + Math.round((game.world.height - game.camera.y)
    // / 16);

    if (this.levelLineArrayIndex < cameraLineIndex) {
      // Read level: Load missing lines.
      this.loadLines(this.levelLineArrayIndex, cameraLineIndex);

      // Refresh level line progress (only for debugging).
      // TODO optimize by caching last, very slow otherwise.
      // game.domElementCurrentLine.innerHTML = this.levelLineArrayIndex;
    }
  };

  /**
   * Update is called each frame. Game logic runs here.
   */
  stg.Level.prototype.update = function() {
    if (this.levelLineArrayIndex === 0) {
      var key = this.key;
      this.game.destroy();
      throw new Error('No level data found, check level: ' + key);
    }
    var game = this.game;
    var player = this.player;
    var tileGroupCollidable = this.tileGroupCollidable;
    var difficultyFactor = game.customDifficultyFactor;
    var isEasy = difficultyFactor < 1;

    if (game.time.fps !== 0 && game.time.fps !== this.lastFps) {
      this.lastFps = game.time.fps;
      // Update FPS display.
      game.domElementFps.innerHTML = this.lastFps;
    }
    var elapsedMs = game.time.physicsElapsedMS;

    if (game.customLevelSpeed === 0) {
      if (allDead(this.enemyGroup)) {
        game.customLevelSpeed = 60; // game.time.desiredFps;
      }
    } else {
      var cameraOldY = game.camera.y;

      // This converts to milliseconds.
      // When equal to 1 it will scroll 1px.
      // If lower than 1 it cannot scroll (rounded) and must accumulate.
      // If higher than 1 it can scroll.
      var cameraAddPixelsY = elapsedMs / (1000.0 / game.customLevelSpeed);
      // var cameraAddPixelsY = elapsedMs * game.customLevelSpeed / 1000;

      var scrollAmountPx = 0;
      if (cameraAddPixelsY < 1) {
        this.levelAccuSpeedInc += cameraAddPixelsY;
        if (this.levelAccuSpeedInc >= 1) {
          scrollAmountPx = this.levelAccuSpeedInc;
          this.levelAccuSpeedInc = 0;
        }
      } else {
        scrollAmountPx = cameraAddPixelsY;
      }
      if (scrollAmountPx > 0) {
        // Move the camera in the level.
        game.camera.y -= scrollAmountPx;
        var cameraAppliedDeltaY = cameraOldY - game.camera.y;

        // Auto-move the player to follow the camera.
        player.sprite.y -= Math.round(cameraAppliedDeltaY);

        if (this.parallaxScrolling) {
          this.parallaxScrolling(cameraAppliedDeltaY);
        }

      }
    }

    // Move level.
    this.moveLevel();

    //
    // Collision check. Hit detection.
    // NOTE: According to the documentation the arcade.overlap function is not
    // recursive (not going into nested groups).
    //
    customOverlapSpriteVsMatrixTiles(player.sprite, this.tileByCellPos, collPlayerVsTilesNoDeath); // collPlayerVsTilesDeath

    for (var pbp = 0; pbp < player.bulletPools.length; pbp++) {
      var pool = player.bulletPools[pbp];
      if (pool.length) {
        customOverlapGroupVsMatrixTiles(pool, this.tileByCellPos, collBulletVsTiles);
      }
    }

    var enemyBulletPools = this.enemyBulletPools;
    for (var p = 0; p < enemyBulletPools.length; p++) {
      var pool = enemyBulletPools[p];
      customOverlapGroupVsMatrixTiles(pool, this.tileByCellPos, collBulletVsTiles);
    }

    if (this.collectibleGroup.length > 0) {
      // There is a player sprite for sure...
      customOverlapSpriteVsGroup(player.sprite, this.collectibleGroup, collPlayerVsCollectibles);
    }

    if (tileGroupCollidable.length > 0) {
      // There is a player sprite for sure...
      customOverlapSpriteVsGroup(player.sprite, tileGroupCollidable, collPlayerVsTilesNoDeath); // collPlayerVsTilesDeath

      for (var pbp = 0; pbp < player.bulletPools.length; pbp++) {
        var pool = player.bulletPools[pbp];
        if (pool.length) {
          customOverlapGroupVsGroup(pool, tileGroupCollidable, collBulletVsTiles);
        }
      }

      for (var p = 0; p < enemyBulletPools.length; p++) {
        var pool = enemyBulletPools[p];
        customOverlapGroupVsGroup(pool, tileGroupCollidable, collEnemyBulletVsTiles);
      }
    } // END OF TILEGROUP LENGTH CHECK.

    for (var p = 0; p < enemyBulletPools.length; p++) {
      var pool = enemyBulletPools[p];
      customOverlapGroupVsGroup(pool, this.enemyGroup, function(enemyBullet, enemy) {
        // Bullets x Tiles ... this is slow, is there another way, do checks
        // manually only on known impassable tiles ?
        // For example add an impassable tile, also add it to some special
        // array.
        // Only do check on this array.
        // Remove it from this special array when removed later on.
        enemyBullet.kill();
      }, 'customEnemyBulletImpass');
    }

    customOverlapSpriteVsGroup(player.sprite, this.enemyGroup, function(playerSprite, enemy) {
      var mortal = player.sprite.customMortal;
      if (mortal) {
        stg.startExplosion(game, playerSprite.x, playerSprite.y, playerSprite.width, playerSprite.height);
        if (!game.sound.mute) {
          game.soundExplosion.play();
        }
        playerSprite.kill();
      }
    }, 'customPlayerImpass');

    // NOT SURE HOW OPTIMIZED THOSE SELF OVERLAP CHECKS ARE.
    // Enemy on enemy.
    customOverlapGroupVsGroup(this.enemyGroup, this.enemyGroup, collEnemyVsEnemy);

    for (var pbp = 0; pbp < player.bulletPools.length; pbp++) {
      var pool = player.bulletPools[pbp];
      if (pool.length) {
        customOverlapGroupVsMatrixTiles(pool, this.tileByCellPos, collBulletVsTiles);
      }
    }

    for (var pbp = 0; pbp < player.bulletPools.length; pbp++) {
      var pool = player.bulletPools[pbp];
      if (pool.length) {
        customOverlapGroupVsGroup(pool, this.enemyGroup, collPlayerBulletVsEnemy);
      }
    }

    // Lost quite some time figuring this out, but read the docs...
    // The two objects will be passed to this function in the same order in
    // which you specified them, unless you are checking Group vs. Sprite, in
    // which case Sprite will always be the first parameter.
    // ...so always pass sprite first to avoid confusion !!!

    var spriteVsEnemyBullet = function(playerSprite, enemyBullet) {
      if (!playerSprite.alive) {
        // YES THIS CAN HAPPEN !!!
        return;
      }
      if (!enemyBullet.alive) {
        // YES THIS CAN HAPPEN !!!
        return;
      }
      enemyBullet.kill();
      stg.startExplosion(game, enemyBullet.x, enemyBullet.y, playerSprite.width, playerSprite.height);
      if (!game.sound.mute) {
        game.soundExplosion.play();
      }
      if (playerSprite.customMortal) {
        playerSprite.kill();
      }
    };

    for (var p = 0; p < enemyBulletPools.length; p++) {
      pool = enemyBulletPools[p];
      customOverlapSpriteVsGroup(player.sprite, pool, spriteVsEnemyBullet);
    }

    // CHECK WORLD BOUNDS CUSTOM !
    // We do this custom as the concept of the Phaser world is not fitting the
    // stg/shmup genre.
    // THE WORLD BOUNDS CHANGE (enlarge) IF WE LET ANYTHING ESCAPE THEM...
    // var bounds = game.world.getBounds();
    // HERE WE USE CUSTOM BOUNDS INSTEAD, the bounds are the screen size plus
    // some offset.
    var bounds = game.customBounds;
    bounds.y = game.camera.y;

    var playerWidthDiv2 = player.sprite.width * 0.5;
    if (player.sprite.x - playerWidthDiv2 < bounds.x) {
      player.sprite.x = bounds.x + playerWidthDiv2;
    } else if (player.sprite.x + playerWidthDiv2 > bounds.x + game.width) {
      player.sprite.x = bounds.x + game.width - playerWidthDiv2;
    }

    var playerHeightDiv2 = player.sprite.height * 0.5;
    if (player.sprite.y - playerHeightDiv2 < bounds.y) {
      player.sprite.y = bounds.y + playerHeightDiv2;
    } else if (player.sprite.y + playerHeightDiv2 > bounds.y + game.height) {
      player.sprite.y = bounds.y + game.height - playerHeightDiv2;
    }

    player.update();

    // EXPERIMENTAL: we can probably let this run less often.
    if (Math.random() > 0.91) {
      // TODO could 'spread' the load by checking bounds for some groups and
      // then others.
      this.checkOutOfBounds(bounds);
    }
    // --- End of update code.
  };

  /**
   * @memberOf stg.Level
   */
  stg.Level.prototype.shutdown = function() {
    var game = this.game;
    if (game.cache.checkImageKey('background-deepest')) {
      game.cache.removeImage('background-deepest');
    }
    if (game.cache.checkImageKey('background-middleLayer')) {
      game.cache.removeImage('background-middleLayer');
    }
    if (game.cache.checkImageKey('foreground-above')) {
      game.cache.removeImage('foreground-above');
    }

    if (game.music) {
      game.music.stop();
      game.music.destroy();

      if (game.cache.checkSoundKey('theMusic')) {
        game.cache.removeSound('theMusic');
      }
      game.music = null;
    }
  };

  // THIS MAKES THE GAME STUTTER !
  stg.Level.prototype.checkOutOfBounds = function(bounds) {
    var game = this.game;
    var player = this.player;

    //
    // Handle off screen bullets (out of screen).
    //
    var minBoundXBullet = bounds.x - 32;
    var maxBoundXBullet = bounds.x + bounds.width + 32;

    var minBoundYBullet = bounds.y - 32;
    var maxBoundYBullet = bounds.y + game.height + 32;

    var killBulletIfOutOfBounds = function(alive) {
      // Check y first as this is more common (higher probability).
      if ((alive.y < minBoundYBullet) || (alive.y > maxBoundYBullet)) {
        alive.kill();
        // Can do else because of the kill.
      } else if ((alive.x < minBoundXBullet) || (alive.x > maxBoundXBullet)) {
        alive.kill();
      }
    };

    var enemyBulletPools = this.enemyBulletPools;
    for (var p = 0; p < enemyBulletPools.length; p++) {
      var pool = enemyBulletPools[p];
      if (pool.length > 0) {
        pool.forEachAlive(killBulletIfOutOfBounds);
      }
    }

    var playerBulletPools = player.bulletPools;
    for (var pbp = 0; pbp < playerBulletPools.length; pbp++) {
      var pool = playerBulletPools[pbp];
      if (pool.length > 0) {
        pool.forEachAlive(killBulletIfOutOfBounds);
      }
    }

    var maxBoundX = bounds.x + bounds.width + 64;
    var minBoundX = bounds.x - 64;

    var maxBoundY = bounds.y + game.height + 64;
    var minBoundY = bounds.y - 256;

    var destroyIfOutOfBounds = function(alive) {
      // Check y first as this is more common (higher probability).
      if ((alive.y < minBoundY) || (alive.y > maxBoundY)) {
        alive.destroy();
        // Can do else because of the destroy.
      } else if ((alive.x < minBoundX) || (alive.x > maxBoundX)) {
        alive.destroy();
      }
    };
    if (this.enemyGroup.length > 0) {
      this.enemyGroup.forEachAlive(destroyIfOutOfBounds);
    }
    if (this.collectibleGroup.length > 0) {
      this.collectibleGroup.forEachAlive(destroyIfOutOfBounds);
    }

    var tileByCellPos = this.tileByCellPos;
    var maxOutOfScreen = bounds.y + game.height + 64;
    var destroyOldTiles = function(alive) {
      if (alive.y > maxOutOfScreen) {
        // Remove the reference to the tile from the hashtable.
        // Not strictly required but it probably is a good idea to keep the
        // hashmap small and free memory.
        if (alive.width === 16 && alive.height < 21) {
          var cx = alive.x / 16;
          var cy = alive.y / 16;
          delete tileByCellPos[cx + cy * 16];
        }
        alive.destroy(); // Is this a good idea (lot of GC) ?
      }
    };
    if (this.tileGroupAbove.length > 0) {
      this.tileGroupAbove.forEachAlive(destroyOldTiles);
    }
    if (this.tileGroupBelow.length > 0) {
      this.tileGroupBelow.forEachAlive(destroyOldTiles);
    }
    if (this.tileGroupCollidable.length > 0) {
      this.tileGroupCollidable.forEachAlive(destroyOldTiles);
    }
  };

  /**
   * @memberOf stg.Level
   */
  stg.Level.prototype.addCollectibleCoin = function(x, y) {
    this.addCollectible(x, y, "coin", 25);
  };

  /**
   * @memberOf stg.Level
   */
  stg.Level.prototype.addCollectibleCoinBig = function(x, y) {
    this.addCollectible(x, y, "coin-big", 100);
  };

  /**
   * @memberOf stg.Level
   */
  stg.Level.prototype.addCollectibleAnkh = function(x, y) {
    this.addCollectible(x, y, "ankh", 500);
  };

  /**
   * Adds collectible to the collectible group.
   * 
   * @param {number}
   *            x
   * @param {number}
   *            y
   * @param {string}
   *            atlasKey
   * @param {number}
   *            bonusPoints
   * @returns {Phaser.Sprite} the sprite, so you may modify it...
   */
  stg.Level.prototype.addCollectible = function(x, y, atlasKey, bonusPoints) {
    var game = this.game;
    var collectible = new Phaser.Sprite(game, x, y, "atlas-collectibles", atlasKey);
    if (game.customTint !== 0xffffff) {
      collectible.tint = game.customTint;
    }
    // Add collectibe.
    this.collectibleGroup.addAt(collectible, 0, true); // addAt, silent = true

    // The collectible only has a body after the group add.
    collectible.anchor.setTo(0.5, 0.5);
    collectible.allowRotation = false;
    collectible.checkWorldBounds = false;
    collectible.outOfBoundsKill = false;

    var body = collectible.body;
    body.allowGravity = false;
    body.allowRotation = false;
    body.immovable = true;

    body.customSeparateX = true;
    body.customSeparateY = true;

    // TODO add big collectible.
    collectible.customScoreBonus = bonusPoints;
    return collectible;
  };

  /**
   * Loads the given lines into the current game.
   */
  stg.Level.prototype.loadLines = function(lowerLine, upperLine) {
    if (!(lowerLine >= 0 && upperLine >= lowerLine)) {
      var msg = "loadLines: must be defined and upperLine must be <= upperLine " + lowerLine + " - " + upperLine;
      alert(msg);
      throw new Error(msg);
    }
    var game = this.game;
    var player = this.player;

    var textureByChar = this.textureByChar;
    var enemyByChar = this.enemyByChar;

    var levelData = this.levelData;
    // var levelConfig = this.levelConfig;

    var tileGroupBelow = this.tileGroupBelow;
    var tileGroupCollidable = this.tileGroupCollidable;
    var tileGroupAbove = this.tileGroupAbove;
    var tileByCellPos = this.tileByCellPos;

    // var level.levelLineArrayIndex = 0;
    var levelAnnotationsByLine = levelData.annotationsByLine;
    var levelLinesArray = levelData.linesArray;
    var maxUpperLine = Math.min(upperLine, levelLinesArray.length);
    for (var lineIndex = lowerLine; lineIndex < maxUpperLine; lineIndex++) {
      var lineArray = levelLinesArray[lineIndex];
      var lineAnnotation = levelAnnotationsByLine[lineIndex];
      if (lineAnnotation && lineAnnotation.levelSpeed >= 0) {
        game.customLevelSpeed = lineAnnotation.levelSpeed;
      }

      for (var columnIndex = lineArray.length - 1; columnIndex >= 0; columnIndex--) {
        var column = lineArray[columnIndex];
        var character = column.character;
        if (character === "-" || character === '.') {
          continue; // Skip empty cell.
        }
        var collX, collY;
        if (character === '$') {
          collX = columnIndex * 16 + Math.round(Math.random() * 8) - 4;
          collY = game.world.height - lineIndex * 16 + Math.round(Math.random() * 8) - 4;
          this.addCollectibleCoin(collX + 8, collY + 8);
        } else if (character === '€') {
          collX = columnIndex * 16;
          collY = game.world.height - lineIndex * 16;
          this.addCollectibleCoinBig(collX + 8, collY + 8);
        } else if (character === '£') {
          collX = columnIndex * 16;
          collY = game.world.height - lineIndex * 16;
          this.addCollectibleAnkh(collX + 8, collY + 8);
        }
        if (character === character.toLowerCase()) {
          var entry = textureByChar[character];
          if (entry) {
            // Set the character on the entry: this will allow a reverse lookup
            // for general properties shared amongst instances of this char.
            entry.character = character;

            var hasAnimation = entry.framePrefix;

            var tile;
            if (entry.impass || entry.rotate) {
              // Must be a Sprite as they have a physical body for collision.
              if (hasAnimation) {
                tile = new Phaser.Sprite(game, columnIndex * 16, game.world.height - lineIndex * 16, this.tileAtlasKey);
              } else {
                tile = new Phaser.Sprite(game, columnIndex * 16, game.world.height - lineIndex * 16, this.tileAtlasKey, entry.filename);
              }
            } else {
              // Only decorative use light-weight Image instead of Sprite.
              if (hasAnimation) {
                tile = new Phaser.Image(game, columnIndex * 16, game.world.height - lineIndex * 16, this.tileAtlasKey);
              } else {
                tile = new Phaser.Image(game, columnIndex * 16, game.world.height - lineIndex * 16, this.tileAtlasKey, entry.filename);
              }
            }

            if (entry.framePrefix && entry.frameCount && entry.frameFPS) {
              // Animated tile (example: waterfall).
              var frameNames = Phaser.Animation.generateFrameNames(entry.framePrefix, 1, entry.frameCount, '', 3);
              tile.animations.add(entry.framePrefix, frameNames, entry.frameFPS, true);
              tile.animations.play(entry.framePrefix);
            }

            if (entry.rotateFps) {
              // Example: windmill
              tile.x += 8;
              tile.anchor.setTo(0.5, 0.5);
              tile.allowRotation = true;
              var rotateFps = entry.rotateFps;
              tile.update = function() {
                var angleIncrement = Math.round((rotateFps / 1000) * game.time.physicsElapsedMS);
                if (angleIncrement !== 0) {
                  this.angle += angleIncrement;
                }
              };
            }

            // When not found Phaser will take the whole picture, check if width
            // is not abnormal.
            if (tile.width > 500) {
              alert("Could not find entry '" + entry.filename + "' in " + this.tileAtlasKey);
              return;
            }

            // if (sprite.width === 16 && sprite.height === 16) {
            // TODO Use a 2d array ?
            // }

            if (game.customTint !== 0xffffff) {
              tile.tint = game.customTint;
            }
            tile.checkWorldBounds = false;
            tile.outOfBoundsKill = false;

            // Add a tile. Add tile. Add new tile. Insert tile. Create tile.
            if (entry.layer === 'top') {
              // Those will not be checked for collision and are purely
              // decorative and displayed above the player (rock arch, bridge,
              // branches...).
              // Use those sparingly...
              tileGroupAbove.addAt(tile, 0, true); // addAt, silent = true
            } else {
              if (entry.impass) {
                // OPTIMIZATION: use hashmap if tile is close to grid dimensions
                // to 16x16.
                // 16, obvious... < 21 because sometimes we add some pixels for
                // decoration.
                if (tile.width > 15 && tile.width < 18 && tile.height <= 20) {
                  // Not decorative but also not in the 'free-size' collidable
                  // group.
                  tileGroupBelow.addAt(tile, 0, true); // addAt, silent = true

                  // This group has no arcade physics so add it manually for
                  // this tile.
                  game.physics.enable(tile, Phaser.Physics.ARCADE);

                  // Old school tile map for performance.
                  // Cells: 15 x 20 or more, so max 15 for x, but unknown for y.
                  // So we use 15 + 1 = 16 to make sure x cannot 'reach' it.
                  var cx = tile.x / 16;
                  var cy = tile.y / 16;
                  tileByCellPos[cx + cy * 16] = tile;

                  if (entry.hp && entry.hp > 0) {
                    tile.health = entry.hp;
                  }
                } else {
                  // These are impassable and will collide.
                  // This is the 'any-size' category, gives more freedom but
                  // costly collision checks.
                  tileGroupCollidable.addAt(tile, 0, true); // addAt, silent =
                  // true
                }

                // The tile only has a body after the group add.
                tile.body.allowGravity = false;
                tile.body.allowRotation = entry.rotateFps;
                tile.body.immovable = true;

                tile.body.customSeparateX = true;
                tile.body.customSeparateY = true;
              } else {
                // Those will not be checked for collision and are purely
                // decorative and displayed below the player (terrain artifacts,
                // ...)
                tileGroupBelow.addAt(tile, 0, true); // addAt, silent = true
              }
            }
          }
        } else if (character === character.toUpperCase()) {
          var enemyInfo = enemyByChar[character];
          if (enemyInfo) {
            var x = columnIndex * 16;
            var y = game.world.height - lineIndex * 16;
            var randomness, minDifficultyFactor;
            if (lineAnnotation) {
              if (lineAnnotation.randomEnemy) {
                randomness = lineAnnotation.randomEnemy >= 0 ? lineAnnotation.randomEnemy : 0;
              } else {
                randomness = null;
              }
              if (lineAnnotation.difficultyLevel) {
                var difficultyLevel = lineAnnotation.difficultyLevel;
                if (difficultyLevel === "easy") {
                  minDifficultyFactor = 0.7;
                } else if (difficultyLevel === "medium") {
                  minDifficultyFactor = 1;
                } else if (difficultyLevel === "hard") {
                  minDifficultyFactor = 1.1;
                } else {
                  alert("Unknown difficulty level '" + difficultyLevel + "'. At line " + lineIndex);
                  minDifficultyFactor = null;
                }
              } else {
                minDifficultyFactor = null;
              }
              if (lineAnnotation.trigger) {
                if (this[lineAnnotation.trigger]) {
                  this[lineAnnotation.trigger](x, y);
                } else {
                  throw new Error("Expecting trigger function '" + lineAnnotation.trigger + "' on level.");
                }
              }
            } else {
              randomness = null;
              minDifficultyFactor = null;
            }

            var enemyParts = this.enemyFactory.buildEnemy(this.parentLevel, enemyInfo, x, y, randomness, minDifficultyFactor, this);
            if (enemyParts !== null) {
              for (var part = 0; part < enemyParts.length; part++) {
                var enemyPart = enemyParts[part];
                this.enemyGroup.add(enemyPart);
              }
            }

          }
        }
      }
    }
    // Update current progress of the line loader.
    this.levelLineArrayIndex = maxUpperLine;
  };

  function customOverlapSpriteVsMatrixTiles(sprite, tileByCellPos, action) {
    if (sprite.alive) {
      var spriteBody = sprite.body;
      var spriteBodyCenterX = spriteBody.center.x;
      var spriteBodyCenterY = spriteBody.center.y;

      var cx = Math.floor(spriteBodyCenterX / 16);
      var cy = Math.floor(spriteBodyCenterY / 16);

      // TODO Could also try an array of 15 hashmaps ...
      // Cells: 15 x 20 or more, so max 15 for x, but unknown for y.
      // So we use 15 + 1 = 16 to make sure x cannot 'reach' it.
      var tile = tileByCellPos[cx + cy * 16];

      // If the sprite is in the same cell as the tile, collide !
      // NOTE: this assumes the sprite hitbox is 16px or less.
      if (tile && tile.alive) {
        action(sprite, tile);
      }
    }
  }

  /**
   * This has a complexity of O(n)
   */
  function customOverlapGroupVsMatrixTiles(group, tileByCellPos, action) {
    var groupChildren = group.children;
    var grouplen = groupChildren.length, g, i;
    // PERFORMANCE: make sure the hashmap has content before looping, this is
    // good for empty spaces (when there are no tiles).
    // NOTE: Object.keys requires ES5.
    if (grouplen > 0 && Object.keys(tileByCellPos).length > 0) {
      for (i = 0; i < grouplen; i += 1) {
        g = groupChildren[i];
        if (g.alive) {
          // NODE: we expect a body at this point.
          var spriteBody = g.body;
          var spriteBodyCenterX = spriteBody.center.x;
          var spriteBodyCenterY = spriteBody.center.y;

          var cx = Math.floor(spriteBodyCenterX / 16);
          var cy = Math.floor(spriteBodyCenterY / 16);

          // TODO Could also try an array of 15 hashmaps ...
          // Cells: 15 x 20 or more, so max 15 for x, but unknown for y.
          // So we use 15 + 1 = 16 to make sure x cannot 'reach' it.
          var tile = tileByCellPos[cx + cy * 16];

          // If the sprite is in the same cell as the tile, collide !
          // NOTE: this assumes the sprite hitbox is 16px or less.
          if (tile && tile.alive) {
            action(g, tile);
          }
        }
      }
    }
  }

  // TODO make it larger ?
  var collisionCheckThreshold = 96;

  // TODO maybe sort vertically if more than some amount present.
  function customOverlapSpriteVsGroup(sprite, group2, action, g2KeyToCheckOptional) {
    var group2len, g2, g2Body, i, spriteBody, spriteBodyCenterX, spriteBodyCenterY;
    if (sprite.alive) {
      var g2Children = group2.children;
      group2len = g2Children.length;
      if (group2len > 0) {
        spriteBody = sprite.body;
        spriteBodyCenterX = spriteBody.center.x;
        spriteBodyCenterY = spriteBody.center.y;
        // if (!spriteBody.width || !spriteBody.height) {
        // return;
        // }

        var mathAbs = Math.abs;
        for (i = 0; i < group2len; i += 1) {
          g2 = g2Children[i];
          if (g2.alive && (!g2KeyToCheckOptional || g2[g2KeyToCheckOptional])) {
            g2Body = g2.body;
            if (mathAbs(g2Body.center.y - spriteBodyCenterY) < collisionCheckThreshold && mathAbs(g2Body.center.x - spriteBodyCenterX) < collisionCheckThreshold) {
              if (!(spriteBody.right - 1 < g2Body.x || spriteBody.bottom - 1 < g2Body.y || spriteBody.x > g2Body.right - 1 || spriteBody.y > g2Body.bottom - 1)) {
                // There is a bug with this function, -1 is missing.
                // if (Phaser.Rectangle.intersects(spriteBody, g2.body)) {
                action(sprite, g2);
                if (!sprite.alive) {
                  break;
                }
              }
            }
          }
        }

      }
    }
  }

  // TODO maybe sort vertically if more than some amount present.
  function customOverlapGroupVsGroup(group1, group2, action, g2KeyToCheckOptional) {
    var group2len, g2, g2Body, i, group1len, g1, g1Body, j;
    var g1Children = group1.children;
    group1len = g1Children.length;
    if (group1len > 0) {
      var g2Children = group2.children;
      group2len = g2Children.length;
      if (group2len > 0) {

        var mathAbs = Math.abs;
        // const mathAbs = Math.abs;
        for (i = 0; i < group2len; i += 1) {
          g2 = g2Children[i];
          if (g2 && g2 !== g1 && g2.alive && (!g2KeyToCheckOptional || g2[g2KeyToCheckOptional])) {
            g2Body = g2.body;
            if (g2Body.width > 0 && g2Body.height > 0) {

              var g2BodyCenterY = g2Body.center.y;
              for (j = 0; j < group1len; j += 1) {
                g1 = g1Children[j];
                var g1Body = g1.body;
                if (g1.alive && mathAbs(g1Body.center.y - g2BodyCenterY) < collisionCheckThreshold) {
                  if (mathAbs(g1Body.center.x - g2Body.center.x) < collisionCheckThreshold) {
                    if (!(g1Body.right - 1 < g2Body.x || g1Body.bottom - 1 < g2Body.y || g1Body.x > g2Body.right - 1 || g1Body.y > g2Body.bottom - 1)) {
                      // There is a bug with this function, -1 is missing.
                      // if (Phaser.Rectangle.intersects(g1Body, g2Body)) {
                      action(g1, g2);
                      if (!g2.alive) {
                        break; // In case it got killed in the action.
                      }
                    }
                  }
                }
              }

            }
          }
        }

      }
    }
  }

  /**
   * @private
   * @memberOf stg.Level
   */
  function collPlayerVsTilesNoDeath(playerSprite, tile) {
    playerSprite.x = playerSprite.xPast;
    playerSprite.y = playerSprite.yPast;
    return;
  }

  /**
   * @private
   * @memberOf stg.Level
   */
  function collPlayerVsTilesDeath(playerSprite, tile) {
    var game = playerSprite.game;
    stg.startExplosion(game, playerSprite.x, playerSprite.y, playerSprite.width, playerSprite.height);
    if (!game.sound.mute) {
      game.soundExplosion.play();
    }
    if (playerSprite.customMortal) {
      playerSprite.kill();
    }
  }

  /**
   * @private
   * @memberOf stg.Level
   */
  function collPlayerVsCollectibles(playerSprite, collectible) {
    // Get collectible. Hit collectible. Gets collectible. Hits collectible.
    // Pickup Coin.
    var game = playerSprite.game;
    if (collectible.alive) {
      var bodyCenterX = collectible.body.center.x;
      var bodyCenterY = collectible.body.center.y;
      stg.startSpark(game, (bodyCenterX + playerSprite.x) / 2, bodyCenterY);

      var effectExplosionRadius = game.add.image(bodyCenterX, bodyCenterY, 'img-explosion-combo-spritesheet');
      effectExplosionRadius.anchor.setTo(0.5, 0.5);
      effectExplosionRadius.animations.add('animation-on');
      effectExplosionRadius.animations.play('animation-on', 20, false, true); // FPS.

      if (!game.sound.mute) {
        if (game.soundCoin.isPlaying) {
          game.soundCoin.stop();
        }
        game.soundCoin.play();
      }

      // Increment score.
      game.player.incrementScore(collectible.customScoreBonus);

      collectible.kill();
    }
  }

  /**
   * @private
   * @memberOf stg.Level
   */
  function collBulletVsTiles(bullet, tile) {
    var game = bullet.game;
    // Some tiles have health and can be destroyed.
    if (tile.health > 0 && bullet.strengthHp > 0) {
      tile.health = Math.max(0, tile.health - bullet.strengthHp);
      if (tile.health <= 0) {
        tile.destroy();
        stg.startExplosionSmall(game, bullet.x, bullet.y);
      }
      // bullet.strengthHp -= diff;
      if (!game.sound.mute) {
        game.soundExplosionShort.play();
      }
    }
    bullet.kill();
    stg.startSpark(game, bullet.x, bullet.y);
  }

  /**
   * @private
   * @memberOf stg.Level
   */
  function collEnemyBulletVsTiles(enemyBullet, tile) {
    // Bullets x Tiles ... this is slow, is there another way, do checks
    // manually only on known impassable tiles ?
    // For example add an impassable tile, also add it to some special
    // array.
    // Only do check on this array.
    // Remove it from this special array when removed later on.
    enemyBullet.kill();
    stg.startExplosionSmall(tile.game, enemyBullet.x, enemyBullet.y);
  }

  /**
   * @private
   * @memberOf stg.Level
   */
  function collEnemyVsEnemy(enemy1, enemy2) {
    if (!enemy1.alive) {
      // YES THIS CAN HAPPEN !!!
      return;
    }
    if (!enemy2.alive) {
      // YES THIS CAN HAPPEN !!!
      return;
    }
    var game = enemy1.game;
    if (enemy1.customEnemyImpass) {
      if (enemy1 === enemy2) {
        // Do this check inside of the impass one as it occurs less often.
        return; // Avoid bizarre case of self-collision.
      }
      stg.startExplosion(game, enemy2.x, enemy2.y, enemy2.width, enemy2.height);
      if (!game.sound.mute) {
        game.soundExplosion.play();
      }
      enemy2.kill();
    }
    if (enemy2.customEnemyImpass) {
      if (enemy1 === enemy2) {
        // Do this check inside of the impass one as it occurs less often.
        return; // Avoid bizarre case of self-collision.
      }
      stg.startExplosion(game, enemy1.x, enemy1.y, enemy1.width, enemy1.height);
      if (!game.sound.mute) {
        game.soundExplosion.play();
      }
      enemy1.kill();
    }
  }

  /**
   * @private
   * @memberOf stg.Level
   */
  function collPlayerBulletVsEnemy(playerBullet, enemy) {
    if (!enemy.alive) {
      // YES THIS CAN HAPPEN !!!
      return;
    }
    if (!playerBullet.alive) {
      // YES THIS CAN HAPPEN !!!
      return;
    }

    var game = enemy.game;
    var player = game.player;

    // Update hitpoints.
    var scoreIncrement = 0;

    if (enemy.health >= 0) {
      // The enemy still has health.
      if (enemy.health < 11) {
        // Close to critical hit.
        stg.startExplosionSmall(game, playerBullet.x, playerBullet.y - 8);
      }
      if (enemy.customDoWhenHit) {
        enemy.customDoWhenHit(playerBullet);
      }

      if (playerBullet.passThrough && Math.random() < playerBullet.passThrough) {
        return; // Pass through (high-energy particles).
      }

      var healthMalus = playerBullet.strengthHp;
      var effectiveMalus = enemy.health - healthMalus < 0 ? enemy.health : healthMalus;

      scoreIncrement = effectiveMalus;

      enemy.health -= effectiveMalus;

      playerBullet.strengthHp -= healthMalus;
      if (playerBullet.strengthHp <= 0) {
        playerBullet.kill();
      }

      stg.startSpark(game, playerBullet.x, playerBullet.y - 4);
      // TODO there should be a way to customize only this.
      // TODO this also depends on the bullet type ?
      // (if ... then ... else default
      if (!game.sound.mute) {
        game.soundExplosionShort.play();
      }
    }

    // IN ADDITION TO THE STANDARD HIT.
    if (enemy.health <= 0) { // The enemy got no more health (death).
      var enemyName = enemy.customName;
      if (enemyName === player.customChainLast) {
        if (player.customChainCount < 2) {
          // No chain combo yet.
          player.setChainCount(player.customChainCount + 1);
        } else {
          // Chain combo unlocked !
          var msDiff = game.time.totalElapsedSeconds() * 1000 - player.customChainTimeMs;
          var timeBonusFactor = Math.max(1, Math.round(2000 / msDiff));

          scoreIncrement += enemy.customHealthOriginal * player.customChainCount * timeBonusFactor;

          player.setChainCount(0); // Reset chain.

          var effectExplosionRadius = game.add.image(enemy.x, enemy.y, 'img-explosion-combo-spritesheet');
          effectExplosionRadius.anchor.setTo(0.5, 0.5);
          effectExplosionRadius.animations.add('animation-on'); // FPS.
          effectExplosionRadius.animations.play('animation-on', 10, false, true);

          if (!game.sound.mute) {
            game.soundCombo.play();
          }
        }
      } else {
        // Cancel chain.
        player.customChainLast = enemyName;
        player.customChainTimeMs = game.time.totalElapsedSeconds() * 1000;
        player.setChainCount(1);
      }

      scoreIncrement += enemy.customScoreBonus;

      if (!game.sound.mute) {
        // TODO could depend on enemy.
        game.soundExplosion.play();
      }
      if (enemy.customDoWhenDestroyed) {
        enemy.customDoWhenDestroyed(playerBullet);
      }
      enemy.destroy();

      // TODO could depend on enemy or bullet.
      stg.startExplosion(game, enemy.x, enemy.y, enemy.width, enemy.height);
    }

    // Increment the score and update display.
    player.incrementScore(scoreIncrement);
  }

  /**
   * @private
   * @memberOf stg.Level
   */
  function allDead(group) {
    var gChildren = group.children;
    var len = gChildren.length;
    var allDead = true;
    if (len) {
      var i, child;
      for (i = 0; i < len; i += 1) {
        child = gChildren[i];
        if (child.alive) {
          allDead = false;
          break;
        }
      }
    }
    return allDead;
  }

}(window.stg = window.stg || {}));
