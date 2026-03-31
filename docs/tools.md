# Development Tools

## Scaffolding a New Landing Feature

I have provided a script in the root of the project called `scaffold.sh` that will allow you to scaffold a landing feature in an already existing area.

It's also available as an NPM script called `scaffold`.

### Steps

1. Make sure the Area already exists (e.g. `/src/app/areas/food`)
2. Run the `scaffold.sh` command (either from the command line in the root of the project, or doing `npm run scaffold`).
3. Select the area (e.g. `food`)
4. Give your landing feature a name, like `pizza`.
5. Party!

> **Note**: This is using the `.templates` directory in this project. I have VSCode hide it (look for the setting in `.vscode/settings.json`) and it is using a library called `simple-scaffold`
