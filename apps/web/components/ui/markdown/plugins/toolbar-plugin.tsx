import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { $createCodeNode, $isCodeNode } from "@lexical/code";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  LexicalCommand,
  SELECTION_CHANGE_COMMAND,
  TextFormatType,
} from "lexical";
import {
  Bold,
  Code,
  Hash,
  Highlighter,
  Italic,
  LucideIcon,
  Strikethrough,
} from "lucide-react";

import InfoTooltip from "../../info-tooltip";

const LowPriority = 1;

function MarkdownToolTip() {
  const { t } = useTranslation();
  return (
    <InfoTooltip size={15}>
      <table className="w-full table-auto text-left text-sm">
        <thead>
          <tr>
            <th>{t("editor.text_toolbar.markdown_shortcuts.label")}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.heading.label")}
            </td>
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.heading.example")}
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.bold.label")}
            </td>
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.bold.example")}
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.italic.label")}
            </td>
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.italic.example")}
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.blockquote.label")}
            </td>
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.blockquote.example")}
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.ordered_list.label")}
            </td>
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.ordered_list.example")}
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.unordered_list.label")}
            </td>
            <td className="py-2">
              {t(
                "editor.text_toolbar.markdown_shortcuts.unordered_list.example",
              )}
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.inline_code.label")}
            </td>
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.inline_code.example")}
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.block_code.label")}
            </td>
            <td className="py-2">
              {t("editor.text_toolbar.markdown_shortcuts.block_code.example")}
            </td>
          </tr>
        </tbody>
      </table>
    </InfoTooltip>
  );
}

export default function ToolbarPlugin({
  isRawMarkdownMode = false,
  setIsRawMarkdownMode,
}: {
  isRawMarkdownMode: boolean;
  setIsRawMarkdownMode: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const [editor] = useLexicalComposerContext();
  const [editorToolbarState, setEditorToolbarState] = useState<{
    isBold: boolean;
    isItalic: boolean;
    isStrikethrough: boolean;
    isHighlight: boolean;
    isCode: boolean;
  }>({
    isBold: false,
    isItalic: false,
    isStrikethrough: false,
    isHighlight: false,
    isCode: false,
  });

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setEditorToolbarState({
        isBold: selection.hasFormat("bold"),
        isItalic: selection.hasFormat("italic"),
        isStrikethrough: selection.hasFormat("strikethrough"),
        isHighlight: selection.hasFormat("highlight"),
        isCode: selection.hasFormat("code"),
      });
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          $updateToolbar();
          return false;
        },
        LowPriority,
      ),
    );
  }, [editor, $updateToolbar]);

  const formatButtons: {
    command: LexicalCommand<TextFormatType>;
    format: TextFormatType;
    isActive?: boolean;
    icon: LucideIcon;
    label: string;
  }[] = [
    {
      command: FORMAT_TEXT_COMMAND,
      format: "bold",
      icon: Bold,
      isActive: editorToolbarState.isBold,
      label: t("editor.text_toolbar.bold"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "italic",
      icon: Italic,
      isActive: editorToolbarState.isItalic,
      label: t("editor.text_toolbar.italic"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "strikethrough",
      icon: Strikethrough,
      isActive: editorToolbarState.isStrikethrough,
      label: t("editor.text_toolbar.strikethrough"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "code",
      icon: Code,
      isActive: editorToolbarState.isCode,
      label: t("editor.text_toolbar.code"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "highlight",
      icon: Highlighter,
      isActive: editorToolbarState.isHighlight,
      label: t("editor.text_toolbar.highlight"),
    },
  ];

  const handleRawMarkdownToggle = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      if ($isCodeNode(firstChild) && firstChild.getLanguage() === "markdown") {
        $convertFromMarkdownString(firstChild.getTextContent(), TRANSFORMERS);
        setIsRawMarkdownMode(false);
      } else {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        const codeNode = $createCodeNode("markdown");
        codeNode.append($createTextNode(markdown));
        root.clear().append(codeNode);
        if (markdown.length === 0) {
          codeNode.select();
        }
        setIsRawMarkdownMode(true);
      }
    });
  }, [editor]);

  return (
    <div className="mb-1 flex items-center justify-between rounded-t-lg p-1">
      <div className="flex">
        {formatButtons.map(
          ({ command, format, icon: Icon, isActive, label }) => (
            <Button
              key={format}
              disabled={isRawMarkdownMode}
              size={"sm"}
              onClick={() => {
                editor.dispatchCommand(command, format);
              }}
              variant={isActive ? "default" : "ghost"}
              aria-label={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ),
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant={isRawMarkdownMode ? "default" : "ghost"}
          size={"sm"}
          onClick={() => {
            handleRawMarkdownToggle();
          }}
        >
          <Hash className="h-4 w-4" />
        </Button>
        <MarkdownToolTip />
      </div>
    </div>
  );
}
