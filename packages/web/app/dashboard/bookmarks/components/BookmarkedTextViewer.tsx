import { Dialog, DialogContent } from "@/components/ui/dialog";
import Markdown from "react-markdown";

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
        <Markdown className="prose">{content}</Markdown>
      </DialogContent>
    </Dialog>
  );
}
