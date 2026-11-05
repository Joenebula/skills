import './Button.css';

export function Button({ children }: { children: React.ReactNode }) {
  // style values that are tokens are fine
  return (
    <button className="ds-button" style={{ padding: 'var(--ds-space-2)', opacity: 1 }}>
      <Icon size="md" />
      {children}
    </button>
  );
}

function Icon(_: { size: string }) {
  return <svg width="100%" height="100%" />;
}
