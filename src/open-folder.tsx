import { List, ActionPanel, Action, getPreferenceValues, showToast, Toast, Icon, open } from "@raycast/api";
import { useEffect, useState } from "react";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { getPromptsFolder } from "./utils";
import ConfigureFolder from "./configure-folder";

const execAsync = promisify(exec);

interface Preferences {
  vscodePath: string;
}

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [promptsFolder, setPromptsFolder] = useState<string>();

  useEffect(() => {
    getPromptsFolder().then((folder) => {
      setPromptsFolder(folder);
      if (folder) {
        openFolder(folder);
      }
      setIsLoading(false);
    });
  }, []);

  async function openFolder(folder: string) {
    try {
      const expandedPath = folder.replace(/^~/, process.env.HOME || "");

      if (!fs.existsSync(expandedPath)) {
        fs.mkdirSync(expandedPath, { recursive: true });
      }

      const { vscodePath } = getPreferenceValues<Preferences>();
      if (vscodePath && fs.existsSync(vscodePath)) {
        // Open folder in VSCode
        await execAsync(`"${vscodePath}" --new-window "${expandedPath}"`);
      } else {
        // Try to detect VSCode in common locations
        const commonPaths = [
          "/usr/local/bin/code",
          "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
          "/snap/bin/code",
        ];

        for (const path of commonPaths) {
          if (fs.existsSync(path)) {
            await execAsync(`"${path}" --new-window "${expandedPath}"`);
            return;
          }
        }

        // Fallback to system default
        await open(expandedPath);
      }
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to open editor",
        message: String(error),
      });
    }
  }

  if (!promptsFolder) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Prompts Folder Not Configured"
          description="Please configure the prompts folder to start using the extension."
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
    <List isLoading={isLoading}>
      <List.EmptyView
        icon={Icon.BlankDocument}
        title="Opening Folder..."
        description="Your prompts folder will open in the editor shortly."
      />
    </List>
  );
}
