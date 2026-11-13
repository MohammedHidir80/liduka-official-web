import { BoxIcon } from "./icons";

export default function PageStub({ title, description, Icon = BoxIcon }) {
  return (
    <div className="container-page py-6">
      <h1 className="text-xl font-extrabold tracking-tight">{title}</h1>
      <div className="card mt-4 grid place-items-center gap-2 p-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-100 text-ink-400">
          <Icon size={24} />
        </span>
        <p className="text-sm font-semibold text-ink-700">{title}</p>
        <p className="max-w-xs text-xs leading-relaxed text-ink-400">
          {description}
        </p>
      </div>
    </div>
  );
}