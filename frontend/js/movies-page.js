document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('moviesFilter');
  const resetBtn = document.getElementById('resetMoviesFilter');
  const moviesCountEl = document.getElementById('moviesCount');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      loadMovies(new FormData(form));
    });
  }

  if (resetBtn && form) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      loadMovies();
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const preset = {};
  if (urlParams.get('genre')) preset.genre = urlParams.get('genre');
  if (urlParams.get('query')) preset.query = urlParams.get('query');
  loadMovies(Object.keys(preset).length ? new URLSearchParams(preset) : undefined);
});

async function loadMovies(formData) {
  const params = {};
  if (formData) {
    if (formData instanceof URLSearchParams) {
      for (const [k, v] of formData.entries()) if (v) params[k] = v;
    } else {
      for (const [key, value] of formData.entries()) {
        if (value) params[key] = value;
      }
    }
  }
  try {
    const res = await Api.searchMovies(params);
    renderMovies(res.data || res);
  } catch (e) {
    console.error(e);
    renderMovies([]);
  }
}

function renderMovies(movies) {
  const container = document.getElementById('moviesList');
  const moviesCountEl = document.getElementById('moviesCount');
  
  if (!container) return;
  
  const count = movies?.length || 0;
  if (moviesCountEl) {
    moviesCountEl.textContent = `${count} ${getCountWord(count)}`;
  }
  
  if (!movies || !movies.length) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = movies
    .map(
      (m) => `
      <a class="movie-card" href="/pages/movie.html?slug=${encodeURIComponent(m.slug)}">
        <div class="movie-poster" style="background-image:url('${m.poster_url || '/images/posters/default-poster.jpg'}')">
          ${m.rating ? `<div class="rating-badge absolute bottom-2 left-2" style="width:2rem;height:2rem;font-size:0.875rem;">${m.rating.toFixed(1)}</div>` : ''}
        </div>
        <div class="movie-info">
          <p class="movie-title">${m.title}</p>
          <p class="movie-year">${m.release_year || ''}${m.duration ? ` • ${m.duration} мин` : ''}</p>
        </div>
      </a>
    `
    )
    .join('');
}

function getCountWord(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'фильмов';
  if (lastDigit === 1) return 'фильм';
  if (lastDigit >= 2 && lastDigit <= 4) return 'фильма';
  return 'фильмов';
}
