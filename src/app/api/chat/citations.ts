import type { UIMessage } from "ai";
import { z } from "zod";

type ToolResultLike = {
  toolName: string;
  output: unknown;
};

const assistantCitationSchema = z.object({
  toolName: z.string(),
  dataAsOfValues: z.array(z.string()),
  hasUnavailableDataAsOf: z.boolean(),
});

export const assistantMessageMetadataSchema = z.object({
  citations: z.array(assistantCitationSchema).optional(),
  sourcesLine: z.string().optional(),
});

export type AssistantCitation = z.infer<typeof assistantCitationSchema>;
export type AssistantMessageMetadata = z.infer<
  typeof assistantMessageMetadataSchema
>;
export type AssistantChatMessage = UIMessage<AssistantMessageMetadata>;

function getMessageText(message: Pick<AssistantChatMessage, "parts">) {
  return message.parts
    .filter(
      (part): part is Extract<AssistantChatMessage["parts"][number], { type: "text" }> =>
        part.type === "text"
    )
    .map((part) => part.text)
    .join("")
    .trim();
}

function collectDataAsOfValues(
  value: unknown,
  values: Set<string>,
  state: { hasUnavailableDataAsOf: boolean }
) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectDataAsOfValues(item, values, state));
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  const hasCamelCaseDataAsOf = Object.hasOwn(record, "dataAsOf");
  const hasPascalCaseDataAsOf = Object.hasOwn(record, "DataAsOf");

  if (hasCamelCaseDataAsOf || hasPascalCaseDataAsOf) {
    const rawDataAsOf = hasCamelCaseDataAsOf
      ? record.dataAsOf
      : record.DataAsOf;

    if (typeof rawDataAsOf === "string" && rawDataAsOf.trim().length > 0) {
      values.add(rawDataAsOf);
    } else {
      state.hasUnavailableDataAsOf = true;
    }
  }

  Object.values(record).forEach((nestedValue) =>
    collectDataAsOfValues(nestedValue, values, state)
  );
}

export function buildToolCitations(
  toolResults: ToolResultLike[]
): AssistantCitation[] {
  const citationsByTool = new Map<
    string,
    { toolName: string; dataAsOfValues: Set<string>; hasUnavailableDataAsOf: boolean }
  >();

  toolResults.forEach(({ toolName, output }) => {
    const existing = citationsByTool.get(toolName) ?? {
      toolName,
      dataAsOfValues: new Set<string>(),
      hasUnavailableDataAsOf: false,
    };

    collectDataAsOfValues(output, existing.dataAsOfValues, existing);

    if (existing.dataAsOfValues.size === 0) {
      existing.hasUnavailableDataAsOf = true;
    }

    citationsByTool.set(toolName, existing);
  });

  return Array.from(citationsByTool.values()).map((citation) => ({
    toolName: citation.toolName,
    dataAsOfValues: Array.from(citation.dataAsOfValues).sort(),
    hasUnavailableDataAsOf: citation.hasUnavailableDataAsOf,
  }));
}

const estFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

function formatTimestampEst(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return estFormatter.format(date);
}

export function formatCitationSourcesLine(citations: AssistantCitation[]) {
  if (citations.length === 0) {
    return undefined;
  }

  const entries = citations.map((citation) => {
    if (citation.dataAsOfValues.length === 0) {
      return `${citation.toolName} dataAsOf unavailable`;
    }

    const formattedTimestamps = citation.dataAsOfValues.map(formatTimestampEst);

    if (citation.hasUnavailableDataAsOf) {
      return `${citation.toolName} as of ${formattedTimestamps.join(", ")}; some results had no dataAsOf`;
    }

    return `${citation.toolName} as of ${formattedTimestamps.join(", ")}`;
  });

  return `Sources: ${entries.join("; ")}`;
}

export function buildAssistantMessageMetadata(toolResults: ToolResultLike[]) {
  const citations = buildToolCitations(toolResults);
  const sourcesLine = formatCitationSourcesLine(citations);

  if (!sourcesLine) {
    return undefined;
  }

  return {
    citations,
    sourcesLine,
  };
}

