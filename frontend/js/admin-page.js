document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});

async function initAdmin() {
  let me;
  try {
    me = await Api.getCurrentUser();
  } catch (_) {}
  const user = me?.data || me;
  if (!user || user.role !== 'ADMIN') {
    location.href = '/index.html';
    return;
  }
  window.__adminUser = user;
  initSidebar();
  showSection('dashboard');
}

function initSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  if (!sidebar) return;
  sidebar.addEventListener('click', (e) => {
    const link = e.target.closest('.admin-nav-item[data-section]');
    if (!link) return;
    e.preventDefault();
    sidebar.querySelectorAll('.admin-nav-item').forEach((a) => a.classList.remove('active'));
    link.classList.add('active');
    const section = link.getAttribute('data-section');
    showSection(section);
  });
}

function showSection(key) {
  document.querySelectorAll('.admin-section').forEach((s) => s.classList.add('hidden'));
  const el = document.getElementById(`section-${key}`);
  if (!el) return;
  el.classList.remove('hidden');
  if (key === 'dashboard') loadDashboard();
  if (key === 'movies') initMovies();
  if (key === 'actors') initActors();
  if (key === 'directors') initDirectors();
  if (key === 'users') initUsers();
  if (key === 'genres') initGenres();
  if (key === 'reviews') initReviews();
}

async function loadDashboard() {
  const cards = document.getElementById('statsCards');
  const topEl = document.getElementById('topReviewers');
  const recentEl = document.getElementById('recentReviews');
  if (!cards || !topEl || !recentEl) return;
  cards.innerHTML = '';
  topEl.innerHTML = '';
  recentEl.innerHTML = '';
  try {
    const res = await Api.adminGetStats();
    const d = res.data || res;
    const t = d.totals || {};
    const items = [
      { k: 'movies', label: 'Фильмы' },
      { k: 'users', label: 'Пользователи' },
      { k: 'actors', label: 'Актёры' },
      { k: 'directors', label: 'Режиссёры' }
    ];
    cards.innerHTML = items
      .map((it) => `<div class="card stat-card"><div class="stat-value">${t[it.k] || 0}</div><div class="stat-label">${it.label}</div></div>`) 
      .join('');
    const top = (d.activity && d.activity.top_reviewers) || [];
    topEl.innerHTML = renderTable(['Пользователь', 'Кол-во', 'Средний рейтинг'], top.map((r) => [
      r.User?.username || '—',
      Number(r.dataValues?.review_count || r.review_count || 0),
      Number(r.dataValues?.avg_rating || r.avg_rating || 0).toFixed(2)
    ]));
    const recent = (d.activity && d.activity.recent_reviews) || [];
    recentEl.innerHTML = renderTable(['Фильм', 'Заголовок', 'Оценка', 'Дата'], recent.map((r) => [
      r.Movie?.title || '—',
      r.title || '',
      r.rating || '',
      new Date(r.created_at).toLocaleString()
    ]));
  } catch (e) {
    cards.innerHTML = `<div class="section-subtitle" style="color:var(--text-secondary)">${e.message}</div>`;
  }
}

function initMovies() {
  const form = document.getElementById('moviesFilterForm');
  const reset = document.getElementById('resetMoviesFilter');
  const addBtn = document.getElementById('addMovieBtn');
  loadMovies();
  if (form) form.addEventListener('submit', (e) => { e.preventDefault(); loadMovies(new FormData(form)); });
  if (reset && form) reset.addEventListener('click', () => { form.reset(); loadMovies(); });
  if (addBtn) addBtn.addEventListener('click', () => openMovieForm());
  // Live search with debounce
  if (form) {
    let searchTimer;
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (!t || !t.name) return;
      if (['search', 'release_year', 'genre'].includes(t.name)) {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadMovies(new FormData(form)), 300);
      }
    });
  }
  const section = document.getElementById('section-movies');
  if (section) section.addEventListener('click', onMoviesTableClick);
}

async function loadMovies(formData) {
  const params = {};
  if (formData) {
    for (const [k, v] of formData.entries()) {
      const val = typeof v === 'string' ? v.trim() : v;
      if (val) params[k] = val;
    }
    // Map admin filter fields to backend API query params
    if (params.search) { params.query = params.search; delete params.search; }
    if (params.release_year) {
      const y = params.release_year;
      params.year_from = y;
      params.year_to = y;
      delete params.release_year;
    }
    // Country is not supported in /movies/search — drop to avoid confusion
    if (params.country) delete params.country;
  }
  const table = document.getElementById('moviesTable');
  if (!table) return;
  table.innerHTML = loaderHtml();
  try {
    const res = await Api.searchMovies(params);
    const list = res.data || res;
    const cardsHtml = list
      .map((m) => {
        const directorsArr = (m.Directors || m.directors || []).map((d) => d.full_name);
        const directorText = directorsArr.length ? directorsArr.join(', ') : (m.Director?.full_name || m.director?.full_name || '');
        const poster = m.poster_url || '/images/posters/default-poster.jpg';
        return `
          <div class="admin-movie-card">
            <div class="admin-movie-poster" style="background-image:url('${poster}')"></div>
            <div class="admin-movie-info">
              <div class="admin-movie-title">${m.title}</div>
              <div class="admin-movie-meta">${m.release_year || ''}${directorText ? ` • ${directorText}` : ''}</div>
            </div>
            <div class="admin-movie-actions">
              <button type="button" class="btn btn-primary small" data-edit-movie="${m.movie_id}">Редактировать</button>
              <button type="button" class="btn btn-danger small" data-delete-movie="${m.movie_id}">Удалить</button>
            </div>
          </div>
        `;
      })
      .join('');
    table.className = 'admin-movies-grid';
    table.innerHTML = cardsHtml;
    table.addEventListener('click', onMoviesTableClick);
  } catch (e) {
    table.innerHTML = `<div class="section-subtitle" style="color:var(--text-secondary)">${e.message}</div>`;
  }
}

