import Logo from '@/components/ui/Logo';

export default function Footer() {
  return (
    <footer className="border-t py-10 px-6" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size={40} animated={false} withWordmark />
        <p className="text-xs text-center" style={{ color: 'var(--subtle-foreground)' }}>
          © {new Date().getFullYear()} Retinexus AI — Final Year Project, COMSATS University Islamabad, Lahore Campus. For research & educational use.
        </p>
      </div>
    </footer>
  );
}
