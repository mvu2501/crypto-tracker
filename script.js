// Biến toàn cục
let allCryptos = [];
let currentCurrency = 'usd';
let usdToVndRate = 24000; // Tỷ giá mặc định, sẽ cập nhật sau

// Hàm chính
async function fetchCryptoData() {
  try {
    // Lấy tỷ giá USD/VND nếu đang chọn VND
    if (currentCurrency === 'vnd') {
      await fetchUsdToVndRate();
    }
    
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=true`);
    const data = await response.json();
    allCryptos = data;
    filterAndDisplayCryptos();
  } catch (error) {
    console.error('Error fetching data:', error);
    document.getElementById('crypto-list').innerHTML = '<div class="error">Failed to load data. Please try again later.</div>';
  }
}

// Lấy tỷ giá USD/VND
async function fetchUsdToVndRate() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    usdToVndRate = data.rates.VND;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    // Sử dụng tỷ giá mặc định nếu không lấy được
    usdToVndRate = 24000;
  }
}

// Chuyển đổi tiền tệ
function convertCurrency(price) {
  if (currentCurrency === 'vnd') {
    return (price * usdToVndRate).toLocaleString('vi-VN');
  }
  return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// Hiển thị dữ liệu
function filterAndDisplayCryptos() {
  const searchInput = document.getElementById('search-input').value.toLowerCase();
  const filteredCryptos = allCryptos.filter(crypto => 
    crypto.name.toLowerCase().includes(searchInput) || 
    crypto.symbol.toLowerCase().includes(searchInput)
  ).slice(0, 10); // Giới hạn hiển thị 10 coin

  displayCryptoData(filteredCryptos);
}

// Tạo biểu đồ
function createSparklineChart(container, sparklineData) {
  const canvas = document.createElement('canvas');
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
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}

// Hiển thị dữ liệu crypto
function displayCryptoData(cryptos) {
  const cryptoList = document.getElementById('crypto-list');
  cryptoList.innerHTML = '';

  if (cryptos.length === 0) {
    cryptoList.innerHTML = '<div class="no-result">No cryptocurrencies found</div>';
    return;
  }

  cryptos.forEach(crypto => {
    const cryptoItem = document.createElement('div');
    cryptoItem.className = 'crypto-item';

    const priceChangeClass = crypto.price_change_percentage_24h >= 0 ? 'price-up' : 'price-down';
    const priceChange = crypto.price_change_percentage_24h >= 0 ? 
      `+${crypto.price_change_percentage_24h.toFixed(2)}%` : 
      `${crypto.price_change_percentage_24h.toFixed(2)}%`;

    const currencySymbol = currentCurrency === 'vnd' ? '₫' : '$';
    const displayedPrice = convertCurrency(crypto.current_price);

    cryptoItem.innerHTML = `
      <div class="crypto-info">
        <span>${crypto.market_cap_rank}</span>
        <img src="${crypto.image}" alt="${crypto.name}" class="crypto-icon">
        <span>${crypto.name} (${crypto.symbol.toUpperCase()})</span>
      </div>
      <div class="crypto-price">
        <span>${currencySymbol}${displayedPrice}</span>
        <span class="${priceChangeClass}">${priceChange}</span>
      </div>
    `;

    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    cryptoItem.querySelector('.crypto-price').appendChild(chartContainer);
    
    cryptoList.appendChild(cryptoItem);

    if (crypto.sparkline_in_7d?.price) {
      createSparklineChart(chartContainer, crypto.sparkline_in_7d.price);
    }
  });

  document.getElementById('time').textContent = new Date().toLocaleTimeString();
}

// Sự kiện tìm kiếm
document.getElementById('search-btn').addEventListener('click', filterAndDisplayCryptos);
document.getElementById('search-input').addEventListener('keyup', (e) => {
  if (e.key === 'Enter') {
    filterAndDisplayCryptos();
  }
});

// Sự kiện chuyển đổi tiền tệ
document.getElementById('currency').addEventListener('change', (e) => {
  currentCurrency = e.target.value;
  filterAndDisplayCryptos();
});

// Khởi chạy
fetchCryptoData();
setInterval(fetchCryptoData, 60000);