import { Linking, Text, View } from "react-native";

import { colors, radius } from "@/theme";

type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; label: string; url: string };

type MarkdownContentProps = {
  content: string;
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  const blocks = parseBlocks(content);

  return (
    <View style={{ gap: 10 }}>
      {blocks.map((block) => {
        if (block.type === "heading") {
          const size = block.level === 1 ? 19 : block.level === 2 ? 17 : 15;
          return (
            <Text key={block.key} style={{ fontSize: size, lineHeight: size + 7, fontWeight: "900", color: colors.textMain }}>
              {renderInline(block.text)}
            </Text>
          );
        }

        if (block.type === "list") {
          return (
            <View key={block.key} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
              <Text style={{ width: 20, fontSize: 14, lineHeight: 21, fontWeight: "800", color: colors.primary }}>{block.marker}</Text>
              <Text style={{ flex: 1, fontSize: 14, lineHeight: 21, color: colors.textSub }}>{renderInline(block.text)}</Text>
            </View>
          );
        }

        if (block.type === "callout") {
          return (
            <View
              key={block.key}
              style={{
                borderLeftWidth: 3,
                borderLeftColor: colors.primary,
                backgroundColor: colors.primaryBg,
                borderRadius: radius.button,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textMain }}>{renderInline(block.text)}</Text>
            </View>
          );
        }

        if (block.type === "code") {
          return (
            <Text
              key={block.key}
              style={{
                borderRadius: radius.button,
                backgroundColor: "#111827",
                color: "#F9FAFB",
                fontFamily: "monospace",
                fontSize: 13,
                lineHeight: 19,
                padding: 12,
              }}
            >
              {block.text}
            </Text>
          );
        }

        return (
          <Text key={block.key} style={{ fontSize: 14, lineHeight: 21, color: colors.textSub }}>
            {renderInline(block.text)}
          </Text>
        );
      })}
    </View>
  );
}

function parseBlocks(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Array<
    | { key: string; type: "heading"; level: number; text: string }
    | { key: string; type: "list"; marker: string; text: string }
    | { key: string; type: "callout"; text: string }
    | { key: string; type: "code"; text: string }
    | { key: string; type: "paragraph"; text: string }
  > = [];

  let inCode = false;
  let codeLines: string[] = [];

  lines.forEach((rawLine, index) => {
    const line = rawLine.trimEnd();

    if (line.trim().startsWith("```")) {
      if (inCode) {
        blocks.push({ key: `code-${index}`, type: "code", text: codeLines.join("\n") });
        codeLines = [];
      }
      inCode = !inCode;
      return;
    }

    if (inCode) {
      codeLines.push(rawLine);
      return;
    }

    if (!line.trim()) return;

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({ key: `heading-${index}`, type: "heading", level: heading[1].length, text: heading[2] });
      return;
    }

    const ordered = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (ordered) {
      blocks.push({ key: `ordered-${index}`, type: "list", marker: `${ordered[1]}.`, text: ordered[2] });
      return;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      blocks.push({ key: `unordered-${index}`, type: "list", marker: "•", text: unordered[1] });
      return;
    }

    const callout = line.match(/^(?:>\s?|->\s?)(.+)$/);
    if (callout) {
      blocks.push({ key: `callout-${index}`, type: "callout", text: callout[1] });
      return;
    }

    blocks.push({ key: `paragraph-${index}`, type: "paragraph", text: line.trim() });
  });

  if (inCode && codeLines.length > 0) {
    blocks.push({ key: "code-tail", type: "code", text: codeLines.join("\n") });
  }

  return blocks;
}

function renderInline(text: string) {
  return tokenizeInline(text).map((token, index) => {
    if (token.type === "bold") {
      return (
        <Text key={index} style={{ fontWeight: "900", color: colors.textMain }}>
          {token.value}
        </Text>
      );
    }

    if (token.type === "italic") {
      return (
        <Text key={index} style={{ fontStyle: "italic" }}>
          {token.value}
        </Text>
      );
    }

    if (token.type === "code") {
      return (
        <Text key={index} style={{ fontFamily: "monospace", color: colors.primary, backgroundColor: colors.primaryBg }}>
          {token.value}
        </Text>
      );
    }

    if (token.type === "link") {
      return (
        <Text key={index} style={{ color: colors.primary, fontWeight: "800" }} onPress={() => void Linking.openURL(token.url)}>
          {token.label}
        </Text>
      );
    }

    return token.value;
  });
}

function tokenizeInline(text: string) {
  const tokens: InlineToken[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      tokens.push({ type: "text", value: text.slice(cursor, match.index) });
    }

    const token = match[0];
    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      tokens.push({ type: "link", label: link[1], url: link[2] });
    } else if (token.startsWith("**")) {
      tokens.push({ type: "bold", value: token.slice(2, -2) });
    } else if (token.startsWith("`")) {
      tokens.push({ type: "code", value: token.slice(1, -1) });
    } else {
      tokens.push({ type: "italic", value: token.slice(1, -1) });
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    tokens.push({ type: "text", value: text.slice(cursor) });
  }

  return tokens;
}
