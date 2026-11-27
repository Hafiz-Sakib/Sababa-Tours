// src/data/travel.js
// Shared editorial content for Home, Destinations, Travel Guide and Journal.

export const destinations = [
  {
    slug: "bandarban",
    key: "bandarban",
    name: "Bandarban",
    tag: "Cloud forests, hill trails, waterfalls",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1100&q=85",
    bestFor: "Adventure Seekers",
    duration: "3–5 Days",
    highlight: "Private hill guide · waterfall picnic · sunrise viewpoint",
    getting: "Reached by road from Chattogram and Dhaka. Our desk arranges private transfers and a local hill guide.",
    guide: "hills",
  },
  {
    slug: "rangamati",
    key: "rangamati",
    name: "Rangamati",
    tag: "Lake cruises, culture, calm escapes",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1100&q=85",
    bestFor: "Culture & Slow Travel",
    duration: "2–4 Days",
    highlight: "Kaptai Lake cruise · local lunch · artisan village",
    getting: "A scenic road journey from Chattogram. Boat time on the lake is built into the plan.",
    guide: "lake",
  },
  {
    slug: "coxs-bazar",
    key: "cox",
    name: "Cox's Bazar",
    tag: "Beach retreats and sunset stays",
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1100&q=85",
    bestFor: "Families & Beach Lovers",
    duration: "3–6 Days",
    highlight: "Oceanfront stay · sunset dinner · island day trip",
    getting: "Reachable by road or air. We time transfers and hotel location around your family's pace.",
    guide: "beach",
  },
];

/* General seasonal guidance, Jan → Dec. 3 = best, 2 = good, 1 = possible (heat or monsoon).
   Always confirm current conditions with the desk before travelling. */
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const seasons = {
  bandarban: [3, 3, 2, 1, 1, 1, 2, 2, 2, 3, 3, 3],
  rangamati: [3, 3, 2, 1, 1, 1, 1, 1, 2, 3, 3, 3],
  cox: [3, 3, 3, 2, 1, 1, 1, 1, 1, 2, 3, 3],
};
export const seasonLabel = { 3: "Best time", 2: "Good", 1: "Possible" };

export const articles = [
  {
    title: "Best time to visit Bangladesh's hill destinations",
    category: "Travel Tips",
    date: "Oct 2026",
    read: "3 min",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=85",
    excerpt: "A practical seasonal guide for dry trails, clear views, waterfalls, and comfortable road transfers.",
    body: [
      "The cooler, drier months from October to March give the clearest views and the most comfortable trails, which is why most hill itineraries are planned then.",
      "The rainy months bring fuller waterfalls but slippery paths and occasional road delays, so plans need more buffer time and a guide who knows the ground.",
      "Whatever the month, start early, carry water, and let the travel desk know your fitness level so the route can be matched to you.",
    ],
  },
  {
    title: "How to plan a premium family beach escape",
    category: "Planning",
    date: "Sep 2026",
    read: "4 min",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=85",
    excerpt: "The small choices that make a Cox's Bazar trip smoother for families, from hotel location to transfer timing.",
    body: [
      "Choose the hotel by walking distance to the sand and to dinner, not just by star rating. Short walks matter a lot with children.",
      "Plan beach time for early morning and late afternoon, and keep the middle of the day for rest, pool time or a short indoor activity.",
      "Share ages, nap times and food preferences with the desk up front, so transfers and meals are timed around them.",
    ],
  },
  {
    title: "Responsible travel in local communities",
    category: "Culture",
    date: "Aug 2026",
    read: "3 min",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=85",
    excerpt: "How to travel with curiosity and respect while supporting local guides, hosts, and makers.",
    body: [
      "Ask before photographing people or homes, and dress modestly when visiting villages and places of worship.",
      "Buy directly from local makers and eat where locals eat. It keeps more of your spend in the community you are visiting.",
      "Carry out what you carry in. Plastic bottles and wrappers do not belong on trails, lakes or beaches.",
    ],
  },
];

export const packing = {
  hills: [
    "Sturdy shoes with good grip",
    "Rain jacket or poncho",
    "Quick-dry clothes",
    "Reusable water bottle",
    "Insect repellent",
    "Small first-aid kit",
    "Power bank",
    "Daypack",
    "Sunscreen and hat",
    "Cash in small notes",
  ],
  lake: [
    "Sunscreen and hat",
    "Light cotton clothes",
    "Light jacket for the evening",
    "Dry bag for phone and camera",
    "Comfortable sandals",
    "Motion-sickness remedy (if you are prone)",
    "Reusable water bottle",
    "Power bank",
    "Cash in small notes",
  ],
  beach: [
    "Swimwear and a quick-dry towel",
    "Sunscreen and after-sun lotion",
    "Hat and sunglasses",
    "Flip-flops",
    "Waterproof phone pouch",
    "Modest clothes for town and local visits",
    "Reusable water bottle",
    "Power bank",
  ],
};

export const guideTips = [
  {
    q: "Before you go",
    a: "Keep copies of your ID and booking details, charge your power bank, and share your phone number and address with the travel desk. Tell us about food needs, mobility and anyone travelling with children.",
  },
  {
    q: "On the trail or the water",
    a: "Follow your guide's pace and route, stay with the group, and wear a life jacket on any boat. Start early, drink water often, and turn back if the weather changes.",
  },
  {
    q: "Staying safe at the beach",
    a: "Swim only where it is permitted and watch the warning flags. The sea can be rough in the rainy months, so stay in your depth and keep children within arm's reach.",
  },
  {
    q: "Travelling responsibly",
    a: "Ask before taking photos of people, dress modestly in villages and places of worship, buy from local makers, and take your rubbish with you.",
  },
];

export const matchesRegion = (service, region) =>
  String(service?.location || service?.name || "")
    .toLowerCase()
    .includes(region.key);
