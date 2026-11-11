
// Initialize map centered on the Philippines
const map = L.map('map').setView([12.8797, 121.7740], 6);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Store map markers
let markers = [];

// Track the latest search
let searchNumber = 0;

// Function to remove all markers
function clearMarkers() {

    markers.forEach(marker => {
        map.removeLayer(marker);
    });

    markers = [];
}

// Automatically remove markers when user types
document.getElementById("cityInput")
    .addEventListener("input", function() {

        // Invalidate previous searches
        searchNumber++;

        // Remove previous markers
        clearMarkers();

        // Update message
        document.getElementById("message").textContent =
            "Enter a new place and click Search.";

    });

// Search Philippine cities
async function searchCity() {

    const city = document.getElementById("cityInput").value.trim();
    const message = document.getElementById("message");

    // Check empty input
    if (city === "") {
        message.textContent = "Please enter a city name.";
        return;
    }

    // Identify current search
    const currentSearch = ++searchNumber;

    // Remove old markers before searching
    clearMarkers();

    message.textContent = "Searching for locations...";

    try {

        // Search using Nominatim API
        const url =
            `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(city + ", Philippines")}&countrycodes=ph&limit=5&addressdetails=1&dedupe=0`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to connect to the location service.");
        }

        const results = await response.json();

        // Ignore outdated search results
        if (currentSearch !== searchNumber) {
            return;
        }

        // Check if there are results
        if (results.length === 0) {

            message.textContent =
                "No matching locations found. Please check the spelling or try another Philippine city.";

            map.setView([12.8797, 121.7740], 6);

            return;
        }

        // Display up to five matching locations
        results.slice(0, 5).forEach(place => {

            const lat = parseFloat(place.lat);
            const lon = parseFloat(place.lon);

            const placeName =
                place.name || place.display_name.split(",")[0];

            const country =
                place.address?.country || "Philippines";

            // Create marker
            const marker = L.marker([lat, lon]).addTo(map);

            // Add popup with place name and country
            marker.bindPopup(`
                <b>Place:</b> ${escapeHTML(placeName)}<br>
                <b>Country:</b> ${escapeHTML(country)}
            `);

            // Save marker
            markers.push(marker);

        });

        // Zoom map to show all matching locations
        if (markers.length === 1) {

            map.setView(markers[0].getLatLng(), 12);
            markers[0].openPopup();

        } else {

            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.2));

        }

        message.textContent =
            `Found ${markers.length} matching location(s). Click a marker to view its details.`;

    } catch (error) {

        // Ignore errors from outdated searches
        if (currentSearch !== searchNumber) {
            return;
        }

        message.textContent =
            "Error: Unable to search locations. Please try again later.";

        console.error(error);

    }
}

// Escape text before displaying it in popups
function escapeHTML(text) {

    return String(text).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[char]);

}

// Search button event
document.getElementById("searchButton")
    .addEventListener("click", searchCity);

// Allow Enter key to search
document.getElementById("cityInput")
    .addEventListener("keypress", function(event) {

        if (event.key === "Enter") {
            searchCity();
        }

    });
