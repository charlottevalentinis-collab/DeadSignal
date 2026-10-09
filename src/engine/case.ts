import data from "../../cases/the-last-upload/case.json";
import type { CaseFile } from "./types";

// The prototype ships a single case. Later cases are new JSON files here.
export const currentCase = data as unknown as CaseFile;

export const byId = <T extends { id: string }>(list: T[], id: string) =>
  list.find((x) => x.id === id);
