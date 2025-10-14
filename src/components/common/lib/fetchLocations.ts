const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api/locations`;

// Define the shape of each item in the API response
interface LocationData {
  id: number;
  location: string;
  stations: string;
  is_active: number;
  creator: string;
  sys_date_time: string;
  updated_at: string | null;
}

// Array to hold location strings
let locations: string[] = [];

async function fetchLocations(): Promise<void> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: LocationData[] = await response.json();
    locations = data.map((item) => item.location);
  } catch (error) {
    console.error("Error fetching locations:", error);
  }
}

// Immediately fetch the locations
fetchLocations();

export { locations };
