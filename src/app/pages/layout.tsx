export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1>My Site</h1>
      {children}
    </div>
  );
}