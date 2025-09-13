import "./globals.css";

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
      <body>
        {children}
      </body>
    </html>
  );
}
