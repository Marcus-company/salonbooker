/**
 * SalonBooker Embed Script
 * Easy integration for third-party websites
 */

(function(window) {
  'use strict';

  const SalonBooker = {
    version: '1.0.0',
    
    defaults: {
      container: '#salonbooker-widget',
      salonId: 'hairsalonx-roermond',
      theme: 'default',
      width: '100%',
      height: '600',
      baseUrl: 'https://salonbooker.vercel.app/widget',
    },

    init: function(options) {
      const config = Object.assign({}, this.defaults, options);
      
      // Find container
      const container = typeof config.container === 'string' 
        ? document.querySelector(config.container)
        : config.container;

      if (!container) {
        console.error('SalonBooker: Container not found');
        return;
      }

      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = `${config.baseUrl}/widget.html?salon=${config.salonId}&theme=${config.theme}`;
      iframe.width = config.width;
      iframe.height = config.height;
      iframe.frameBorder = '0';
      iframe.style.borderRadius = '12px';
      iframe.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      iframe.title = 'Boek een afspraak';
      
      // Add to container
      container.innerHTML = '';
      container.appendChild(iframe);

      // Listen for messages from widget
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'BOOKING_SUBMITTED') {
          console.log('SalonBooker: Booking submitted', event.data.data);
          
          // Dispatch custom event
          container.dispatchEvent(new CustomEvent('bookingSubmitted', {
            detail: event.data.data
          }));
        }
      });

      console.log('SalonBooker: Widget initialized');
    },

    // Generate embed code
    generateEmbedCode: function(salonId) {
      return `<!-- SalonBooker Widget -->
<div id="salonbooker-widget"></div>
<script src="https://salonbooker.vercel.app/widget/embed.js"></script>
<script>
  SalonBooker.init({
    container: '#salonbooker-widget',
    salonId: '${salonId || 'hairsalonx-roermond'}'
  });
</script>`;
    }
  };

  // Expose to global scope
  window.SalonBooker = SalonBooker;

  // Auto-initialize if data attributes present
  document.addEventListener('DOMContentLoaded', function() {
    const autoWidgets = document.querySelectorAll('[data-salonbooker]');
    autoWidgets.forEach(function(el) {
      SalonBooker.init({
        container: el,
        salonId: el.dataset.salonbooker || 'hairsalonx-roermond'
      });
    });
  });

})(window);
