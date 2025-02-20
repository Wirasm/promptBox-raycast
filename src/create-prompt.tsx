import { Form, ActionPanel, Action, showToast, Toast, showInFinder, popToRoot, List, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import fs from "fs";
import path from "path";
import { FileFormat, formatPromptContent } from "./types";
import { getPromptsFolder } from "./utils";
import ConfigureFolder from "./configure-folder";

export default function Command() {
  const [nameError, setNameError] = useState<string | undefined>();
  const [promptsFolder, setPromptsFolder] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPromptsFolder().then((folder) => {
      setPromptsFolder(folder);
      setIsLoading(false);
    });
  }, []);

  function dropNameErrorIfNeeded() {
    if (nameError && nameError.length > 0) {
      setNameError(undefined);
    }
  }

  async function handleSubmit(values: { name: string; content: string; format: string }) {
    try {
      if (!promptsFolder) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Folder Required",
          message: "Please configure the prompts folder first",
        });
        return;
      }

      if (!values.name || !values.content) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Invalid Input",
          message: "Name and content are required",
        });
        return;
      }

      const expandedPath = promptsFolder.replace(/^~/, process.env.HOME || "");

      if (!fs.existsSync(expandedPath)) {
        fs.mkdirSync(expandedPath, { recursive: true });
      }

      const sanitizedName = values.name
        .trim()
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .replace(/-+/g, "-");
      const fileName = `${sanitizedName}.${values.format || "txt"}`;
      const filePath = path.join(expandedPath, fileName);

      if (fs.existsSync(filePath)) {
        setNameError("A prompt with this name already exists");
        return;
      }

      // Write the prompt content
      const formattedContent = formatPromptContent(values.content, (values.format as FileFormat) || "txt");
      fs.writeFileSync(filePath, formattedContent);

      await showToast({
        style: Toast.Style.Success,
        title: "Prompt Created",
        message: "Your prompt has been saved successfully",
      });

      // Show the created prompt in Finder
      await showInFinder(filePath);

      // Pop back to browse view
      await popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Create Prompt",
        message: String(error),
      });
    }
  }

  if (isLoading) {
    return <List isLoading={true} />;
  }

  if (!promptsFolder) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Prompts Folder Not Configured"
          description="Please configure the prompts folder to start creating prompts."
          actions={
            <ActionPanel>
              <Action.Push title="Configure Prompts Folder" icon={Icon.Gear} target={<ConfigureFolder />} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <Form
      navigationTitle="Create Prompt"
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Name"
        placeholder="Enter prompt name"
        error={nameError}
        onChange={dropNameErrorIfNeeded}
        autoFocus
      />
      <Form.TextArea id="content" title="Content" placeholder="Enter your prompt content" />
      <Form.Dropdown id="format" title="Format" defaultValue="txt">
        <Form.Dropdown.Item value="txt" title="Text (.txt)" />
        <Form.Dropdown.Item value="md" title="Markdown (.md)" />
        <Form.Dropdown.Item value="json" title="JSON (.json)" />
        <Form.Dropdown.Item value="xml" title="XML (.xml)" />
      </Form.Dropdown>
    </Form>
  );
}
