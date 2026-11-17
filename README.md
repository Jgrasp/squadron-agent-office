# Agent Office

A [Squadron](https://github.com/Jgrasp/squadron) extension that shows your agents at work in an isometric office, live.

## Use

Next to an agent, click **Agent Office** in its tools. The office opens in a floating window of its own, which you can move and resize and which keeps its size and place; clicking the button again brings it back to the front. It builds the office from your projects:

- each project that had an agent over the last 7 days gets an office in its color, its name on a plate above the door. Its size follows the number of agents of the week: a booth for one, up to an open space from 20. Archived projects and projects without agents this week have none;
- each group of projects fills one block of the building, sub-groups included. Small projects sometimes share an office;
- agents that work, wait for you or are in error sit at their desk; the latest done ones rest on the sofas or in the lounges. When there are more agents than places, the others are not drawn: click the floor of an office to count them;
- an agent started by another one gets a visit from it, an agent that sends a message to another walks over with a letter, and an archived agent walks out through the reception;
- the status wall in the lounge shows Claude's 5-hour session and week, their reset time and whether Claude's API answers. A limit reached dims the lights, an outage puts every room in alert.

Click an agent to see its state and the tool it runs; **Open agent** shows it in Squadron. Drag to move, scroll to zoom, double-click a room to go to it. **New layout** draws another plan; the ★ menu keeps a layout you like and opens with it next time.

Squadron hands the extension no conversation, prompt, tool input, folder or secret: an agent Squadron has not named yet shows as **New agent**.

## What it asks Squadron for

- `agents: activity`: the names and states of your agents, archived ones included, the name of the tool each one runs and which agent started it, to seat them and move them in the office;
- `agents: show`: **Open agent** brings the agent you clicked to the front, only right after your click in the panel;
- `projects: read`: the names, colors and groups of your projects and how many agents worked in them this week, to lay out the offices;
- `usage: read`: how much of Claude's session and weekly limits you used and whether Claude's API answers, for the status wall.

It runs no program and reaches no network. Its layouts, the camera and the selection stay in its own storage in Squadron.

Needs Squadron 0.51.0 or later, the first release with extension API 1.7. Until it ships, `extension.json` accepts the 0.50.0 development builds of the API 1.7 branch; set `"squadron": ">=0.51.0"` before publishing.

## Build

```sh
rustup target add wasm32-wasip2
cargo build --release --target wasm32-wasip2
```

Then add this folder in Settings › Extensions › Add an extension › A folder on this computer.

## Credits

[PixiJS](https://pixijs.com) 8.23 (MIT, `panel/vendor/PIXI-LICENSE`) draws the office. DM Sans and DM Mono (SIL Open Font License, `panel/fonts/`) are bundled for the panel.
