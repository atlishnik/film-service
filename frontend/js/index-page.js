document.addEventListener('DOMContentLoaded', () => {
  loadHomePageData();
});

async function loadHomePageData() {
  try {
    const movies = await Api.getPopularMovies();
    const items = movies.data || movies;

    renderPopularMovies(items);
    initHeroSlider(items);
  } catch (e) {
    console.error(e);
  }

  try {
    const actors = await Api.getPopularActors();
    renderPopularActors(actors.data || actors);
  } catch (e) {
    console.error(e);
  }

  try {
    const reviews = await Api.getLatestReviews({ limit: 5 });
    renderLatestReviews(reviews.data || reviews);
    // Периодическое обновление
    setInterval(async () => {
      try {
        const r = await Api.getLatestReviews({ limit: 5 });
        renderLatestReviews(r.data || r);
      } catch (_) {}
    }, 15000);
  } catch (e) {
    console.error(e);
  }
}

function renderPopularMovies(movies) {
  const container = document.getElementById('popularMovies');
  if (!container) return;
  container.innerHTML = movies
    .map(
      (m) => `
    <a class="movie-card" href="/pages/movie.html?slug=${encodeURIComponent(m.slug)}">
      <div class="movie-poster" style="background-image:url('${m.poster_url || '/images/posters/default-poster.jpg'}')"></div>
      <div class="movie-info">
        <p class="movie-title">${m.title}</p>
        <p class="movie-year">${m.release_year || ''}</p>
      </div>
    </a>
  `
    )
    .join('');
}

function renderPopularActors(actors) {
  const container = document.getElementById('popularActors');
  if (!container) return;
  container.innerHTML = actors
    .map(
      (a) => `
    <a class="actor-card detailed" href="/pages/person.html?type=actor&id=${a.actor_id || a.id}">
      <div class="actor-photo small" style="background-image:url('${a.photo_url || '/images/persons/default-actor.jpg'}')"></div>
      <p class="actor-name">${a.full_name}</p>
    </a>
  `
    )
    .join('');
}

function renderLatestReviews(reviews) {
  const container = document.getElementById('latestReviews');
  if (!container) return;
  if (!reviews || !reviews.length) {
    container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.875rem;">Пока нет отзывов</p>';
    return;
  }
  container.innerHTML = reviews
    .map(
      (r) => `
    <a class="review-card" href="/pages/movie.html?slug=${encodeURIComponent(r.Movie?.slug || '')}" style="text-decoration:none;">
      <div class="review-header" style="justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div class="review-avatar" style="background-image:url('${r.User?.avatar_url || '/images/avatars/default-avatar.png'}')"></div>
          <div class="reviewer-info">
            <span class="reviewer-name">${r.User?.username || 'Пользователь'}</span>
            <div style="display:flex;gap:2px;align-items:center;">
              ${Array.from({length:5}).map((_,i)=>`<span class="material-symbols-outlined" style="color:${i < Math.round(Number(r.rating)/2) ? '#ff9d0a' : '#9CA3AF'}">grade</span>`).join('')}
              <span class="review-rating" style="margin-left:6px;">${r.rating}/10</span>
            </div>
          </div>
        </div>
        <div style="color:var(--text-secondary);font-size:0.875rem;">${new Date(r.created_at).toLocaleDateString('ru-RU')}</div>
      </div>
      <div class="review-text">
        <strong>${r.title || ''}</strong>
        <p>${r.review_text || ''}</p>
      </div>
    </a>
  `
    )
    .join('');
}

function initHeroSlider(movies) {
  const hero = document.getElementById('heroSlider');
  if (!hero || !movies || !movies.length) return;
  let index = 0;

  function showMovie(i) {
    const m = movies[i];
    hero.style.backgroundImage = `linear-gradient(180deg, rgba(24, 21, 16, 0) 0%, rgba(24, 21, 16, 0.9) 85%), url('${m.backdrop_url || m.poster_url || '/images/posters/default-poster.jpg'}')`;
    document.getElementById('heroTitle').textContent = m.title;
    document.getElementById('heroDescription').textContent = m.description || '';
    document.getElementById('heroRating').textContent = Number(m.avg_rating || 0).toFixed(1);
    const link = document.getElementById('heroWatchLink');
    link.href = `/pages/movie.html?slug=${encodeURIComponent(m.slug)}`;
  }

  showMovie(index);
  setInterval(() => {
    index = (index + 1) % movies.length;
    showMovie(index);
  }, 7000);
}


