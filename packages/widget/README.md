# @salonbooker/widget v1.1.0

Embeddable booking widget for HairsalonX.

## Features

- ✨ **Responsive Design** - Works on all devices
- 🎨 **HairsalonX Branding** - Matching colors and style
- 📅 **Date Picker** - Visual calendar with available days
- ⏰ **Time Slots** - Shows only available times
- 💅 **Service Selection** - Beautiful cards for treatments
- 📱 **Mobile First** - Optimized for smartphones
- 🔄 **Embeddable** - Easy to integrate via iframe or JS
- ♿ **Accessible** - ARIA labels, keyboard navigation
- 🛡️ **Validation** - Real-time form validation
- 🌍 **Dutch Language** - Native NL support

## Files

- `widget.html` - Widget HTML structure
- `widget.css` - Styling with HairsalonX branding
- `widget.js` - Interactive functionality (v1.1.0)
- `embed.js` - Embed code generator (v1.1.0)

## Quick Start

### Method 1: Iframe (Simplest)

```html
<iframe 
  src="https://salonbooker.vercel.app/widget/widget.html"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
</iframe>
```

### Method 2: JavaScript Embed (Recommended)

```html
<div id="salonbooker-widget"></div>
<script src="https://salonbooker.vercel.app/widget/embed.js"></script>
<script>
  SalonBooker.init({
    container: '#salonbooker-widget',
    salonId: 'hairsalonx-roermond',
    theme: 'default',
    height: 600,
    onBookingSubmitted: function(booking) {
      console.log('Booking confirmed:', booking);
      // Add custom analytics or tracking here
    }
  });
</script>
```

### Method 3: Auto-Initialize with Data Attributes

```html
<div 
  data-salonbooker="hairsalonx-roermond"
  data-theme="default"
  data-height="600"
></div>
<script src="https://salonbooker.vercel.app/widget/embed.js"></script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | string/Element | '#salonbooker-widget' | CSS selector or DOM element |
| `salonId` | string | 'hairsalonx-roermond' | Salon identifier |
| `theme` | string | 'default' | Theme name |
| `width` | string | '100%' | Widget width |
| `height` | number | 600 | Widget height in pixels |
| `minHeight` | number | 500 | Minimum height |
| `language` | string | 'nl' | Language code |
| `baseUrl` | string | auto | Base URL for widget files |
| `onBookingSubmitted` | function | null | Callback when booking is made |
| `onError` | function | null | Error callback |

## Embed Code Generator

```javascript
// Generate JavaScript embed code
const code = SalonBooker.generateEmbedCode('my-salon-id', {
  height: 700,
  theme: 'default'
});
console.log(code);

// Generate simple iframe code
const iframeCode = SalonBooker.generateIframeCode('my-salon-id', {
  height: 700
});
```

## Styling / Theming

The widget uses CSS custom properties for easy theming:

```css
:root {
  --sb-primary: #0f172a;        /* Main color */
  --sb-primary-light: #1e293b;  /* Lighter variant */
  --sb-accent: #d4a574;         /* Accent (gold) */
  --sb-accent-light: #e8c9a8;   /* Light accent */
  --sb-pink: #fdf2f8;           /* Background pink */
  --sb-text: #0f172a;           /* Text color */
  --sb-text-muted: #64748b;     /* Muted text */
  --sb-border-radius: 12px;     /* Border radius */
  --sb-success: #22c55e;        /* Success color */
  --sb-error: #ef4444;          /* Error color */
}
```

## Supabase Integration

The widget connects to Supabase for:
- **Services** - Dynamic treatment list
- **Staff** - Available stylists
- **Bookings** - Real-time availability
- **Availability** - Booked time slots

Configure Supabase by setting `window.SALONBOOKER_CONFIG` before loading the widget:

```html
<script>
  window.SALONBOOKER_CONFIG = {
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseKey: 'your-anon-key',
    salonId: 'your-salon-id'
  };
</script>
<script src="widget.js"></script>
```

Without Supabase config, the widget runs in demo mode with default services.

## API Reference

### SalonBooker Methods

```javascript
// Initialize a widget
const widget = SalonBooker.init(options);

// Get all widgets
const widgets = SalonBooker.getWidgets();

// Destroy a widget
widget.destroy();

// Resize widget
widget.resize(800);

// Destroy all widgets
SalonBooker.destroyAll();
```

### Widget Events

Listen for booking events on the container:

```javascript
document.getElementById('salonbooker-widget').addEventListener('salonbooker:bookingSubmitted', function(e) {
  console.log('Booking:', e.detail);
  // e.detail contains: id, salon_id, service_name, booking_date, booking_time, etc.
});
```

Or use the callback:

```javascript
SalonBooker.init({
  onBookingSubmitted: function(booking) {
    // booking.id, booking.service_name, etc.
    gtag('event', 'booking_completed', {
      service: booking.service_name,
      price: booking.service_price
    });
  }
});
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- iOS Safari 13+
- Chrome Android 80+

## Accessibility Features

- Full keyboard navigation
- ARIA labels and roles
- Focus management
- Screen reader support
- Reduced motion support
- High contrast mode support

## Version History

### v1.1.0 (Current)
- Fixed date parsing bug in `formatDateForDB`
- Fixed timezone issues with `toISOString()`
- Added proper input validation (name, phone, email)
- Added error handling for network failures
- Added max booking date limit (90 days)
- Added confirmation dialog before submission
- Added loading states for sections
- Added ARIA labels and accessibility improvements
- Added reduced motion support
- Added print styles
- Improved mobile experience
- Added booking ID display on success

### v1.0.0
- Initial release
- 3-step booking flow
- Supabase integration
- Basic responsive design

## Development

```bash
# Navigate to widget directory
cd packages/widget/src

# Start local server
npx serve .

# Or Python
python3 -m http.server 8080
```

Visit `http://localhost:8080/widget.html`

## Integration with HairsalonX Website

Add to your contact/booking page:

```html
<section class="booking-section">
  <h2>Online Afspraak Maken</h2>
  <p>Reserveer eenvoudig je volgende afspraak bij HairsalonX</p>
  
  <div id="salonbooker-widget"></div>
  <script src="https://salonbooker.vercel.app/widget/embed.js"></script>
  <script>
    SalonBooker.init({
      container: '#salonbooker-widget',
      salonId: 'hairsalonx-roermond',
      theme: 'default',
      height: 650,
      onBookingSubmitted: function(booking) {
        // Track conversion
        if (typeof gtag !== 'undefined') {
          gtag('event', 'conversion', {
            send_to: 'AW-XXXXXXXX/XXXXXXXX',
            value: booking.service_price,
            currency: 'EUR'
          });
        }
      }
    });
  </script>
</section>
```

## License

© 2026 HairsalonX - SalonBooker. All rights reserved.