function onMoviesTableClick(e) {
  const edit = e.target.closest('[data-edit-movie]');
  const del = e.target.closest('[data-delete-movie]');
  if (edit) {
    const id = edit.getAttribute('data-edit-movie');
    openMovieForm(id);
  }
  if (del) {
    const id = del.getAttribute('data-delete-movie');
    confirmDeleteMovie(id);
  }
}

async function deleteMovie(id) {
  try { await Api.adminDeleteMovie(id); loadMovies(); } catch (e) { alert(e.message); }
}

async function confirmDeleteMovie(id) {
  const root = document.getElementById('site-modals') || document.body;
  let modal = document.getElementById('adminConfirmDeleteMovieModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminConfirmDeleteMovieModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:520px;">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        <div style="display:flex;align-items:flex-start;gap:1rem;">
          <span class="material-symbols-outlined" style="font-size:42px;color:#ef4444;">warning</span>
          <div>
            <h2 class="section-title" style="padding:0 0 0.5rem 0;">Удаление фильма</h2>
            <div style="color:var(--text-secondary);font-size:1rem;">Вы точно хотите удалить фильм?</div>
            <div style="display:flex;gap:0.75rem;margin-top:1rem;">
              <button class="btn btn-danger" id="adminConfirmDeleteMovieBtn">Удалить</button>
              <button class="btn btn-secondary" data-close-modal>Отмена</button>
            </div>
          </div>
        </div>
      </div>`;
    root.appendChild(modal);
  }
  const btn = modal.querySelector('#adminConfirmDeleteMovieBtn');
  if (btn) {
    btn.onclick = async () => {
      try { await Api.adminDeleteMovie(id); closeAllModals(); loadMovies(); } catch (e) { showAdminError(e.message); }
    };
  }
  openModal('adminConfirmDeleteMovieModal');
}

function openMovieForm(id) {
  let modal = document.getElementById('movieEditModal');
  const modalsRoot = document.getElementById('site-modals') || document.body;
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'movieEditModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        ${getMovieFormHtml()}
      </div>
    `;
    modalsRoot.appendChild(modal);
    bindMovieForm();
  }
  modal.setAttribute('data-movie-id', id || '');
  const form = modal.querySelector('#movieForm');
  Array.from(form.querySelectorAll('input, textarea')).forEach((el) => { el.value = ''; });
  const actorsListEl = form.querySelector('#actorsList');
  if (actorsListEl) actorsListEl.innerHTML = '';
  const posterHidden = form.querySelector('input[name=poster_url]');
  const backdropHidden = form.querySelector('input[name=backdrop_url]');
  const posterPreview = form.querySelector('#posterPreview');
  const backdropPreview = form.querySelector('#backdropPreview');
  const slugInput = form.querySelector('[name=slug]');
  if (posterHidden) posterHidden.value = '';
  if (backdropHidden) backdropHidden.value = '';
  if (posterPreview) posterPreview.style.backgroundImage = '';
  if (backdropPreview) backdropPreview.style.backgroundImage = '';
  if (slugInput) slugInput.value = '';
  if (id) {
    Api.getMovieById(id).then((res) => {
      const m = res.data || res;
      form.querySelector('[name=title]').value = m.title || '';
      if (slugInput) slugInput.value = m.slug || '';
      form.querySelector('[name=release_year]').value = m.release_year || '';
      form.querySelector('[name=duration]').value = m.duration || '';
      form.querySelector('[name=country]').value = m.country || '';
      const dname = m.Director?.full_name || m.director?.full_name || '';
      const genresText = (m.Genres || m.genres || []).map((g) => g.name).join(', ');
      form.querySelector('[name=director_name]').value = dname;
      form.querySelector('[name=genres_text]').value = genresText;
      if (posterHidden) posterHidden.value = m.poster_url || '';
      if (backdropHidden) backdropHidden.value = m.backdrop_url || '';
      if (posterPreview && m.poster_url) posterPreview.style.backgroundImage = `url('${m.poster_url}')`;
      if (backdropPreview && m.backdrop_url) backdropPreview.style.backgroundImage = `url('${m.backdrop_url}')`;
      const actors = m.Actors || m.actors || [];
      if (actorsListEl && actors.length) {
        actorsListEl.innerHTML = '';
        actors.forEach((a) => {
          const role = a.MovieActor?.role_name || a.MovieActor?.character_name || '';
          const row = document.createElement('div');
          row.setAttribute('data-actor-row', '');
          row.className = 'filter-grid';
          row.style.gridTemplateColumns = '1fr 1fr auto';
          row.style.gap = '0.5rem';
          row.style.marginBottom = '0.5rem';
          row.innerHTML = `
            <label class="filter-field"><span>ФИО</span><input type="text" name="actor_full_name" placeholder="ФИО" value="${a.full_name || ''}" /></label>
            <label class="filter-field"><span>Роль</span><input type="text" name="actor_role" placeholder="Роль" value="${role}" /></label>
            <button type="button" class="btn btn-secondary" data-remove-actor>Удалить</button>
          `;
          actorsListEl.appendChild(row);
          row.querySelector('[data-remove-actor]').addEventListener('click', () => row.remove());
        });
      }
    }).catch(() => {});
  }
  openModal('movieEditModal');
}

