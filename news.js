// news.js
document.addEventListener('DOMContentLoaded', () => {
  fetchCryptoNews();
});

async function fetchCryptoNews() {
  try {
    // Lưu ý: Thay YOUR_API_KEY bằng API key thực từ NewsAPI
    const response = await fetch('https://newsapi.org/v2/everything?q=cryptocurrency&apiKey=95506b3ae6fa45b88c139e1d31051049&pageSize=10');
    const data = await response.json();
    
    if (data.articles?.length > 0) {
      displayNews(data.articles);
    } else {
      showNoNews();
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    showError();
  }
}

function displayNews(articles) {
  const newsContainer = document.getElementById('news-container');
  newsContainer.innerHTML = articles.map(article => `
    <div class="news-item">
      <h3 class="news-title">${article.title}</h3>
      <div class="news-source">${article.source?.name || 'Unknown'} • ${new Date(article.publishedAt).toLocaleDateString()}</div>
      <p class="news-description">${article.description || 'No description available'}</p>
      <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="news-link">Read more →</a>
    </div>
  `).join('');
}

function showNoNews() {
  document.getElementById('news-container').innerHTML = `
    <div class="no-news">
      No crypto news available at the moment. Please check back later.
    </div>
  `;
}

function showError() {
  document.getElementById('news-container').innerHTML = `
    <div class="error">
      Failed to load news. 
      <button onclick="fetchCryptoNews()">Retry</button>
    </div>
  `;
}