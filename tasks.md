We're going to create several new agent specialist templates. The purpose of the two figma agent templates is to create
an
ecosystem that can be used to accurately extract the information from a figma file to recreate the screens in code and
also to make sure that components in the design system align. The information will get passed to other agent specialist templates.

# Figma API

https://developers.figma.com/docs/rest-api/

# Figma Plugin

https://developers.figma.com/docs/plugins/
https://developers.figma.com/docs/plugins/api/api-reference/

# Zephyr ShadCN Design System

Skills: React, Tailwind 4.1, ShadCN 3, Tanstack Start, PNPM.

# Desired Workflow

I have a figma file with my design system / library.
I can launch the zephyr plugin, select a node, frame, or page, and one of the following

- extract as image. This uses the figma export capabilities to export as png, svg, and jpeg for visual verification and
  regression testing
- generate as code. This takes the node graph and state of every sub node (including all attributes) and exports it as a
  json object that can be used to generate the code. This will be picked up by another process that has the semantic
  mappings to our code component library. The json object should also contain version and edit date information to make sure that if things change (the component getting updated) that we can know if we need to change something.

# Tasks
1) Create a new directory called third_pass, have a package.json and pnpm workspace configured for the third_pass folder
2) Create the figma plugin named Zephyr Figma
3) Create the validation pipeline using what we've done in this repo as a whole
4) Create a new ui demo app using our preferred stack, tanstack start, tailwind 4, use the "new-result-testing" as a reference
