import "./globals.css";
import { HeaderController } from "../components/HeaderController";

export const metadata = {
  title: "Adapt",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewpoint"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </head>
      <body>
        {/* O Header agora é controlado pelo HeaderController */}
        <HeaderController />
        <main>{children}</main>
      </body>
    </html>
  );
}
