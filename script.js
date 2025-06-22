// Biến toàn cục
let allCryptos = [];
let currentCurrency = 'usd';
let usdToVndRate = 24000;
let currentPage = 1;
const coinsPerPage = 20;
const maxPages = 5;

// DOM Elements
const cryptoList = document.getElementById('crypto-list');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const currencySelect = document.getElementById('currency');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const timeElement = document.getElementById('time');

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
  fetchCryptoData();
  setupEventListeners();
});

function setupEventListeners() {
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keyup', (e) => e.key === 'Enter' && handleSearch());
  currencySelect.addEventListener('change', handleCurrencyChange);
  prevPageBtn.addEventListener('click', goToPreviousPage);
  nextPageBtn.addEventListener('click', goToNextPage);
}

function handleSearch() {
  currentPage = 1;
  filterAndDisplayCryptos();
}

async function handleCurrencyChange(e) {
  currentCurrency = e.target.value;
  currentPage = 1;
  
  if (currentCurrency === 'vnd') {
    await fetchUsdToVndRate();
  }
  filterAndDisplayCryptos();
}

async function fetchCryptoData() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=true');
    
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
    
    const data = await response.json();
    allCryptos = data;
    filterAndDisplayCryptos();
    setTimeout(fetchCryptoData, 60000);
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    showError('Failed to load data. Please try again later.');
    setTimeout(fetchCryptoData, 30000);
  }
}

async function fetchUsdToVndRate() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) throw new Error(`Exchange API failed with status ${response.status}`);
    const data = await response.json();
    usdToVndRate = data.rates.VND || 24000;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    usdToVndRate = 24000;
  }
}

function convertCurrency(price) {
  const value = currentCurrency === 'vnd' ? price * usdToVndRate : price;
  const options = {
    style: 'currency',
    currency: currentCurrency === 'vnd' ? 'VND' : 'USD',
    minimumFractionDigits: currentCurrency === 'vnd' ? 0 : 2,
    maximumFractionDigits: currentCurrency === 'vnd' ? 0 : 6
  };
  return new Intl.NumberFormat(currentCurrency === 'vnd' ? 'vi-VN' : 'en-US', options).format(value);
}

function filterAndDisplayCryptos() {
  try {
    const searchTerm = searchInput.value.toLowerCase();
    let filteredCryptos = allCryptos;
    
    if (searchTerm) {
      filteredCryptos = allCryptos.filter(crypto => 
        crypto.name.toLowerCase().includes(searchTerm) || 
        crypto.symbol.toLowerCase().includes(searchTerm)
      );
    }
    
    const startIndex = (currentPage - 1) * coinsPerPage;
    const paginatedCryptos = filteredCryptos.slice(startIndex, startIndex + coinsPerPage);
    
    displayCryptoData(paginatedCryptos);
    updatePagination(filteredCryptos.length);
    updateLastUpdatedTime();
  } catch (error) {
    console.error('Error filtering cryptos:', error);
    showError('Error displaying data. Please refresh the page.');
  }
}

function displayCryptoData(cryptos) {
  if (!cryptos || cryptos.length === 0) {
    cryptoList.innerHTML = '<div class="no-results">No cryptocurrencies found</div>';
    return;
  }
  
  cryptoList.innerHTML = cryptos.map(crypto => {
    const priceChange = crypto.price_change_percentage_24h || 0;
    const priceChangeClass = priceChange >= 0 ? 'price-up' : 'price-down';
    const priceChangeText = priceChange >= 0 ? 
      `+${priceChange.toFixed(2)}%` : 
      `${priceChange.toFixed(2)}%`;
    
    return `
      <div class="crypto-item">
        <div class="crypto-info">
          <span class="crypto-rank">${crypto.market_cap_rank}</span>
          <img src="${crypto.image}" alt="${crypto.name}" class="crypto-icon">
          <div>
            <span class="crypto-name">${crypto.name}</span>
            <span class="crypto-symbol">${crypto.symbol.toUpperCase()}</span>
          </div>
        </div>
        <div class="crypto-price-container">
          <span class="crypto-price">${convertCurrency(crypto.current_price)}</span>
          <span class="price-change ${priceChangeClass}">${priceChangeText}</span>
        </div>
        <div class="chart-container" id="chart-${crypto.id}"></div>
      </div>
    `;
  }).join('');
  
  cryptos.forEach(crypto => {
    if (crypto.sparkline_in_7d?.price) {
      createSparklineChart(crypto.id, crypto.sparkline_in_7d.price);
    }
  });
}

function createSparklineChart(coinId, sparklineData) {
  const canvas = document.createElement('canvas');
  const container = document.getElementById(`chart-${coinId}`);
  if (!container) return;
  
  container.innerHTML = '';
  container.appendChild(canvas);
  
  const dataPoints = sparklineData.slice(-7);
  const isPositive = dataPoints[dataPoints.length - 1] >= dataPoints[0];
  
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: Array(7).fill(''),
      datasets: [{
        data: dataPoints,
        borderColor: isPositive ? '#4ADE80' : '#F87171',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}

function updatePagination(totalItems) {
  const totalPages = Math.min(maxPages, Math.ceil(totalItems / coinsPerPage));
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage >= totalPages;
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function goToPreviousPage() {
  if (currentPage > 1) {
    currentPage--;
    filterAndDisplayCryptos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function goToNextPage() {
  if (currentPage < maxPages) {
    currentPage++;
    filterAndDisplayCryptos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updateLastUpdatedTime() {
  timeElement.textContent = new Date().toLocaleTimeString();
}

function showError(message) {
  cryptoList.innerHTML = `
    <div class="error">
      ${message}
      <button onclick="fetchCryptoData()">Retry</button>
    </div>
  `;
}