// src/Components/Billing/InvoiceModal.js
// Invoice in a popup with a print / save-as-PDF button (used by the admin dashboard).
import { FiPrinter, FiX } from "react-icons/fi";
import { AnimatePresence, Backdrop, motion } from "../ui/Motion";
import Invoice from "./Invoice";

const InvoiceModal = ({ booking, onClose }) => (
  <AnimatePresence>
    {booking && (
      <div className="fixed inset-0 z-[85] flex items-start justify-center overflow-y-auto px-3 py-6 print:static print:block print:overflow-visible print:p-0">
        <div className="print:hidden">
          <Backdrop onClick={onClose} className="fixed" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="relative w-full max-w-[860px]"
        >
          <div className="mb-3 flex justify-end gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-btn px-4 py-2.5 text-xs font-black text-white hover:bg-brand"
            >
              <FiPrinter /> Print / Save PDF
            </button>
            <button onClick={onClose} aria-label="Close" className="rounded-xl bg-surface p-2.5 text-ink hover:bg-sandy">
              <FiX size={16} />
            </button>
          </div>
          <Invoice b={booking} />
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default InvoiceModal;
