// src/Components/Utilities/bookingRules.js
// Customer change window: a booking can be edited or cancelled only until
// LOCK_DAYS days before the trip date. The admin is never limited by this.
// The backend enforces the same rule (see docs/BACKEND_BOOKING_RULES.md);
// this file only decides what the buttons show.
export const LOCK_DAYS = 5;
const DAY = 86400000;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

/* whole calendar days from today to the trip date (negative once the trip date has passed) */
export const daysUntilTrip = (preferredDate) => {
  if (!preferredDate) return null;
  return Math.round((startOfDay(preferredDate) - startOfDay(new Date())) / DAY);
};

/* what a customer may do with a booking right now */
export const customerAccess = (b) => {
  const days = daysUntilTrip(b.preferredDate);
  const open = b.status !== "cancelled";
  const inWindow = days !== null && days >= LOCK_DAYS;
  return {
    days,
    canEdit: open && inWindow,
    canCancel: open && inWindow,
    canDelete: b.status === "cancelled",
    locked: open && !inWindow,
    lockMessage:
      days !== null && days < 0
        ? "This trip date has passed, so the booking can no longer be changed."
        : `Changes and cancellations close ${LOCK_DAYS} days before the trip. Please contact our travel desk for help.`,
  };
};
