# bromanko-for-claude

A collection of Claude Code plugins for enhanced productivity and workflow automation.

## Adding this marketplace

Add this marketplace to your Claude Code installation:

### Using GitHub (recommended)
```shell
/plugin marketplace add bromanko/claude
```

### Using local path (for development)
```shell
/plugin marketplace add /path/to/this/repo
```

## Available plugins

### jujutsu-tools
Tools and commands for working with Jujutsu (jj) version control.

**Commands:**
- `/jj:commit` - Analyze jj status and create logical commits with descriptive messages

**Installation:**
```shell
/plugin install jujutsu-tools@bromanko-for-claude
```

**Keywords:** jujutsu, jj, vcs, version-control

## Using plugins

After installing a plugin:

1. **Browse commands:** Use `/` to see available commands
2. **Get help:** Most commands support `/command --help`
3. **Configure:** Check plugin documentation for configuration options

## Contributing

### Adding new plugins

1. Create a new directory under `plugins/`
2. Add a `plugin.json` manifest file
3. Add your plugin components (commands, agents, hooks, etc.)
4. Update `.claude-plugin/marketplace.json` to register the plugin
5. Submit a pull request

### Plugin structure

```
plugins/your-plugin/
├── plugin.json          # Plugin manifest
├── commands/            # Custom commands (optional)
├── agents/              # Custom agents (optional)
└── README.md           # Plugin documentation (optional)
```

## Development

### Testing locally

1. Clone this repository
2. Add the local marketplace:
   ```shell
   /plugin marketplace add ./path/to/clone
   ```
3. Install plugins for testing:
   ```shell
   /plugin install plugin-name@bromanko-for-claude
   ```

### Validation

Validate the marketplace configuration:
```bash
claude plugin validate .
```

## License

MIT
