import { List, ActionPanel, Action, getPreferenceValues, showToast, Toast, Icon, Color, open } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { useEffect, useState } from "react";
import fs from "fs";
import path from "path";
import { FileFormat, getFileExtension, extractPromptContent } from "./types";
import { getPromptsFolder } from "./utils";
import ConfigureFolder from "./configure-folder";
import CreatePrompt from "./create-prompt";

const execAsync = promisify(exec);

interface Preferences {
  vscodePath: string;
}

interface PromptFile {
  name: string;
  content: string;
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
          const content = fs.readFileSync(filepath, "utf-8");
          const promptContent = extractPromptContent(content, format);

          loadedPrompts.push({
            name: file.replace(/\.[^.]+$/, ""),
            content: promptContent,
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
    <List isLoading={isLoading} onSearchTextChange={setSearchText} searchBarPlaceholder="Search prompts by name...">
      {filteredPrompts.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Document}
          title="No Prompts Found"
          description="Create your first prompt to get started"
          actions={
            <ActionPanel>
              <Action.Push title="Create New Prompt" target={<CreatePrompt />} icon={Icon.PlusCircle} />
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
              accessories={[{ tag: { value: prompt.format, color } }, { icon }]}
              actions={
                <ActionPanel>
                  <Action.Paste content={prompt.content} />
                  <Action.CopyToClipboard
                    content={prompt.content}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                  />
                  <Action
                    title="Open in Editor"
                    icon={Icon.BlankDocument}
                    shortcut={{ modifiers: ["cmd"], key: "o" }}
                    onAction={async () => {
                      try {
                        const { vscodePath } = getPreferenceValues<Preferences>();
                        if (vscodePath && fs.existsSync(vscodePath)) {
                          await execAsync(`"${vscodePath}" "${prompt.filepath}"`);
                        } else {
                          await open(prompt.filepath);
                        }
                      } catch (error) {
                        showToast({
                          style: Toast.Style.Failure,
                          title: "Failed to open editor",
                          message: String(error),
                        });
                      }
                    }}
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
