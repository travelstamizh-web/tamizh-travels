# Project Edit History & Changelog - Tamizh Travels

This document logs all the design decisions, layout adjustments, API integrations, and code revisions implemented for the Tamizh Travels interactive outstation cab estimator.

---

## 📅 Revision History

### Phase 1: Geocoding & CORS Resolutions
* **CORS Issue Resolution**: Encountered CORS blocks when fetching `nominatim.openstreetmap.org` directly from the local browser environment (`http://localhost:4200`). Resolving this by switching the search geocoder provider to the public **Photon API** (`https://photon.komoot.io`), which natively supports CORS.
* **Photon suggestions bias**: Configured queries to target places in India as fallbacks.

### Phase 2: Dual Layout Restructuring (Desktop & Mobile)
* **Desktop Redesign**: Re-engineered styling to render as a premium full-width interactive workspace inspired by outstation portals.
  * **Brand Header**: Bold yellow banner (`#FFCC00`) with the custom car vector logo left-aligned and Hotline Support right-aligned.
  * **Interactive Calculator Card**: Styled on the left with a dark heading header, containing location inputs, distance counters, default rates, and tolls.
  * **Fare Summary Card**: Styled on the right displaying the total fare price badge, a yellow hatchback graphic model, and WhatsApp share CTA.
* **Mobile Redesign**: Recreated the app as a 6-screen responsive phone mockup layout (`DASHBOARD`, `INPUT`, `SUMMARY`, `SETTINGS`, `HISTORY`, `WHATSAPP`).
  * Implemented screen view routers and unified bottom tab navigation inside `app.component.html`.

### Phase 3: OSRM Real Road Distance Integration
* **Coordinates Caching**: Added fields in `app.component.ts` to cache coordinates of resolved places.
* **OSRM Route Finder**: Integrated the Open Source Routing Machine (`router.project-osrm.org`) to calculate driving road distance (in KM) instead of straight-line metrics.
* **Auto-Calculate Trigger**: Connected the coordinates state checks to automatically fire OSRM queries and compute total fare once both pickup and drop details are set.

### Phase 4: UI Performance & Visual Enhancements
* **300ms Input Debouncing**: Added timeouts to input keyups inside pickup/drop fields to prevent Photon geocoder queries from triggering on every keystroke.
* **Input Loading Spinners**: Added CSS rotation spinners inside fields to indicate active API lookups or GPS resolves.
* **Tamil Nadu Search Bounding Box**: Refined autocomplete query limits to a Tamil Nadu bounding box (`&bbox=76,8,80.5,14`) to filter out other states' cities.
* **CSS Overflow Fix**: Changed the desktop form card wrapper's overflow setting from `hidden` to `visible` to allow the absolute suggestions dropdown boxes to display without clipping.

### Phase 5: Support dialer connection
* **Redirection Link**: Modified the support call buttons to trigger standard phone dialer protocols:
  * Redirects to: `tel:+919597673524`

### Phase 6: Trip Type Selection Tabs
* **Interactive Tabs UI**: Implemented select bars for **One Way**, **Round Trip**, **Local**, and **Airport** cab categories on both desktop and mobile views.
* **Screenshot-Aligned Fields Dynamic Rendering**:
  * **One Way**: Renders `FROM`, `TO`, swap `⇄` location controls, `PICK UP DATE`, and `PICK UP TIME`.
  * **Round Trip**: Renders `FROM`, `TO`, swap `⇄` location controls, `PICK UP DATE`, `RETURN DATE`, and `PICK UP TIME`.
  * **Local**: Renders `CITY`, `PICK UP DATE`, and `PICK UP TIME` (hides destination input).
  * **Airport**: Renders `TRIP` type selector dropdown (Drop to Airport / Pickup from Airport) and dynamically updates pickup/drop labels (e.g. `PICKUP ADDRESS` / `DROP AIRPORT`), date, and time.
