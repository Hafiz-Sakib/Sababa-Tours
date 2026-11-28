// src/Components/Pages/Contact.js
// The "Talk to Us" half of the Meet Us page (hero + tab switch live in MeetUs.js).
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiCompass,
  FiCopy,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSend,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { BlurAccordion, Reveal, TiltCard } from "../ui/Motion";

const EMAIL = "hello@sababatours.com";

const nextSteps = [
  { title: "We read your message", text: "A real person on the travel desk reviews your plan, dates and group size." },
  { title: "We reply within 24 hours", text: "You get questions, ideas and a suggested route, never a hard sell." },
  { title: "You decide", text: "Happy with the plan? Send a request. Not sure? Keep talking to us." },
];

const contactFaqs = [
  { q: "Do I need to know my exact dates?", a: "No. Share a rough month or a range and we will suggest what works best for the place you want." },
  { q: "Can I plan for a group or a family?", a: "Yes. Tell us group size, ages and any needs, and we will shape the pace and stays around them." },
  { q: "Is there a fee to enquire?", a: "No. Sending an enquiry is free, and booking requests do not need payment up front." },
  { q: "Prefer to pick a package first?", a: "Browse the packages and send a booking request in a few steps. You can track it in My Bookings." },
];

const WEB3FORMS_ACCESS_KEY = "fa7f8ec7-a4a8-424b-8efd-9b6387755682";

const SuccessModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-scrim/80 backdrop-blur-sm px-4">
    <div className="relative w-full max-w-md bg-surface rounded-3xl p-10 text-center shadow-2xl">
      <button
        onClick={onClose}
        className="absolute right-6 top-6 text-muted hover:text-ink transition"
        aria-label="Close"
      >
        <FiX size={28} />
      </button>

      <div className="mx-auto w-20 h-20 flex items-center justify-center bg-brand/10 rounded-full text-6xl text-brand-ink mb-6">
        <FiCheckCircle />
      </div>

      <h3 className="text-3xl font-black text-ink">Message Received</h3>
      <p className="mt-4 text-muted leading-relaxed">
        Thank you! Our travel desk will reply within 24 hours.
      </p>

      <button
        onClick={onClose}
        className="mt-8 w-full py-4 bg-btn text-white font-black uppercase tracking-widest rounded-2xl hover:bg-brand transition"
      >
        Back to Homepage
      </button>
    </div>
  </div>
);

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      toast.success("Email copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy. Please select the email manually.");
    }
  };

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    if (errors[event.target.name])
      setErrors({ ...errors, [event.target.name]: "" });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.email) nextErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      nextErrors.email = "Enter a valid email.";
    if (!form.subject.trim()) nextErrors.subject = "Subject is required.";
    if (!form.message.trim()) nextErrors.message = "Message is required.";
    else if (form.message.trim().length < 20)
      nextErrors.message = "Message must be at least 20 characters.";
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const payload = new FormData();
    payload.append("access_key", WEB3FORMS_ACCESS_KEY);
    payload.append("name", form.name);
    payload.append("email", form.email);
    payload.append(
      "subject",
      form.subject || "New Sababa Tours Contact Form Submission",
    );
    payload.append("message", form.message);
    payload.append("from_name", "Sababa Tours Website");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: payload,
      });
      const result = await response.json();

      if (!response.ok || !result.success) throw new Error();

      setSuccess(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      toast.success("Message sent successfully!");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full border bg-page-alt px-6 py-4 rounded-2xl focus:outline-none text-base transition-all ${
      errors[field]
        ? "border-red-500"
        : "border-line focus:border-brand"
    }`;

  return (
    <>
      {success && <SuccessModal onClose={() => setSuccess(false)} />}

      {/* Quick channels */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 -mt-10 relative z-10">
        <div className="grid gap-4 md:grid-cols-3">
          <TiltCard max={3} className="rounded-3xl">
            <div className="h-full rounded-3xl border border-line bg-surface p-6 shadow-lg">
              <FiMail className="text-2xl text-brand-ink" />
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted">Email the desk</p>
              <p className="mt-1 break-all font-bold">{EMAIL}</p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={copyEmail} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-bold transition hover:bg-page">
                  {copied ? <FiCheckCircle className="text-brand-ink" /> : <FiCopy />} {copied ? "Copied" : "Copy"}
                </button>
                <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 rounded-full bg-btn px-4 py-2 text-xs font-bold text-white transition hover:bg-brand">Write</a>
              </div>
            </div>
          </TiltCard>
          <TiltCard max={3} className="rounded-3xl">
            <div className="h-full rounded-3xl border border-line bg-surface p-6 shadow-lg">
              <FiClock className="text-2xl text-brand-ink" />
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-muted">Reply time</p>
              <p className="mt-1 text-3xl font-black">Within 24 hours</p>
              <p className="mt-2 text-sm text-muted">Send your plan and we will come back with next steps.</p>
            </div>
          </TiltCard>
          <TiltCard max={3} className="rounded-3xl">
            <Link to="/services" className="group block h-full rounded-3xl bg-panel2 p-6 text-on shadow-lg">
              <FiCompass className="text-2xl text-accent-lt" />
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-on/60">Already know where?</p>
              <p className="mt-1 text-2xl font-black">Send a request from a package</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-accent-lt transition-all group-hover:gap-4">Browse packages <FiArrowRight /></span>
            </Link>
          </TiltCard>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 lg:px-10 grid lg:grid-cols-2 gap-16">
        {/* Contact Info */}
        <aside className="space-y-10">
          <div>
            <p className="text-brand-ink uppercase tracking-widest text-sm font-bold">
              Concierge Desk
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight">
              Planning starts with a good conversation.
            </h2>
            <p className="mt-6 text-lg text-muted">
              Our team is ready to help shape your dream trip.
            </p>
          </div>

          {[
            {
              icon: <FiMapPin className="text-3xl" />,
              label: "Office",
              value: "Chittagong, Bangladesh",
            },
            {
              icon: <FiMail className="text-3xl" />,
              label: "Email",
              value: "hello@sababatours.com",
            },
            {
              icon: <FiPhone className="text-3xl" />,
              label: "Phone",
              value: "+880 1XXX-XXXXXX",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex gap-6 bg-surface border border-line p-7 rounded-3xl"
            >
              <div className="text-brand-ink">{item.icon}</div>
              <div>
                <p className="font-bold uppercase tracking-widest text-sm text-muted">
                  {item.label}
                </p>
                <p className="text-lg font-medium mt-1">{item.value}</p>
              </div>
            </div>
          ))}

          <div className="rounded-3xl overflow-hidden border border-line">
            <iframe
              title="Sababa Tours location"
              src="https://maps.google.com/maps?q=Chittagong+Bangladesh&output=embed"
              width="100%"
              height="300"
              className="w-full"
              loading="lazy"
            />
          </div>
        </aside>

        {/* Contact Form - More Compact */}
        <div className="bg-surface border border-line rounded-3xl p-8 md:p-10 shadow-sm">
          <p className="text-brand-ink uppercase tracking-widest text-sm font-bold">
            Trip Inquiry
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Request a custom plan.
          </h2>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">
                  Full Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className={inputClass("name")}
                />
                {errors.name && (
                  <p className="mt-1 text-red-600 text-sm">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={inputClass("email")}
                />
                {errors.email && (
                  <p className="mt-1 text-red-600 text-sm">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">
                Subject
              </label>
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Private trip inquiry"
                className={inputClass("subject")}
              />
              {errors.subject && (
                <p className="mt-1 text-red-600 text-sm">{errors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">
                Message
              </label>
              <textarea
                name="message"
                rows={5}
                required
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us your destination, preferred dates, group size, and travel style..."
                className={`${inputClass("message")} resize-none min-h-[120px]`}
              />
              {errors.message && (
                <p className="mt-1 text-red-600 text-sm">{errors.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-btn text-white font-black uppercase tracking-widest rounded-2xl hover:bg-brand transition disabled:opacity-70 flex items-center justify-center gap-3"
            >
              {loading ? "Sending..." : "Send Inquiry"} <FiSend />
            </button>
          </form>
        </div>
      </section>

      {/* What happens next + FAQ */}
      <section className="bg-surface py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid gap-14 lg:grid-cols-2">
          <Reveal>
            <p className="text-brand-ink uppercase tracking-widest text-sm font-bold">What happens next</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-black">Three steps, no pressure.</h2>
            <ol className="mt-8 space-y-6">
              {nextSteps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-btn text-sm font-bold text-white">{i + 1}</span>
                  <div>
                    <p className="font-bold">{s.title}</p>
                    <p className="text-sm text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
              <Link to="/destinations" className="rounded-full border border-line px-5 py-2.5 transition hover:bg-page">Explore destinations</Link>
              <Link to="/guide" className="rounded-full border border-line px-5 py-2.5 transition hover:bg-page">Travel guide</Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <BlurAccordion items={contactFaqs} />
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default Contact;
