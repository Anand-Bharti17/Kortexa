import { Truck, ShieldCheck, Zap } from "lucide-react";

const perks = [
  { icon: Truck, title: "Fast delivery", desc: "Reliable shipping on every order" },
  { icon: ShieldCheck, title: "Secure checkout", desc: "Safe payments at checkout" },
  { icon: Zap, title: "Curated catalog", desc: "Quality products from trusted vendors" },
];

export default function TrustPerks() {
  return (
    <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
      {perks.map(({ icon: Icon, title, desc }) => (
        <div
          key={title}
          className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:items-start"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 sm:text-sm">{desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
