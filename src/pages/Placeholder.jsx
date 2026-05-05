export default function Placeholder({ title }) {
  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Coming next</p>
      <h2 className="serif text-4xl">{title}</h2>
      <p className="text-muted-foreground max-w-prose">
        This module will be built in the next iteration. Data scaffolding is already in
        place via the seeded localStorage tables, so we can wire it up quickly.
      </p>
    </div>
  );
}