function getMovieFormHtml() {
  return `
    <h2 class="section-title" style="padding:0 0 1rem 0;">Карточка фильма</h2>
    <form id="movieForm" class="modal-form">
      <label class="modal-field"><span>Название фильма</span><input type="text" name="title" required /></label>
      <label class="modal-field"><span>Slug</span><input type="text" name="slug" placeholder="kryminalnoe-chivo" /></label>
      <div class="filter-grid">
        <label class="filter-field"><span>Год</span><input type="number" name="release_year" /></label>
        <label class="filter-field"><span>Страна</span><input type="text" name="country" /></label>
        <label class="filter-field"><span>Длительность</span><input type="number" name="duration" /></label>
      </div>
      <label class="modal-field"><span>Режиссёр(ы) (через запятую)</span><input type="text" name="director_name" /></label>
      <label class="modal-field"><span>Жанры (через запятую)</span><input type="text" name="genres_text" /></label>
      <div class="card" style="margin-top:0.5rem;">
        <div class="section-subtitle" style="margin-bottom:0.5rem;">Изображения</div>
        <div class="filter-grid">
          <div class="filter-field">
            <span>Постер</span>
            <div style="display:flex;flex-direction:column;gap:0.5rem;align-items:flex-start;">
              <div id="posterPreview" style="width:100px;height:150px;border-radius:var(--border-radius);background:#1f1f1f;background-size:cover;background-position:center;"></div>
              <input type="file" id="posterFile" accept="image/*" style="display:none;" />
              <label for="posterFile" class="btn btn-secondary small">Выбрать файл</label>
              <input type="hidden" name="poster_url" />
            </div>
          </div>
          <div class="filter-field">
            <span>Фон</span>
            <div style="display:flex;flex-direction:column;gap:0.5rem;align-items:flex-start;">
              <div id="backdropPreview" style="width:100%;height:160px;border-radius:var(--border-radius);background:#1f1f1f;background-size:cover;background-position:center;"></div>
              <input type="file" id="backdropFile" accept="image/*" style="display:none;" />
              <label for="backdropFile" class="btn btn-secondary small">Выбрать файл</label>
              <input type="hidden" name="backdrop_url" />
            </div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:0.5rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <div class="section-subtitle">Актёры</div>
          <button type="button" class="btn btn-secondary" id="addActorRowBtn">Добавить актёра</button>
        </div>
        <div id="actorsList"></div>
      </div>
      <div class="modal-actions" style="display:flex;gap:0.5rem;margin-top:0.5rem;">
        <button type="submit" class="btn btn-primary">Сохранить</button>
      </div>
    </form>
  `;
}

function bindMovieForm() {
  const modal = document.getElementById('movieEditModal');
  const form = modal.querySelector('#movieForm');
  const addActorBtn = form.querySelector('#addActorRowBtn');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitMovieForm(false);
  });
  if (addActorBtn) addActorBtn.addEventListener('click', () => addActorRow());

  const posterInput = form.querySelector('#posterFile');
  const posterPreview = form.querySelector('#posterPreview');
  if (posterInput) {
    posterInput.addEventListener('change', async () => {
      const file = posterInput.files && posterInput.files[0];
      if (!file) return;
      try {
        const resp = await Api.uploadPoster(file);
        const url = resp?.url || resp?.data?.url || '';
        const hidden = form.querySelector('input[name=poster_url]');
        if (hidden) hidden.value = url;
        if (posterPreview && url) posterPreview.style.backgroundImage = `url('${url}')`;
      } catch (err) { alert(err.message); }
    });
  }

  const backdropInput = form.querySelector('#backdropFile');
  const backdropPreview = form.querySelector('#backdropPreview');
  if (backdropInput) {
    backdropInput.addEventListener('change', async () => {
      const file = backdropInput.files && backdropInput.files[0];
      if (!file) return;
      try {
        const resp = await Api.uploadBackdrop(file);
        const url = resp?.url || resp?.data?.url || '';
        const hidden = form.querySelector('input[name=backdrop_url]');
        if (hidden) hidden.value = url;
        if (backdropPreview && url) backdropPreview.style.backgroundImage = `url('${url}')`;
      } catch (err) { alert(err.message); }
    });
  }
}

async function submitMovieForm(closeAfter) {
  const modal = document.getElementById('movieEditModal');
  const id = modal.getAttribute('data-movie-id');
  const form = modal.querySelector('#movieForm');
  const fd = new FormData(form);
  const payload = {};
  for (const [k, v] of fd.entries()) payload[k] = v;
  if (!payload.title) { alert('Название обязательно'); return false; }
  if (!payload.slug) {
    const base = String(payload.title || '').trim().toLowerCase();
    payload.slug = base
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9а-яё\-]/gi, '')
      .replace(/\-+/g, '-');
  }
  // Если введено несколько режиссёров через запятую, берём первого (бэкенд поддерживает одного)
  if (payload.director_name && payload.director_name.includes(',')) {
    payload.director_name = payload.director_name.split(',').map((s) => s.trim()).filter(Boolean)[0] || '';
  }
  const list = form.querySelectorAll('[data-actor-row]');
  const actors = [];
  list.forEach((row) => {
    const name = row.querySelector('input[name=actor_full_name]')?.value?.trim();
    const role = row.querySelector('input[name=actor_role]')?.value?.trim();
    if (name) actors.push({ full_name: name, character_name: role || null });
  });
  if (actors.length) payload.actors = actors;
  try {
    if (id) await Api.adminUpdateMovie(id, payload); else await Api.adminCreateMovie(payload);
    loadMovies();
    return true;
  } catch (e) {
    alert(e.message);
    return false;
  }
}

