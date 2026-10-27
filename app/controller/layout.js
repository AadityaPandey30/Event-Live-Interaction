export const metadata = {
  title: 'Controller · Catalygn Edge Business Health Check',
  robots: { index: false, follow: false },
};

export default function ControllerLayout({ children }) {
  return <div className="min-h-screen bg-ink-950 text-white">{children}</div>;
}
