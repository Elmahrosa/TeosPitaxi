export const EGYPTIAN_CITIES = [
  { city: "Alexandria", governorate: "Alexandria", lat: 31.2001, lng: 29.9187 },
  { city: "Cairo", governorate: "Cairo", lat: 30.0444, lng: 31.2357 },
  { city: "Giza", governorate: "Giza", lat: 30.0131, lng: 31.2089 },
  { city: "Shubra El-Kheima", governorate: "Qalyubia", lat: 30.1286, lng: 31.2422 },
  { city: "Port Said", governorate: "Port Said", lat: 31.2653, lng: 32.3019 },
  { city: "Suez", governorate: "Suez", lat: 29.9668, lng: 32.5498 },
  { city: "Luxor", governorate: "Luxor", lat: 25.6872, lng: 32.6396 },
  { city: "Mansoura", governorate: "Dakahlia", lat: 31.0409, lng: 31.3785 },
  { city: "El-Mahalla El-Kubra", governorate: "Gharbia", lat: 30.9743, lng: 31.1669 },
  { city: "Tanta", governorate: "Gharbia", lat: 30.7865, lng: 31.0004 },
  { city: "Asyut", governorate: "Asyut", lat: 27.1809, lng: 31.1837 },
  { city: "Ismailia", governorate: "Ismailia", lat: 30.5903, lng: 32.2654 },
  { city: "Fayyum", governorate: "Fayyum", lat: 29.3084, lng: 30.8428 },
  { city: "Zagazig", governorate: "Sharqia", lat: 30.5877, lng: 31.5021 },
  { city: "Aswan", governorate: "Aswan", lat: 24.0889, lng: 32.8998 },
  { city: "Damietta", governorate: "Damietta", lat: 31.4175, lng: 31.8144 },
  { city: "Damanhur", governorate: "Beheira", lat: 31.0341, lng: 30.4682 },
  { city: "Minya", governorate: "Minya", lat: 28.0871, lng: 30.7618 },
  { city: "Beni Suef", governorate: "Beni Suef", lat: 29.0661, lng: 31.0994 },
  { city: "Qena", governorate: "Qena", lat: 26.1551, lng: 32.716 },
  { city: "Sohag", governorate: "Sohag", lat: 26.5569, lng: 31.6948 },
  { city: "Hurghada", governorate: "Red Sea", lat: 27.2579, lng: 33.8116 },
  { city: "6th of October City", governorate: "Giza", lat: 29.9602, lng: 30.9291 },
  { city: "Shibin El Kom", governorate: "Monufia", lat: 30.5505, lng: 31.011 },
  { city: "Banha", governorate: "Qalyubia", lat: 30.4596, lng: 31.1844 },
  { city: "Kafr el-Sheikh", governorate: "Kafr el-Sheikh", lat: 31.1107, lng: 30.9388 },
  { city: "Arish", governorate: "North Sinai", lat: 31.1319, lng: 33.798 },
  { city: "Mallawi", governorate: "Minya", lat: 27.7317, lng: 30.8419 },
]

export const POPULAR_LOCATIONS = [
  // Alexandria
  { name: "Alexandria Train Station", city: "Alexandria", lat: 31.1975, lng: 29.9097 },
  { name: "Bibliotheca Alexandrina", city: "Alexandria", lat: 31.2089, lng: 29.9096 },
  { name: "Alexandria Airport", city: "Alexandria", lat: 31.1889, lng: 29.949 },
  { name: "Stanley Bridge", city: "Alexandria", lat: 31.2343, lng: 29.9544 },
  { name: "Montazah Palace", city: "Alexandria", lat: 31.2901, lng: 30.0174 },
  { name: "Corniche", city: "Alexandria", lat: 31.2239, lng: 29.952 },

  // Cairo
  { name: "Cairo International Airport", city: "Cairo", lat: 30.1219, lng: 31.4056 },
  { name: "Egyptian Museum", city: "Cairo", lat: 30.0478, lng: 31.2336 },
  { name: "Tahrir Square", city: "Cairo", lat: 30.0444, lng: 31.2357 },
  { name: "Cairo Tower", city: "Cairo", lat: 30.0458, lng: 31.2244 },
  { name: "Khan el-Khalili", city: "Cairo", lat: 30.0474, lng: 31.2624 },
  { name: "City Stars Mall", city: "Cairo", lat: 30.0726, lng: 31.3427 },
  { name: "Cairo Festival City", city: "Cairo", lat: 30.0292, lng: 31.4011 },

  // Giza
  { name: "Pyramids of Giza", city: "Giza", lat: 29.9792, lng: 31.1342 },
  { name: "Sphinx", city: "Giza", lat: 29.9753, lng: 31.1376 },
  { name: "Mall of Egypt", city: "Giza", lat: 30.0034, lng: 30.9705 },
  { name: "Smart Village", city: "Giza", lat: 30.0755, lng: 30.9984 },

  // Aswan
  { name: "Aswan Airport", city: "Aswan", lat: 23.9644, lng: 32.82 },
  { name: "Philae Temple", city: "Aswan", lat: 24.0253, lng: 32.8844 },
  { name: "Aswan High Dam", city: "Aswan", lat: 23.9675, lng: 32.877 },
]

export function searchEgyptianLocations(query: string) {
  if (!query || query.length < 2) return []

  const lowerQuery = query.toLowerCase()
  const results = []

  // Search cities
  const cityMatches = EGYPTIAN_CITIES.filter(
    (city) => city.city.toLowerCase().includes(lowerQuery) || city.governorate.toLowerCase().includes(lowerQuery),
  )
  results.push(...cityMatches.map((c) => ({ ...c, type: "city" })))

  // Search popular locations
  const locationMatches = POPULAR_LOCATIONS.filter((loc) => loc.name.toLowerCase().includes(lowerQuery))
  results.push(...locationMatches.map((l) => ({ ...l, type: "location" })))

  return results.slice(0, 8) // Return top 8 matches
}