function addActorRow() {
  const list = document.getElementById('actorsList');
  if (!list) return;
  const row = document.createElement('div');
  row.setAttribute('data-actor-row', '');
  row.className = 'filter-grid';
  row.style.gridTemplateColumns = '1fr 1fr auto';
  row.style.gap = '0.5rem';
  row.style.marginBottom = '0.5rem';
  row.innerHTML = `
    <label class="filter-field"><span>ФИО</span><input type="text" name="actor_full_name" placeholder="ФИО" /></label>
    <label class="filter-field"><span>Роль</span><input type="text" name="actor_role" placeholder="Роль" /></label>
    <button type="button" class="btn btn-secondary" data-remove-actor>Удалить</button>
  `;
  list.appendChild(row);
  row.querySelector('[data-remove-actor]').addEventListener('click', () => row.remove());
}

function initActors() {
  const form = document.getElementById('actorsFilterForm');
  const reset = document.getElementById('resetActorsFilter');
  const add = document.getElementById('addActorBtn');
  loadActors();
  if (form) form.addEventListener('submit', (e) => { e.preventDefault(); loadActors(new FormData(form)); });
  if (reset && form) reset.addEventListener('click', () => { form.reset(); loadActors(); });
  if (add) add.addEventListener('click', () => openPersonForm('actor'));
  if (form) {
    let timer;
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (!t || !t.name) return;
      if (['search', 'country'].includes(t.name)) {
        clearTimeout(timer);
        timer = setTimeout(() => loadActors(new FormData(form)), 300);
      }
    });
  }
}

async function loadActors(formData) {
  const params = {};
  if (formData) for (const [k, v] of formData.entries()) if (v) params[k] = v;
  const table = document.getElementById('actorsTable');
  table.innerHTML = loaderHtml();
  try {
    const res = await Api.searchActors(params);
    const list = res.data || res;
    const cards = (list || []).map((p) => {
      const photo = p.photo_url || '/images/persons/default-actor.jpg';
      const birth = p.birth_date || '';
      const count = p.dataValues?.movies_count || p.movies_count || 0;
      return `
        <div class="admin-actor-card">
          <div class="admin-actor-photo" style="background-image:url('${photo}')"></div>
          <div class="admin-actor-info">
            <div class="admin-actor-name">${p.full_name}</div>
            <div class="admin-actor-meta">${birth}${count ? ` • Фильмов: ${count}` : ''}</div>
          </div>
          <div class="admin-actor-actions">
            <button class="btn btn-primary small" data-edit-actor="${p.actor_id}">Редактировать</button>
            <button class="btn btn-danger small" data-delete-actor="${p.actor_id}">Удалить</button>
          </div>
        </div>
      `;
    }).join('');
    table.className = 'admin-actors-grid';
    table.innerHTML = cards;
    table.addEventListener('click', onActorsTableClick);
  } catch (e) {
    table.innerHTML = `<div class="section-subtitle" style="color:var(--text-secondary)">${e.message}</div>`;
  }
}

function onActorsTableClick(e) {
  const edit = e.target.closest('[data-edit-actor]');
  const del = e.target.closest('[data-delete-actor]');
  if (edit) openPersonForm('actor', edit.getAttribute('data-edit-actor'));
  if (del) { confirmDeleteActor(del.getAttribute('data-delete-actor')); }
}

async function deleteActor(id) { try { await apiRequest(`/actors/${id}`, { method: 'DELETE' }); loadActors(); } catch (e) { alert(e.message); } }

