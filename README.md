# MKS Tools

A collection of independent tools and applications for Practice development, learning, and knowledge sharing.

## Repository Structure

This repository is organized as a monorepo, with each tool or application in its own directory under `tools/`:

```
mks-tools/
├── tools/
│   ├── braze-web-sdk-test/     # Braze Web SDK testing application
│   └── [future-tool]/          # Additional tools can be added here
├── README.md                    # This file
└── .gitignore                   # Shared gitignore
```

## Available Tools

### [Braze Web SDK Test](./tools/braze-web-sdk-test/)

A comprehensive testing application for Braze Web SDK integration. Features include:
- Push notifications testing
- Content cards display
- Custom events and purchase tracking
- User attribute management
- Real-time event logging

See the [tool's README](./tools/braze-web-sdk-test/README.md) for detailed documentation.

## Adding New Tools

To add a new tool to this repository:

1. Create a new directory under `tools/` with a descriptive name:
   ```bash
   mkdir tools/your-tool-name
   ```

2. Add your tool's files to that directory

3. Include a `README.md` in your tool's directory explaining:
   - What the tool does
   - How to set it up
   - How to use it
   - Any dependencies or requirements

4. Update this root README to list your new tool

5. Commit and push your changes

## Best Practices

- **Independence**: Each tool should be self-contained and runnable independently
- **Documentation**: Each tool should have its own README
- **Dependencies**: Each tool should manage its own dependencies (e.g., `package.json`, `requirements.txt`)
- **Configuration**: Use environment variables or config files for sensitive data
- **Naming**: Use kebab-case for tool directory names (e.g., `my-awesome-tool`)

## Contributing

When adding or modifying tools:
1. Ensure your tool is fully functional and documented
2. Test your tool before committing
3. Update this README if adding a new tool
4. Follow the existing code style and structure
