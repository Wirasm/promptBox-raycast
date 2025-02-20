import { Form, ActionPanel, Action, showToast, Toast, useNavigation, clearSearchBar } from "@raycast/api";
import { useState } from "react";
import fs from "fs";
import { setPromptsFolder } from "./utils";

export default function Command() {
  const [selectedFolder, setSelectedFolder] = useState<string>();
  const { pop } = useNavigation();

  async function handleSubmit(values: { folder: string[] }) {
    try {
      if (!values.folder || values.folder.length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Folder Required",
          message: "Please select a folder for your prompts",
        });
        return;
      }

      const folderPath = values.folder[0];

      // Create folder if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Save folder to LocalStorage
      await setPromptsFolder(folderPath);

      await showToast({
        style: Toast.Style.Success,
        title: "Folder Configured",
        message: "Your prompts folder has been set successfully",
      });

      // Clear search and return to previous view
      await clearSearchBar();
      await pop();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Configure Folder",
        message: String(error),
      });
    }
  }

  return (
    <Form
      navigationTitle="Configure Prompts Folder"
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Select Prompts Folder"
        text="Choose a folder where your prompts will be stored. You can create a new folder if needed."
      />
      <Form.FilePicker
        id="folder"
        title="Prompts Folder"
        allowMultipleSelection={false}
        canChooseFiles={false}
        canChooseDirectories
        defaultValue={selectedFolder ? [selectedFolder] : undefined}
        onChange={(paths) => setSelectedFolder(paths[0])}
      />
      <Form.Description text="This folder will be used to store all your prompts. You can change it later in the extension preferences." />
    </Form>
  );
}