async function confirmDeleteActor(id) {
  const root = document.getElementById('site-modals') || document.body;
  let modal = document.getElementById('adminConfirmDeleteActorModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminConfirmDeleteActorModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:520px;">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        <div style="display:flex;align-items:flex-start;gap:1rem;">
          <span class="material-symbols-outlined" style="font-size:42px;color:#ef4444;">warning</span>
          <div>
            <h2 class="section-title" style="padding:0 0 0.5rem 0;">Удаление актёра</h2>
            <div style="color:var(--text-secondary);font-size:1rem;">Вы точно хотите удалить актёра?</div>
            <div style="display:flex;gap:0.75rem;margin-top:1rem;">
              <button class="btn btn-danger" id="adminConfirmDeleteActorBtn">Удалить</button>
              <button class="btn btn-secondary" data-close-modal>Отмена</button>
            </div>
          </div>
        </div>
      </div>`;
    root.appendChild(modal);
  }
  const btn = modal.querySelector('#adminConfirmDeleteActorBtn');
  if (btn) {
    btn.onclick = async () => {
      try { await apiRequest(`/actors/${id}`, { method: 'DELETE' }); closeAllModals(); loadActors(); } catch (e) { showAdminError(e.message); }
    };
  }
  openModal('adminConfirmDeleteActorModal');
}

function initDirectors() {
  const form = document.getElementById('directorsFilterForm');
  const reset = document.getElementById('resetDirectorsFilter');
  const add = document.getElementById('addDirectorBtn');
  loadDirectors();
  if (form) form.addEventListener('submit', (e) => { e.preventDefault(); loadDirectors(new FormData(form)); });
  if (reset && form) reset.addEventListener('click', () => { form.reset(); loadDirectors(); });
  if (add) add.addEventListener('click', () => openPersonForm('director'));
  if (form) {
    let timer;
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (!t || !t.name) return;
      if (['search', 'country'].includes(t.name)) {
        clearTimeout(timer);
        timer = setTimeout(() => loadDirectors(new FormData(form)), 300);
      }
    });
  }
}

async function loadDirectors(formData) {
  const params = {};
  if (formData) for (const [k, v] of formData.entries()) if (v) params[k] = v;
  const table = document.getElementById('directorsTable');
  table.className = 'admin-table';
  table.innerHTML = loaderHtml();
  try {
    const res = await Api.searchDirectors(params);
    const list = res.data || res;
    const rows = list.map((p) => [
      `<div class="table-avatar" style="background-image:url('${p.photo_url || '/images/persons/default-actor.jpg'}')"></div>`,
      p.full_name,
      p.birth_date || '',
      p.dataValues?.movies_count || p.movies_count || 0,
      `<div class="table-actions">
        <button class="btn btn-secondary small" data-edit-director="${p.director_id}">Редактировать</button>
        <button class="btn btn-secondary small" data-delete-director="${p.director_id}">Удалить</button>
      </div>`
    ]);
    table.innerHTML = renderTable(['', 'Имя', 'Дата рождения', 'Фильмы', 'Действия'], rows);
    table.addEventListener('click', onDirectorsTableClick);
  } catch (e) {
    table.innerHTML = `<div class="section-subtitle" style="color:var(--text-secondary)">${e.message}</div>`;
  }
}

function onDirectorsTableClick(e) {
  const edit = e.target.closest('[data-edit-director]');
  const del = e.target.closest('[data-delete-director]');
  if (edit) openPersonForm('director', edit.getAttribute('data-edit-director'));
  if (del) { confirmDeleteDirector(del.getAttribute('data-delete-director')); }
}

async function deleteDirector(id) { try { await apiRequest(`/directors/${id}`, { method: 'DELETE' }); loadDirectors(); } catch (e) { alert(e.message); } }

async function confirmDeleteDirector(id) {
  const root = document.getElementById('site-modals') || document.body;
  let modal = document.getElementById('adminConfirmDeleteDirectorModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminConfirmDeleteDirectorModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:520px;">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        <div style="display:flex;align-items:flex-start;gap:1rem;">
          <span class="material-symbols-outlined" style="font-size:42px;color:#ef4444;">warning</span>
          <div>
            <h2 class="section-title" style="padding:0 0 0.5rem 0;">Удаление режиссёра</h2>
            <div style="color:var(--text-secondary);font-size:1rem;">Вы точно хотите удалить режиссёра?</div>
            <div style="display:flex;gap:0.75rem;margin-top:1rem;">
              <button class="btn btn-danger" id="adminConfirmDeleteDirectorBtn">Удалить</button>
              <button class="btn btn-secondary" data-close-modal>Отмена</button>
            </div>
          </div>
        </div>
      </div>`;
    root.appendChild(modal);
  }
  const btn = modal.querySelector('#adminConfirmDeleteDirectorBtn');
  if (btn) {
    btn.onclick = async () => {
      try { await apiRequest(`/directors/${id}`, { method: 'DELETE' }); closeAllModals(); loadDirectors(); } catch (e) { showAdminError(e.message); }
    };
  }
  openModal('adminConfirmDeleteDirectorModal');
}

