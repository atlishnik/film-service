document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (!slug) return;
  loadMovie(slug);
  loadAuthForReview();
  initBookmarkUi();
});

async function loadMovie(slug) {
  try {
    const res = await Api.getMovieBySlug(slug);
    const movie = res.data || res;
    renderMovie(movie);
    window.__currentMovie = movie;
    renderReviewFormIfPossible();
  } catch (e) {
    console.error(e);
  }
}

function renderMovie(m) {
  document.title = `${m.title} - Film Service`;
  document.getElementById('movieTitle').textContent = m.title;
  document.getElementById('movieOriginalTitle').textContent = m.original_title || '';
  document.getElementById('movieRating').textContent = `Рейтинг: ${Number(m.avg_rating || 0).toFixed(1)} (${m.rating_count || 0} оценок)`;
  document.getElementById('movieYear').textContent = m.release_year || '';
  document.getElementById('movieCountry').textContent = m.country || '';
  document.getElementById('movieDuration').textContent = m.duration ? `${m.duration} мин.` : '';
  document.getElementById('movieDescription').textContent = m.description || '';

  const poster = document.getElementById('moviePoster');
  if (poster) {
    poster.style.backgroundImage = `url('${m.poster_url || '/images/posters/default-poster.jpg'}')`;
  }
  const banner = document.getElementById('movieBanner');
  if (banner) {
    banner.style.backgroundImage = `linear-gradient(180deg, rgba(24,21,16,0.0) 0%, rgba(24,21,16,0.75) 70%), url('${m.backdrop_url || m.poster_url || '/images/posters/default-poster.jpg'}')`;
  }

  const genresContainer = document.getElementById('movieGenres');
  if (genresContainer) {
    genresContainer.innerHTML = (m.Genres || m.genres || [])
      .map((g) => {
        const slug = g.slug || g.name;
        return `<a class="genre-tag" href="/pages/movies.html?genre=${encodeURIComponent(slug)}">${g.name}</a>`;
      })
      .join('');
  }

  const directorContainer = document.getElementById('movieDirector');
  if (directorContainer) {
    const d = m.Director || m.director;
    if (d) {
      directorContainer.innerHTML = `<a class="info-value link" href="/pages/person.html?type=director&id=${d.director_id}">${d.full_name}</a>`;
    } else {
      directorContainer.textContent = '—';
    }
  }

  const actorsContainer = document.getElementById('movieActors');
  if (actorsContainer) {
    const actors = m.Actors || m.actors || [];
    actorsContainer.innerHTML = actors
      .map((a) => {
        const photo = a.photo_url || '/images/persons/default-actor.jpg';
        const role = a.MovieActor?.role_name || a.MovieActor?.character_name || '';
        return `
      <a class="actor-card detailed" href="/pages/person.html?type=actor&id=${a.actor_id}">
        <div class="actor-photo small" style="background-image:url('${photo}')"></div>
        <p class="actor-name">${a.full_name}</p>
        ${role ? `<p class="actor-role">${role}</p>` : ''}
      </a>
    `;
      })
      .join('');
  }

  const reviewsContainer = document.getElementById('movieReviews');
  if (reviewsContainer) {
    const reviews = m.Reviews || m.reviews || [];
    if (!reviews.length) {
      reviewsContainer.innerHTML = '<p style="color:var(--text-secondary);font-size:0.875rem;">Отзывов пока нет</p>';
    } else {
      reviewsContainer.innerHTML = reviews
        .map(
          (r) => `
        <article class="review-card" data-review-id="${r.review_id}" data-user-id="${r.User?.user_id || r.user_id || ''}" style="display:grid;grid-template-columns:240px 1fr;gap:1rem;">
          <div>
            <div class="review-avatar" style="background-image:url('${r.User?.avatar_url || '/images/avatars/default-avatar.png'}')"></div>
            <div class="reviewer-info" style="margin-top:0.5rem;">
              <span class="reviewer-name">${r.User?.username || 'Пользователь'}</span>
              <div style="display:flex;gap:2px;margin-top:0.25rem;align-items:center;">
                ${Array.from({length:5}).map((_,i)=>`<span class="material-symbols-outlined" style="color:${i < Math.round(Number(r.rating)/2) ? '#f59e0b' : '#9CA3AF'}">grade</span>`).join('')}
                <span class="review-rating" style="margin-left:6px;">${r.rating}/10</span>
              </div>
            </div>
          </div>
          <div class="review-text" style="align-self:center;">
            ${r.title ? `<strong style="display:block;margin-bottom:0.25rem;">${r.title}</strong>` : ''}
            <p>${r.review_text || ''}</p>
            <div class="review-actions" style="margin-top:0.5rem;display:none;">
              <button class="btn btn-secondary small" data-action="edit-review">Редактировать</button>
              <button class="btn btn-danger small" data-action="delete-review">Удалить</button>
            </div>
            
          </div>
        </article>
      `
        )
        .join('');
      initMovieReviewsEditing();
      enableReviewActionsForOwner();
    }
  }
}

