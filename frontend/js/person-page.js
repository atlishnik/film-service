document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type'); // actor | director
  const id = params.get('id');
  if (!type || !id) return;
  loadPerson(type, id);
});

async function loadPerson(type, id) {
  try {
    if (type === 'actor') {
      const [actorRes, moviesRes] = await Promise.all([
        apiRequest(`/actors/${id}`),
        apiRequest(`/actors/${id}/movies`)
      ]);
      renderPerson('actor', actorRes.data || actorRes, moviesRes.data || moviesRes);
    } else if (type === 'director') {
      const [dirRes, moviesRes] = await Promise.all([
        apiRequest(`/directors/${id}`),
        apiRequest(`/directors/${id}/movies`)
      ]);
      renderPerson('director', dirRes.data || dirRes, moviesRes.data || moviesRes);
    }
  } catch (e) {
    console.error(e);
  }
}

function renderPerson(type, p, movies) {
  const roleLabel = type === 'actor' ? 'Актёр' : 'Режиссёр';
  document.title = `${p.full_name} - ${roleLabel} - Film Service`;
  document.getElementById('personName').textContent = p.full_name;
  document.getElementById('personType').textContent = roleLabel;
  document.getElementById('personCountry').textContent = p.country || '';
  document.getElementById('personBirth').textContent = p.birth_date || '';
  document.getElementById('personDeath').textContent = p.death_date || '—';
  document.getElementById('personBio').textContent = p.biography || '';

  const photo = document.getElementById('personPhoto');
  if (photo) {
    photo.style.backgroundImage = `url('${p.photo_url || '/images/persons/default-actor.jpg'}')`;
  }

  const titleEl = document.getElementById('personMoviesTitle');
  if (titleEl) {
    titleEl.textContent = type === 'actor' ? 'Фильмы с участием' : 'Фильмы режиссёра';
  }

  const moviesContainer = document.getElementById('personMovies');
  if (!moviesContainer) return;
  if (!movies || !movies.length) {
    moviesContainer.innerHTML = '<p style="color:var(--text-secondary);font-size:0.875rem;">Фильмы не найдены</p>';
    return;
  }
  moviesContainer.innerHTML = movies
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


