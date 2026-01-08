// Get DOM elements
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const vegetarianCheckbox = document.getElementById('vegetarian');
const sortPriceCheckbox = document.getElementById('sortPrice');
const menuSections = document.querySelectorAll('.menu-section');
const menuItems = document.querySelectorAll('.menu-item');
const menu = document.querySelector('.menu');

// State
let currentCategory = 'all';
let currentSearch = '';
let showVegetarianOnly = false;
let sortByPrice = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    filterMenu();
});

// Event Listeners
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        filterMenu();
    });

    // Category filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Update current category
            currentCategory = btn.dataset.category;
            filterMenu();
        });
    });

    // Vegetarian checkbox
    vegetarianCheckbox.addEventListener('change', (e) => {
        showVegetarianOnly = e.target.checked;
        filterMenu();
    });

    // Sort by price checkbox
    sortPriceCheckbox.addEventListener('change', (e) => {
        sortByPrice = e.target.checked;
        filterMenu();
    });
}

// Main filter function
function filterMenu() {
    let visibleItemCount = 0;
    let allItems = Array.from(menuItems);

    // First, filter items
    allItems.forEach(item => {
        const itemName = item.dataset.name.toLowerCase();
        const itemCategory = item.closest('.menu-section').dataset.category;
        const isVegetarian = item.dataset.vegetarian === 'true';

        // Check if item matches all filters
        const matchesSearch = itemName.includes(currentSearch) ||
                            item.querySelector('.description')?.textContent.toLowerCase().includes(currentSearch);
        const matchesCategory = currentCategory === 'all' || itemCategory === currentCategory;
        const matchesVegetarian = !showVegetarianOnly || isVegetarian;

        if (matchesSearch && matchesCategory && matchesVegetarian) {
            item.classList.remove('hidden');
            visibleItemCount++;
        } else {
            item.classList.add('hidden');
        }
    });

    // Sort by price if checkbox is checked
    if (sortByPrice) {
        sortItemsByPrice();
    }

    // Show/hide sections based on visible items
    menuSections.forEach(section => {
        const visibleItems = section.querySelectorAll('.menu-item:not(.hidden)');
        if (visibleItems.length > 0 && (currentCategory === 'all' || section.dataset.category === currentCategory)) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });

    // Show "no results" message if no items are visible
    showNoResultsMessage(visibleItemCount);
}

// Sort items by price
function sortItemsByPrice() {
    menuSections.forEach(section => {
        const items = Array.from(section.querySelectorAll('.menu-item'));

        // Sort items by price
        items.sort((a, b) => {
            const priceA = parseFloat(a.dataset.price);
            const priceB = parseFloat(b.dataset.price);
            return priceA - priceB;
        });

        // Reorder items in the DOM
        items.forEach(item => {
            section.appendChild(item);
        });
    });
}

// Show "no results" message
function showNoResultsMessage(count) {
    // Remove existing no-results message
    const existingMessage = document.querySelector('.no-results');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Add message if no results
    if (count === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.innerHTML = `
            <h3>🔍 No Items Found</h3>
            <p>Try adjusting your search terms or filters</p>
        `;
        menu.appendChild(noResultsDiv);
    }
}

// Smooth scroll to top when filter changes
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Focus search on "/" key
    if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
    }

    // Clear search on "Escape" key
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        currentSearch = '';
        searchInput.blur();
        filterMenu();
    }
});

// Add visual feedback for loading
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Console easter egg
console.log('%c🚀 Welcome to The Quantum Chippy! 🚀', 'font-size: 20px; color: #00ffff; font-weight: bold;');
console.log('%cServing Britain\'s finest since 2525', 'font-size: 14px; color: #00ff88; font-style: italic;');
console.log('%c\nKeyboard shortcuts:\n- Press "/" to focus search\n- Press "Escape" to clear search', 'color: #8891b0;');
