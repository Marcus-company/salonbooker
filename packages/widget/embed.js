/**
 * SalonBooker Embed Script v1.1.0
 * Easy integration for third-party websites
 * 
 * Usage:
 * <div id="salonbooker-widget"></div>
 * <script src="https://salonbooker.vercel.app/widget/embed.js"></script>
 * <script>
 *   SalonBooker.init({
 *     container: '#salonbooker-widget',
 *     salonId: 'hairsalonx-roermond',
 *     theme: 'default'
 *   });
 * </script>
 */

(function(window) {
  'use strict';

  const SalonBooker = {
    version: '1.1.0',
    
    defaults: {
      container: '#salonbooker-widget',
      salonId: 'hairsalonx-roermond',
      theme: 'default',
      width: '100%',
      height: '600',
      minHeight: '500',
      baseUrl: '',
      language: 'nl',
      config: {},
      onBookingSubmitted: null,
      onError: null,
    },

    widgets: [],

    /**
     * Initialize the widget
     * @param {Object} options - Configuration options
     */
    init: function(options) {
      const config = Object.assign({}, this.defaults, options);
      
      // Auto-detect base URL if not provided
      if (!config.baseUrl) {
        const script = document.currentScript || document.querySelector('script[src*="embed.js"]');
        if (script) {
          const src = script.src;
          config.baseUrl = src.substring(0, src.lastIndexOf('/'));
        } else {
          config.baseUrl = 'https://salonbooker.vercel.app/widget';
        }
      }

      // Find container
      const container = typeof config.container === 'string' 
        ? document.querySelector(config.container)
        : config.container;

      if (!container) {
        const error = 'SalonBooker: Container element not found: ' + config.container;
        console.error(error);
        if (config.onError) config.onError(new Error(error));
        return null;
      }

      // Check if already initialized
      if (container._salonbooker) {
        console.warn('SalonBooker: Widget already initialized on this container');
        return container._salonbooker;
      }

      // Create widget instance
      const widget = this.createWidget(container, config);
      this.widgets.push(widget);
      container._salonbooker = widget;

      console.log('SalonBooker: Widget initialized v' + this.version);
      return widget;
    },

    /**
     * Create a widget instance
     */
    createWidget: function(container, config) {
      // Clear container
      container.innerHTML = '';
      
      // Set container styles
      container.style.width = '100%';
      container.style.minHeight = config.minHeight + 'px';

      // Create wrapper for responsive sizing
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.width = '100%';
      wrapper.style.paddingBottom = '0';
      
      // Create iframe
      const iframe = document.createElement('iframe');
      
      // Build URL with query parameters
      const params = new URLSearchParams({
        salon: config.salonId,
        theme: config.theme,
        lang: config.language,
        v: this.version,
      });
      
      // Add any custom config as encoded JSON
      if (Object.keys(config.config).length > 0) {
        params.set('cfg', btoa(JSON.stringify(config.config)));
      }
      
      iframe.src = `${config.baseUrl}/widget.html?${params.toString()}`;
      iframe.width = '100%';
      iframe.height = config.height;
      iframe.style.width = '100%';
      iframe.style.height = config.height + 'px';
      iframe.style.minHeight = config.minHeight + 'px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      iframe.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      iframe.style.display = 'block';
      iframe.title = 'Boek een afspraak - SalonBooker';
      iframe.allow = 'fullscreen';
      iframe.loading = 'lazy';
      
      // Add to wrapper
      wrapper.appendChild(iframe);
      container.appendChild(wrapper);

      // Store reference
      const widget = {
        container: container,
        iframe: iframe,
        config: config,
        destroy: () => this.destroyWidget(widget),
        resize: (height) => {
          iframe.style.height = height + 'px';
        },
      };

      // Listen for messages from widget
      this.bindMessages(widget, config);

      return widget;
    },

    /**
     * Bind message handlers for iframe communication
     */
    bindMessages: function(widget, config) {
      const handler = (event) => {
        // Verify origin
        const allowedOrigins = [
          window.location.origin,
          new URL(config.baseUrl).origin,
        ];
        
        if (!allowedOrigins.includes(event.origin)) {
          return;
        }

        if (!event.data || typeof event.data !== 'object') {
          return;
        }

        switch (event.data.type) {
          case 'BOOKING_SUBMITTED':
            console.log('SalonBooker: Booking submitted', event.data.data);
            
            // Dispatch custom event on container
            widget.container.dispatchEvent(new CustomEvent('salonbooker:bookingSubmitted', {
              detail: event.data.data,
              bubbles: true,
            }));
            
            // Call callback if provided
            if (typeof config.onBookingSubmitted === 'function') {
              config.onBookingSubmitted(event.data.data);
            }
            break;

          case 'WIDGET_RESIZE':
            if (event.data.height) {
              widget.iframe.style.height = event.data.height + 'px';
            }
            break;

          case 'WIDGET_ERROR':
            console.error('SalonBooker: Widget error', event.data.error);
            if (typeof config.onError === 'function') {
              config.onError(new Error(event.data.error));
            }
            break;
        }
      };

      window.addEventListener('message', handler);
      widget._messageHandler = handler;
    },

    /**
     * Destroy a widget instance
     */
    destroyWidget: function(widget) {
      if (widget._messageHandler) {
        window.removeEventListener('message', widget._messageHandler);
      }
      
      widget.container.innerHTML = '';
      delete widget.container._salonbooker;
      
      const index = this.widgets.indexOf(widget);
      if (index > -1) {
        this.widgets.splice(index, 1);
      }
    },

    /**
     * Generate embed code for a salon
     */
    generateEmbedCode: function(salonId, options = {}) {
      const config = Object.assign({
        height: 600,
        theme: 'default',
      }, options);

      return `<!-- SalonBooker Widget - Begin -->
<div id="salonbooker-widget"></div>
<script src="${this.defaults.baseUrl}/embed.js"></script>
<script>
  (function() {
    var widget = SalonBooker.init({
      container: '#salonbooker-widget',
      salonId: '${salonId || 'hairsalonx-roermond'}',
      theme: '${config.theme}',
      height: ${config.height},
      onBookingSubmitted: function(booking) {
        console.log('Booking confirmed:', booking);
        // Add your custom logic here
      }
    });
  })();
</script>
<!-- SalonBooker Widget - End -->`;
    },

    /**
     * Generate simple iframe embed code
     */
    generateIframeCode: function(salonId, options = {}) {
      const config = Object.assign({
        width: '100%',
        height: 600,
        theme: 'default',
      }, options);

      const params = new URLSearchParams({
        salon: salonId || 'hairsalonx-roermond',
        theme: config.theme,
      });

      return `<!-- SalonBooker Widget (Iframe) -->
<iframe 
  src="${this.defaults.baseUrl}/widget.html?${params.toString()}"
  width="${config.width}"
  height="${config.height}"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); width: 100%; border: none;"
  title="Boek een afspraak"
  loading="lazy"
></iframe>`;
    },

    /**
     * Get all active widget instances
     */
    getWidgets: function() {
      return [...this.widgets];
    },

    /**
     * Destroy all widgets
     */
    destroyAll: function() {
      while (this.widgets.length > 0) {
        this.destroyWidget(this.widgets[0]);
      }
    },
  };

  // Expose to global scope
  window.SalonBooker = SalonBooker;

  // Auto-initialize if data attributes present
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  function autoInit() {
    const autoWidgets = document.querySelectorAll('[data-salonbooker]');
    autoWidgets.forEach(function(el) {
      // Parse config from data attributes
      const config = {
        container: el,
        salonId: el.dataset.salonbooker || 'hairsalonx-roermond',
        theme: el.dataset.theme || 'default',
        height: parseInt(el.dataset.height) || 600,
      };

      // Parse callback if provided as data attribute
      if (el.dataset.onBooking) {
        try {
          config.onBookingSubmitted = new Function('booking', el.dataset.onBooking);
        } catch (e) {
          console.error('SalonBooker: Invalid onBooking callback', e);
        }
      }

      SalonBooker.init(config);
    });
  }

  // AMD support
  if (typeof define === 'function' && define.amd) {
    define('salonbooker', [], function() {
      return SalonBooker;
    });
  }

  // CommonJS support
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SalonBooker;
  }

})(window);
