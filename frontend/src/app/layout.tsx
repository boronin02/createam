import { Header } from "@/widgets/header/ui/Header";
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
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
