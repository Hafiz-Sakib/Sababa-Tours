import { fireEvent, render, screen } from "@testing-library/react";
import EditBookingModal from "./EditBookingModal";

const future = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
const booking = {
  serviceName: "Bandarban Trek", travelers: 4, preferredDate: future, phoneNumber: "01712345678", address: "House 1, Dhaka", notes: "",
  category: "Family",
  traveler: { fullName: "Rahim Uddin", nationality: "Bangladeshi", children: 1, emergencyName: "", emergencyPhone: "" },
  hotel: { needed: true, roomType: "Deluxe", rooms: 2, bedType: "Twin", mealPlan: "Breakfast", nights: 3 },
  flight: { mode: "own", departFrom: "Dhaka", airline: "Biman", flightNo: "BG435", arrivalTime: "09:30" },
};

test("edit modal shows the saved trip details and saves them back", () => {
  const onSave = jest.fn();
  render(<EditBookingModal booking={booking} saving={false} onSave={onSave} onClose={() => {}} />);
  expect(screen.getByDisplayValue("Rahim Uddin")).toBeInTheDocument();
  expect(screen.getByDisplayValue("BG435")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: /Luxury Suite/ }));
  fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
  expect(onSave).toHaveBeenCalledTimes(1);
  const p = onSave.mock.calls[0][0];
  expect(p.hotel.roomType).toBe("Luxury Suite");
  expect(p.hotel.rooms).toBe(2);
  expect(p.flight).toMatchObject({ mode: "own", flightNo: "BG435", arrivalTime: "09:30" });
  expect(p.traveler.fullName).toBe("Rahim Uddin");
  expect(p.category).toBe("Family");
});

test("edit modal blocks save when the lead traveler name is missing", () => {
  const onSave = jest.fn();
  render(<EditBookingModal booking={{ ...booking, traveler: { ...booking.traveler, fullName: "" } }} saving={false} onSave={onSave} onClose={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByText(/full name/i, { selector: "p" })).toBeInTheDocument();
});
