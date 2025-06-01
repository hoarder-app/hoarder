import KarakeepLogo from "@/components/KarakeepIcon";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex-col overflow-y-auto bg-muted">
      <header className="sticky left-0 right-0 top-0 z-50 flex h-16 items-center justify-between overflow-x-auto overflow-y-hidden bg-background p-4 shadow">
        <KarakeepLogo height={38} />
      </header>
      <main className="container mx-3 mt-3 flex-1">{children}</main>
    </div>
  );
}
