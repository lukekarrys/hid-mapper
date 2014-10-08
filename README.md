hid-mapper
==========

[![NPM](https://nodei.co/npm/hid-mapper.png)](https://nodei.co/npm/hid-mapper/)

CLI for mapping HID button presses to their pins/values.


## Install

`npm install hid-mapper -g`


## Usage

`hid-mapper --vendor 121 --product 17`

This will open up a CLI, waiting for a button to be pressed on the specified device. If you don't specify a product or a vendor, a list of available devices will be displayed.


### `--buttons` / `--joysticks`

You may specify a list of buttons and/or joysticks that you want to press and the CLI will prompt for each one. One you have been prompted for all the buttons/joysticks you will be prompted to save the file.

```sh
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

```sh
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

#### `--platform`

There are also special predefined platforms that you can pass to the `--platform` option. Right now only `snes` and `n64` are supported. These are just a shortcut to the actual list of buttons and joysticks on each of those controllers.


### Other Options

#### `--ignore` (default: none)
Some hid devices (especially those with joysticks) will have some pins that toggle values very quickly, even if no buttons or joysticks are being touched. `hid-mapper` does its best to try and determine those pins/values during calibration, and then ignore those changes. However, this method isn't foolproof, so there might be times where prompts for buttons/joysticks are happening automatically. If this is the case, you can pass those to the `--ignore` option manually. Some examples:

```sh
# Ignore all changes on pin 2
hid-mapper --vendor 121 --product 17 --ignore 2

# Ignore all changes on pin 3 and when pin 2 changes its value to 128
hid-mapper --vendor 121 --product 17 --ignore 2/128,3
```

#### `--sensitivity` (default: 2)

To go along with the above `ignore` option, there is a sensitivity option. This can be used to ignore a range of values. It works so if `2/128` is being ignored, it will actually ignore all changes on pin `2` for the values `126-130` (inclusive).


#### `--loglevel` (default: 0)

Set `--loglevel` to `1` or `2` to see the events from the device logged to the console (along with the calibration information). `1` will log the `change` and `joystick` events determined by `hid-mapper`. `2` will log all data events from `node-hid` (which run about every 7-10ms).


#### `--playground` (default: false)

When `--playground` mode is on, nothing will be prompted at all. This works best with the above `--loglevel` option, since you can see all the data being emitted in case something isn't working right or you just want to examine the raw data.



### Saving

Press `^C` to quit the program and you will be prompted with a filename to save the device mapping.

```sh
[?] Enter a filename to save this file (blank to skip): filename.json
File saved to filename.json
```


## What do I use this for?

I had a few USB controllers laying around the house and I wanted to create mappings so they could be used with [node-gamepad](https://www.npmjs.org/package/node-gamepad). This CLI made it really easy to create and save the necessary configuration values for all my controllers.


## Testing a saved file

After you save a file you can test and make sure that it works with [node-gamepad](https://www.npmjs.org/package/node-gamepad) by running `hid-mapper --test filename.json`.

This will bring up a repl where you can press buttons and see which press/release events are logged.


### License

MIT