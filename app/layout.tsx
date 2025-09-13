import "./globals.css";
import App from "@/components/App";

export const metadata = {
  title: "Next.js Supabase Starter",
  description: "The fastest way to build apps with Next.js and Supabase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <App />
      </body>
    </html>
  );
}
