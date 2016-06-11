# stg-game-engine

## Keywords

HTML5 browser STG engine and editor, shmup, javascript, mythical wings, text based levels.

## Intro

The goal was:

* to have a simple way to create a vertical shmup using text based levels on any platform
* offline play support, nearly no special setup required !
* learn some HTML5 and JavaScript along the way

The engine is not fully done, but has a lot of interesting features

## Canvas vs WebGL

Uses either canvas or webgl, I recommend canvas for pixel based games.
Also note that some browsers still have poor webgl support.

## Forum discussions

Discuss on forum: http://shmups.system11.org/viewtopic.php?f=9&t=56179&p=1159267

## Running it

It DOES NOT require a server to run locally
Just open the `index.html` in order to run it will usually not be enough due to browser security restrictions.

### Chrome

`google-chrome --allow-file-access-from-files`

### Firefox

    Type `about:config` in the browser url bar
    Find `security.fileuri.strict_origin_policy` parameter
    Set it to `false`

## Using a gamepad or joystick

The gamepads work in Chrome 21 or higher.

As of Firefox 24, the Gamepad API is available behind a preference. You can enable it by loading about:config and setting the dom.gamepad.enabled preference to true.

Unix: The `dmesg` command (gives you info about the connected devices, for example the device identifier)

Unix: `sudo xboxdrv --silent --device-by-id 044f:b326 --type xbox360 --trigger-as-zaxis`

## Level editor

The first 'p' character found from top to bottom will be used.
Place 'p' character anywhere you want to start/test, but...
If you want to test a section make sure you place the 'p' character one screen before the section in order
to simulate the proper loading of this section, because otherwise the enemy behavior will be different as
everything gets loaded at once on the start screen.

Example:
Instead of these bullets (not synchronized because progressively loaded line by line):
x
 x
  x
You may get (synchronized because all enemies loaded a once):
x
x
x
To fix let the player start somewhere before the section you want to test.
