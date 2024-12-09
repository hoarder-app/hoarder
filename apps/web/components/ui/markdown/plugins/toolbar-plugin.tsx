import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
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
  Highlighter,
  Italic,
  LucideIcon,
  Strikethrough,
} from "lucide-react";

const LowPriority = 1;

export default function ToolbarPlugin() {
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

  return (
    <div className="mb-1 flex rounded-t-lg p-1">
      {formatButtons.map(({ command, format, icon: Icon, isActive, label }) => (
        <Button
          key={format}
          size={"sm"}
          onClick={() => {
            editor.dispatchCommand(command, format);
          }}
          variant={isActive ? "default" : "ghost"}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
