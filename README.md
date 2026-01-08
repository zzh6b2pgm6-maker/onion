# The Quantum Chippy - Interactive Menu

A futuristic British diner menu with interactive search and filtering capabilities.

## 🚀 Features

- **Interactive Search** - Real-time search across all menu items and descriptions
- **Category Filtering** - Filter by Breakfast, Mains, Comfort Food, Light Selections, Desserts, or Snacks
- **Vegetarian Filter** - Show only vegetarian-friendly options
- **Price Sorting** - Sort items by price (low to high)
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Futuristic Theme** - Dark theme with neon accents and animations

## 📁 Files

- `index.html` - Main HTML structure
- `styles.css` - Futuristic CSS styling
- `script.js` - Interactive JavaScript functionality
- `MENU.md` - Original markdown menu

## 🎮 How to Use

### Open Locally

1. **Open the website:**
   - Double-click `index.html` to open in your default browser
   - OR right-click `index.html` → Open With → Choose your browser

2. **Search for items:**
   - Type in the search box to find specific dishes
   - Press `/` key to quickly focus the search box
   - Press `Escape` to clear the search

3. **Filter by category:**
   - Click category buttons to show specific sections
   - Click "All Items" to show everything

4. **Use dietary filters:**
   - Check "Vegetarian Friendly" to show only vegetarian options
   - Check "Sort by Price" to order items from cheapest to most expensive

### Deploy Online

**Option 1: GitHub Pages**
1. Push this repo to GitHub
2. Go to Settings → Pages
3. Select branch and save
4. Your site will be live at `https://yourusername.github.io/onion`

**Option 2: Netlify**
1. Drag and drop the folder to [Netlify Drop](https://app.netlify.com/drop)
2. Get instant live URL

**Option 3: Vercel**
1. Run `vercel` in the terminal (requires Vercel CLI)
2. Follow prompts to deploy

## ⌨️ Keyboard Shortcuts

- `/` - Focus search box
- `Escape` - Clear search and unfocus

## 🎨 Customization

### Change Colors
Edit `styles.css` variables at the top:
```css
:root {
    --primary-color: #00ffff;    /* Cyan */
    --secondary-color: #ff00ff;  /* Magenta */
    --accent-color: #00ff88;     /* Green */
}
```

### Add New Menu Items
Edit `index.html` and add items following this format:
```html
<div class="menu-item" data-price="X.XX" data-name="Item Name" data-vegetarian="true">
    <div class="item-header">
        <h3>Item Name <span class="badge veg">🌱</span></h3>
        <span class="price">£X.XX</span>
    </div>
    <p class="description">Item description here</p>
</div>
```

## 🌐 Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## 📱 Mobile Responsive

The menu automatically adapts to:
- Desktop (1400px max-width)
- Tablet (768px and below)
- Mobile (responsive layout)

## 🎯 Technical Details

- Pure HTML/CSS/JavaScript (no frameworks required)
- No build process needed
- Works offline
- Fast and lightweight

## 📝 License

Free to use and modify for your restaurant or project!

---

**The Quantum Chippy** - *Serving Britain's finest since 2525*

*"Keep Calm and Beam On"* 🚀