function openPersonForm(type, id) {
  let modal = document.getElementById('personEditModal');
  const modalsRoot = document.getElementById('site-modals') || document.body;
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'personEditModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        <h2 class="section-title" style="padding:0 0 1rem 0;" data-person-title>Карточка</h2>
        ${getPersonFormHtml()}
      </div>
    `;
    modalsRoot.appendChild(modal);
    bindPersonForm();
  }
  modal.setAttribute('data-person-type', type);
  modal.setAttribute('data-person-id', id || '');
  const titleEl = modal.querySelector('[data-person-title]');
  if (titleEl) titleEl.textContent = type === 'actor' ? 'Карточка актёра' : 'Карточка режиссёра';
  populatePersonForm(type, id);
  openModal('personEditModal');
}

function getPersonFormHtml() {
  return `
    <form class="modal-form" data-person-form>
      <label class="modal-field"><span>Имя и фамилия</span><input type="text" name="full_name" required /></label>
      <div class="filter-grid">
        <label class="filter-field"><span>Дата рождения</span><input type="date" name="birth_date" /></label>
        <label class="filter-field"><span>Страна</span><input type="text" name="country" /></label>
        <label class="filter-field"><span>Дата смерти</span><input type="date" name="death_date" /></label>
      </div>
      <label class="modal-field"><span>Биография</span><textarea name="biography" rows="4"></textarea></label>
      <div class="card" style="margin-top:0.5rem;">
        <div class="section-subtitle" style="margin-bottom:0.5rem;">Фото</div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;align-items:flex-start;">
          <div id="personPhotoPreview" style="width:120px;height:160px;border-radius:var(--border-radius);background:#1f1f1f;background-size:cover;background-position:center;"></div>
          <input type="file" id="personPhotoFile" accept="image/*" style="display:none;" />
          <label for="personPhotoFile" class="btn btn-secondary small">Выбрать файл</label>
          <input type="hidden" name="photo_url" />
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;">
        <button type="submit" class="btn btn-primary">Сохранить</button>
      </div>
    </form>
  `;
}

function bindPersonForm() {
  const modal = document.getElementById('personEditModal');
  const form = modal.querySelector('[data-person-form]');
  const fileInput = form.querySelector('#personPhotoFile');
  const preview = form.querySelector('#personPhotoPreview');
  if (fileInput) {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        const resp = await Api.uploadPersonPhoto(file);
        const url = resp?.url || resp?.data?.url || '';
        const hidden = form.querySelector('input[name=photo_url]');
        if (hidden) hidden.value = url;
        if (preview && url) preview.style.backgroundImage = `url('${url}')`;
      } catch (err) { alert(err.message); }
    });
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = modal.getAttribute('data-person-id');
    const type = modal.getAttribute('data-person-type');
    const fd = new FormData(form);
    const payload = {};
    for (const [k, v] of fd.entries()) payload[k] = v;
    try {
      if (type === 'actor') {
        if (id) await apiRequest(`/actors/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); else await apiRequest(`/actors`, { method: 'POST', body: JSON.stringify(payload) });
        loadActors();
      } else {
        if (id) await apiRequest(`/directors/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); else await apiRequest(`/directors`, { method: 'POST', body: JSON.stringify(payload) });
        loadDirectors();
      }
      closeAllModals();
    } catch (e) { alert(e.message); }
  });
}

async function populatePersonForm(type, id) {
  const modal = document.getElementById('personEditModal');
  const form = modal.querySelector('[data-person-form]');
  Array.from(form.querySelectorAll('input, textarea')).forEach((el) => { el.value = ''; });
  const preview = form.querySelector('#personPhotoPreview');
  if (preview) preview.style.backgroundImage = '';
  if (!id) return;
  try {
    const res = await apiRequest(type === 'actor' ? `/actors/${id}` : `/directors/${id}`);
    const p = res.data || res;
    form.querySelector('[name=full_name]').value = p.full_name || '';
    form.querySelector('[name=birth_date]').value = p.birth_date || '';
    form.querySelector('[name=country]').value = p.country || '';
    const deathInput = form.querySelector('[name=death_date]');
    if (deathInput) deathInput.value = p.death_date || '';
    form.querySelector('[name=biography]').value = p.biography || '';
    const photoHidden = form.querySelector('[name=photo_url]');
    if (photoHidden) photoHidden.value = p.photo_url || '';
    if (preview && p.photo_url) preview.style.backgroundImage = `url('${p.photo_url}')`;
  } catch (_) {}
}

function initUsers() {
  const form = document.getElementById('usersFilterForm');
  const reset = document.getElementById('resetUsersFilter');
  loadUsers();
  if (form) form.addEventListener('submit', (e) => { e.preventDefault(); loadUsers(new FormData(form)); });
  if (reset && form) reset.addEventListener('click', () => { form.reset(); loadUsers(); });
  if (form) {
    let timer;
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (!t || !t.name) return;
      if (t.name === 'search') {
        clearTimeout(timer);
        timer = setTimeout(() => loadUsers(new FormData(form)), 300);
      }
    });
  }
}

async function loadUsers(formData) {
  const params = {};
  if (formData) for (const [k, v] of formData.entries()) if (v) params[k] = v;
  const table = document.getElementById('usersTable');
  table.className = 'admin-table';
  table.innerHTML = loaderHtml();
  try {
    const res = await Api.adminGetUsers(params);
    const list = res.data || res;
    const rows = await Promise.all(list.map(async (u) => {
      let reviewsCount = '';
      try {
        const rr = await Api.getUserReviews(u.user_id);
        reviewsCount = rr?.pagination?.total || rr?.pagination?.total || '';
      } catch (_) {}
      const isProtected = String(u.role) === 'ADMIN' || (window.__adminUser && Number(u.user_id) === Number(window.__adminUser.user_id));
      return [
        `<div class="table-avatar" style="background-image:url('${u.avatar_url || '/images/avatars/default-avatar.png'}')"></div>`,
        `${u.username} • ${u.email}`,
        new Date(u.registration_date).toLocaleDateString(),
        reviewsCount,
        `<select class="btn small" ${isProtected ? 'disabled' : ''} data-role-user="${u.user_id}"><option ${u.role==='USER'?'selected':''}>USER</option><option ${u.role==='ADMIN'?'selected':''}>ADMIN</option></select>`,
        `<div class="table-actions">
          <button class="btn btn-secondary small" ${isProtected ? 'disabled' : ''} data-toggle-user="${u.user_id}" data-active="${u.is_active ? '1' : '0'}">${u.is_active ? 'Заблокировать' : 'Разблокировать'}</button>
          <button class="btn btn-danger small" ${isProtected ? 'disabled' : ''} data-delete-user="${u.user_id}">Удалить</button>
        </div>`
      ];
    }));
    table.innerHTML = renderTable(['', 'Пользователь', 'Регистрация', 'Отзывы', 'Роль', 'Действия'], rows);
    table.addEventListener('click', onUsersTableClick);
    table.addEventListener('change', onUsersRoleChange);
  } catch (e) {
    table.innerHTML = `<div class="section-subtitle" style="color:var(--text-secondary)">${e.message}</div>`;
  }
}

function onUsersTableClick(e) {
  const profile = e.target.closest('[data-view-user]');
  const toggle = e.target.closest('[data-toggle-user]');
  const del = e.target.closest('[data-delete-user]');
  if (profile) {
    const id = profile.getAttribute('data-view-user');
    location.href = `/pages/profile.html?id=${id}`;
  }
  if (toggle) {
    const id = toggle.getAttribute('data-toggle-user');
    const active = toggle.getAttribute('data-active') === '1';
    updateUser(id, { is_active: !active }).then((ok) => {
      if (ok) {
        const msg = active ? 'Пользователь заблокирован' : 'Пользователь разблокирован';
        showAdminNotice(msg, active ? 'danger' : 'success');
      }
    });
  }
  if (del) {
    const id = del.getAttribute('data-delete-user');
    confirmDeleteUser(id);
  }
}

function onUsersRoleChange(e) {
  const sel = e.target.closest('[data-role-user]');
  if (!sel) return;
  const id = sel.getAttribute('data-role-user');
  const role = sel.value;
  updateUser(id, { role });
}

async function updateUser(id, payload) {
  try { await Api.adminUpdateUser(id, payload); loadUsers(); return true; } catch (e) { showAdminError(e.message); return false; }
}

async function confirmDeleteUser(id) {
  let count = 0;
  try { const rr = await Api.getUserReviews(id); count = rr?.pagination?.total || 0; } catch (_) {}
  const root = document.getElementById('site-modals') || document.body;
  let modal = document.getElementById('adminConfirmDeleteUserModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminConfirmDeleteUserModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:520px;">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        <div style="display:flex;align-items:flex-start;gap:1rem;">
          <span class="material-symbols-outlined" style="font-size:42px;color:#ef4444;">warning</span>
          <div>
            <h2 class="section-title" style="padding:0 0 0.5rem 0;">Удаление пользователя</h2>
            <div id="adminConfirmDeleteText" style="color:var(--text-secondary);font-size:1rem;"></div>
            <div style="display:flex;gap:0.75rem;margin-top:1rem;">
              <button class="btn btn-danger" id="adminConfirmDeleteBtn">Удалить</button>
              <button class="btn btn-secondary" data-close-modal>Отмена</button>
            </div>
          </div>
        </div>
      </div>`;
    root.appendChild(modal);
  }
  const textEl = modal.querySelector('#adminConfirmDeleteText');
  if (textEl) textEl.textContent = `Вы точно хотите удалить пользователя? Вместе с этим будут удалены и его отзывы. Кол-во:${count}`;
  const btn = modal.querySelector('#adminConfirmDeleteBtn');
  if (btn) {
    btn.onclick = async () => {
      try { await Api.adminDeleteUser(id); closeAllModals(); loadUsers(); } catch (e) { showAdminError(e.message); }
    };
  }
  openModal('adminConfirmDeleteUserModal');
}

