// Konfigurasi
const API_KEY = "a1e7fa5215b5046bf9cf1cd9b78478ad"; 
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// Elemen DOM
const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const loadingEl = document.getElementById("loading");
const errorMsgEl = document.getElementById("error-msg");
const weatherInfoEl = document.getElementById("weather-info");
const forecastSectionEl = document.getElementById("forecast-section");
const forecastContainerEl = document.getElementById("forecast-container");
const historyContainerEl = document.getElementById("history-container");

const cityNameEl = document.getElementById("city-name");
const weatherIconEl = document.getElementById("weather-icon");
const temperatureEl = document.getElementById("temperature");
const descriptionEl = document.getElementById("description");
const humidityEl = document.getElementById("humidity");

const btnCelsius = document.getElementById("btn-celsius");
const btnFahrenheit = document.getElementById("btn-fahrenheit");

// State Aplikasi
let currentUnit = "metric"; // 'metric' -> °C, 'imperial' -> °F
let currentCity = "";
let searchHistory = JSON.parse(localStorage.getItem("weather_history")) || [];

// Event Listener Utama
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) {
    currentCity = city;
    getWeatherData(city);
    cityInput.value = "";
  }
});

btnCelsius.addEventListener("click", () => changeUnit("metric"));
btnFahrenheit.addEventListener("click", () => changeUnit("imperial"));

// Fungsi untuk Mengubah Unit Suhu (°C / °F)
const changeUnit = (unit) => {
  if (currentUnit === unit) return;
  currentUnit = unit;

  if (unit === "metric") {
    btnCelsius.classList.add("active");
    btnFahrenheit.classList.remove("active");
  } else {
    btnFahrenheit.classList.add("active");
    btnCelsius.classList.remove("active");
  }

  if (currentCity) {
    getWeatherData(currentCity);
  }
};

// Fungsi Mengambil Data Cuaca (async/await + Fetch API)
const getWeatherData = async (city) => {
  showLoading(true);
  hideError();

  try {
    // 1. Fetch Cuaca Saat Ini
    const weatherRes = await fetch(
      `${BASE_URL}/weather?q=${city}&units=${currentUnit}&lang=id&appid=${API_KEY}`
    );

    // Error Handling: Kota Tidak Ditemukan (404)
    if (weatherRes.status === 404) {
      throw new Error("Kota tidak ditemukan. Periksa kembali ejaan nama kota.");
    }

    if (!weatherRes.ok) {
      throw new Error("Terjadi kesalahan saat mengambil data cuaca.");
    }

    const weatherData = await weatherRes.json();

    // 2. Fetch Forecast 5 Hari
    const forecastRes = await fetch(
      `${BASE_URL}/forecast?q=${city}&units=${currentUnit}&lang=id&appid=${API_KEY}`
    );

    const forecastData = await forecastRes.json();

    // Tampilkan Data ke UI
    displayCurrentWeather(weatherData);
    displayForecast(forecastData.list);

    // Simpan ke Riwayat Pencarian
    saveToHistory(weatherData.name);

  } catch (error) {
    // Error Handling: Network Error atau Custom Error
    if (error.message === "Failed to fetch") {
      showError("Gagal terhubung ke jaringan (Network Error). Periksa koneksi internet Anda.");
    } else {
      showError(error.message);
    }
  } finally {
    showLoading(false);
  }
};

// Fungsi Menampilkan Cuaca Saat Ini
const displayCurrentWeather = (data) => {
  const { name, main, weather } = data;
  const unitSymbol = currentUnit === "metric" ? "°C" : "°F";

  cityNameEl.textContent = name;
  temperatureEl.textContent = `${Math.round(main.temp)} ${unitSymbol}`;
  descriptionEl.textContent = weather[0].description;
  humidityEl.textContent = main.humidity;
  weatherIconEl.src = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;

  weatherInfoEl.classList.remove("hidden");
};

// Fungsi Menampilkan Forecast (Memakai Array Methods: filter & map)
const displayForecast = (forecastList) => {
  forecastContainerEl.innerHTML = "";

  // Menggunakan .filter() untuk mengambil data prakiraan jam 12:00 siang tiap hari
  const dailyForecast = forecastList.filter((item) =>
    item.dt_txt.includes("12:00:00")
  );

  const unitSymbol = currentUnit === "metric" ? "°C" : "°F";

  // Menggunakan .map() untuk mengolah array menjadi elemen HTML
  const forecastCardsHTML = dailyForecast.map((item) => {
    const date = new Date(item.dt_txt).toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    return `
      <div class="forecast-card">
        <p><strong>${date}</strong></p>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="icon" />
        <p>${Math.round(item.main.temp)} ${unitSymbol}</p>
      </div>
    `;
  }).join("");

  forecastContainerEl.innerHTML = forecastCardsHTML;
  forecastSectionEl.classList.remove("hidden");
};

// Fungsi Manajemen LocalStorage untuk Riwayat
const saveToHistory = (city) => {
  if (!searchHistory.includes(city)) {
    searchHistory.unshift(city);
    if (searchHistory.length > 5) searchHistory.pop(); // Maksimal 5 riwayat
    localStorage.setItem("weather_history", JSON.stringify(searchHistory));
    renderHistory();
  }
};

const renderHistory = () => {
  historyContainerEl.innerHTML = "";
  searchHistory.forEach((city) => {
    const chip = document.createElement("button");
    chip.className = "history-chip";
    chip.textContent = city;
    chip.addEventListener("click", () => {
      currentCity = city;
      getWeatherData(city);
    });
    historyContainerEl.appendChild(chip);
  });
};

// Helper Loading State & Error UI
const showLoading = (isLoading) => {
  if (isLoading) {
    loadingEl.classList.remove("hidden");
    weatherInfoEl.classList.add("hidden");
    forecastSectionEl.classList.add("hidden");
  } else {
    loadingEl.classList.add("hidden");
  }
};

const showError = (message) => {
  errorMsgEl.textContent = message;
  errorMsgEl.classList.remove("hidden");
};

const hideError = () => {
  errorMsgEl.classList.add("hidden");
};

// Inisialisasi Riwayat saat Aplikasi Pertama Dibuka
renderHistory();