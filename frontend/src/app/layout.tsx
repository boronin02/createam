import { Header } from "@/widgets/header/ui/Header";
import { Providers } from "./providers";
import "@/shared/assets/styles/reset.scss";
import "@/shared/assets/styles/global.scss";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
