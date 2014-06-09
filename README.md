hid-mapper
==========

CLI for mapping HID button presses to their pins/values.


## Install

`npm install hid-mapper -g`


## Usage

`hid-mapper --vendor 121 --product 17`

This will open up a CLI, waiting for a button to be pressed on the specified device. If you don't specify a product or a vendor, a list of available devices will be displayed.


### Buttons / Joysticks

You may specify a list of buttons and/or joysticks that you want to press and the CLI will prompt for each one. One you have been prompted for all the buttons/joysticks you will be prompted to save the file.

```
$ hid-mapper --vendor 121 --product 17 --buttons a,b --joysticks center

Press the a button:
Added {"pin":5,"value":47,"name":"a"}

Press the b button:
Added {"pin":5,"value":79,"name":"b"}

Move the center joystick in the x direction:
Added {"name":"center","x":{"pin":0}}

Move the center joystick in the y direction:
Added {"name":"center","x":{"pin":0},"y":{"pin":1}}

[?] Enter a filename to save this file (blank to skip):
```

If you don't specify any buttons or joysticks, the CLI will wait for any buttons to be pressed. After a button is pressed or a joystick is moved, the CLI will present a prompt to name that button/joystick. To specify it as a joystick, use the format `joystick_name.[x|y]`.

**Note: this method is not as reliable as the method above, especially when it comes to joystick events.**

```
$ hid-mapper --vendor 121 --product 17

Press any button on your controller
^C to quit with an option to save

[?] Enter an identifier for pin change 0/32: center.x
{"name":"center","x":{"pin":0}}

[?] Enter an identifier for pin change 1/80: center.y
{"name":"center","x":{"pin":0},"y":{"pin":1}}

[?] Enter an identifier for pin change 6/4: a
{"pin":6,"value":4,"name":"a"}
```


#### Predefined Platforms

There are also special predefined platforms that you can pass to the `--platform` option. Right now only `snes` and `n64` are supported. These are just a shortcut to the actual list of buttons and joysticks on each of those controllers.


### Saving

Press `^C` to quit the program and you will be prompted with a filename to save the device mapping.

```
[?] Enter a filename to save this file (blank to skip): filename.json
File saved to filename.json
```


## What do I use this for?

I had a few USB controllers laying around the house and I wanted to create mappings so they could be used with [node-gamepad](https://www.npmjs.org/package/node-gamepad). This CLI made it really easy to create and save the necessary configuration values for all my controllers.


## Playground

After you save a file you can test and make sure that it works with [node-gamepad](https://www.npmjs.org/package/node-gamepad) by running `hid-mapper --test filename.json`.

This will bring up a repl where you can press buttons and see which press/release events are logged.


### License

MIT