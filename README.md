# PromptBox

Store and quickly access your LLM prompts from Raycast.

## Features

- Store prompts in various formats (txt, md, json, xml)
- Quick copy/paste actions
- Search by name
- VSCode integration
- Format-specific syntax highlighting

## Setup

1. Install the extension
2. Configure your prompts folder:
   - Run the "Configure Prompts Folder" command
   - Select or create a folder where your prompts will be stored
   - Optionally, set VSCode path in preferences for better editor integration

## Commands

### Browse Prompts
Browse and use your stored prompts with quick actions for copy/paste.

### Create Prompt
Create a new prompt and save it in your preferred format:
- Text (.txt) - Plain text
- Markdown (.md) - With prompt header
- JSON (.json) - Structured format
- XML (.xml) - With proper XML escaping

### Edit Prompts
Browse and open individual prompts in VSCode or your default editor.

### Open Prompts Folder
Open the entire prompts folder in VSCode for bulk editing.

### Configure Prompts Folder
Set up or change where your prompts are stored.

## Tips

- Use Markdown format for prompts that need structure and formatting
- Use JSON format for prompts with variables or structured data
- Use XML format for prompts that need to be processed by other tools
- Use Text format for simple, plain text prompts

## Preferences

- **Prompts Folder**: The folder where your prompts are stored (supports ~ for home directory)
- **VSCode Path**: Path to VSCode executable (leave empty to use default system editor)
