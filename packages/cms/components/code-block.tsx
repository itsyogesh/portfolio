import type { HTMLAttributes, ReactNode } from 'react';

type CodeBlockProperties = HTMLAttributes<HTMLPreElement> & {
  children?: ReactNode;
};

export const CodeBlock = ({ children, ...props }: CodeBlockProperties) => (
  <pre {...props}>{children}</pre>
);
