import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="id">
      <Head>
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>
      <body className="bg-slate-100 min-h-screen">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