function showAdminNotice(message, kind) {
  const root = document.getElementById('site-modals') || document.body;
  let modal = document.getElementById('adminNoticeModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminNoticeModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:480px;">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <span class="material-symbols-outlined" id="adminNoticeIcon" style="font-size:40px;"></span>
          <h2 class="section-title" id="adminNoticeText" style="padding:0;">Сообщение</h2>
        </div>
      </div>`;
    root.appendChild(modal);
  }
  const iconEl = modal.querySelector('#adminNoticeIcon');
  const textEl = modal.querySelector('#adminNoticeText');
  const color = kind === 'danger' ? '#ef4444' : '#22c55e';
  const icon = kind === 'danger' ? 'block' : 'check_circle';
  if (iconEl) { iconEl.textContent = icon; iconEl.style.color = color; }
  if (textEl) textEl.textContent = message || 'Готово';
  openModal('adminNoticeModal');
}

function showAdminError(message) {
  const root = document.getElementById('site-modals') || document.body;
  let modal = document.getElementById('adminErrorModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminErrorModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:480px;">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        <h2 class="section-title" style="padding:0 0 1rem 0;">Ошибка</h2>
        <div id="adminErrorMessage" style="color:var(--text-secondary);font-size:0.95rem;"></div>
        <div style="display:flex;gap:0.75rem;margin-top:1rem;">
          <button class="btn btn-secondary" data-close-modal>Закрыть</button>
        </div>
      </div>`;
    root.appendChild(modal);
  }
  const msgEl = modal.querySelector('#adminErrorMessage');
  if (msgEl) msgEl.textContent = message || 'Произошла ошибка';
  openModal('adminErrorModal');
}

function initGenres() {
  const form = document.getElementById('genresFilterForm');
  loadGenres();
  const add = document.getElementById('addGenreBtn');
  if (add) add.addEventListener('click', () => openGenreForm());
  if (form) {
    let timer;
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (!t || !t.name) return;
      if (t.name === 'search') {
        clearTimeout(timer);
        timer = setTimeout(() => loadGenres(new FormData(form)), 300);
      }
    });
  }
}

async function loadGenres(formData) {
  const table = document.getElementById('genresTable');
  table.className = 'admin-table';
  table.innerHTML = loaderHtml();
  try {
    const res = await Api.getGenres();
    let list = res.data || res;
    window.__genresList = list;
    const params = {};
    if (formData) for (const [k, v] of formData.entries()) if (v) params[k] = v;
    const q = (params.search || '').toString().trim().toLowerCase();
    if (q) list = list.filter((g) => String(g.name || '').toLowerCase().includes(q) || String(g.slug || '').toLowerCase().includes(q));
    const rows = list.map((g) => [
      g.name,
      g.slug,
      `<div class=\"table-actions\">\n        <button class=\"btn btn-secondary small\" data-edit-genre=\"${g.genre_id}\">Переименовать</button>\n        <button class=\"btn btn-danger small\" data-delete-genre=\"${g.genre_id}\">Удалить</button>\n      </div>`
    ]);
    table.innerHTML = renderTable(['Название', 'Slug', 'Действия'], rows);
    table.addEventListener('click', onGenresTableClick);
  } catch (e) {
    table.innerHTML = `<div class="section-subtitle" style="color:var(--text-secondary)">${e.message}</div>`;
  }
}

