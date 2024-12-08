import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_TEXT_COMMAND,
  LexicalCommand,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  TextFormatType,
  UNDO_COMMAND,
} from "lexical";
import {
  Bold,
  Code,
  Highlighter,
  Italic,
  LucideIcon,
  Redo,
  Strikethrough,
  Underline,
  Undo,
} from "lucide-react";

const LowPriority = 1;

export default function ToolbarPlugin() {
  const { t } = useTranslation();
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
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
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
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
      isActive: isBold,
      label: t("editor.text_toolbar.bold"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "italic",
      icon: Italic,
      isActive: isItalic,
      label: t("editor.text_toolbar.italic"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "underline",
      icon: Underline,
      isActive: isUnderline,
      label: t("editor.text_toolbar.underline"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "strikethrough",
      icon: Strikethrough,
      isActive: isStrikethrough,
      label: t("editor.text_toolbar.strikethrough"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "code",
      icon: Code,
      label: t("editor.text_toolbar.code"),
    },
    {
      command: FORMAT_TEXT_COMMAND,
      format: "highlight",
      icon: Highlighter,
      label: t("editor.text_toolbar.highlight"),
    },
  ];

  return (
    <div className="mb-1 flex rounded-t-lg p-1" ref={toolbarRef}>
      <Button
        size={"sm"}
        disabled={!canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        variant={"ghost"}
        aria-label={t("editor.text_toolbar.undo")}
      >
        <Undo className="h-4" />
      </Button>
      <Button
        size={"sm"}
        disabled={!canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        variant={"ghost"}
        aria-label={t("editor.text_toolbar.redo")}
      >
        <Redo className="h-4" />
      </Button>
      <Separator orientation={"vertical"} />
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
