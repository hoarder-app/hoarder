import React, { memo, useCallback, useMemo } from "react";
import ToolbarPlugin from "@/components/ui/markdown/plugins/toolbar-plugin";
import { UpdateMarkdownPlugin } from "@/components/ui/markdown/plugins/update-markdown-editor-plugin";
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
        editorState: () =>
          $convertFromMarkdownString(initialMarkdown, TRANSFORMERS),
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
                  <ContentEditable className="h-full overflow-auto" />
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
            <OnChangePlugin onChange={handleOnChange} />
          </>
        )}
        <UpdateMarkdownPlugin markdown={initialMarkdown} />
      </LexicalComposer>
    );
  },
);
// needed for linter because of memo
MarkdownEditor.displayName = "MarkdownEditor";

export default MarkdownEditor;
