import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Spin AI - AI-Powered Web Development',
  description: 'Generate, edit, and preview full-stack web applications using natural language prompts powered by Google Gemini AI',
  keywords: 'AI, web development, React, code generation, Sandpack, Gemini',
  authors: [{ name: 'Spin AI' }],
  viewport: 'width=device-width, initial-scale=1',
  // Prevent FOUC (Flash of Unstyled Content)
  other: {
    'theme-color': '#ffffff',
  },
};

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical CSS */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Critical CSS */
              body { 
                opacity: 0; 
                transition: opacity 0.3s ease-in-out;
              }
              body.loaded { 
                opacity: 1; 
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
        {/* Add a script to handle FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Remove loading class once the page has loaded
              document.addEventListener('DOMContentLoaded', function() {
                document.body.classList.add('loaded');
              });
            `,
          }}
        />
      </body>
    </html>
  );
}