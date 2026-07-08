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
  const rawDataAsOf = record.dataAsOf ?? record.DataAsOf;

  if (rawDataAsOf !== undefined) {
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

export function formatCitationSourcesLine(citations: AssistantCitation[]) {
  if (citations.length === 0) {
    return undefined;
  }

  const entries = citations.map((citation) => {
    if (citation.dataAsOfValues.length === 0) {
      return `${citation.toolName} dataAsOf unavailable`;
    }

    if (citation.hasUnavailableDataAsOf) {
      return `${citation.toolName} as of ${citation.dataAsOfValues.join(", ")}; some results had no dataAsOf`;
    }

    return `${citation.toolName} as of ${citation.dataAsOfValues.join(", ")}`;
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
