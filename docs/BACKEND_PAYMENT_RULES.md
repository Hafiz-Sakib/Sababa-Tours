# Backend changes needed for the 30% advance + billing flow

The front end (this repo) now has: the **advance countdown**, the **Billing page** (`/my-bookings/:id/billing`), **pay any amount**, the **invoice**
and the new **admin confirm flow**. This repo has no server code, so add the pieces below to your Express backend (`sababa-tours-backend`).
Adjust the names (`Booking`, `Service`, `verifyToken`, `verifyAdmin`, `req.user.uid`) to match what you already use.

Until these routes exist, the Billing page cannot take a payment (`POST /api/bookings/:id/pay` will fail) and the server will not set
`awaiting_payment` / auto-cancel. The front end already copes with a server reply that has no `booking` in it, but the server is the authority.

## The flow

1. Customer sends a request → `pending`.
2. Admin presses **Confirm**:
   * the trip date is **free** in the schedule (no other `confirmed` / `awaiting_payment` booking on that day) → `awaiting_payment`,
     `advanceAmount = 30% of total`, `payDeadline = now + 72 h`;
   * the date is **not free** → `confirmed` straight away (no advance). Flip `ADVANCE_ONLY_WHEN_SCHEDULE_FREE` to `false`
     (here and in `src/Components/Utilities/payment.js`) if you want the advance on every confirmation.
   * if the booking already has ≥ 30% paid (re-confirming after an edit) → `confirmed`.
3. Customer pays (any amount ≥ 1, up to the balance). Payments are **marked paid immediately**, nothing is verified by hand.
   As soon as total paid ≥ `advanceAmount` the booking becomes `confirmed` automatically and `payDeadline` is cleared.
4. Customer can keep paying: the rest, the full balance, or any amount, until the balance is 0.
5. 72 h pass with the advance unpaid → the server cancels the booking (`status: "cancelled"`, `cancelReason: "advance_not_paid"`).

## Booking fields to add

```js
status:        { type: String, enum: ["pending", "awaiting_payment", "confirmed", "cancelled"], default: "pending" },
advanceAmount: { type: Number, default: 0 },        // 30% of totalAmount, set when the admin confirms
advanceRequired: { type: Boolean, default: false },
confirmedAt:   Date,
payDeadline:   Date,                                  // confirmedAt + 72 h, cleared once the advance is paid
cancelReason:  String,                                // "advance_not_paid" | "customer" | "admin"
paidAmount:    { type: Number, default: 0 },
payments:      [{ amount: Number, method: String, paidAt: { type: Date, default: Date.now } }],
invoiceNo:     String,                                // optional; the front end falls back to INV-<last 6 of _id>
```

## Shared helpers

```js
const ADVANCE_PERCENT = 30;
const HOLD_HOURS = 72;
const ADVANCE_ONLY_WHEN_SCHEDULE_FREE = true;
const METHODS = ["bKash", "Nagad", "Card"];

const advanceFor = (total) => Math.ceil((total * ADVANCE_PERCENT) / 100);

// cancel every booking whose 72 h ran out without the advance
async function sweepExpired() {
  await Booking.updateMany(
    { status: "awaiting_payment", payDeadline: { $lte: new Date() }, $expr: { $lt: [{ $ifNull: ["$paidAmount", 0] }, "$advanceAmount"] } },
    { $set: { status: "cancelled", cancelReason: "advance_not_paid", payDeadline: null } },
  );
}
setInterval(() => sweepExpired().catch(console.error), 60 * 1000);
// Render's free instance sleeps, so ALSO call `await sweepExpired()` at the top of:
//   GET /api/bookings/user/:uid, GET /api/admin/bookings, POST /api/bookings/:id/pay
```

## Admin: confirm (extend `PATCH /api/admin/bookings/:id`)

