async function fetchCryptoData() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&sparkline=true');
    const data = await response.json();
    displayCryptoData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    document.getElementById('crypto-list').innerHTML = '<div class="error">Failed to load data. Please try again later.</div>';
  }
}

function createSparklineChart(container, sparklineData) {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  
  // Lấy 7 điểm dữ liệu cuối cùng (7 ngày)
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

function displayCryptoData(cryptos) {
  const cryptoList = document.getElementById('crypto-list');
  cryptoList.innerHTML = '';

  cryptos.forEach(crypto => {
    const cryptoItem = document.createElement('div');
    cryptoItem.className = 'crypto-item';

    const priceChangeClass = crypto.price_change_percentage_24h >= 0 ? 'price-up' : 'price-down';
    const priceChange = crypto.price_change_percentage_24h >= 0 ? 
      `+${crypto.price_change_percentage_24h.toFixed(2)}%` : 
      `${crypto.price_change_percentage_24h.toFixed(2)}%`;

    cryptoItem.innerHTML = `
      <div class="crypto-info">
        <span>${crypto.market_cap_rank}</span>
        <img src="${crypto.image}" alt="${crypto.name}" class="crypto-icon">
        <span>${crypto.name} (${crypto.symbol.toUpperCase()})</span>
      </div>
      <div class="crypto-price">
        <span>$${crypto.current_price.toLocaleString()}</span>
        <span class="${priceChangeClass}">${priceChange}</span>
      </div>
    `;

    // Thêm container cho biểu đồ
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    cryptoItem.querySelector('.crypto-price').appendChild(chartContainer);
    
    cryptoList.appendChild(cryptoItem);

    // Vẽ biểu đồ nếu có dữ liệu
    if (crypto.sparkline_in_7d?.price) {
      createSparklineChart(chartContainer, crypto.sparkline_in_7d.price);
    }
  });

  // Update time
  document.getElementById('time').textContent = new Date().toLocaleTimeString();
}

// Fetch data initially
fetchCryptoData();

// Update every 60 seconds
setInterval(fetchCryptoData, 60000);