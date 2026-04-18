import type { OrgReport } from "../types.js";

export function renderJSON(report: OrgReport): void {
  console.log(JSON.stringify(report, null, 2));
}
