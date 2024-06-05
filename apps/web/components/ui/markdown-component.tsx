import React from "react";
import CodeCopyBtn from "@/components/ui/code-copy-button";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";

export function MarkdownComponent({
  children: markdown,
}: {
  children: string;
}) {
  const Pre = ({ children }: { children?: React.ReactNode }) => (
    <pre className="relative mx-auto mb-12 shadow-lg">
      <CodeCopyBtn>{children}</CodeCopyBtn>
      {children}
    </pre>
  );
  return (
    <Markdown
      className="prose mx-auto dark:prose-invert"
      components={{
        pre: Pre,
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className ?? "");
          return match ? (
            // @ts-expect-error i have absolutely no idea what it complains about and passing refs to it also does not solve it
            <SyntaxHighlighter
              PreTag="div"
              language={match[1]}
              {...props}
              style={dracula}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {markdown}
    </Markdown>
  );
}
