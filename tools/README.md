# Tools Directory

This directory contains independent tools and applications that can be used by team members as needed.

## Structure

Each tool should be in its own subdirectory with:
- Its own `README.md` explaining what it does and how to use it
- Its own dependencies (e.g., `package.json`, `requirements.txt`)
- Its own configuration files
- Clear instructions for setup and usage

## Current Tools

- **[braze-web-sdk-test](./braze-web-sdk-test/)** - Braze Web SDK testing application
- **[braze-api-tester](./braze-api-tester/)** - Braze REST API testing tool with pre-built templates and request builder

## Adding a New Tool

1. Create a new directory: `mkdir tools/your-tool-name`
2. Add your tool's files
3. Create a `README.md` in your tool's directory
4. Update the root `README.md` to list your new tool
5. Commit and push

## Best Practices

- Keep tools independent and self-contained
- Document setup and usage clearly
- Use environment variables for sensitive configuration
- Follow naming conventions (kebab-case for directories)
