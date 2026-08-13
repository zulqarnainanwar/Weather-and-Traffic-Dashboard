import { useState, useEffect } from 'react';
import { Country, City } from 'country-state-city';
import { Globe, MapPin, Sun, Cloud, CloudRain, Snowflake, Droplets, Wind, Thermometer, Search } from 'lucide-react';
import './App.css';

export default function App() {
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [selectedCountryName, setSelectedCountryName] = useState('');
  const [selectedCountryFlag, setSelectedCountryFlag] = useState('');
  
  const [activeCity, setActiveCity] = useState(null);
  const [citySearch, setCitySearch] = useState('');
  
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_KEY = 'bd5e378503939ddaee76f12ad7a97608';

  // 1. Initialize countries & auto-detect user location via IP API
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);

    // Auto-detect location
    fetch('https://ipapi.co/json/')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.country_code) {
          const userCountry = allCountries.find(c => c.isoCode === data.country_code);
          if (userCountry) {
            handleCountrySelect(userCountry.isoCode, data.city);
            return;
          }
        }
        // Fallback to Pakistan / Islamabad if IP detect fails
        handleCountrySelect('PK', 'Islamabad');
      })
      .catch(() => handleCountrySelect('PK', 'Islamabad'));
  }, []);

  // 2. Load cities whenever a country is picked
  const handleCountrySelect = (countryCode, defaultCityName = '') => {
    const countryObj = Country.getCountryByCode(countryCode);
    if (!countryObj) return;

    setSelectedCountryCode(countryCode);
    setSelectedCountryName(countryObj.name);
    setSelectedCountryFlag(countryObj.flag);

    const countryCities = City.getCitiesOfCountry(countryCode) || [];
    setCities(countryCities);
    setCitySearch('');

    if (countryCities.length > 0) {
      // Find matching default city or default to the first city in the list
      const targetCity = defaultCityName 
        ? countryCities.find(c => c.name.toLowerCase() === defaultCityName.toLowerCase()) || countryCities[0]
        : countryCities[0];

      setActiveCity(targetCity);
      fetchLiveWeather(targetCity.name, countryCode);
    } else {
      setActiveCity(null);
      setWeather(null);
    }
  };

  // 3. Select city from the left-side scrollable list
  const handleCityClick = (cityObj) => {
    setActiveCity(cityObj);
    fetchLiveWeather(cityObj.name, selectedCountryCode);
  };

  // 4. Fetch Weather Data from OpenWeatherMap API
  const fetchLiveWeather = async (cityName, countryCode) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName},${countryCode}&units=metric&appid=${API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Weather data currently unavailable for this location.');
      }

      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Weather Icon helper
  const getWeatherIcon = (main) => {
    switch (main) {
      case 'Clear':
        return <Sun size={64} className="icon-sun" />;
      case 'Clouds':
        return <Cloud size={64} className="icon-cloud" />;
      case 'Rain':
      case 'Drizzle':
        return <CloudRain size={64} className="icon-rain" />;
      case 'Snow':
        return <Snowflake size={64} className="icon-snow" />;
      default:
        return <Sun size={64} className="icon-sun" />;
    }
  };

  // Filter cities in scroll list using input
  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <div className="dashboard-wrapper">
      <header className="main-header">
        <span className="badge">Real-time Forecast</span>
        <h1>Weather Dashboard</h1>
        <p>Worldwide countries & live city weather telemetry</p>
      </header>

      {/* Top Country Selection Bar */}
      <div className="country-selector-bar">
        <div className="country-meta">
          <Globe className="globe-icon" size={24} />
          <div>
            <span className="meta-label">Selected Country</span>
            <h2 className="meta-value">{selectedCountryFlag} {selectedCountryName}</h2>
          </div>
        </div>

        <select 
          value={selectedCountryCode}
          onChange={(e) => handleCountrySelect(e.target.value)}
          className="country-dropdown"
        >
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main 2-Column Dashboard Layout */}
      <div className="dashboard-grid">
        
        {/* Left Column: Scrollable Cities List */}
        <div className="cities-sidebar">
          <div className="sidebar-header">
            <h3><MapPin size={18} /> Cities in {selectedCountryName}</h3>
            <span className="city-count">{filteredCities.length} cities</span>
          </div>

          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search city..." 
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
            />
          </div>

          <div className="scrollable-city-list">
            {filteredCities.length > 0 ? (
              filteredCities.map((cityObj, idx) => {
                const isSelected = activeCity && activeCity.name === cityObj.name;
                return (
                  <button
                    key={`${cityObj.name}-${idx}`}
                    onClick={() => handleCityClick(cityObj)}
                    className={`city-list-item ${isSelected ? 'active' : ''}`}
                  >
                    <span className="city-name">{cityObj.name}</span>
                    {cityObj.stateCode && <span className="state-tag">{cityObj.stateCode}</span>}
                  </button>
                );
              })
            ) : (
              <p className="no-cities">No cities found.</p>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Live Weather Panel */}
        <div className="weather-main-panel">
          {loading && (
            <div className="status-container">
              <p className="loading-text">Fetching live satellite weather...</p>
            </div>
          )}

          {error && (
            <div className="status-container">
              <p className="error-text">{error}</p>
            </div>
          )}

          {!loading && !error && weather && (
            <div className="weather-detail-view">
              <div className="detail-top shadow-card">
                <div>
                  <p className="geo-tag">
                    <MapPin size={16} /> {weather.name}, {selectedCountryCode}
                  </p>
                  <h2 className="weather-title">{weather.name}</h2>
                  <p className="weather-desc">{weather.weather[0].description}</p>
                </div>
                <div className="temp-hero">
                  {getWeatherIcon(weather.weather[0].main)}
                  <span className="temp-hero-val">{Math.round(weather.main.temp)}°C</span>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <Droplets size={24} className="stat-icon-blue" />
                  <div>
                    <p className="stat-title">Humidity</p>
                    <p className="stat-val">{weather.main.humidity}%</p>
                  </div>
                </div>

                <div className="stat-card">
                  <Wind size={24} className="stat-icon-purple" />
                  <div>
                    <p className="stat-title">Wind Speed</p>
                    <p className="stat-val">{weather.wind.speed} m/s</p>
                  </div>
                </div>

                <div className="stat-card">
                  <Thermometer size={24} className="stat-icon-yellow" />
                  <div>
                    <p className="stat-title">Feels Like</p>
                    <p className="stat-val">{Math.round(weather.main.feels_like)}°C</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}