* **Dynamic Pricing Formula Adaptations**:
  * **Round Trip**: Automatically doubles the OSRM route mileage calculation for return travel, and sets the base fare to 1.5x of the default base rate.
  * **Local**: Sets base fare flat at ₹1,500 representing standard local package base (includes 80km limit). Calculates additional standard rates only on excess distance.
  * **Airport**: Sets base fare flat at ₹1,200 as flat transfer rate, and disables mileage excess additions.

### Phase 7: Split Search and Multi-Car Results Listing Page Flow
* **Search View**: Removed the instant right-column hatchback fare calculator preview from the home page. The calculator is now full-width, clean, and centers focus entirely on location/date inputs.
* **Widescreen "Select Car" Results Page**:
  * Triggered by the orange `EXPLORE CABS` button.
  * Dynamically calculates OSRM routes, geocodes input values, and moves the desktop router screen to `'RESULTS'`.
  * Renders a premium breadcrumb navigation row, travel detail summary panel, and `Modify Booking` action button (which takes user back to search inputs).
  * Includes a promotional confidence banner (Zero Cost booking, Free cancellations, Support).
  * Lists multiple available vehicles (Wagon R, Toyota Etios, Ertiga, Innova Crysta) with their respective AC/seating specifications, dynamic inclusion mileage trackers, fuel choice radio toggles, 12% discounted fares, and tax computations.
* **Integrated Booking Ticket Confirmation Modal**: Clicking `SELECT CAR` opens the pre-populated WhatsApp confirmation card matching the selected vehicle specifications.

