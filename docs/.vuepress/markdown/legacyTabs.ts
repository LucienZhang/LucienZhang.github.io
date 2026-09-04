import type MarkdownIt from "markdown-it";

const legacyTabsFencePattern = /^(?<indent>\s*)(?<fence>:{4,})\s+tabs\s*$/u;
const legacyTabPattern = /^(?<indent>\s*):{3}\s+tab(?:\s+(?<title>.*?))?\s*$/u;
const containerOpenPattern = /^(?<indent>\s*)(?<fence>:{3,})\s+\S.*$/u;
const containerClosePattern = /^(?<indent>\s*)(?<fence>:{3,})\s*$/u;

/**
 * Convert the old snippetors nested-container syntax to the grammar consumed by
 * the official @vuepress/plugin-markdown-tab plugin. This keeps article source
 * stable while leaving rendering and client behavior to the official plugin.
 */
export const convertLegacyTabs = (source: string): string => {
  const lines = source.split("\n");
  const converted: string[] = [];
  let outerFenceLength = 0;
  let outerIndent = "";
  let insideLegacyTab = false;
  const nestedContainerFences: number[] = [];

  for (const line of lines) {
    if (outerFenceLength === 0) {
      const tabsFence = line.match(legacyTabsFencePattern);
      if (tabsFence?.groups) {
        outerFenceLength = tabsFence.groups.fence.length;
        outerIndent = tabsFence.groups.indent;
      }
      converted.push(line);
      continue;
    }

    const containerClose = line.match(containerClosePattern);
    const isOuterClose =
      containerClose?.groups?.indent === outerIndent &&
      containerClose.groups.fence.length >= outerFenceLength &&
      nestedContainerFences.length === 0;
    if (isOuterClose) {
      outerFenceLength = 0;
      outerIndent = "";
      insideLegacyTab = false;
      converted.push(line);
      continue;
    }

    const legacyTab = line.match(legacyTabPattern);
    if (legacyTab?.groups?.indent === outerIndent) {
      const title = legacyTab.groups.title?.trim();
      converted.push(`${outerIndent}@tab${title ? ` ${title}` : ""}`);
      insideLegacyTab = true;
      nestedContainerFences.length = 0;
      continue;
    }

    if (insideLegacyTab && containerClose?.groups?.indent === outerIndent) {
      if (nestedContainerFences.length > 0) {
        nestedContainerFences.pop();
        converted.push(line);
      }
      // The official grammar starts the next tab with @tab and does not use a
      // closing fence for each tab, so the legacy tab closer is omitted.
      continue;
    }

    const nestedOpen = line.match(containerOpenPattern);
    if (insideLegacyTab && nestedOpen?.groups?.indent === outerIndent) {
      nestedContainerFences.push(nestedOpen.groups.fence.length);
    }
    converted.push(line);
  }

  return converted.join("\n");
};

export const legacyTabsPlugin = (md: MarkdownIt): void => {
  md.core.ruler.before("block", "legacy-tabs", (state) => {
    state.src = convertLegacyTabs(state.src);
  });
};
