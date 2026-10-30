import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";

// MUI Core
import { ServerStyleSheets } from "@mui/styles";

import { GA_TRACKING_ID } from "../lib/gtag";
import { SITE_INTERFACE, interfaceDirection, isInterfaceLanguage } from "../lib/language";
import { accentGradient } from "../lib/sites";

// The site's ribbon (header, hero bar, menu: --brand-ribbon in styles/_variables.scss) from
// its accent colours (config/countries.json); without one, the stylesheet's neutral one.
const ribbon = accentGradient();
const ribbonStyle = ribbon ? { "--brand-ribbon": ribbon } : undefined;

class CustomDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    // The interface language, which follows the content language (lib/language.js
    // interfaceFor), and its direction: each page says which interface it is in (lib/api
    // loadPage, loadStaticPage). Content blocks carry their own lang and dir.
    const pageProps = (this.props.__NEXT_DATA__ && this.props.__NEXT_DATA__.props && this.props.__NEXT_DATA__.props.pageProps) || {};
    const lang = isInterfaceLanguage(pageProps.uiLang) ? pageProps.uiLang : SITE_INTERFACE;
    return (
      <Html lang={lang} dir={interfaceDirection(lang)} style={ribbonStyle}>
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
