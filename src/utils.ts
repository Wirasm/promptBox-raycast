import { LocalStorage } from "@raycast/api";

export async function getPromptsFolder(): Promise<string | undefined> {
  return LocalStorage.getItem<string>("promptsFolder");
}

export async function setPromptsFolder(folder: string): Promise<void> {
  await LocalStorage.setItem("promptsFolder", folder);
}

export async function clearPromptsFolder(): Promise<void> {
  await LocalStorage.removeItem("promptsFolder");
}