async function loadAuthForReview() {
  const token = localStorage.getItem('token');
  if (!token) {
    renderReviewFormGuest();
    return;
  }
  try {
    const me = await Api.getCurrentUser();
    window.__currentUser = me?.data || me;
    renderReviewFormIfPossible();
    enableReviewActionsForOwner();
  } catch (_) {
    renderReviewFormGuest();
  }
}

function renderReviewFormIfPossible() {
  const btn = document.getElementById('openCreateReviewModalTop');
  const user = window.__currentUser;
  const movie = window.__currentMovie;
  if (!btn || !movie) return;
  if (!user) { btn.style.display = 'none'; return; }
  const hasOwn = ((movie.Reviews || movie.reviews || []) || []).some((r) => Number(r.User?.user_id || r.user_id) === Number(user.user_id));
  btn.style.display = hasOwn ? 'none' : '';
  btn.onclick = () => openReviewModal();
}

function initStars(form) {
  const stars = form.querySelectorAll('#starRating [data-star]');
  const input = form.querySelector('input[name="rating"]');
  let current = 0;
  const paint = () => {
    stars.forEach((s) => {
      const val = Number(s.getAttribute('data-star'));
      s.style.color = val <= current ? '#f59e0b' : '#9CA3AF';
    });
  };
  stars.forEach((s) => {
    s.addEventListener('click', () => {
      current = Number(s.getAttribute('data-star'));
      input.value = String(current);
      paint();
    });
    s.addEventListener('mouseenter', () => {
      const hoverVal = Number(s.getAttribute('data-star'));
      stars.forEach((x) => {
        const v = Number(x.getAttribute('data-star'));
        x.style.color = v <= hoverVal ? '#f59e0b' : '#9CA3AF';
      });
    });
    s.addEventListener('mouseleave', paint);
  });
  paint();
}

function renderReviewFormGuest() {
  const btn = document.getElementById('openCreateReviewModalTop');
  if (btn) btn.style.display = 'none';
}


function initBookmarkUi() {
  const btn = document.getElementById('bookmarkButton');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Войдите, чтобы добавлять закладки');
      return;
    }
    openBookmarkModalForMovie(window.__currentMovie);
  });
}
// Модальное добавление в закладки со страницы фильма
async function openBookmarkModalForMovie(movie) {
  if (!movie) return;
  try {
    const res = await Api.getBookmarkFolders();
    const items = res.data || res || [];
    const root = document.getElementById('site-modals') || document.body;
    let modal = document.getElementById('bookmarkChooseModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'bookmarkChooseModal';
      modal.className = 'modal hidden';
      modal.innerHTML = `
        <div class="modal-content">
          <button class="icon-btn modal-close" data-close-modal>
            <span class="material-symbols-outlined">close</span>
          </button>
          <h2 class="section-title" style="padding:0 0 1rem 0;">Добавить в закладки</h2>
          <form id="bookmarkChooseForm" class="modal-form">
            <label class="modal-field">
              <span>Выберите папку</span>
              <select name="folder"><option value="">Выбрать папку…</option></select>
            </label>
            <label class="modal-field">
              <span>Или создайте новую</span>
              <input type="text" name="new_folder" placeholder="Название новой папки" />
            </label>
            <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
              <button type="submit" class="btn btn-primary">Добавить</button>
              <button type="button" class="btn btn-secondary" data-close-modal>Отмена</button>
            </div>
          </form>
        </div>`;
      root.appendChild(modal);
    }
    const select = modal.querySelector('select[name="folder"]');
    if (select) select.innerHTML = `<option value="">Выбрать папку…</option>` + items.map((f) => `<option value="${f.folder}">${f.folder}</option>`).join('');
    const form = modal.querySelector('#bookmarkChooseForm');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const folder = (fd.get('new_folder') || fd.get('folder') || '').toString().trim();
        if (!folder) { alert('Укажите папку'); return; }
        try { await Api.addBookmark({ movie_id: movie.movie_id, folder }); closeAllModals(); alert('Добавлено в закладки'); }
        catch (err) { alert(err.message); }
      };
    }
    openModal('bookmarkChooseModal');
  } catch (err) { alert(err.message); }
}

