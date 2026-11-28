# Backend changes needed for booking edit / cancel / delete

> The advance / billing flow (status `awaiting_payment`, 30% advance, 72 h auto-cancel, payments) is in `BACKEND_PAYMENT_RULES.md`.
> Where the two documents differ, `BACKEND_PAYMENT_RULES.md` wins (e.g. editing an `awaiting_payment` booking also sends it back to `pending`).

The website (front end) now shows these buttons, but **the 5‑day rule must also be enforced on the server**
(`sababa-tours-backend`), otherwise anyone could call the API directly. This repo has no server code,
so add the routes below to your Express backend and adjust the names (`Booking`, `Service`, `verifyToken`,
`req.user.uid`, `booking.userId`) to match what you already use.

## Rules

| Who | Edit | Cancel | Delete |
| --- | --- | --- | --- |
| Customer | until **5 days before** the trip date | until **5 days before** the trip date | only a booking that is already **cancelled** |
| Admin | any time | any time (`status: "cancelled"`, row stays) | any time, **permanently removed** from the database |

* Editing a **confirmed** booking moves it back to **pending** so the admin re-confirms the new details.
* The total is always recalculated on the server: service price × travelers.
* Cancel and Delete are two different buttons for the admin. Cancel keeps the record; Delete removes it.

## Shared helper

```js
const LOCK_DAYS = 5;
const DAY = 86400000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
// use the server's local day; if Render runs in UTC and you want Bangladesh days, shift by +6h first
const daysUntilTrip = (date) => Math.round((startOfDay(date) - startOfDay(new Date())) / DAY);
const LOCK_MSG = `Changes and cancellations close ${LOCK_DAYS} days before the trip. Please contact our travel desk for help.`;

const PHONE_REGEX = /^(013|014|015|016|017|018|019)\d{8}$/;
function cleanFields(body) {
  const out = {};
  if (body.travelers !== undefined) {
    const n = Number(body.travelers);
    if (!Number.isInteger(n) || n < 1 || n > 20) throw new Error("Travelers must be between 1 and 20.");
    out.travelers = n;
  }
  if (body.preferredDate !== undefined) {
    if (isNaN(new Date(body.preferredDate))) throw new Error("Please provide a valid trip date.");
    out.preferredDate = new Date(body.preferredDate);
  }
  if (body.phoneNumber !== undefined) {
    if (!PHONE_REGEX.test(String(body.phoneNumber))) throw new Error("Enter a valid phone number, e.g. 017XXXXXXXX.");
    out.phoneNumber = String(body.phoneNumber);
  }
  if (body.address !== undefined) {
    const a = String(body.address).trim();
    if (!a || a.split(/\s+/).length > 30) throw new Error("Address is required and must be under 30 words.");
    out.address = a;
  }
  if (body.notes !== undefined) out.notes = String(body.notes).trim().slice(0, 500);
  return out;
}
async function recalcTotal(booking) {
  const service = await Service.findById(booking.serviceId);
  const price = parseFloat(String(service?.balance).replace(/[^0-9.]/g, "")) || 0;
  return Math.round(price * booking.travelers);
}
```

## Customer routes (Firebase token → `req.user.uid`)

```js
// Edit
router.patch("/api/bookings/:id", verifyToken, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking || booking.userId !== req.user.uid)
    return res.status(404).json({ success: false, message: "Booking not found." });
  if (booking.status === "cancelled")
    return res.status(400).json({ success: false, message: "A cancelled booking cannot be edited." });
  if (daysUntilTrip(booking.preferredDate) < LOCK_DAYS)
    return res.status(403).json({ success: false, message: LOCK_MSG });
  try {
    const fields = cleanFields(req.body);
    if (fields.preferredDate && daysUntilTrip(fields.preferredDate) < LOCK_DAYS)
      return res.status(400).json({ success: false, message: `The new trip date must be at least ${LOCK_DAYS} days from today.` });
    Object.assign(booking, fields);
    booking.totalAmount = await recalcTotal(booking);
    if (booking.status === "confirmed") booking.status = "pending";
    await booking.save();
    res.json({ success: true, booking });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// Cancel: add the same lock check to your existing PATCH /api/bookings/:id/cancel
//   if (daysUntilTrip(booking.preferredDate) < LOCK_DAYS)
//     return res.status(403).json({ success: false, message: LOCK_MSG });

// Delete (only already-cancelled bookings)
router.delete("/api/bookings/:id", verifyToken, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking || booking.userId !== req.user.uid)
    return res.status(404).json({ success: false, message: "Booking not found." });
  if (booking.status !== "cancelled")
    return res.status(400).json({ success: false, message: "Please cancel the booking first, then delete it." });
  await booking.deleteOne();
  res.json({ success: true });
});
```

## Admin route (extend the existing `PATCH /api/admin/bookings/:id`)

It already accepts `{ status }`. Let it also accept the editable fields (no date limit for the admin):

```js
router.patch("/api/admin/bookings/:id", verifyAdmin, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });
  try {
    if (req.body.status) {
      if (!["pending", "confirmed", "cancelled"].includes(req.body.status))
        return res.status(400).json({ success: false, message: "Invalid status." });
      booking.status = req.body.status;
    }
    const fields = cleanFields(req.body);
    Object.assign(booking, fields);
    if (fields.travelers) booking.totalAmount = await recalcTotal(booking);
    await booking.save();
    res.json({ success: true, booking });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});
// DELETE /api/admin/bookings/:id already removes the document permanently (keep it).
```

The front end reads `result.booking` when the server returns it and falls back to its own calculation otherwise.
