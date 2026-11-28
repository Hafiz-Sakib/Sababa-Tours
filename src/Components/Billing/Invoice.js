// src/Components/Billing/Invoice.js
// Printable invoice. Colours are fixed hex (not theme tokens) so it looks the same in day / night mode, on screen and on paper.
// "Download PDF" uses the browser's print dialog (choose "Save as PDF"); App.css has the @media print rules for `.inv-print`.
import { forwardRef } from "react";
import logoMark from "../../assets/logo/logo-mark.png";
import { fmtDate, fmtDateTime, invoiceNo, money, moneyOf, paymentsOf } from "../Utilities/payment";

const BRAND = "#1D8A84";
const FOREST = "#0F5C46";

const statusChip = (b, m) => {
  if (b.status === "cancelled") return ["CANCELLED", "#b91c1c", "#fef2f2"];
  if (m.paidInFull) return ["PAID IN FULL", "#047857", "#ecfdf5"];
  if (b.status === "confirmed") return m.paid > 0 ? ["CONFIRMED · PART PAID", "#0f766e", "#f0fdfa"] : ["CONFIRMED", "#0f766e", "#f0fdfa"];
  if (b.status === "awaiting_payment") return m.paid > 0 ? ["PART PAID · ADVANCE DUE", "#b45309", "#fffbeb"] : ["ADVANCE DUE", "#b45309", "#fffbeb"];
  return ["AWAITING APPROVAL", "#64748b", "#f1f5f9"];
};

