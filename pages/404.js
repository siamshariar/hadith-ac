import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="wrap">
      <div className="content">
        <h1>404</h1>
        <h2>Page not found.</h2>
        <Link href="/">
          Back To Home
        </Link>
      </div>
      <style jsx>
        {`
          body {
            margin: 0;
          }
          .wrap {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100vh;
            color: #000;
            background: #fff;
            font-family: -apple-system, BlinkMacSystemFont, Roboto,
              Segoe UI-MONOSPACE, Fira sans-serif, Avenir, Helvetica Neue,
              Lucida Grande, sans-serif;
            text-align: center;
          }
          .content {
            display: flex;
            width: 100%;
            max-width: 1100px;
            padding: 0;
            margin: 0 auto;
            justify-content: center;
            align-items: center;
          }
          h1 {
            display: inline-block;
            border-right: 1px solid rgba(0, 0, 0, 0.3);
            margin: 0;
            margin-right: 20px;
            padding: 10px 23px 10px 0;
            font-size: 24px;
            font-weight: 500;
            vertical-align: top;
          }
          h2,
          a {
            font-size: 14px;
            font-weight: normal;
            line-height: inherit;
            margin: 0;
            padding: 0;
          }
          a {
            margin-left: 4px;
          }
          a:hover {
            font-weight: bold;
          }
        `}
      </style>
    </div>
  );
}
