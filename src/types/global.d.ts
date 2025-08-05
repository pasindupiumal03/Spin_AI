/// <reference types="react" />

// Ensure JSX types are available
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Add type declarations for @codesandbox/sandpack-react
declare module '@codesandbox/sandpack-react' {
  import * as React from 'react';
  
  export interface SandpackConsoleProps {
    showHeader?: boolean;
    showSyntaxError?: boolean;
    resetOnPreviewRestart?: boolean;
    standalone?: boolean;
    actionsChildren?: React.ReactNode;
  }

  export const SandpackConsole: React.ForwardRefExoticComponent<
    SandpackConsoleProps & React.RefAttributes<unknown>
  >;
}