### Phase 9: Review Your Booking Confirmation Modal
* **Interactive Booking Review Dialog**: Clicking `SELECT CAR` on any vehicle card launches the comprehensive **Review Your Booking** modal with data matching the user's selected car and trip details.
* **Modal Sections & Features**:
  * **Top Banner**: Blue `Review Your Booking` header and yellow `Free cancellation till 1 hr of departure` badge.
  * **Trip & Vehicle Summary**: Dynamic route title (e.g. `Kanchipuram ➔ Bangalore (Oneway)`), car model, fuel type (CNG/Diesel), pickup date/time, and included mileage limit.
  * **Contact & Pickup Details**: Inputs for Full Name, Mobile Number (`+91`), Email ID, alternate email, GSTIN toggles, and pickup/drop address boxes.
  * **Inclusions / Exclusions**: Green checklist for base fare, fuel, driver allowance, GST, state tax/toll, bags, AC; Red list for excess km rates and multi-stop terms with expandable policy details.
  * **Payment Options Card**: Radio selector for `Part Pay` (25% advance) vs `Full Pay` (100% full amount) with live calculations.
  * **Coupon & Offers**: Coupon input (`SAVE10`, `TAMIZH`) with instant discount deductions.
  * **Proceed CTA & Fare Breakup**: Orange `PROCEED` button and expandable fare breakup breakdown.
  * **Mobile Review Booking Screen (Exact Match)**: Re-architected `activeMobileScreen === 'REVIEW'` to match the 4 mobile reference screenshots:
    * Blue `Review Your Booking` header banner.
    * Route summary card (`Car Type`, `Fuel Type`, `Pickup Date`, `Kms included`).
    * `🟡 Free cancellation till 1 hr of departure` notice banner.
    * Passenger details card with Name, Mobile (`+91`), Email, styled Pickup/Drop location boxes, and `+ Alternate Email` / `+ Add GST` buttons.
    * `Coupon & Offers` box with `APPLY` button.
    * `SAY HELLO TO, YOUR TRAVEL EXPERT` banner with 24x7 one-touch direct call button (`+91 95976 73524`).
    * `Inclusions/Exclusions` list with expandable `Read Terms and Conditions`.
    * Sticky bottom floating payment bar with `Total Fare ℹ`, `Pay 25% (₹1,426 now)`, `Pay 100% (₹5,705)`, and orange `PAY NOW` CTA button.
  * **Header Hidden on Mobile Review Screen**: Suppressed the yellow subheader banner (`.mobile-screen-title-banner`) on `activeMobileScreen === 'REVIEW'`, allowing the mobile review page to render cleanly starting directly from `Review Your Booking`.
  * **Modal Isolation for Mobile View**: Separated `selectVehicleMobile()` from desktop `selectVehicle()` and enforced CSS `@media (max-width: 900px) { .desktop-booking-modal-overlay { display: none !important; } }`, completely preventing modal popups from showing on mobile devices.
  * **Disabled Mobile Viewport Zoom**: Configured viewport meta scaling parameters (`maximum-scale=1, user-scalable=no`) inside `index.html` to disable user pinch-zooming on mobile browsers.
  * **Dynamic Distance-Based Fare Logic**: Updated the fare engine to automatically recalculate vehicle base rates and driver allowances dynamically based on OSRM driving distances:
    * **≤ 20 km**: Hatchback rate at `₹20/km` (Driver Allowance: Nil)
    * **21–40 km**: Hatchback rate at `₹17/km` (Driver Allowance: Nil)
    * **41–100 km**: Hatchback rate at `₹14/km` (Driver Allowance: Nil)
    * **101–200 km**: Hatchback rate at `₹13/km` (Driver Allowance: `₹300`)
    * **201–300 km**: Hatchback rate at `₹12/km` (Driver Allowance: `₹300`)
    * **> 300 km**: Hatchback rate at `₹11/km` (Driver Allowance: `₹300`)
    * Dynamic rates proportionally scale other vehicle classes: Sedan (`+₹2/km`), Ertiga SUV (`+₹7/km`), and Innova Crysta (`+₹10/km`).
  * **Price Stability Fix**: Fixed an issue in `selectVehicle()` where the global `baseFare` was inadvertently mutated, ensuring prices remain completely consistent and accurately match the selected vehicle.
  * **Interactive WhatsApp Quotation Dispatcher**:
    * Integrated a text input field inside the WhatsApp preview modal footer to allow entering a custom recipient mobile number.
    * Added a native WhatsApp-green circular send button that constructs a fully formatted quotation text block (including passenger info, route directions, OSRM distance, dynamic per-km rate, base fare, tolls, and total fare) and launches the official WhatsApp API link to send it directly to the designated number.
    * Auto-populates the input with the passenger's mobile number by default.
  * **Dynamic Fare Calculations & parities**:
    * **GST @ 5%**: Calculates 5% GST on the subtotal and includes it in the final payable fare.
    * **Driver & Night Allowances**: Adds ₹300 driver allowance for routes > 100 km, and ₹200 night allowance for pickup times between 10:00 PM and 6:00 AM.
    * **Waiting Charges**: Calculates charges at ₹1/minute after 1 hour (60 minutes) based on entered waiting time.
    * **Exclusions Note**: Explicitly states in the breakdown and vehicle lists that tolls and parking charges are extra.
    * **Parity**: One-way and round trips have identical price calculations (round trips no longer double the distance rate).
    * **Default Settings**: Round Trip is now selected by default on load.
  * **Swift Dzire Exclusive Selection**:
    * Added `Swift Dzire or Equivalent` Sedan to the vehicles list.
    * Pre-selects Swift Dzire by default on results loading.
    * Disables other vehicle cards (`disabled: true`), dimming them to `0.65` opacity and marking their buttons as `UNAVAILABLE` to lock selection to Swift Dzire only.
    * Rendered the high-quality white Swift Dzire photo asset (`white-swift-dzire.jpg` under the `public/` directory) inside the desktop cab results card, mobile results card, and WhatsApp preview modal details card.
  * **Distance & Rate Adjustments**:
    * **Round Trip 2x Distance**: Multiplies the OSRM route distance by 2 for Round Trip calculations (so fare rate calculations lookup and charge correspond to the round trip distance).
    * Updated the vehicle results cards (both desktop list and mobile specs) to dynamically display the doubled mileage limit (e.g. `562 kms included`) and correct dynamic per-km post-limit rate lookup corresponding to Round Trips.
    * **One Way flat rate**: Enforces a flat ₹21/km rate for Sedan/Dzire vehicles on One Way trips (by locking the hatchback base rate to ₹19/km).
  * **API request Optimization (Duplicate Prevention)**:
    * Implemented coordinate-based cache hashing (`lastFetchedCoords`) inside `autoCalculateDistanceAndFare()` to bypass repeated OSRM router calls if the coordinates are unchanged.
    * Implemented the `sendTelegramNotification()` method, which executes on confirming a booking inside `proceedBooking()`.
    * Formats the requested ride specifications (passenger name, phone, trip type, pickup/drop locations, OSRM distance, rate per km, complete fare breakdown, and total payable price) into a markdown block and posts it directly to the Telegram bot endpoint.
    * Configured the user's provided Telegram Bot Token (`8815675673:AAHvGa3-yWIpu-6SizUCP9QZ6JguP_7Qf7k`) as the pre-configured default fallback.
    * Bypassed the WhatsApp share modal popup trigger inside `proceedBooking()` in favor of direct silent background dispatch to the Telegram channel, displaying a direct success confirmation dialog and navigating back to the home screen.
    * Replaced the mobile payment grid layout with a single, premium, full-width **Book Ride** CTA button showing the final total price, enlarging the title text to `1.15rem` and pricing text to `0.95rem` with increased padding.
  * **Favicon Integration**:
    * Generated a modern minimalist yellow app icon containing a black taxi silhouette.
    * Added it to the `public/` folder as `favicon.png` and `favicon.ico`, and updated `src/index.html` to reference `favicon.png` for high-resolution displays.
  * **Telegram Local Storage Cleanup**:
    * Removed all `localStorage` getItem/setItem hooks for `telegramBotToken` and `telegramChatId` to rely strictly on code-level properties and keep credentials out of browser local storage. Added active deletion logic in `ngOnInit()` to wipe existing keys from users' client storage.
  * **Unique Location Autocomplete Filtering**:
    * Implemented active deduplication filtering on autocomplete results fetched via Photon API inside `executePhotonSearch()`. This prevents redundant items with identical display names from rendering in the pickup and drop dropdown suggestions lists.
  * **Customer Checkout Form Validation & Styling**:
    * Updated both desktop review modal and mobile summary email input placeholders to explicitly display `Email ID (optional)`.
    * Implemented active Indian mobile number regex validation (`/^[6-9]\d{9}$/`) inside `proceedBooking()`, checking that a valid 10-digit number has been entered (and stripping formatting artifacts like spaces, dashes, parentheses, `+91`, or leading `0`).
    * Removed Part Pay/Full Pay radio button selection options on the desktop review modal and mobile summary sections. The title is now set to **Amount payable**, showing a single clean box with the final total price.
  * **Resilient Distance Calculation Engine**:
    * Implemented mathematical **Haversine Geographic Distance** (`calculateHaversineDistanceKm`) with realistic Indian road curvature scaling (1.18x - 1.28x) directly in the browser.
    * Added 2.5-second timeout (`AbortController`) to OSRM API calls, seamlessly switching to exact Haversine road distance if the public OSRM server is slow, down, or rate-limited.
    * Replaced the old dummy random number generator in `fallbackMockDistance()` with exact coordinate-based Haversine computation.
  * **Trip Type Tab Bar Visibility**:
    * Set `.desktop-trip-tabs-bar` and `.mobile-trip-tabs-bar` to `display: none !important;` in `src/app/app.component.css`, hiding the "One Way", "Round Trip", "Local", and "Airport" selector tabs.
  * **Recent Activities Label Update**:
    * Updated history headers, dashboard action cards, and empty state cards from "Recent Estimates" / "No Estimates Saved" to **Recent Activities** and **No Recent Activities**.
  * **Brand Logo & #f8bd20 Theme Color Integration**:
    * Set `--primary-yellow` in `src/styles.css` to **`#f8bd20`**.
    * Replaced SVG car icons in desktop & mobile headers and browser favicon with the custom yellow & black car artwork (`app-logo.jpg`).
  * **Universal Interactive Icon & Button Animations**:
    * Added smooth hover, wiggle/ring, spin, pulse, and tactile click-press animations across all icons:
      - **Phone Support Icons**: Phone ring/wiggle keyframes (`phoneIconWiggle`) on hover + press compression.
      - **Swap Buttons**: 180° smooth spin + `#f8bd20` glow on hover + spring bounce on click.
      - **GPS Target Icons**: Target rotation & glow on hover + pop-down press.
      - **Vehicle Cards & Images**: Forward drive translation (`translateX(6px)`) + shadow elevation on hover.
      - **Back & Close Buttons**: Arrow slide (`translateX(-4px)`) + 90° spin close on hover.
  * **Official Tariff Plan Engine & Display Card**:
    * Updated `getDynamicRatePerKm()` and `getFareBreakdown()` with exact distance tariff slabs:
      - **0 - 10 KM**: Flat ₹200 Base + 5% GST (Driver: ₹0)
      - **11 - 20 KM**: ₹20 / KM + 5% GST (Driver: ₹0)
      - **21 - 40 KM**: ₹17 / KM + 5% GST (Driver: ₹0)
      - **41 - 100 KM**: ₹14 / KM + 5% GST (Driver: ₹0)
      - **101 - 200 KM**: ₹13 / KM + 5% GST + Driver Allowance ₹300
      - **201 - 300 KM**: ₹12 / KM + 5% GST + Driver Allowance ₹300
      - **301+ KM**: ₹11 / KM + 5% GST + Driver Allowance ₹300
  * **Dynamic Current Date/Time & Past Dates Boundary**:
    * Initialized `pickupDate`, `returnDate`, and `pickupTime` to current local date/time in `ngOnInit()`.
    * Added `[min]="minDate"` boundary to date input elements, disabling past calendar dates.
  * **Supabase Database Schema & Backend API Integration**:
    * Created [supabase/schema.sql](file:///Users/babukumar/projects/tamizh-travels/supabase/schema.sql) containing PostgreSQL database tables (`bookings`, `tariff_slabs`, `vehicles`, `coupons`), seed data, and Row Level Security (RLS) policies.
    * Created [api/calculate.js](file:///Users/babukumar/projects/tamizh-travels/api/calculate.js) serverless API endpoint executing distance tariff slab calculations, driver allowances (> 100 KM), waiting charges, 5% GST, and promo discount validation.
    * Integrated `@supabase/supabase-js` `createClient` into [api/bookings.js](file:///Users/babukumar/projects/tamizh-travels/api/bookings.js) for inserting and querying PostgreSQL `bookings` table records.
    * Created [src/app/services/supabase.service.ts](file:///Users/babukumar/projects/tamizh-travels/src/app/services/supabase.service.ts) Angular service encapsulating Supabase client operations.

---

## 📂 Key Modified Code Files

* **[app.component.ts](file:///Users/babukumar/projects/tamizh-travels/src/app/app.component.ts)**: Houses the central application state machine (active screen controls, inputs, rate values), geocoding photon fetches, debouncing timeouts, OSRM distance handlers, local storage history, vehicles lists, and goHome routing logic.
* **[app.component.html](file:///Users/babukumar/projects/tamizh-travels/src/app/app.component.html)**: Defines the dual desktop/mobile interface layouts, autocomplete suggestion list render overlays, loading spinners, settings forms, multi-vehicle listings cards (both desktop and mobile), and WhatsApp overlay modals.
* **[app.component.css](file:///Users/babukumar/projects/tamizh-travels/src/app/app.component.css)**: Implements CSS rules, media query visibility bindings, position relationships, custom scrollbars, and keyframe loading animations.
* **[styles.css](file:///Users/babukumar/projects/tamizh-travels/src/styles.css)**: Holds the primary yellow/black color variables, font families, and browser body resets.
