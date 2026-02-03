# @salonbooker/widget

Embeddable booking widget for HairsalonX.

## Features

- ✨ **Responsive Design** - Werkt op alle apparaten
- 🎨 **HairsalonX Branding** - Matching kleuren en stijl
- 📅 **Datum Picker** - Visuele kalender met beschikbare dagen
- ⏰ **Tijd Slots** - Toon alleen beschikbare tijden
- 💅 **Service Selectie** - Mooie kaarten voor behandelingen
- 📱 **Mobile First** - Geoptimaliseerd voor smartphones
- 🔄 **Embedbaar** - Eenvoudig te integreren via iframe

## Gebruik

### Via Iframe (Aanbevolen)

```html
<iframe 
  src="https://salonbooker.vercel.app/widget/widget.html"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
</iframe>
```

### Embed Code Generator

```html
<div id="salonbooker-widget"></div>
<script src="https://salonbooker.vercel.app/widget/embed.js"></script>
<script>
  SalonBooker.init({
    container: '#salonbooker-widget',
    salonId: 'hairsalonx-roermond',
    theme: 'default'
  });
</script>
```

## Styling

Het widget gebruikt CSS custom properties voor eenvoudige theming:

```css
:root {
  --sb-primary: #0f172a;      /* Hoofdkleur */
  --sb-accent: #d4a574;       /* Accent (goud) */
  --sb-pink: #fdf2f8;         /* Achtergrond roze */
  --sb-border-radius: 12px;   /* Afgeronde hoeken */
}
```

## Development

```bash
# Installeer dependencies
npm install

# Start development server
npx serve src/

# Build
npm run build
```

## Bestanden

- `widget.html` - Widget HTML structuur
- `widget.css` - Styling met HairsalonX branding
- `widget.js` - Interactieve functionaliteit
- `embed.js` - Embed code generator

## Integratie met HairsalonX Website

Voeg toe aan de contact pagina:

```html
<section class="booking-widget">
  <h2>Online Afspraak Maken</h2>
  <iframe 
    src="https://salonbooker.vercel.app/widget/widget.html"
    class="salonbooker-iframe"
    title="Boek een afspraak bij HairsalonX">
  </iframe>
</section>
```

## TODO

- [ ] API integratie voor echte beschikbaarheid
- [ ] Supabase database connectie
- [ ] Email bevestigingen
- [ ] Meertalig (NL/EN)
- [ ] Thema customisatie opties

---

© 2026 HairsalonX - SalonBooker
