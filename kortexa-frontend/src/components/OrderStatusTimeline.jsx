import { Check, Circle, Package, Truck } from "lucide-react";

const STEPS = [
  { key: "PAID", label: "Paid", icon: Check },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Package },
];

const rank = { PAID: 0, SHIPPED: 1, DELIVERED: 2 };

export default function OrderStatusTimeline({ status }) {
  if (status === "CANCELLED" || status === "PENDING" || status === "RETURNED") {
    return (
      <p className="text-sm text-slate-500">
        {status === "PENDING"
          ? "Awaiting payment confirmation."
          : status === "RETURNED"
            ? "This order was returned."
            : "This order was cancelled."}
      </p>
    );
  }

  const current = rank[status] ?? -1;

  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {STEPS.map((step, index) => {
        const done = current >= index;
        const active = current === index;
        const Icon = step.icon;

        return (
          <li key={step.key} className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                done
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-400"
              } ${active ? "ring-2 ring-indigo-200" : ""}`}
            >
              {done ? <Icon size={14} /> : <Circle size={12} />}
            </div>
            <span
              className={`hidden text-xs font-semibold sm:inline ${
                done ? "text-slate-800" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-1 hidden h-0.5 flex-1 sm:block ${
                  current > index ? "bg-indigo-500" : "bg-slate-200"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
