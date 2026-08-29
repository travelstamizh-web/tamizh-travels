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
  showTerms: boolean = true;

  // Modern Toast / Popup Notification State
  showAlertModal: boolean = false;
  alertTitle: string = '';
  alertMessage: string = '';
  alertType: 'success' | 'warning' | 'error' | 'info' = 'info';
  alertTimeout: any = null;

  showCustomAlert(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info', title: string = '') {
    clearTimeout(this.alertTimeout);
    this.alertMessage = message;
    this.alertType = type;
    this.alertTitle = title || (type === 'success' ? 'Success' : type === 'warning' || type === 'error' ? 'Notice' : 'Information');
    this.showAlertModal = true;

    this.alertTimeout = setTimeout(() => {
      this.closeCustomAlert();
    }, 4500);
  }

  closeCustomAlert() {
    this.showAlertModal = false;
  }

  // Button Car Drive Animation States
  isExploreAnimating: boolean = false;
  isBookingAnimating: boolean = false;

  triggerCarDriveAnim(type: 'explore' | 'booking') {
    if (type === 'explore') {
      this.isExploreAnimating = true;
      setTimeout(() => this.isExploreAnimating = false, 1200);
    } else {
      this.isBookingAnimating = true;
      setTimeout(() => this.isBookingAnimating = false, 1200);
    }
  }

  // Memoization Caches to prevent circular template re-evaluation
  private fareBreakdownCache = new Map<string, any>();
  private formattedDateCache = new Map<string, string>();
  private formattedTimeCache = new Map<string, string>();
  private detailedDateCache = new Map<string, string>();

  getDetailedFormattedDate(dateStr: string, timeStr: string): string {
    if (!dateStr) dateStr = this.pickupDate || '2026-08-09';
    if (!timeStr) timeStr = this.pickupTime || '07:00';

    const cacheKey = `${dateStr}_${timeStr}`;
    if (this.detailedDateCache.has(cacheKey)) {
      return this.detailedDateCache.get(cacheKey)!;
    }

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
    const result = `${day}${suffix} ${monthName} ${year}, ${formattedTime}`;
    this.detailedDateCache.set(cacheKey, result);
    return result;
  }

  getBookingRawFare(): number {
    if (this.selectedVehicle) {
      return this.getVehicleFare(this.selectedVehicle);
    }
    return this.totalFare || 0;
  }

  getBookingTotalFare(): number {
    return Math.max(0, this.getBookingRawFare() - this.couponDiscount);
  }

  getBookingBaseFare(): number {
    return Math.max(0, this.getBookingRawFare() - (this.tollParking || 0));
  }

  getPartPayAmount(): number {
    return Math.round(this.getBookingTotalFare() * 0.25);
  }

  getFullPayAmount(): number {
    return this.getBookingTotalFare();
  }

  applyCoupon() {
    const code = this.couponCode.trim().toUpperCase();
    const tripKm = (this.distance || 0) * 2;

    if (code === 'WELCOME50') {
      if (tripKm > 100 || (this.distance || 0) > 100) {
        this.couponDiscount = 50;
        this.couponApplied = true;
        this.showCustomAlert(`Coupon ${code} applied! You saved ₹${this.couponDiscount}`, 'success', 'Coupon Applied!');
      } else {
        this.couponDiscount = 0;
        this.couponApplied = false;
        this.showCustomAlert('Coupon WELCOME50 is applicable only for trips greater than 100 km.', 'warning', 'Trip Distance Limit');
      }
    } else {
      this.couponDiscount = 0;
      this.couponApplied = false;
      this.showCustomAlert('Invalid coupon code. Please enter a valid coupon code.', 'warning', 'Invalid Coupon');
    }
  }

  proceedBooking() {
    this.triggerCarDriveAnim('booking');
    if (!this.customerName.trim() || !this.customerPhone.trim()) {
      this.showCustomAlert('Please enter your Full Name and Mobile Number to proceed.', 'warning', 'Required Details');
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
      this.showCustomAlert('Please enter a valid 10-digit Indian mobile number.', 'warning', 'Invalid Mobile Number');
      return;
    }

    // Assign the cleaned 10-digit number back for clean notification logging
    this.customerPhone = rawPhone;

    this.showBookingModal = false;
    this.sendTelegramNotification();
    this.showCustomAlert('Booking Request Sent successfully! Our representative will call you shortly.', 'success', 'Booking Confirmed!');
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

  // Screen date and time selectors (defaults to current date and time)
  minDate: string = '';
  pickupDate: string = '';
  pickupTime: string = '';
  returnDate: string = '';
  airportTripType: string = 'Drop to Airport'; // 'Drop to Airport' | 'Pickup from Airport'

  // Quick Time Selection Shortcuts
  quickTimeSlots = [
    { label: 'NOW', time: '' },
    { label: '06:00 AM', time: '06:00' },
    { label: '09:00 AM', time: '09:00' },
    { label: '12:00 PM', time: '12:00' },
    { label: '03:00 PM', time: '15:00' },
    { label: '06:00 PM', time: '18:00' },
    { label: '09:00 PM', time: '21:00' }
  ];

  selectQuickTime(slotTime: string) {
    if (!slotTime) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      this.pickupTime = `${hours}:${minutes}`;
    } else {
      this.pickupTime = slotTime;
    }
  }

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
    // Initialize current local date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    this.minDate = todayStr;
    this.pickupDate = todayStr;
    this.returnDate = todayStr;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.pickupTime = `${hours}:${minutes}`;

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

  // Recommended Locations in and around Vellore & nearby Tamil Nadu destinations
  recommendedVelloreLocations: any[] = [
    { display_name: 'CMC Hospital Main Campus, Ida Scudder Rd, Vellore', short_name: '🏥 CMC Hospital', lat: 12.9247, lon: 79.1353, category: 'Hospital' },
    { display_name: 'Katpadi Junction Railway Station, Katpadi, Vellore', short_name: '🚆 Katpadi Junction', lat: 12.9734, lon: 79.1378, category: 'Station' },
    { display_name: 'VIT University Main Gate, Katpadi, Vellore', short_name: '🎓 VIT University', lat: 12.9692, lon: 79.1559, category: 'University' },
    { display_name: 'Golden Temple, Sripuram, Vellore', short_name: '🛕 Golden Temple Sripuram', lat: 12.8714, lon: 79.0888, category: 'Temple' },
    { display_name: 'Vellore Fort & Jalakanteswarar Temple, Vellore', short_name: '🏰 Vellore Fort', lat: 12.9231, lon: 79.1325, category: 'Landmark' },
    { display_name: 'Vellore New Bus Stand, Off NH 48, Vellore', short_name: '🚌 New Bus Stand', lat: 12.9272, lon: 79.1384, category: 'Bus Stand' },
    { display_name: 'Chennai International Airport (MAA), Chennai', short_name: '✈️ Chennai Airport', lat: 12.9941, lon: 80.1709, category: 'Airport' },
    { display_name: 'Tirupati Temple, Tirumala, Andhra Pradesh', short_name: '⛰️ Tirupati Temple', lat: 13.6833, lon: 79.3473, category: 'Pilgrimage' },
    { display_name: 'Tiruvannamalai Annamalaiyar Temple, Tiruvannamalai', short_name: '🛕 Tiruvannamalai', lat: 12.2253, lon: 79.0747, category: 'Temple' },
    { display_name: 'Kanchipuram Silk City & Temples, Kanchipuram', short_name: '🛕 Kanchipuram', lat: 12.8342, lon: 79.7036, category: 'Nearby' },
    { display_name: 'Bengaluru Airport (BLR), Devanahalli, Bengaluru', short_name: '✈️ Bengaluru Airport', lat: 13.1986, lon: 77.7066, category: 'Airport' }
  ];

  onLocationInputFocus(field: 'pickup' | 'drop') {
    if (field === 'pickup' && (!this.pickupLocation || this.pickupLocation.length < 3)) {
      this.pickupSuggestions = this.recommendedVelloreLocations;
      this.activeSuggestionField = 'pickup';
    } else if (field === 'drop' && (!this.dropLocation || this.dropLocation.length < 3)) {
      this.dropSuggestions = this.recommendedVelloreLocations;
      this.activeSuggestionField = 'drop';
    }
  }

  fetchLocationSuggestions(query: string, field: 'pickup' | 'drop') {
    if (field === 'pickup') {
      this.pickupLocation = query;
      this.pickupCoords = null;
      this.distance = null;
      this.totalFare = null;

      clearTimeout(this.debounceTimeoutPickup);
      if (!query || query.trim().length < 3) {
        this.pickupSuggestions = this.recommendedVelloreLocations;
        this.activeSuggestionField = 'pickup';
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
        this.dropSuggestions = this.recommendedVelloreLocations;
        this.activeSuggestionField = 'drop';
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
    this.fareBreakdownCache.clear();
    if (this.distance !== null) {
      const targetVehicle = this.selectedVehicle || (this.vehiclesList && this.vehiclesList.length > 0 ? this.vehiclesList[0] : { name: 'Wagon R or Equivalent', baseRate: 14, baseFareOffset: 100 });
      this.totalFare = this.getVehicleFare(targetVehicle);
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
    } finally {
      this.recalculateTotalFare();
      this.isLocating = false;
      this.isLoadingPickup = false;
      this.isLoadingDrop = false;
    }
  }

  // Estimator math
  getFormattedDate(dateStr: string): string {
    if (!dateStr) return '05-08-2026';
    if (this.formattedDateCache.has(dateStr)) {
      return this.formattedDateCache.get(dateStr)!;
    }
    const parts = dateStr.split('-');
    let res = dateStr;
    if (parts.length === 3) {
      res = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD to DD-MM-YYYY
    }
    this.formattedDateCache.set(dateStr, res);
    return res;
  }

  getFormattedTime(timeStr: string): string {
    if (!timeStr) return '7:00 AM';
    if (this.formattedTimeCache.has(timeStr)) {
      return this.formattedTimeCache.get(timeStr)!;
    }
    const parts = timeStr.split(':');
    let res = timeStr;
    if (parts.length === 2) {
      let hr = parseInt(parts[0]);
      const min = parts[1];
      const ampm = hr >= 12 ? 'PM' : 'AM';
      hr = hr % 12;
      if (hr === 0) hr = 12;
      res = `${hr}:${min} ${ampm}`;
    }
    this.formattedTimeCache.set(timeStr, res);
    return res;
  }

  tariffSlabs = [
    { range: '0 - 10 KM', baseRate: 'Flat ₹200', ratePerKm: 'Flat ₹200 Base', driverAllowance: '₹0', gst: '5%' },
    { range: '11 - 20 KM', baseRate: '₹20 / KM', ratePerKm: '₹20/km', driverAllowance: '₹0', gst: '5%' },
    { range: '21 - 40 KM', baseRate: '₹17 / KM', ratePerKm: '₹17/km', driverAllowance: '₹0', gst: '5%' },
    { range: '41 - 100 KM', baseRate: '₹14 / KM', ratePerKm: '₹14/km', driverAllowance: '₹0', gst: '5%' },
    { range: '101 - 200 KM', baseRate: '₹13 / KM', ratePerKm: '₹13/km', driverAllowance: '₹300', gst: '5%' },
    { range: '201 - 300 KM', baseRate: '₹12 / KM', ratePerKm: '₹12/km', driverAllowance: '₹300', gst: '5%' },
    { range: '301+ KM', baseRate: '₹11 / KM', ratePerKm: '₹11/km', driverAllowance: '₹300', gst: '5%' }
  ];

  getActiveTariffTierIndex(): number {
    const d = this.selectedTripType === 'Round Trip' ? (this.distance || 0) * 2 : (this.distance || 0);
    if (d <= 10) return 0;
    if (d <= 20) return 1;
    if (d <= 40) return 2;
    if (d <= 100) return 3;
    if (d <= 200) return 4;
    if (d <= 300) return 5;
    return 6;
  }

  getDynamicRatePerKm(vehicle: any, dist: number): number {
    let baseRate = 14;

    if (dist <= 10) baseRate = 20;
    else if (dist <= 20) baseRate = 20;
    else if (dist <= 40) baseRate = 17;
    else if (dist <= 100) baseRate = 14;
    else if (dist <= 200) baseRate = 13;
    else if (dist <= 300) baseRate = 12;
    else baseRate = 11;

    if (!vehicle) return baseRate;

    // Scale other vehicles relative to Hatchback (Wagon R) baseline
    if (vehicle.name.includes('Sedan') || vehicle.name.includes('Etios') || vehicle.name.includes('Dzire')) {
      return baseRate;
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
    const cacheKey = `${veh.name}_${this.selectedTripType}_${dist}_${this.baseFare}_${this.waitingTime}`;

    if (this.fareBreakdownCache.has(cacheKey)) {
      return this.fareBreakdownCache.get(cacheKey)!;
    }

    let calcDistance = dist;
    if (this.selectedTripType === 'Round Trip') {
      calcDistance = dist * 2;
    } else if (this.selectedTripType === 'Local') {
      calcDistance = Math.max(0, dist - 80);
    } else if (this.selectedTripType === 'Airport') {
      calcDistance = 0;
    }

    const rate = this.getDynamicRatePerKm(veh, calcDistance);
    let baseAndFuel = 0;
    if (calcDistance <= 10 && calcDistance > 0) {
      baseAndFuel = 200;
    } else {
      baseAndFuel = Math.round(calcDistance * rate);
    }

    const driverAllowance = (calcDistance > 100) ? 300 : 0;
    const nightAllowance = 0;
    const waitingCharges = Math.max(0, (this.waitingTime || 0) - 60) * 1;

    const subtotal = baseAndFuel + driverAllowance + waitingCharges;
    const gst = Math.round(subtotal * 0.05);
    const total = subtotal + gst;

    const result = {
      baseAndFuel,
      driverAllowance,
      nightAllowance,
      waitingCharges,
      gst,
      total
    };

    this.fareBreakdownCache.set(cacheKey, result);
    return result;
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
    this.triggerCarDriveAnim('explore');
    if (this.isLocating) return; // Prevent duplicate continuous concurrent calls

    if (!this.pickupLocation.trim() || (!this.dropLocation.trim() && this.selectedTripType !== 'Local')) {
      this.showCustomAlert('Please enter both pickup and drop locations.', 'warning', 'Location Required');
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

      if (this.pickupCoords && (this.dropCoords || this.selectedTripType === 'Local')) {
        await this.autoCalculateDistanceAndFare();
      } else {
        this.fallbackMockDistance();
        this.recalculateTotalFare();
      }
    } catch (e) {
      console.warn('Geocoding failed:', e);
      this.fallbackMockDistance();
      this.recalculateTotalFare();
    } finally {
      this.isLocating = false;
      this.isLoadingPickup = false;
      this.isLoadingDrop = false;
    }

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

    this.showCustomAlert('Settings Saved successfully!', 'success', 'Settings Saved');
    this.setMobileScreen('DASHBOARD');
  }

  sendTelegramNotification() {
    if (!this.telegramBotToken || !this.telegramChatId) {
      console.warn('Telegram Bot Token or Chat ID not configured.');
      return;
    }

    const totalKm = (this.distance || 0) * 2;
    const vehicleName = this.selectedVehicle ? this.selectedVehicle.name : 'Outstation Cab';
    const rate = this.selectedVehicle ? this.getDynamicRatePerKm(this.selectedVehicle, totalKm) : this.ratePerKm;
    const bk = this.getFareBreakdown(this.selectedVehicle);
    const total = bk.total - this.couponDiscount;

    let msg = `🚖 *NEW RIDE REQUESTED - TAMIZH TRAVELS*\n\n`;
    msg += `👤 *Passenger:* ${this.customerName.trim()} (${this.customerPhone.trim()})\n`;
    msg += `🚗 *Vehicle:* ${vehicleName}\n`;
    msg += `📍 *Trip Type:* ${this.selectedTripType}\n`;
    msg += `🛫 *From:* ${this.pickupLocation}\n`;
    msg += `🛬 *To:* ${this.dropLocation}\n`;
    msg += `📅 *Date/Time:* ${this.getDetailedFormattedDate(this.pickupDate, this.pickupTime)}\n`;
    msg += `🛣️ *Distance:* ${totalKm} km (Up & Down) (Rate: ₹${rate}/km)\n\n`;
    msg += `💵 *Fare Breakdown:*\n`;
    msg += `- Base & Fuel: ₹${bk.baseAndFuel}\n`;
    if (bk.driverAllowance > 0) msg += `- Driver Allowance: ₹${bk.driverAllowance}\n`;
    if (bk.nightAllowance > 0) msg += `- Night Allowance: ₹${bk.nightAllowance}\n`;
    if (bk.waitingCharges > 0) msg += `- Waiting Charges: ₹${bk.waitingCharges} (${this.waitingTime} mins)\n`;
    msg += `- GST (5%): ₹${bk.gst}\n`;
    if (this.couponDiscount > 0) msg += `- Discount (${this.couponCode.trim().toUpperCase()}): -₹${this.couponDiscount}\n`;
    msg += `- Tolls/Parking: Extra\n`;
    msg += `💰 *Total Fare:* *₹${total}*\n`;

    const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
    const chatIds = Array.from(new Set(['5257290283', '857072720', '1059451500', this.telegramChatId].filter(id => !!id)));

    chatIds.forEach(id => {
      const body = {
        chat_id: id,
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
            console.log(`Telegram notification sent successfully to chat_id ${id}!`);
          } else {
            console.error(`Telegram notification error for chat_id ${id}:`, data);
          }
        })
        .catch(err => console.error(`Telegram fetch error for chat_id ${id}:`, err));
    });
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
      this.showCustomAlert('Please enter a mobile number to send the quotation to.', 'warning', 'Phone Number Required');
      return;
    }

    // Clean phone number (remove non-digits, format with country code)
    let cleanPhone = phoneNum.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Default to India country code if 10 digits
    }

    const totalKm = (this.distance || 0) * 2;
    const vehicleName = this.selectedVehicle ? this.selectedVehicle.name : 'Outstation Cab';
    const rate = this.selectedVehicle ? this.getDynamicRatePerKm(this.selectedVehicle, totalKm) : this.ratePerKm;

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
    text += `*Distance:* ${totalKm} km (Up & Down)\n`;
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
      text += `*Coupon Discount (${this.couponCode.trim().toUpperCase()}):* -₹${this.couponDiscount}\n`;
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
    window.location.href = 'tel:+919597956507';
  }
}
