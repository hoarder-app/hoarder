import { memo, useCallback, useMemo } from "react";
import ToolbarPlugin from "@/components/ui/markdown/plugins/toolbar-plugin";
import { MarkdownEditorTheme } from "@/components/ui/markdown/theme/theme";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { EditorState } from "lexical";

function onError(error: Error) {
  console.error(error);
}

const EDITOR_NODES = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  LinkNode,
  CodeNode,
  HorizontalRuleNode,
];

interface MarkdownEditorProps {
  children: string;
  onChangeMarkdown?: (markdown: string) => void;
  readonly?: boolean;
}

const MarkdownEditor = memo(
  ({
    children: initialMarkdown,
    onChangeMarkdown,
    readonly = false,
  }: MarkdownEditorProps) => {
    const initialConfig: InitialConfigType = useMemo(
      () => ({
        namespace: "editor",
        onError,
        editable: !readonly,
        theme: MarkdownEditorTheme,
        nodes: EDITOR_NODES,
        editorState: () => {
          $convertFromMarkdownString(initialMarkdown, TRANSFORMERS);
        },
      }),
      [readonly, initialMarkdown],
    );

    const handleOnChange = useCallback(
      (editorState: EditorState) => {
        editorState.read(() => {
          const markdownString = $convertToMarkdownString();
          if (onChangeMarkdown) onChangeMarkdown(markdownString);
        });
      },
      [onChangeMarkdown],
    );

    return (
      <LexicalComposer initialConfig={initialConfig}>
        {readonly ? (
          <PlainTextPlugin
            contentEditable={
              <ContentEditable className="h-full w-full content-center" />
            }
            ErrorBoundary={LexicalErrorBoundary}
          ></PlainTextPlugin>
        ) : (
          <>
            <div className="flex h-full flex-col justify-stretch">
              <ToolbarPlugin></ToolbarPlugin>
              <RichTextPlugin
                contentEditable={
                  <ContentEditable className="overflow-autop h-full p-2" />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
          </>
        )}
        {!readonly && (
          <>
            <HistoryPlugin />
            <AutoFocusPlugin />
            <TabIndentationPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <OnChangePlugin onChange={handleOnChange} />
          </>
        )}
      </LexicalComposer>
    );
  },
);
// needed for linter because of memo
MarkdownEditor.displayName = "MarkdownEditor";

export default MarkdownEditor;
