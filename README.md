hid-mapper
==========

CLI for mapping HID button presses to their pins/values.


## Install

`npm install hid-mapper -g`


## Usage

`hid-mapper --product 111 --vendor 222`

This will open up a CLI, waiting for a button to be pressed on the specified device. If you don't specify a product or a vendor, a list of available devices will be displayed.


### Buttons

After a button is pressed, the CLI will present a prompt to name that button:

```
[?] Enter an identifier for pin change 5/47: a
Added {"pin":5,"value":47,"name":"a"}
```


### Saving

Press `^C` to quit the program and you will be prompted with a filename to save the device mapping.

```
[?] Enter a filename to save this file (blank to skip): test.json
File saved to ./saved/test.json
```


## What do I use this for?

I had a few USB controllers laying around the house and I wanted to create mappings so they could be used with [node-gamepad](https://www.npmjs.org/package/node-gamepad). This CLI made it really easy to create and save the necessary configuration values for all my controllers.


## Playground

After you save a file you can test and make sure that it works with [node-gamepad](https://www.npmjs.org/package/node-gamepad) by running `node playground.js filename.json`.

This will bring up a repl where you can press buttons and see which press/release events are logged.


### Todo

- Allow saving of joystick values
- Allow for prompts to ask for the button name first
- Predefined prompt templates (like `snes` or `n64`)


### License

MIT