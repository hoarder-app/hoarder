import { Dialog, DialogContent } from "@/components/ui/dialog";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function BookmarkedTextViewer({
  content,
  open,
  setOpen,
}: {
  content: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[75%] overflow-auto">
        <Markdown remarkPlugins={[remarkGfm]} className="prose">
          {content}
        </Markdown>
      </DialogContent>
    </Dialog>
  );
}
