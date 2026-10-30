import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";

// MUI Core
import { ServerStyleSheets } from "@mui/styles";

import { GA_TRACKING_ID } from "../lib/gtag";
import { INTERFACE_DIRECTION, INTERFACE_LANGUAGE } from "../lib/language";

class CustomDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    // The deployment's interface language (lib/language.js), whatever the content
    // language: content blocks carry their own lang and dir.
    return (
      <Html lang={INTERFACE_LANGUAGE} dir={INTERFACE_DIRECTION}>
        <Head>
          {/* Global Site Tag (gtag.js) - Google Analytics, only when an ID is configured
              (next.config.js accepts letters, digits and dashes only) */}
          {GA_TRACKING_ID && (
            <>
              <script async src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_TRACKING_ID)}`} />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag() {
                      dataLayer.push(arguments);
                    }
                    gtag('js', new Date());
                    gtag('config', ${JSON.stringify(GA_TRACKING_ID)}, {
                      page_path: window.location.pathname,
                    });
                  `,
                }}
              />
            </>
          )}
        </Head>
        <body>
          <Main />
          <NextScript />
          <script> </script>
        </body>
      </Html>
    );
  }
}

CustomDocument.getInitialProps = async (ctx) => {
  // Render app and page and get the context of the page with collected side effects.
  const sheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => sheets.collect(<App {...props} />),
    });

  const initialProps = await Document.getInitialProps(ctx);

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [
      ...React.Children.toArray(initialProps.styles),
      sheets.getStyleElement(),
    ],
  };
};

export default CustomDocument;
