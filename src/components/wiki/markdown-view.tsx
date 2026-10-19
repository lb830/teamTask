import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
export function MarkdownView({ body }: { body: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // Remote images can track readers. Render a deliberate link instead of fetching them.
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              <a href={src} target="_blank" rel="noopener noreferrer">
                Image: {alt || "Open image"}
              </a>
            ) : null,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
