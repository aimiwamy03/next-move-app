import { ScrollViewStyleReset } from 'expo-router/html';

/**
 * Web document shell — dark stage behind the always-on iPhone frame.
 */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
                background: #121816;
                overflow: hidden;
              }
              body {
                display: flex;
                align-items: stretch;
                justify-content: stretch;
              }
              #root {
                display: flex;
                flex: 1;
                min-height: 100%;
              }
              #root > div {
                flex: 1;
                min-height: 100%;
              }
              /* Center the iPhone shell even if RN-web drops display:flex */
              [data-testid="phone-stage"] {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                width: 100% !important;
                height: 100% !important;
                min-height: 100vh !important;
                background: #121816 !important;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
