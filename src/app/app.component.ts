import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface HistoryItem {
  id: number;
  pickup: string;
  drop: string;
  distance: number;
  ratePerKm: number;
  baseFare: number;
  tollParking: number;
  waitingCharges: number;
  fare: number;
  date: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  // Mobile router state: 'DASHBOARD' | 'INPUT' | 'SUMMARY' | 'SETTINGS' | 'HISTORY' | 'WHATSAPP'
  activeMobileScreen: string = 'DASHBOARD';

  // Modal display toggles
  showAboutModal: boolean = false;
  showWhatsAppModal: boolean = false;
  whatsappRecipientNumber: string = '';
  lastFetchedCoords: string = '';
  telegramBotToken: string = '8815675673:AAHvGa3-yWIpu-6SizUCP9QZ6JguP_7Qf7k';
  telegramChatId: string = '5257290283';
  settingTelegramBotToken: string = '8815675673:AAHvGa3-yWIpu-6SizUCP9QZ6JguP_7Qf7k';
  settingTelegramChatId: string = '';
  showSaveSuccess: boolean = false;
  selectedTripType: string = 'Round Trip';
  activeDesktopScreen: string = 'SEARCH'; // 'SEARCH' | 'RESULTS'

  selectedVehicle: any = null;

  // Booking Confirmation Modal & Customer Form State
  showBookingModal: boolean = false;
  customerName: string = '';
  customerPhone: string = '';
  customerEmail: string = '';
  alternateEmail: string = '';
  gstNumber: string = '';
  showAlternateEmail: boolean = false;
  showGstInput: boolean = false;
  selectedPaymentOption: 'PART' | 'FULL' = 'PART';
  couponCode: string = '';
  couponApplied: boolean = false;
  couponDiscount: number = 0;
  showFareBreakup: boolean = true;
  showTerms: boolean = false;

  getDetailedFormattedDate(dateStr: string, timeStr: string): string {
    if (!dateStr) dateStr = this.pickupDate || '2026-08-09';
    if (!timeStr) timeStr = this.pickupTime || '07:00';

    const d = new Date(dateStr);
    const day = isNaN(d.getDate()) ? 9 : d.getDate();
    let suffix = 'th';
    if (day % 10 === 1 && day !== 11) suffix = 'st';
    else if (day % 10 === 2 && day !== 12) suffix = 'nd';
    else if (day % 10 === 3 && day !== 13) suffix = 'rd';

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = !isNaN(d.getMonth()) ? months[d.getMonth()] : 'August';
    const year = !isNaN(d.getFullYear()) ? d.getFullYear() : 2026;

    const formattedTime = this.getFormattedTime(timeStr);
    return `${day}${suffix} ${monthName} ${year}, ${formattedTime}`;
  }

  getBookingTotalFare(): number {
    if (this.selectedVehicle) {
      return this.getVehicleFare(this.selectedVehicle) - this.couponDiscount;
    }
    return (this.totalFare || 0) - this.couponDiscount;
  }

  getBookingBaseFare(): number {
    const total = this.selectedVehicle ? this.getVehicleFare(this.selectedVehicle) : (this.totalFare || 0);
    return Math.max(0, total - (this.tollParking || 0));
  }

  getPartPayAmount(): number {
    return Math.round(this.getBookingTotalFare() * 0.25);
  }

  getFullPayAmount(): number {
    return this.getBookingTotalFare();
  }

  applyCoupon() {
    if (this.couponCode.trim().toUpperCase() === 'SAVE10' || this.couponCode.trim().toUpperCase() === 'TAMIZH') {
      this.couponDiscount = Math.round(this.getBookingTotalFare() * 0.1);
      this.couponApplied = true;
      alert(`Coupon ${this.couponCode.toUpperCase()} applied! You saved ₹${this.couponDiscount}`);
    } else if (this.couponCode.trim()) {
      this.couponDiscount = 150;
      this.couponApplied = true;
      alert(`Special Coupon ${this.couponCode.toUpperCase()} applied! You saved ₹150`);
    }
  }

  proceedBooking() {
    if (!this.customerName.trim() || !this.customerPhone.trim()) {
      alert('Please enter your Full Name and Mobile Number to proceed.');
      return;
    }

    // Clean phone number: remove spaces, dashes, parentheses, and '+91' or leading '0'
    let rawPhone = this.customerPhone.replace(/[\s\-\(\)\+]/g, '');
    if (rawPhone.startsWith('91')) {
      rawPhone = rawPhone.substring(2);
    } else if (rawPhone.startsWith('0')) {
      rawPhone = rawPhone.substring(1);
    }

    // Validate 10-digit Indian Mobile Number pattern (starts with 6-9)
    const indianMobileRegex = /^[6-9]\d{9}$/;
    if (!indianMobileRegex.test(rawPhone)) {
      alert('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    // Assign the cleaned 10-digit number back for clean notification logging
    this.customerPhone = rawPhone;

    this.showBookingModal = false;
    this.sendTelegramNotification();
    alert('Booking Request Sent successfully! Our representative will call you shortly.');
    this.goHome();
  }

  vehiclesList = [
    {
      name: 'Swift Dzire or Equivalent',
      rating: '4.6 ★',
      desc: 'or equivalent | 4 seater AC Cab',
      baseRate: 16,
      baseFareOffset: 120,
      image: 'white-swift-dzire.jpg',
      fuelType: 'Petrol',
      luggageCharge: 149,
      disabled: false
    },
    {
      name: 'Wagon R or Equivalent',
      rating: '4.5 ★',
      desc: 'or equivalent | 4 seater AC Cab',
      baseRate: 14,
      baseFareOffset: 100,
      image: 'wagon-r.png',
      fuelType: 'CNG',
      luggageCharge: 149,
      disabled: true
    },
    {
      name: 'Toyota Etios or Equivalent',
      rating: '4.5 ★',
      desc: 'or equivalent | 4 seater AC Cab',
      baseRate: 16,
      baseFareOffset: 120,
      image: 'etios.png',
      fuelType: 'CNG',
      luggageCharge: 149,
      disabled: true
    },
    {
      name: 'Ertiga or Equivalent',
      rating: '4.7 ★',
      desc: 'or equivalent | 6 seater AC Cab',
      baseRate: 21,
      baseFareOffset: 180,
      image: 'ertiga.png',
      fuelType: 'CNG',
      luggageCharge: 149,
      disabled: true
    },
    {
      name: 'Innova Crysta',
      rating: '4.8 ★',
      desc: 'or equivalent | 7 seater AC Cab',
      baseRate: 28,
      baseFareOffset: 250,
      image: 'innova.png',
      fuelType: 'Diesel',
      luggageCharge: 149,
      disabled: true
    }
  ];

  // Form Estimator Fields (empty by default)
  pickupLocation: string = '';
  dropLocation: string = '';
  distance: number | null = null;
  ratePerKm: number = 16.00;
  baseFare: number = 80;
  tollParking: number = 0;
  waitingCharges: number = 0;
  waitingTime: number = 0;
  totalFare: number | null = null;

  // Screen date and time selectors (defaults matching screenshots)
  pickupDate: string = '2026-08-05';
  pickupTime: string = '03:15';
  returnDate: string = '2026-08-05';
  airportTripType: string = 'Drop to Airport'; // 'Drop to Airport' | 'Pickup from Airport'

  swapLocations() {
    const tempLoc = this.pickupLocation;
    this.pickupLocation = this.dropLocation;
    this.dropLocation = tempLoc;

    const tempCoords = this.pickupCoords;
    this.pickupCoords = this.dropCoords;
    this.dropCoords = tempCoords;

    if (this.pickupCoords && this.dropCoords) {
      this.autoCalculateDistanceAndFare();
    } else if (this.distance) {
      this.recalculateTotalFare();
    }
  }

  // Geocoding coordinates states
  pickupCoords: { lat: number; lon: number } | null = null;
  dropCoords: { lat: number; lon: number } | null = null;
  pickupSuggestions: any[] = [];
  dropSuggestions: any[] = [];
  activeSuggestionField: 'pickup' | 'drop' | null = null;
  isLocating: boolean = false;
  isLoadingPickup: boolean = false;
  isLoadingDrop: boolean = false;

  // Debouncing timers
  private debounceTimeoutPickup: any;
  private debounceTimeoutDrop: any;

  // Settings properties
  settingRatePerKm: number = 16.00;
  settingBaseFare: number = 80;
  settingWaitingChargesPerHour: number = 150;
  selectedVehicleType: string = 'Hatchback (4 Seater)';

  // Static Getaway/History Database
  historyList: HistoryItem[] = [];

  ngOnInit() {
    const stored = localStorage.getItem('tamizh_travels_mockup_history');
    if (stored) {
      try {
        this.historyList = JSON.parse(stored);
      } catch (e) {
        console.error('Could not parse history list.');
      }
    }

    // Close suggestions on outside clicks
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.desktop-form-input-card') && !target.closest('.mobile-form-input-card')) {
        this.activeSuggestionField = null;
      }
    });

    // Geolocation startup request removed.
  }

  // --- REAL-TIME GEOCODING & ROUTING API (OSRM + NOMINATIM) ---

  fetchJsonp(url: string, callbackName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const separator = url.includes('?') ? '&' : '?';
      const jsonpUrl = `${url}${separator}json_callback=${callbackName}`;

      const script = document.createElement('script');
      script.src = jsonpUrl;
      script.async = true;

      (window as any)[callbackName] = (data: any) => {
        resolve(data);
        cleanup();
      };

      script.onerror = (err) => {
        reject(err);
        cleanup();
      };

      document.body.appendChild(script);

      function cleanup() {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        delete (window as any)[callbackName];
      }
    });
  }

  fetchLocationSuggestions(query: string, field: 'pickup' | 'drop') {
    if (field === 'pickup') {
      this.pickupLocation = query;
      this.pickupCoords = null;
      this.distance = null;
      this.totalFare = null;

      clearTimeout(this.debounceTimeoutPickup);
      if (!query || query.trim().length < 3) {
        this.pickupSuggestions = [];
        this.isLoadingPickup = false;
        return;
      }
      this.isLoadingPickup = true;
      this.debounceTimeoutPickup = setTimeout(() => {
        this.executePhotonSearch(query, 'pickup');
      }, 300);
    } else {
      this.dropLocation = query;
      this.dropCoords = null;
      this.distance = null;
      this.totalFare = null;

      clearTimeout(this.debounceTimeoutDrop);
      if (!query || query.trim().length < 3) {
        this.dropSuggestions = [];
        this.isLoadingDrop = false;
        return;
      }
      this.isLoadingDrop = true;
      this.debounceTimeoutDrop = setTimeout(() => {
        this.executePhotonSearch(query, 'drop');
      }, 300);
    }
  }

  executePhotonSearch(query: string, field: 'pickup' | 'drop') {
    let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=15&bbox=68,6,97.5,37&osm_tag=!boundary`;

    // Bias search to nearby locations if pickup coordinates are known
    if (field === 'drop' && this.pickupCoords) {
      url += `&lat=${this.pickupCoords.lat}&lon=${this.pickupCoords.lon}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const features = data.features || [];

        // Exclude boundary polygons (taluks/counties/districts centroids) which skew coordinates
        const validFeatures = features.filter((f: any) => {
          const p = f.properties;
          return p && p.osm_key !== 'boundary' && p.type !== 'county' && p.type !== 'state';
        });

        const targetList = validFeatures.length > 0 ? validFeatures : features;

        const suggestions = targetList.map((f: any) => {
          const p = f.properties;
          const nameParts = [p.district || p.county, p.city, p.state].filter(val => val && val !== p.name);
          const uniqueParts = Array.from(new Set(nameParts));
          const displayName = p.name + (uniqueParts.length > 0 ? ', ' + uniqueParts.join(', ') : '');
          return {
            display_name: displayName,
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0]
          };
        });

        // Filter duplicate display names to maintain a clean unique list
        const uniqueSuggestions: any[] = [];
        const seenNames = new Set<string>();
        for (const item of suggestions) {
          if (!seenNames.has(item.display_name)) {
            seenNames.add(item.display_name);
            uniqueSuggestions.push(item);
          }
        }

        if (field === 'pickup') {
          this.pickupSuggestions = uniqueSuggestions;
          this.activeSuggestionField = 'pickup';
          this.isLoadingPickup = false;
        } else {
          this.dropSuggestions = uniqueSuggestions;
          this.activeSuggestionField = 'drop';
          this.isLoadingDrop = false;
        }
      })
      .catch(err => {
        console.error('Error fetching suggestions from Photon:', err);
        if (field === 'pickup') {
          this.pickupSuggestions = [];
          this.isLoadingPickup = false;
        } else {
          this.dropSuggestions = [];
          this.isLoadingDrop = false;
        }
      });
  }

  selectGeocodedLocation(item: any, field: 'pickup' | 'drop') {
    const rawName = item.display_name;
    const parts = rawName.split(',');
    // Extract first two details for clean reading (e.g. "Ranipet, Vellore District")
    const cleanLabel = parts[0].trim() + (parts[1] ? ', ' + parts[1].trim() : '');

    if (field === 'pickup') {
      this.pickupLocation = cleanLabel;
      this.pickupCoords = { lat: parseFloat(item.lat), lon: parseFloat(item.lon) };
      this.pickupSuggestions = [];
      this.activeSuggestionField = null;
    } else {
      this.dropLocation = cleanLabel;
      this.dropCoords = { lat: parseFloat(item.lat), lon: parseFloat(item.lon) };
      this.dropSuggestions = [];
      this.activeSuggestionField = null;
    }

    // Automatically calculate distance and fare if both locations are selected
    if (this.pickupCoords && this.dropCoords) {
      this.autoCalculateDistanceAndFare();
    }
  }



  // Navigation handlers
  setMobileScreen(screen: string) {
    this.activeMobileScreen = screen;
    this.showSaveSuccess = false;

    // Sync settings fields if transitioning to Settings
    if (screen === 'SETTINGS') {
      this.settingRatePerKm = this.ratePerKm;
      this.settingBaseFare = this.baseFare;
      this.settingTelegramBotToken = this.telegramBotToken;
      this.settingTelegramChatId = this.telegramChatId;
    }
  }

  goHome() {
    this.activeDesktopScreen = 'SEARCH';
    this.setMobileScreen('DASHBOARD');
  }

  // Settings checks handlers
  onVehicleTypeChange(type: string) {
    this.selectedVehicleType = type;
    if (type.startsWith('Hatchback')) {
      this.settingRatePerKm = 16.00;
      this.settingBaseFare = 80;
      this.settingWaitingChargesPerHour = 150;
    } else if (type.startsWith('Sedan')) {
      this.settingRatePerKm = 18.00;
      this.settingBaseFare = 100;
      this.settingWaitingChargesPerHour = 150;
    } else if (type.startsWith('SUV')) {
      this.settingRatePerKm = 22.00;
      this.settingBaseFare = 150;
      this.settingWaitingChargesPerHour = 200;
    } else if (type.startsWith('Tempo')) {
      this.settingRatePerKm = 30.00;
      this.settingBaseFare = 250;
      this.settingWaitingChargesPerHour = 300;
    }
  }

  // Estimator math

  selectTripType(type: string) {
    this.selectedTripType = type;

    // Adjust default base fares dynamically based on trip type selections
    if (type === 'One Way') {
      this.baseFare = this.settingBaseFare;
    } else if (type === 'Round Trip') {
      this.baseFare = Math.round(this.settingBaseFare * 1.5);
    } else if (type === 'Local') {
      this.baseFare = 1500; // Local 8hr/80km package base
    } else if (type === 'Airport') {
      this.baseFare = 1200; // Flat airport transfer rate
    }

    if (this.pickupCoords && this.dropCoords) {
      this.autoCalculateDistanceAndFare();
    } else if (this.distance) {
      this.recalculateTotalFare();
    }
  }

  recalculateTotalFare() {
    if (this.distance !== null) {
      const dummyHatchback = { name: 'Wagon R or Equivalent', baseRate: 14, baseFareOffset: 100 };
      this.totalFare = this.getVehicleFare(dummyHatchback);
    }
  }

  calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const crowFlies = R * c;

    // Apply real-world road curvature factor (1.15x for short city trips, 1.25x for intercity)
    if (crowFlies < 1) {
      return 1;
    } else if (crowFlies < 5) {
      return Math.max(1, Math.round(crowFlies * 1.18));
    } else if (crowFlies < 20) {
      return Math.round(crowFlies * 1.24);
    } else {
      return Math.round(crowFlies * 1.28);
    }
  }

  async autoCalculateDistanceAndFare() {
    if (!this.pickupCoords || !this.dropCoords) return;

    const coordKey = `${this.pickupCoords.lat},${this.pickupCoords.lon}-${this.dropCoords.lat},${this.dropCoords.lon}`;
    if (this.lastFetchedCoords === coordKey && this.distance !== null) {
      this.recalculateTotalFare();
      return;
    }

    this.isLocating = true;
    this.isLoadingPickup = true;
    this.isLoadingDrop = true;

    // Compute exact geographic Haversine road distance as baseline
    const haversineDist = this.calculateHaversineDistanceKm(
      this.pickupCoords.lat,
      this.pickupCoords.lon,
      this.dropCoords.lat,
      this.dropCoords.lon
    );

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${this.pickupCoords.lon},${this.pickupCoords.lat};${this.dropCoords.lon},${this.dropCoords.lat}?overview=false`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(osrmUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data && data.routes && data.routes.length > 0 && data.routes[0].distance) {
        this.distance = Math.max(1, Math.round(data.routes[0].distance / 1000));
        this.lastFetchedCoords = coordKey;
      } else {
        this.distance = haversineDist;
        this.lastFetchedCoords = coordKey;
      }
    } catch (e) {
      console.warn('OSRM routing lookup failed or timed out, using Haversine road distance:', e);
      this.distance = haversineDist;
      this.lastFetchedCoords = coordKey;
    }

    this.recalculateTotalFare();

    this.isLocating = false;
    this.isLoadingPickup = false;
    this.isLoadingDrop = false;
  }

  // Estimator math
  getFormattedDate(dateStr: string): string {
    if (!dateStr) return '05-08-2026';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD to DD-MM-YYYY
    }
    return dateStr;
  }

  getFormattedTime(timeStr: string): string {
    if (!timeStr) return '7:00 AM';
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      let hr = parseInt(parts[0]);
      const min = parts[1];
      const ampm = hr >= 12 ? 'PM' : 'AM';
      hr = hr % 12;
      if (hr === 0) hr = 12;
      return `${hr}:${min} ${ampm}`;
    }
    return timeStr;
  }

  getDynamicRatePerKm(vehicle: any, dist: number): number {
    let baseRate = 14;

    if (this.selectedTripType === 'One Way') {
      baseRate = 19; // baseline Hatchback rate so that Sedan/Dzire is baseRate + 2 = 21
    } else {
      if (dist <= 20) baseRate = 20;
      else if (dist <= 40) baseRate = 17;
      else if (dist <= 100) baseRate = 14;
      else if (dist <= 200) baseRate = 13;
      else if (dist <= 300) baseRate = 12;
      else baseRate = 11;
    }

    if (!vehicle) return baseRate;

    // Scale other vehicles relative to Hatchback (Wagon R) baseline
    if (vehicle.name.includes('Sedan') || vehicle.name.includes('Etios') || vehicle.name.includes('Dzire')) {
      return baseRate + 2;
    } else if (vehicle.name.includes('Ertiga')) {
      return baseRate + 7;
    } else if (vehicle.name.includes('Crysta') || vehicle.name.includes('Innova')) {
      return baseRate + 10;
    }
    return baseRate; // Wagon R / Hatchback
  }

  getFareBreakdown(vehicle: any = null) {
    const veh = vehicle || this.selectedVehicle || { name: 'Wagon R or Equivalent', baseRate: 14, baseFareOffset: 100 };
    const dist = this.distance || 0;
    let calcDistance = dist;

    // adjust base based on vehicle offset relative to base hatchback
    const vehicleBase = this.baseFare + (veh.baseFareOffset - 80);

    if (this.selectedTripType === 'Round Trip') {
      calcDistance = dist * 2;
    } else if (this.selectedTripType === 'Local') {
      calcDistance = Math.max(0, dist - 80);
    } else if (this.selectedTripType === 'Airport') {
      calcDistance = 0;
    }

    const rate = this.getDynamicRatePerKm(veh, calcDistance);
    const baseAndFuel = Math.round(vehicleBase + (calcDistance * rate));
    const driverAllowance = 0;
    const nightAllowance = 0;
    const waitingCharges = Math.max(0, (this.waitingTime || 0) - 60) * 1;

    const subtotal = baseAndFuel + waitingCharges;
    const gst = Math.round(subtotal * 0.05);
    const total = subtotal + gst;

    return {
      baseAndFuel,
      driverAllowance,
      nightAllowance,
      waitingCharges,
      gst,
      total
    };
  }

  getVehicleFare(vehicle: any): number {
    return this.getFareBreakdown(vehicle).total;
  }

  getVehicleOriginalFare(vehicle: any): number {
    const fare = this.getVehicleFare(vehicle);
    return Math.round(fare / 0.88);
  }

  getVehicleTaxes(vehicle: any): number {
    return this.getFareBreakdown(vehicle).gst;
  }

  selectVehicle(vehicle: any) {
    this.selectedVehicle = vehicle;
    this.totalFare = this.getVehicleFare(vehicle);
    this.showBookingModal = true;
  }

  selectVehicleMobile(vehicle: any) {
    this.selectedVehicle = vehicle;
    this.totalFare = this.getVehicleFare(vehicle);
    this.showBookingModal = false;
    this.setMobileScreen('REVIEW');
  }

  async exploreCabs() {
    if (!this.pickupLocation.trim() || (!this.dropLocation.trim() && this.selectedTripType !== 'Local')) {
      alert('Please enter both pickup and drop locations.');
      return;
    }

    this.isLocating = true;
    this.isLoadingPickup = !this.pickupCoords;
    this.isLoadingDrop = !this.dropCoords && this.selectedTripType !== 'Local';

    try {
      // 1. Resolve Pickup coordinates via Photon if they are not cached/selected from dropdown
      if (!this.pickupCoords) {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(this.pickupLocation)}&limit=5&bbox=68,6,97.5,37&osm_tag=!boundary`;
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            const valid = data.features.find((f: any) => f.properties?.osm_key !== 'boundary' && f.properties?.type !== 'county') || data.features[0];
            this.pickupCoords = { lat: valid.geometry.coordinates[1], lon: valid.geometry.coordinates[0] };
          }
        } catch (e) {
          console.error('Pickup geocode error:', e);
        }
      }

      // 2. Resolve Drop coordinates via Photon if they are not cached/selected from dropdown
      if (!this.dropCoords && this.selectedTripType !== 'Local') {
        let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(this.dropLocation)}&limit=5&bbox=68,6,97.5,37&osm_tag=!boundary`;
        if (this.pickupCoords) {
          url += `&lat=${this.pickupCoords.lat}&lon=${this.pickupCoords.lon}`;
        }
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            const valid = data.features.find((f: any) => f.properties?.osm_key !== 'boundary' && f.properties?.type !== 'county') || data.features[0];
            this.dropCoords = { lat: valid.geometry.coordinates[1], lon: valid.geometry.coordinates[0] };
          }
        } catch (e) {
          console.error('Drop geocode error:', e);
        }
      }
    } catch (e) {
      console.warn('Geocoding failed:', e);
    }

    if (this.pickupCoords && (this.dropCoords || this.selectedTripType === 'Local')) {
      await this.autoCalculateDistanceAndFare();
    } else {
      this.fallbackMockDistance();
      this.recalculateTotalFare();
    }

    this.isLocating = false;
    this.isLoadingPickup = false;
    this.isLoadingDrop = false;

    // Default select Swift Dzire
    this.selectedVehicle = this.vehiclesList.find(v => v.name.includes('Dzire')) || this.vehiclesList[0];
    this.totalFare = this.getVehicleFare(this.selectedVehicle);

    // Navigate to Results page on Desktop
    this.activeDesktopScreen = 'RESULTS';

    // Route to Summary viewport if on mobile
    this.setMobileScreen('SUMMARY');
  }

  async calculateFare() {
    await this.exploreCabs();
  }

  fallbackMockDistance() {
    if (this.pickupCoords && this.dropCoords) {
      this.distance = this.calculateHaversineDistanceKm(
        this.pickupCoords.lat,
        this.pickupCoords.lon,
        this.dropCoords.lat,
        this.dropCoords.lon
      );
    } else {
      this.distance = 15;
    }
  }

  saveEstimate() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const formattedDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} • ${timeStr}`;

    const newEntry: HistoryItem = {
      id: Date.now(),
      pickup: this.pickupLocation,
      drop: this.dropLocation,
      distance: this.distance || 0,
      ratePerKm: this.ratePerKm,
      baseFare: this.baseFare,
      tollParking: this.tollParking,
      waitingCharges: this.waitingCharges,
      fare: this.totalFare || 0,
      date: formattedDate
    };

    this.historyList.unshift(newEntry);
    localStorage.setItem('tamizh_travels_mockup_history', JSON.stringify(this.historyList));

    this.showSaveSuccess = true;
    setTimeout(() => {
      this.showSaveSuccess = false;
    }, 3000);
  }

  deleteHistoryItem(id: number, event: Event) {
    event.stopPropagation();
    this.historyList = this.historyList.filter(item => item.id !== id);
    localStorage.setItem('tamizh_travels_mockup_history', JSON.stringify(this.historyList));
  }

  clearAllHistory() {
    if (confirm('Are you sure you want to delete all saved estimates?')) {
      this.historyList = [];
      localStorage.removeItem('tamizh_travels_mockup_history');
    }
  }

  saveSettings() {
    this.ratePerKm = this.settingRatePerKm;
    this.baseFare = this.settingBaseFare;
    this.telegramBotToken = this.settingTelegramBotToken;
    this.telegramChatId = this.settingTelegramChatId;

    this.waitingCharges = 0; // reset active wait

    alert('Settings Saved successfully!');
    this.setMobileScreen('DASHBOARD');
  }

  sendTelegramNotification() {
    if (!this.telegramBotToken || !this.telegramChatId) {
      console.warn('Telegram Bot Token or Chat ID not configured.');
      return;
    }

    const vehicleName = this.selectedVehicle ? this.selectedVehicle.name : 'Outstation Cab';
    const rate = this.selectedVehicle ? this.getDynamicRatePerKm(this.selectedVehicle, this.distance || 0) : this.ratePerKm;
    const bk = this.getFareBreakdown(this.selectedVehicle);
    const total = bk.total - this.couponDiscount;

    let msg = `🚖 *NEW RIDE REQUESTED - TAMIZH TRAVELS*\n\n`;
    msg += `👤 *Passenger:* ${this.customerName.trim()} (${this.customerPhone.trim()})\n`;
    msg += `🚗 *Vehicle:* ${vehicleName}\n`;
    msg += `📍 *Trip Type:* ${this.selectedTripType}\n`;
    msg += `🛫 *From:* ${this.pickupLocation}\n`;
    msg += `🛬 *To:* ${this.dropLocation}\n`;
    msg += `📅 *Date/Time:* ${this.getDetailedFormattedDate(this.pickupDate, this.pickupTime)}\n`;
    msg += `🛣️ *Distance:* ${this.distance || 0} km (Rate: ₹${rate}/km)\n\n`;
    msg += `💵 *Fare Breakdown:*\n`;
    msg += `- Base & Fuel: ₹${bk.baseAndFuel}\n`;
    if (bk.driverAllowance > 0) msg += `- Driver Allowance: ₹${bk.driverAllowance}\n`;
    if (bk.nightAllowance > 0) msg += `- Night Allowance: ₹${bk.nightAllowance}\n`;
    if (bk.waitingCharges > 0) msg += `- Waiting Charges: ₹${bk.waitingCharges} (${this.waitingTime} mins)\n`;
    msg += `- GST (5%): ₹${bk.gst}\n`;
    if (this.couponDiscount > 0) msg += `- Discount: -₹${this.couponDiscount}\n`;
    msg += `- Tolls/Parking: Extra\n`;
    msg += `💰 *Total Fare:* *₹${total}*\n`;

    const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
    const body = {
      chat_id: this.telegramChatId,
      text: msg,
      parse_mode: 'Markdown'
    };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          console.log('Telegram notification sent successfully!');
        } else {
          console.error('Telegram notification error:', data);
        }
      })
      .catch(err => console.error('Telegram fetch error:', err));
  }

  triggerWhatsAppShare() {
    this.whatsappRecipientNumber = this.customerPhone || '';
    this.showWhatsAppModal = true;
  }

  sendWhatsAppQuotation() {
    let phoneNum = this.whatsappRecipientNumber.trim();
    if (!phoneNum) {
      phoneNum = this.customerPhone.trim();
    }

    if (!phoneNum) {
      alert('Please enter a mobile number to send the quotation to.');
      return;
    }

    // Clean phone number (remove non-digits, format with country code)
    let cleanPhone = phoneNum.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Default to India country code if 10 digits
    }

    const vehicleName = this.selectedVehicle ? this.selectedVehicle.name : 'Outstation Cab';
    const rate = this.selectedVehicle ? this.getDynamicRatePerKm(this.selectedVehicle, this.distance || 0) : this.ratePerKm;

    // Get precise breakdown values
    const bk = this.getFareBreakdown(this.selectedVehicle);
    const total = bk.total - this.couponDiscount;

    let text = `*TAMIZH TRAVELS*\n`;
    text += `_Let's go safely_\n\n`;
    text += `*TRIP QUOTATION ESTIMATE*\n`;
    text += `---------------------------------------\n`;
    if (this.customerName.trim()) {
      text += `*Passenger:* ${this.customerName.trim()}\n`;
    }
    text += `*Vehicle:* ${vehicleName}\n`;
    text += `*Route:* ${this.pickupLocation} ➔ ${this.dropLocation} (${this.selectedTripType})\n`;
    text += `*Pickup Time:* ${this.getDetailedFormattedDate(this.pickupDate, this.pickupTime)}\n`;
    text += `*Distance:* ${this.distance || 0} km\n`;
    text += `*Rate:* ₹${rate} / km\n\n`;

    text += `*Base Fare (incl. Fuel):* ₹${bk.baseAndFuel}\n`;
    if (bk.driverAllowance > 0) {
      text += `*Driver Allowance:* ₹${bk.driverAllowance}\n`;
    }
    if (bk.nightAllowance > 0) {
      text += `*Night Allowance:* ₹${bk.nightAllowance}\n`;
    }
    if (bk.waitingCharges > 0) {
      text += `*Waiting Charges:* ₹${bk.waitingCharges} (${this.waitingTime} mins)\n`;
    }
    text += `*GST (5%):* ₹${bk.gst}\n`;
    if (this.couponDiscount > 0) {
      text += `*Coupon Discount:* -₹${this.couponDiscount}\n`;
    }
    text += `*Tolls, Parking & Permits:* Extra (to be paid directly)\n`;
    text += `---------------------------------------\n`;
    text += `*Total Payable Fare:* *₹${total}*\n`;
    text += `---------------------------------------\n`;
    text += `Thank you for choosing *TAMIZH TRAVELS*. Safe Journey! 😊`;

    const encodedText = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    window.open(waUrl, '_blank');
  }

  triggerDirectCall() {
    window.location.href = 'tel:+919597673524';
  }
}