function getMostRecentAssistantMetadata(messages: AssistantChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message.role !== "assistant" || !message.metadata?.sourcesLine) {
      continue;
    }

    return {
      citations: message.metadata.citations,
      sourcesLine: message.metadata.sourcesLine,
    };
  }

  return undefined;
}

function inferRelevantToolNamesFromUserMessage(text: string) {
  const normalizedText = text.toLowerCase();
  const toolNames: string[] = [];

  if (/\bwatchlist\b/u.test(normalizedText)) {
    toolNames.push("get_watchlist");
  }

  if (
    /\btrading volume\b/u.test(normalizedText) ||
    /\btop\b[\s\S]{0,40}\bvolume\b/u.test(normalizedText) ||
    /\bby volume\b/u.test(normalizedText)
  ) {
    toolNames.push("get_top_by_volume");
  }

  if (
    /\bgainers?\b/u.test(normalizedText) ||
    /\blosers?\b/u.test(normalizedText) ||
    /\bmovers?\b/u.test(normalizedText) ||
    /\btrending up\b/u.test(normalizedText) ||
    /\btrending down\b/u.test(normalizedText) ||
    /\bmoved the most\b/u.test(normalizedText) ||
    /\bdown more than\b/u.test(normalizedText) ||
    /\bup more than\b/u.test(normalizedText)
  ) {
    toolNames.push("get_top_movers");
  }

  if (
    /\bmarket summary\b/u.test(normalizedText) ||
    /\bbtc dominance\b/u.test(normalizedText) ||
    /\btotal market cap\b/u.test(normalizedText) ||
    /\b24h volume\b/u.test(normalizedText) ||
    /\baverage 24h change\b/u.test(normalizedText) ||
    /\boverall market\b/u.test(normalizedText)
  ) {
    toolNames.push("get_market_summary");
  }

  if (
    /\bprice\b/u.test(normalizedText) ||
    /\bprices\b/u.test(normalizedText) ||
    /\bstats?\b/u.test(normalizedText) ||
    /\bmarket cap\b/u.test(normalizedText) ||
    /\brank\b/u.test(normalizedText) ||
    /\bsupply\b/u.test(normalizedText) ||
    /\ball-time\b/u.test(normalizedText) ||
    /\bcompare\b/u.test(normalizedText) ||
    /\bversus\b/u.test(normalizedText) ||
    /\bvs\b/u.test(normalizedText)
  ) {
    toolNames.push("get_coin_prices");
  }

  return Array.from(new Set(toolNames));
}

function buildMetadataFromCitations(citations: AssistantCitation[]) {
  const sourcesLine = formatCitationSourcesLine(citations);

  if (!sourcesLine) {
    return undefined;
  }

  return {
    citations,
    sourcesLine,
  };
}

export function inferAssistantMessageMetadataFromHistory(
  messages: AssistantChatMessage[]
) {
  if (messages.length === 0) {
    return undefined;
  }

  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const latestUserText = latestUserMessage ? getMessageText(latestUserMessage) : "";
  const mostRecentAssistantMetadata = getMostRecentAssistantMetadata(messages);

  if (
    /\bsource\b/u.test(latestUserText) ||
    /\bwhere did\b[\s\S]{0,40}\bdata\b/u.test(latestUserText)
  ) {
    return mostRecentAssistantMetadata;
  }

  const relevantToolNames = inferRelevantToolNamesFromUserMessage(latestUserText);

  if (relevantToolNames.length === 0) {
    return undefined;
  }

  const citationsByTool = new Map<string, AssistantCitation>();

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message.role !== "assistant") {
      continue;
    }

    message.metadata?.citations?.forEach((citation) => {
      if (!citationsByTool.has(citation.toolName)) {
        citationsByTool.set(citation.toolName, citation);
      }
    });
  }

  const matchedCitations = relevantToolNames
    .map((toolName) => citationsByTool.get(toolName))
    .filter((citation): citation is AssistantCitation => Boolean(citation));

  return buildMetadataFromCitations(matchedCitations);
}
