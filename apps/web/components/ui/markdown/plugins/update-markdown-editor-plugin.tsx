import { useEffect } from "react";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export const UpdateMarkdownPlugin = ({ markdown }: { markdown: string }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(markdown, TRANSFORMERS);
    });
  }, [markdown, editor]);

  return null;
};
