import React from "react";
import CopyBtn from "@/components/ui/copy-button";
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
      <CopyBtn
        classes="absolute right-5 top-7 transform cursor-pointer text-xl text-white transition-all duration-300 ease-in-out hover:scale-110 hover:opacity-90"
        getStringToCopy={() => {
          if (
            React.isValidElement(children) &&
            "props" in children &&
            "children" in children.props
          ) {
            const element = children as React.ReactElement<{
              children: string;
            }>;
            return element.props.children;
          }
          return "";
        }}
      ></CopyBtn>
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