```js
if (req.body.status) {
  const next = req.body.status;
  if (!["pending", "confirmed", "cancelled"].includes(next))
    return res.status(400).json({ success: false, message: "Invalid status." });

  if (next === "confirmed") {
    if (booking.status === "confirmed" || booking.status === "awaiting_payment")
      return res.status(400).json({ success: false, message: "Already confirmed." });

    const day = new Date(booking.preferredDate); day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day.getTime() + 86400000);
    const busy = await Booking.exists({
      _id: { $ne: booking._id },
      status: { $in: ["confirmed", "awaiting_payment"] },
      preferredDate: { $gte: day, $lt: nextDay },
    });
    const needAdvance = !ADVANCE_ONLY_WHEN_SCHEDULE_FREE || !busy;
    booking.advanceAmount = advanceFor(booking.totalAmount);
    if (needAdvance && (booking.paidAmount || 0) < booking.advanceAmount) {
      booking.status = "awaiting_payment";
      booking.advanceRequired = true;
      booking.confirmedAt = new Date();
      booking.payDeadline = new Date(Date.now() + HOLD_HOURS * 3600000);
    } else {
      booking.status = "confirmed";
      booking.advanceRequired = false;
      booking.payDeadline = null;
    }
  } else {
    booking.status = next;
    booking.payDeadline = null;
    if (next === "cancelled") booking.cancelReason = "admin";
  }
}
// (then the existing cleanFields / save code; keep returning { success: true, booking })
// When the total changes (travelers edited), also refresh the advance:  booking.advanceAmount = advanceFor(booking.totalAmount)
```

## Customer: pay

```js
router.post("/api/bookings/:id/pay", verifyToken, async (req, res) => {
  await sweepExpired();
  const booking = await Booking.findById(req.params.id);
  if (!booking || booking.userId !== req.user.uid)
    return res.status(404).json({ success: false, message: "Booking not found." });
  if (!["awaiting_payment", "confirmed"].includes(booking.status))
    return res.status(400).json({ success: false, message: booking.status === "cancelled"
      ? "This booking is cancelled, so it cannot be paid." : "You can pay once our team approves this booking." });

  const amount = Number(req.body.amount);
  const method = METHODS.includes(req.body.method) ? req.body.method : "Online";
  const paid = booking.paidAmount || 0;
  const balance = booking.totalAmount - paid;
  if (!Number.isInteger(amount) || amount < 1 || amount > balance)
    return res.status(400).json({ success: false, message: `Enter a whole amount between 1 and ${balance}.` });

  // atomic: only applies if nobody else paid in between
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, paidAmount: paid },
    { $inc: { paidAmount: amount }, $push: { payments: { amount, method, paidAt: new Date() } } },
    { new: true },
  );
  if (!updated) return res.status(409).json({ success: false, message: "Please try again." });

  if (updated.status === "awaiting_payment" && updated.paidAmount >= (updated.advanceAmount || advanceFor(updated.totalAmount))) {
    updated.status = "confirmed";
    updated.payDeadline = null;
    await updated.save();
  }
  res.json({ success: true, booking: updated });
});
```

## Edit / cancel rules (changes to the existing customer routes)

* **Edit** (`PATCH /api/bookings/:id`): a `confirmed` **or `awaiting_payment`** booking goes back to `pending` for re-approval
  (`booking.payDeadline = null`). Payments already made are **kept** and count again when the admin re-confirms.
  Recalculate `totalAmount` and `advanceAmount = advanceFor(totalAmount)`.
* **Cancel** (`PATCH /api/bookings/:id/cancel` and the admin cancel): set `status: "cancelled"`, `payDeadline = null`
  (`cancelReason: "customer"` / `"admin"`). `paidAmount` / `payments` stay on the record so you can refund by hand;
  the Billing page and the invoice show the "refund due" amount.
* **Delete**: unchanged (customer only when already cancelled, admin any time).
* `GET /api/bookings/user/:uid` and `GET /api/admin/bookings` must return the new fields
  (`payments`, `paidAmount`, `advanceAmount`, `payDeadline`, `confirmedAt`, `cancelReason`).
