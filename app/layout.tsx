import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata = {
  title: "PromptArena - Test Your Prompt Engineering Skills",
  description: "Compete with other humans in prompt engineering challenges",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
