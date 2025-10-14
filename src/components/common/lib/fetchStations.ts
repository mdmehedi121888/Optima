const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api/stations`;

// Define the shape of each item in the API response
interface StationData {
  id: number;
  stations: string;
  stationsGroup: string;
  requireOperator: string;
  emptyShiftReason: string;
  unhappyOee: number;
  happyOee: number;
  is_active: number;
  creator: string | null;
  sys_date_time: string;
  updated_at: string | null;
}

// Array to hold station strings
let availableStations: string[] = [];

async function fetchStations(): Promise<void> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data: StationData[] = await response.json();
    availableStations = data.map((item) => item.stations);
  } catch (error) {
    console.error("Error fetching stations:", error);
  }
}

// Immediately fetch the stations
fetchStations();

export { availableStations };
