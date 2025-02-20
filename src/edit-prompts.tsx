import {
  List,
  ActionPanel,
  Action,
  getPreferenceValues,
  showToast,
  Toast,
  Icon,
  Color,
  open,
} from "@raycast/api";
import { useEffect, useState } from "react";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import {
  FileFormat,
  getFileExtension,
} from "./types";
import { getPromptsFolder } from "./utils";

const execAsync = promisify(exec);

interface Preferences {
  vscodePath: string;
}

interface PromptFile {
  name: string;
  format: FileFormat;
  filename: string;
  filepath: string;
}

export default function Command() {
  const [prompts, setPrompts] = useState<PromptFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [promptsFolder, setPromptsFolder] = useState<string>();

  useEffect(() => {
    getPromptsFolder().then((folder) => {
      setPromptsFolder(folder);
      if (folder) {
        loadPrompts(folder);
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  async function loadPrompts(folder: string) {
    try {
      const expandedPath = folder.replace(/^~/, process.env.HOME || "");
      
      if (!fs.existsSync(expandedPath)) {
        fs.mkdirSync(expandedPath, { recursive: true });
      }

      const files = fs.readdirSync(expandedPath);
      const loadedPrompts: PromptFile[] = [];

      for (const file of files) {
        const format = getFileExtension(file);
        if (format) {
          const filepath = path.join(expandedPath, file);
          loadedPrompts.push({
            name: file.replace(/\.[^.]+$/, ""),
            format,
            filename: file,
            filepath,
          });
        }
      }

      setPrompts(loadedPrompts);
      setIsLoading(false);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load prompts",
        message: String(error),
      });
      setIsLoading(false);
    }
  }

  const filteredPrompts = prompts.filter((prompt) => {
    const searchLower = searchText.toLowerCase();
    return prompt.name.toLowerCase().includes(searchLower);
  });

  async function openInEditor(filepath: string) {
    try {
      const { vscodePath } = getPreferenceValues<Preferences>();
      if (vscodePath && fs.existsSync(vscodePath)) {
        await execAsync(`"${vscodePath}" "${filepath}"`);
      } else {
        await open(filepath);
      }
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to open editor",
        message: String(error),
      });
    }
  }

  function getFormatIcon(format: FileFormat): { icon: Icon; color: Color } {
    switch (format) {
      case "json":
        return { icon: Icon.Code, color: Color.Blue };
      case "xml":
        return { icon: Icon.Code, color: Color.Red };
      case "md":
        return { icon: Icon.Document, color: Color.Purple };
      case "txt":
      default:
        return { icon: Icon.Text, color: Color.Green };
    }
  }

  if (!promptsFolder) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Prompts Folder Not Configured"
          description="Please configure the prompts folder to start editing prompts."
          actions={
            <ActionPanel>
              <Action.Push
                title="Configure Prompts Folder"
                icon={Icon.Gear}
                target={require("./configure-folder").default}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search prompts by name..."
    >
      {filteredPrompts.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Document}
          title="No Prompts Found"
          description="Create your first prompt to get started"
          actions={
            <ActionPanel>
              <Action.Push
                title="Create New Prompt"
                target={require("./create-prompt").default}
                icon={Icon.PlusCircle}
              />
            </ActionPanel>
          }
        />
      ) : (
        filteredPrompts.map((prompt) => {
          const { icon, color } = getFormatIcon(prompt.format);
          return (
            <List.Item
              key={prompt.filename}
              title={prompt.name}
              subtitle={prompt.format}
              accessories={[
                { tag: { value: prompt.format, color } },
                { icon },
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="Open in Editor"
                    icon={Icon.BlankDocument}
                    onAction={() => openInEditor(prompt.filepath)}
                  />
                  <Action.ShowInFinder path={prompt.filepath} />
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}