const Invoice = forwardRef(function Invoice({ b }, ref) {
  const m = moneyOf(b);
  const pays = paymentsOf(b);
  const [chipText, chipColor, chipBg] = statusChip(b, m);
  const unit = b.travelers ? m.total / Number(b.travelers) : m.total;
  const full = m.paidInFull && b.status !== "cancelled";

  return (
    <div className="inv-print mx-auto w-full max-w-[820px]" ref={ref}>
      <div className="relative overflow-hidden rounded-[22px] border border-[#d6e9e7] bg-white text-[#101828] shadow-[0_20px_60px_-24px_rgba(16,24,40,0.35)] print:rounded-none print:border-0 print:shadow-none">
        {/* top band */}
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${BRAND}, ${FOREST})` }} />

        {full && (
          <div
            aria-hidden
            className="pointer-events-none absolute right-8 top-28 -rotate-12 rounded-lg border-[3px] px-5 py-1.5 text-3xl font-black tracking-[0.2em] opacity-80"
            style={{ color: "#047857", borderColor: "#047857" }}
          >
            PAID
          </div>
        )}

        <div className="p-6 sm:p-10">
          {/* head */}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <img src={logoMark} alt="" data-keep className="h-14 w-14 object-contain" />
              <div>
                <p className="text-xl font-black leading-none" style={{ color: FOREST }}>
                  Sababa Tours
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#546470]">
                  Bangladesh · hello@sababatours.com
                  <br />
                  +880 1XXX-XXXXXX
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black tracking-[0.12em]" style={{ color: BRAND }}>
                INVOICE
              </p>
              <p className="mt-1 text-xs text-[#546470]">
                No. <b className="text-[#101828]">{invoiceNo(b)}</b>
              </p>
              <p className="text-xs text-[#546470]">Issued {fmtDate(b.confirmedAt || b.createdAt)}</p>
              <span
                className="mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-black tracking-widest"
                style={{ color: chipColor, background: chipBg }}
              >
                {chipText}
              </span>
            </div>
          </div>

          {/* who / what */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#f1f9f8] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#546470]">Billed to</p>
              <p className="mt-1.5 text-base font-black">{b.userName || "Customer"}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#546470]">
                {[b.phoneNumber, b.userEmail].filter(Boolean).join(" · ")}
                {b.address ? (
                  <>
                    <br />
                    {b.address}
                  </>
                ) : null}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f1f9f8] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#546470]">Trip</p>
              <p className="mt-1.5 text-base font-black">{b.serviceName}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#546470]">
                {fmtDate(b.preferredDate, { day: "numeric", month: "long", year: "numeric" })}
                <br />
                {b.travelers} traveler{Number(b.travelers) > 1 ? "s" : ""} · Booking ID {String(b._id).slice(-8)}
              </p>
            </div>
          </div>

          {/* summary */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ["Total", m.total, "#101828"],
              ["Paid", m.paid, "#047857"],
              [b.status === "cancelled" ? "Refund due" : "Balance due", b.status === "cancelled" ? m.refundDue : m.balance, m.balance === 0 && b.status !== "cancelled" ? "#047857" : "#b45309"],
            ].map(([l, v, c]) => (
              <div key={l} className="rounded-2xl border border-[#d6e9e7] px-3 py-3 sm:px-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#546470]">{l}</p>
                <p className="mt-1 text-sm font-black sm:text-lg" style={{ color: c }}>
                  {money(v)}
                </p>
              </div>
            ))}
          </div>

          {/* items */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[440px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#f1f9f8] text-left text-[10px] font-black uppercase tracking-widest text-[#546470]">
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5 text-right">Price</th>
                  <th className="px-3 py-2.5 text-right">Qty</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#e6f1ef]">
                  <td className="px-3 py-3.5">
                    <p className="font-bold">{b.serviceName}</p>
                    <p className="text-xs text-[#546470]">Trip on {fmtDate(b.preferredDate)}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-right">{money(unit)}</td>
                  <td className="px-3 py-3.5 text-right">{b.travelers}</td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-right font-bold">{money(m.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* totals */}
          <div className="mt-5 flex justify-end">
            <div className="w-full max-w-[300px] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#546470]">Total</span>
                <b>{money(m.total)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-[#546470]">Paid</span>
                <b style={{ color: "#047857" }}>− {money(m.paid)}</b>
              </div>
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3 text-white"
                style={{ background: `linear-gradient(90deg, ${BRAND}, ${FOREST})` }}
              >
                <span className="text-xs font-black uppercase tracking-widest">{b.status === "cancelled" ? "Balance" : "Balance due"}</span>
                <b className="text-base">{money(b.status === "cancelled" ? 0 : m.balance)}</b>
              </div>
              {b.status === "awaiting_payment" && m.advanceDue > 0 && (
                <p className="text-right text-xs font-semibold" style={{ color: "#b45309" }}>
                  30% advance still due: {money(m.advanceDue)}
                </p>
              )}
            </div>
          </div>

          {/* payments */}
          {pays.length > 0 && (
            <div className="mt-8">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#546470]">Payments received</p>
              <div className="overflow-hidden rounded-2xl border border-[#d6e9e7]">
                {pays.map((p, i) => (
                  <div key={p._id || i} className="flex items-center justify-between gap-3 border-b border-[#e6f1ef] px-4 py-2.5 text-xs last:border-0">
                    <span className="text-[#546470]">
                      {fmtDateTime(p.paidAt || p.createdAt)} · <span className="font-bold capitalize text-[#101828]">{p.method || "Online"}</span>
                    </span>
                    <b>{money(p.amount)}</b>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* terms */}
          <div className="mt-8 grid gap-6 border-t border-[#e6f1ef] pt-6 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#546470]">Terms</p>
              <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-[#546470]">
                <li>• A 30% advance confirms the trip date. It is due within 72 hours of approval, otherwise the booking is cancelled.</li>
                <li>• The remaining amount (or any part of it) can be paid any time before the trip.</li>
                <li>• Changes and cancellations close 5 days before the trip. Prices are in BDT.</li>
              </ul>
            </div>
            <div className="text-right text-[11px] text-[#546470]">
              <p className="font-black" style={{ color: FOREST }}>
                Thank you for travelling with us.
              </p>
              <p>This is a computer-generated invoice.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Invoice;
