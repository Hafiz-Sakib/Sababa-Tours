// Real payment-method logos (bKash, Nagad, Bangladesh Bank) on a white tile so they stay readable in day and night mode.
import { FiCreditCard } from "react-icons/fi";
import bkash from "../../assets/pay/bkash.svg";
import nagad from "../../assets/pay/nagad.png";
import bank from "../../assets/pay/bangladesh-bank.png";

export const PAY_LOGO = { bKash: bkash, Nagad: nagad, Bank: bank };

const SIZE = {
  sm: "h-7 w-11 rounded-lg",
  md: "h-10 w-16 rounded-xl",
  lg: "h-12 w-20 rounded-2xl",
};

const PayLogo = ({ method, size = "md", className = "" }) => (
  <span
    className={`flex shrink-0 items-center justify-center overflow-hidden bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.06)] ${SIZE[size]} ${className}`}
  >
    {PAY_LOGO[method] ? (
      <img src={PAY_LOGO[method]} alt={method} draggable={false} loading="lazy" decoding="async" className="max-h-[68%] max-w-[78%] select-none object-contain" />
    ) : (
      <FiCreditCard className="text-slate-700" size={size === "sm" ? 15 : 20} aria-label={method} />
    )}
  </span>
);

export default PayLogo;
