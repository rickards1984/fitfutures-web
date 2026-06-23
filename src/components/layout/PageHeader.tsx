type Props = {
  title: string;
  subtitle?: string;
};

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <header className="px-4 pt-5 pb-3">
      <h1 className="text-xl font-medium text-brand-text">{title}</h1>
      {subtitle && <p className="mt-0.5 text-sm text-brand-muted">{subtitle}</p>}
    </header>
  );
}