function prependReviewToList(r) {
  const reviewsContainer = document.getElementById('movieReviews');
  if (!reviewsContainer) return;
  const me = window.__currentUser;
  const html = `
    <article class="review-card" data-review-id="${r.review_id}" data-user-id="${me?.user_id || r.user_id || ''}" style="display:grid;grid-template-columns:240px 1fr;gap:1rem;">
      <div>
        <div class="review-avatar" style="background-image:url('${r.User?.avatar_url || me?.avatar_url || '/images/avatars/default-avatar.png'}')"></div>
        <div class="reviewer-info" style="margin-top:0.5rem;">
          <span class="reviewer-name">${r.User?.username || me?.username || 'Пользователь'}</span>
          <div style="display:flex;gap:2px;margin-top:0.25rem;align-items:center;">
            ${Array.from({length:5}).map((_,i)=>`<span class="material-symbols-outlined" style="color:${i < Math.round(Number(r.rating)/2) ? '#f59e0b' : '#9CA3AF'}">grade</span>`).join('')}
            <span class="review-rating" style="margin-left:6px;">${r.rating}/10</span>
          </div>
        </div>
      </div>
      <div class="review-text" style="align-self:center;">
        ${r.title ? `<strong style="display:block;margin-bottom:0.25rem;">${r.title}</strong>` : ''}
        <p class="review-text">${r.review_text || ''}</p>
        <div class="review-actions" style="margin-top:0.5rem;">
          <button class="btn btn-secondary small" data-action="edit-review">Редактировать</button>
          <button class="btn btn-danger small" data-action="delete-review">Удалить</button>
        </div>
      </div>
    </article>
  `;
  reviewsContainer.innerHTML = html + reviewsContainer.innerHTML;
  // обновляем состояние фильма
  const state = window.__currentMovie;
  if (state) {
    const list = state.Reviews || state.reviews || [];
    list.unshift(r);
    if (state.Reviews) state.Reviews = list; else state.reviews = list;
  }
  initMovieReviewsEditing();
  enableReviewActionsForOwner();
}

function initMovieReviewsEditing() {
  const container = document.getElementById('movieReviews');
  if (!container) return;
  container.addEventListener('click', async (e) => {
    const card = e.target.closest('.review-card');
    if (!card) return;
    const id = card.getAttribute('data-review-id');
    if (e.target.matches('[data-action="edit-review"]')) {
      const review = getReviewByIdFromState(id);
      openReviewModal(review);
    }
    if (e.target.matches('[data-action="delete-review"]')) {
      if (!confirm('Удалить отзыв?')) return;
      try {
        await Api.deleteReview(id);
        card.remove();
        // удалить из состояния и показать кнопку создания
        const m = window.__currentMovie;
        if (m) {
          const list = (m.Reviews || m.reviews || []).filter((x) => String(x.review_id) !== String(id));
          if (m.Reviews) m.Reviews = list; else m.reviews = list;
        }
        renderReviewFormIfPossible();
      } catch (err) {
        alert(err.message);
      }
    }
  });
}

function enableReviewActionsForOwner() {
  const me = window.__currentUser;
  if (!me) return;
  document.querySelectorAll('#movieReviews .review-card').forEach((card) => {
    const uid = Number(card.getAttribute('data-user-id'));
    if (uid && uid === me.user_id) {
      const actions = card.querySelector('.review-actions');
      if (actions) actions.style.display = '';
    }
  });
}

function getReviewByIdFromState(id) {
  const m = window.__currentMovie;
  if (!m) return null;
  const list = m.Reviews || m.reviews || [];
  return list.find((r) => String(r.review_id) === String(id));
}