function onGenresTableClick(e) {
  const edit = e.target.closest('[data-edit-genre]');
  const del = e.target.closest('[data-delete-genre]');
  if (edit) openGenreForm(edit.getAttribute('data-edit-genre'));
  if (del) { confirmDeleteGenre(del.getAttribute('data-delete-genre')); }
}

function openGenreForm(id) {
  let modal = document.getElementById('genreEditModal');
  const modalsRoot = document.getElementById('site-modals') || document.body;
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'genreEditModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        <h2 class="section-title" style="padding:0 0 1rem 0;">Жанр</h2>
        <form id="genreForm" class="modal-form">
          <label class="modal-field"><span>Название</span><input type="text" name="name" required /></label>
          <label class="modal-field"><span>Slug</span><input type="text" name="slug" placeholder="fantasy" /></label>
          <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
            <button type="submit" class="btn btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
    `;
    modalsRoot.appendChild(modal);
    const form = modal.querySelector('#genreForm');
    const nameInput = form.querySelector('input[name=name]');
    const slugInput = form.querySelector('input[name=slug]');
    if (nameInput && slugInput) {
      nameInput.addEventListener('input', () => { slugInput.value = slugify(nameInput.value || ''); });
    }
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      let slug = (fd.get('slug') || '').toString().trim();
      if (!name) return;
      if (!slug) slug = slugify(name);
      const payload = { name, slug };
      const gid = modal.getAttribute('data-genre-id');
      try {
        if (gid) await Api.adminUpdateGenre(gid, payload); else await Api.adminCreateGenre(payload);
        closeAllModals();
        loadGenres();
      } catch (e2) { alert(e2.message); }
    });
  }
  modal.setAttribute('data-genre-id', id || '');
  const input = modal.querySelector('input[name=name]');
  const slugInput = modal.querySelector('input[name=slug]');
  input.value = '';
  if (slugInput) slugInput.value = '';
  if (id && window.__genresList && Array.isArray(window.__genresList)) {
    const g = window.__genresList.find((x) => String(x.genre_id) === String(id));
    if (g) { input.value = g.name || ''; if (slugInput) slugInput.value = g.slug || slugify(g.name || ''); }
  }
  openModal('genreEditModal');
}

async function deleteGenre(id) { try { await Api.adminDeleteGenre(id); loadGenres(); } catch (e) { alert(e.message); } }

async function confirmDeleteGenre(id) {
  const root = document.getElementById('site-modals') || document.body;
  let modal = document.getElementById('adminConfirmDeleteGenreModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminConfirmDeleteGenreModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:520px;">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        <div style="display:flex;align-items:flex-start;gap:1rem;">
          <span class="material-symbols-outlined" style="font-size:42px;color:#ef4444;">warning</span>
          <div>
            <h2 class="section-title" style="padding:0 0 0.5rem 0;">Удаление жанра</h2>
            <div style="color:var(--text-secondary);font-size:1rem;">Вы точно хотите удалить жанр?</div>
            <div style="display:flex;gap:0.75rem;margin-top:1rem;">
              <button class="btn btn-danger" id="adminConfirmDeleteGenreBtn">Удалить</button>
              <button class="btn btn-secondary" data-close-modal>Отмена</button>
            </div>
          </div>
        </div>
      </div>`;
    root.appendChild(modal);
  }
  const btn = modal.querySelector('#adminConfirmDeleteGenreBtn');
  if (btn) {
    btn.onclick = async () => {
      try { await Api.adminDeleteGenre(id); closeAllModals(); loadGenres(); } catch (e) { showAdminError(e.message); }
    };
  }
  openModal('adminConfirmDeleteGenreModal');
}

function initReviews() {
  loadReviews();
}

async function loadReviews() {
  const table = document.getElementById('reviewsTable');
  table.innerHTML = loaderHtml();
  try {
    const res = await Api.getLatestReviews({ limit: 20 });
    const list = res.data || res;
    const rows = list.map((r) => [
      r.Movie?.title || '—',
      r.User?.username || '—',
      r.title || '',
      r.rating || '',
      new Date(r.created_at).toLocaleString(),
      `<div class="table-actions"><button class="btn btn-secondary small" data-hide-review="${r.review_id}">Скрыть</button><button class="btn btn-secondary small" data-delete-review="${r.review_id}">Удалить</button></div>`
    ]);
    table.innerHTML = renderTable(['Фильм', 'Автор', 'Заголовок', 'Оценка', 'Дата', 'Действия'], rows);
    table.addEventListener('click', onReviewsTableClick);
  } catch (e) {
    table.innerHTML = `<div class="section-subtitle" style="color:var(--text-secondary)">${e.message}</div>`;
  }
}

function onReviewsTableClick(e) {
  const hide = e.target.closest('[data-hide-review]');
  const del = e.target.closest('[data-delete-review]');
  if (hide) { const id = hide.getAttribute('data-hide-review'); Api.adminRejectReview(id, {}).then(loadReviews).catch((err) => alert(err.message)); }
  if (del) { const id = del.getAttribute('data-delete-review'); Api.deleteReview(id).then(loadReviews).catch((err) => alert(err.message)); }
}

function renderTable(headers, rows) {
  const thead = `<div class="table-header">${headers.map((h) => `<div class="table-cell">${h}</div>`).join('')}</div>`;
  const body = rows.map((r) => `<div class="table-row">${r.map((c) => `<div class="table-cell">${c}</div>`).join('')}</div>`).join('');
  return thead + body;
}

function loaderHtml() {
  return `<div style="padding:1rem;color:var(--text-secondary)">Загрузка...</div>`;
}

function slugify(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, '-');
}
