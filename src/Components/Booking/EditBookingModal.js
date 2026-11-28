// src/Components/Booking/EditBookingModal.js
// Small form to change a booking: travelers, trip date, phone, address, notes.
// Used by the customer (My Bookings) and by the admin (dashboard). The server recalculates the total.
import { useState } from "react";
import { FiSave, FiX } from "react-icons/fi";
import { AnimatePresence, Backdrop, ModalShell, motion } from "../ui/Motion";

const MAX_TRAVELERS = 20;
const MAX_ADDRESS_WORDS = 30;
const MAX_NOTES = 500;
const PHONE_REGEX = /^(013|014|015|016|017|018|019)\d{8}$/;

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const toInputDate = (d) => {
  if (!d) return "";
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

const cls = (err) =>
  `w-full rounded-2xl border bg-page-alt px-4 py-3 text-sm outline-none transition ${err ? "border-red-400" : "border-line focus:border-brand/60"}`;

const Field = ({ label, error, children }) => (
  <div>
    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-muted">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
  </div>
);

/* props: booking, minDate ("YYYY-MM-DD", defaults to today), saving, onSave(fields), onClose */
const EditBookingModal = ({ booking, minDate, saving, onSave, onClose }) => {
  const [travelers, setTravelers] = useState(Number(booking.travelers) || 1);
  const [date, setDate] = useState(toInputDate(booking.preferredDate));
  const [phone, setPhone] = useState(booking.phoneNumber || "");
  const [address, setAddress] = useState(booking.address || "");
  const [notes, setNotes] = useState(booking.notes || "");
  const [errors, setErrors] = useState({});
  const min = minDate || todayLocal();

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!travelers || travelers < 1 || travelers > MAX_TRAVELERS) er.travelers = `Choose between 1 and ${MAX_TRAVELERS} travelers.`;
    if (!date) er.date = "Please choose a trip date.";
    else if (date < min) er.date = "This date is too soon. Please choose a later date.";
    if (!PHONE_REGEX.test(phone)) er.phone = "Enter a valid number, e.g. 017XXXXXXXX.";
    if (!address.trim()) er.address = "Address is required.";
    else if (words(address) > MAX_ADDRESS_WORDS) er.address = `Keep the address under ${MAX_ADDRESS_WORDS} words.`;
    setErrors(er);
    if (Object.keys(er).length) return;
    onSave({ travelers: Number(travelers), preferredDate: date, phoneNumber: phone.trim(), address: address.trim(), notes: notes.trim() });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
        <Backdrop onClick={saving ? undefined : onClose} className="absolute" />
        <ModalShell className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface p-6 shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-ink">Edit booking</p>
              <h3 className="mt-1 text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>{booking.serviceName}</h3>
            </div>
            <button onClick={onClose} disabled={saving} aria-label="Close" className="rounded-xl p-2 hover:bg-sandy"><FiX size={18} /></button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Travelers" error={errors.travelers}>
                <input type="number" min={1} max={MAX_TRAVELERS} value={travelers} onChange={(e) => setTravelers(e.target.value)} className={cls(errors.travelers)} />
              </Field>
              <Field label="Trip date" error={errors.date}>
                <input type="date" min={min} value={date} onChange={(e) => setDate(e.target.value)} className={cls(errors.date)} />
              </Field>
            </div>
            <Field label="Phone" error={errors.phone}>
              <input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="017XXXXXXXX" className={cls(errors.phone)} />
            </Field>
            <Field label="Address" error={errors.address}>
              <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className={`${cls(errors.address)} resize-none`} />
            </Field>
            <Field label="Notes (optional)">
              <textarea rows={3} maxLength={MAX_NOTES} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${cls(false)} resize-none`} />
            </Field>
            <p className="text-xs text-muted">The total is recalculated from the package price and the number of travelers.</p>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-2xl border border-line py-3 text-sm font-bold text-muted hover:bg-sandy">Close</button>
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-btn py-3 text-sm font-black text-white hover:bg-brand disabled:opacity-60">
                <FiSave /> {saving ? "Saving…" : "Save changes"}
              </motion.button>
            </div>
          </form>
        </ModalShell>
      </div>
    </AnimatePresence>
  );
};

export default EditBookingModal;