function openReviewModal(review) {
  const root = document.getElementById('site-modals') || document.body;
  let modal = document.getElementById('reviewEditModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'reviewEditModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:640px;">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        <h2 class="section-title" style="padding:0 0 1rem 0;" data-review-title>Отзыв</h2>
        <form id="reviewEditForm" class="modal-form">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
            <div id="editStarRating" style="display:flex;gap:0.35rem;font-size:26px;">
              ${Array.from({ length: 10 }).map((_, i) => `<span class=\"material-symbols-outlined\" data-star=\"${i + 1}\" style=\"cursor:pointer;color:#f59e0b\">grade</span>`).join('')}
            </div>
            <input type="hidden" name="rating" />
          </div>
          <label class="modal-field" style="margin-top:0.25rem;">
            <span style="font-size:0.95rem;font-weight:600;">Заголовок</span>
            <input type="text" name="title" placeholder="Заголовок" style="font-size:1.05rem;height:2.75rem;padding:0.625rem 0.75rem;" />
          </label>
          <label class="modal-field" style="margin-top:0.5rem;">
            <span>Отзыв</span>
            <textarea name="review_text" rows="5" placeholder="Ваши мысли о фильме" style="font-size:1.05rem;padding:0.625rem 0.75rem;"></textarea>
          </label>
          <div style="display:flex;gap:0.75rem;margin-top:0.5rem;">
            <button type="submit" class="btn btn-primary">Сохранить</button>
            <button type="button" class="btn btn-secondary" data-close-modal>Отмена</button>
          </div>
        </form>
      </div>
    `;
    root.appendChild(modal);
  }
  const titleEl = modal.querySelector('[data-review-title]');
  if (titleEl) titleEl.textContent = review ? 'Редактировать отзыв' : 'Новый отзыв';
  const form = modal.querySelector('#reviewEditForm');
  if (!form) return;
  form.title.value = review?.title || '';
  form.review_text.value = review?.review_text || '';
  const ratingInput = form.querySelector('input[name="rating"]');
  ratingInput.value = review?.rating ? String(review.rating) : '';
  initStarsFor(form, '#editStarRating');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const rating = Number(fd.get('rating'));
    if (!rating || rating < 1 || rating > 10) { alert('Оценка должна быть от 1 до 10'); return; }
    try {
      if (review && review.review_id) {
        const res = await Api.updateReview(review.review_id, { title: fd.get('title') || null, review_text: fd.get('review_text') || null, rating });
        const updated = res.data || res;
        const card = document.querySelector(`#movieReviews .review-card[data-review-id=\"${review.review_id}\"]`);
        if (card) {
          const ratingEl = card.querySelector('.review-rating');
          if (ratingEl) ratingEl.textContent = `${updated.rating}/10`;
          const textEl = card.querySelector('.review-text p');
          if (textEl) textEl.textContent = updated.review_text || '';
          const titleEl2 = card.querySelector('strong');
          if (updated.title) {
            if (titleEl2) { titleEl2.textContent = updated.title; }
            else {
              const h = document.createElement('strong');
              h.style.display = 'block';
              h.style.marginBottom = '0.25rem';
              h.textContent = updated.title;
              card.querySelector('.review-text').insertBefore(h, card.querySelector('.review-text p'));
            }
          } else if (titleEl2) { titleEl2.remove(); }
        }
      } else {
        const created = await Api.createReview({ movie_id: window.__currentMovie.movie_id, rating, title: fd.get('title') || '', review_text: fd.get('review_text') || '' });
        const reviewObj = created.data || created;
        prependReviewToList(reviewObj);
        renderReviewFormIfPossible();
      }
      closeAllModals();
    } catch (err) { alert(err.message); }
  };
  openModal('reviewEditModal');
}

function initStarsFor(form, selector) {
  const stars = form.querySelectorAll(`${selector} [data-star]`);
  const input = form.querySelector('input[name="rating"]');
  let current = Number(input.value) || 0;
  const paint = () => { stars.forEach((s) => { const val = Number(s.getAttribute('data-star')); s.style.color = val <= current ? '#f59e0b' : '#9CA3AF'; }); };
  stars.forEach((s) => {
    s.addEventListener('click', () => { current = Number(s.getAttribute('data-star')); input.value = String(current); paint(); });
    s.addEventListener('mouseenter', () => { const hoverVal = Number(s.getAttribute('data-star')); stars.forEach((x) => { const v = Number(x.getAttribute('data-star')); x.style.color = v <= hoverVal ? '#f59e0b' : '#9CA3AF'; }); });
    s.addEventListener('mouseleave', paint);
  });
  paint();
}
