document.addEventListener('DOMContentLoaded', async () => {
  await initProfile();
  initProfileNav();
  initProfileActions();
  initAddBookmarkFlow();
});

async function initProfile() {
  try {
    const me = await Api.getCurrentUser();
    const user = me.data || me;
    if (!user || user.role === 'ADMIN') {
      location.href = '/index.html';
      return;
    }
    
    // Update profile header
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileEmail').textContent = user.email;
    const av = document.getElementById('profileAvatar');
    if (av) av.style.backgroundImage = `url('${user.avatar_url || '/images/avatars/default-avatar.png'}')`;

    // Load user data
    const [reviewsRes, bookmarksRes] = await Promise.all([
      Api.getUserReviews(),
      Api.getBookmarks()
    ]);
    const reviews = reviewsRes.data || reviewsRes || [];
    const bookmarks = bookmarksRes.data || bookmarksRes || [];
    window.__myReviews = reviews;

    // Update stats
    updateProfileStats({ reviews, bookmarks });
    
    // Render sections
    renderProfileReviews(reviews);
    renderProfileBookmarks(bookmarks);
    

    // Populate settings form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.username.value = user.username || '';
      profileForm.email.value = user.email || '';
      profileForm.about.value = user.about || '';
    }
  } catch (e) {
    alert('Нужно войти в систему, чтобы открыть профиль');
    location.href = '/index.html';
  }
}

function updateProfileStats({ reviews, bookmarks }) {
  const reviewsCount = reviews.length;
  const bookmarksCount = bookmarks.length;
  const avgRating = reviews.length 
    ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  // Update stats in header
  document.getElementById('reviewsCount').textContent = reviewsCount;
  document.getElementById('bookmarksCount').textContent = bookmarksCount;
  document.getElementById('avgRating').textContent = avgRating;

  // Update overview section
  const stats = document.getElementById('profileStats');
  if (!stats) return;
  
  stats.innerHTML = `
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-title">Всего фильмов оценено</div>
        <div class="stat-value">${reviewsCount}</div>
      </div>
      <div class="stat-item">
        <div class="stat-title">Фильмов в закладках</div>
        <div class="stat-value">${bookmarksCount}</div>
      </div>
      <div class="stat-item">
        <div class="stat-title">Активность за месяц</div>
        <div class="stat-value">${reviews.filter(r => {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return new Date(r.created_at || r.updated_at) > monthAgo;
        }).length}</div>
      </div>
    </div>
  `;
}

function getFavoriteGenre(bookmarks) {
  if (!bookmarks.length) return '—';
  const genres = {};
  bookmarks.forEach(b => {
    if (b.Movie && b.Movie.genres) {
      const movieGenres = Array.isArray(b.Movie.genres) 
        ? b.Movie.genres 
        : (b.Movie.genres || '').split(',').map(g => g.trim());
      movieGenres.forEach(g => {
        genres[g] = (genres[g] || 0) + 1;
      });
    }
  });
  const maxGenre = Object.entries(genres).sort((a, b) => b[1] - a[1])[0];
  return maxGenre ? maxGenre[0] : '—';
}

function renderProfileReviews(reviews) {
  const list = document.getElementById('profileReviewsList');
  if (!list) return;
  
  if (!reviews.length) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined empty-state-icon">rate_review</span>
        <h3 class="empty-state-title">Нет отзывов</h3>
        <p class="empty-state-description">Вы ещё не оставили ни одного отзыва. Поделитесь своим мнением о фильмах!</p>
      </div>
    `;
    return;
  }
  
  list.innerHTML = reviews
    .map(
      (r) => `
      <div class="review-item" data-review-id="${r.review_id}">
        <div class="review-movie-info">
          <div class="review-movie-poster" style="background-image: url('${r.Movie?.poster_url || '/images/posters/default-poster.jpg'}')"></div>
          <div>
            <a href="/pages/movie.html?slug=${encodeURIComponent(r.Movie?.slug || '')}" class="review-movie-title">
              ${r.Movie?.title || 'Неизвестный фильм'}
            </a>
            <div class="review-movie-year">${r.Movie?.release_year || ''}</div>
          </div>
        </div>
        <div class="review-content">
          <div class="review-header" style="justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              ${Array.from({length:5}).map((_,i)=>`<span class="material-symbols-outlined" style="color:${i < Math.round(Number(r.rating)/2) ? '#ff9d0a' : '#3a3227'}">star</span>`).join('')}
              <span class="review-rating">${r.rating}/10</span>
            </div>
            <div class="review-date">${formatDate(r.created_at || r.updated_at)}</div>
          </div>
          ${r.title ? `<h4 style="margin-bottom: 0.5rem; color: var(--text-primary-dark);">${r.title}</h4>` : ''}
          <p class="review-text">${r.review_text || 'Без текста'}</p>
          <div class="review-actions">
            <button class="btn btn-secondary small" data-action="edit-review">Редактировать</button>
            <button class="btn btn-danger small" data-action="delete-review">Удалить</button>
          </div>
        </div>
      </div>
    `
    )
    .join('');
  initReviewsEditing();
}

function renderProfileBookmarks(bookmarks) {
  const foldersEl = document.getElementById('profileBookmarksFolders');
  const listEl = document.getElementById('profileBookmarksList');
  if (!foldersEl || !listEl) return;
  
  // Group by folder
  const byFolder = bookmarks.reduce((acc, b) => {
    const f = (b.folder || 'Без папки');
    (acc[f] = acc[f] || []).push(b);
    return acc;
  }, {});
  
  // Render folder buttons
  const folders = Object.keys(byFolder);
  foldersEl.innerHTML = folders
    .map((f, i) => `
      <button class="bookmark-folder-btn ${i === 0 ? 'active' : ''}" data-folder="${f}">
        ${f} (${byFolder[f].length})
      </button>
    `).join('');
  
  // Render bookmarks for first folder
  const renderFolder = (folder) => {
    const items = byFolder[folder] || [];
    
    if (!items.length) {
      listEl.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <span class="material-symbols-outlined empty-state-icon">bookmark</span>
          <h3 class="empty-state-title">Папка пуста</h3>
          <p class="empty-state-description">В этой папке пока нет закладок</p>
        </div>
      `;
      return;
    }
    
    listEl.innerHTML = items
      .map(
        (b) => `
        <a class="bookmark-item" href="/pages/movie.html?slug=${encodeURIComponent(b.Movie?.slug || '')}">
          <div class="bookmark-poster" style="background-image:url('${b.Movie?.poster_url || '/images/posters/default-poster.jpg'}')"></div>
          <div class="bookmark-info">
            <div class="bookmark-title">${b.Movie?.title || 'Неизвестный фильм'}</div>
            <div class="bookmark-year">${b.Movie?.release_year || ''}</div>
          </div>
        </a>
      `
      )
      .join('');
  };
  
  // Set initial folder
  if (folders.length > 0) {
    renderFolder(folders[0]);
  } else {
    listEl.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <span class="material-symbols-outlined empty-state-icon">bookmark</span>
        <h3 class="empty-state-title">Нет закладок</h3>
        <p class="empty-state-description">Добавляйте фильмы в закладки, чтобы вернуться к ним позже</p>
      </div>
    `;
  }
  
  // Add folder click handlers
  foldersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.bookmark-folder-btn');
    if (!btn) return;
    
    // Update active state
    document.querySelectorAll('.bookmark-folder-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Render selected folder
    const folder = btn.getAttribute('data-folder');
    renderFolder(folder);
  });
}

function renderProfileFavorites(favs) {
  const list = document.getElementById('profileFavoritesList');
  if (!list) return;
  
  if (!favs.length) {
    list.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <span class="material-symbols-outlined empty-state-icon">favorite</span>
        <h3 class="empty-state-title">Нет избранного</h3>
        <p class="empty-state-description">Добавляйте фильмы в избранное, чтобы быстро находить их</p>
      </div>
    `;
    return;
  }
  
  list.innerHTML = favs
    .map(
      (b) => `
      <a class="bookmark-item" href="/pages/movie.html?slug=${encodeURIComponent(b.Movie?.slug || '')}">
        <div class="bookmark-poster" style="background-image:url('${b.Movie?.poster_url || '/images/posters/default-poster.jpg'}')">
          <div style="position: absolute; top: 0.5rem; right: 0.5rem; background: var(--primary); color: var(--background-dark); width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span class="material-symbols-outlined" style="font-size: 1rem;">favorite</span>
          </div>
        </div>
        <div class="bookmark-info">
          <div class="bookmark-title">${b.Movie?.title || 'Неизвестный фильм'}</div>
          <div class="bookmark-year">${b.Movie?.release_year || ''}</div>
        </div>
      </a>
    `
    )
    .join('');
}

function initAddBookmarkFlow() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('add');
  if (!slug) return;
  
  const section = document.getElementById('profileBookmarksSection');
  const foldersEl = document.getElementById('profileBookmarksFolders');
  const listEl = document.getElementById('profileBookmarksList');
  
  if (section) section.style.display = '';
  document.querySelector('.profile-nav-link[href="#bookmarks"]')?.classList.add('active');
  document.querySelectorAll('.profile-nav-link').forEach((l) => {
    if (l.getAttribute('href') !== '#bookmarks') l.classList.remove('active');
  });
  
  Api.getBookmarkFolders()
    .then((res) => {
      const items = res.data || res || [];
      
      // Создаем модальное окно для выбора папки
      const modalHtml = `
        <div class="modal-backdrop"></div>
        <div class="modal">
          <div class="modal-content">
            <button class="modal-close" id="closeBookmarkModal">
              <span class="material-symbols-outlined">close</span>
            </button>
            <h2 class="modal-title">Добавить в закладки</h2>
            <div class="modal-form">
              <div class="modal-field">
                <span>Выберите папку</span>
                <select id="bookmarkFolderSelect">
                  <option value="">Выбрать папку…</option>
                  ${items.map((f) => `<option value="${f.folder}">${f.folder}</option>`).join('')}
                </select>
              </div>
              <div class="modal-field">
                <span>Или создайте новую</span>
                <input type="text" id="bookmarkNewFolderInput" placeholder="Название новой папки" />
              </div>
              <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
                <button type="button" class="btn btn-primary" id="confirmAddBookmark">Добавить</button>
                <button type="button" class="btn btn-secondary" id="cancelAddBookmark">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Добавляем модальное окно в DOM
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = modalHtml;
      document.body.appendChild(modalContainer);
      
      // Закрытие модального окна
      document.getElementById('closeBookmarkModal')?.addEventListener('click', () => {
        modalContainer.remove();
      });
      
      document.getElementById('cancelAddBookmark')?.addEventListener('click', () => {
        modalContainer.remove();
      });
      
      document.querySelector('.modal-backdrop')?.addEventListener('click', () => {
        modalContainer.remove();
      });
      
      // Подтверждение добавления
      document.getElementById('confirmAddBookmark')?.addEventListener('click', async () => {
        const select = document.getElementById('bookmarkFolderSelect');
        const input = document.getElementById('bookmarkNewFolderInput');
        const folder = (input.value || select.value || '').trim();
        if (!folder) { alert('Укажите папку'); return; }
        try {
          const movieRes = await Api.getMovieBySlug(slug);
          const movie = movieRes.data || movieRes;
          await Api.addBookmark({ movie_id: movie.movie_id, folder });
          modalContainer.remove();
          alert('Добавлено в закладки');
          location.href = '/pages/profile.html#bookmarks';
        } catch (err) {
          alert(err.message);
        }
      });
    })
    .catch(() => {
      // Если не удалось загрузить папки, показываем простой диалог
      const folderName = prompt('Введите название папки для закладки:');
      if (folderName) {
        Api.getMovieBySlug(slug)
          .then(movieRes => {
            const movie = movieRes.data || movieRes;
            return Api.addBookmark({ movie_id: movie.movie_id, folder: folderName });
          })
          .then(() => {
            alert('Добавлено в закладки');
            location.href = '/pages/profile.html#bookmarks';
          })
          .catch(err => alert(err.message));
      }
    });
}

function initProfileNav() {
  const links = document.querySelectorAll('.profile-nav-link');
  const sections = {
    '#overview': document.getElementById('profileOverviewSection'),
    '#reviews': document.getElementById('profileReviewsSection'),
    '#bookmarks': document.getElementById('profileBookmarksSection'),
    '#settings': document.getElementById('profileSettingsSection')
  };
  
  links.forEach((l) => {
    l.addEventListener('click', (e) => {
      e.preventDefault();
      const hash = l.getAttribute('href');
      
      // Update active link
      links.forEach((x) => x.classList.remove('active'));
      l.classList.add('active');
      
      // Show selected section
      Object.values(sections).forEach((s) => {
        if (s) s.style.display = 'none';
      });
      if (sections[hash]) {
        sections[hash].style.display = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function initReviewsEditing() {
  const list = document.getElementById('profileReviewsList');
  if (!list) return;
  list.addEventListener('click', async (e) => {
    const card = e.target.closest('.review-item');
    if (!card) return;
    const id = card.getAttribute('data-review-id');
    if (e.target.matches('[data-action="edit-review"]')) {
      const review = getMyReviewById(id);
      openProfileReviewModal(review);
    }
    if (e.target.matches('[data-action="delete-review"]')) {
      openDeleteReviewModal(id);
    }
  });
}

function getMyReviewById(id) {
  const list = window.__myReviews || [];
  return list.find((r) => String(r.review_id) === String(id));
}

function openProfileReviewModal(review) {
  const root = document.getElementById('site-modals') || document.body;
  let modal = document.getElementById('profileReviewEditModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'profileReviewEditModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:640px;">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        <h2 class="section-title" style="padding:0 0 1rem 0;" data-review-title>Отзыв</h2>
        <form id="profileReviewEditForm" class="modal-form">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
            <div id="profileEditStarRating" style="display:flex;gap:0.35rem;font-size:26px;">
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
      </div>`;
    root.appendChild(modal);
  }
  const titleEl = modal.querySelector('[data-review-title]');
  if (titleEl) titleEl.textContent = 'Редактировать отзыв';
  const form = modal.querySelector('#profileReviewEditForm');
  if (!form) return;
  form.title.value = review?.title || '';
  form.review_text.value = review?.review_text || '';
  const ratingInput = form.querySelector('input[name="rating"]');
  ratingInput.value = review?.rating ? String(review.rating) : '';
  initStarsForProfile(form, '#profileEditStarRating');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const rating = Number(fd.get('rating'));
    if (!rating || rating < 1 || rating > 10) { alert('Оценка должна быть от 1 до 10'); return; }
    try {
      const res = await Api.updateReview(review.review_id, { title: fd.get('title') || null, review_text: fd.get('review_text') || null, rating });
      const updated = res.data || res;
      // обновить карточку
      const card = document.querySelector(`.review-item[data-review-id="${review.review_id}"]`);
      if (card) {
        const ratingEl = card.querySelector('.review-rating');
        if (ratingEl) ratingEl.textContent = `${updated.rating}/10`;
        const textEl = card.querySelector('p.review-text') || card.querySelector('.review-text');
        if (textEl) textEl.textContent = updated.review_text || 'Без текста';
        const titleEl2 = card.querySelector('h4');
        if (updated.title) {
          if (titleEl2) { titleEl2.textContent = updated.title; }
          else {
            const h = document.createElement('h4');
            h.style.marginBottom = '0.5rem';
            h.style.color = 'var(--text-primary-dark)';
            h.textContent = updated.title;
            card.querySelector('.review-content').insertBefore(h, card.querySelector('.review-text'));
          }
        } else if (titleEl2) { titleEl2.remove(); }
      }
      // обновить состояние списка
      const idx = (window.__myReviews || []).findIndex((x) => String(x.review_id) === String(review.review_id));
      if (idx >= 0) window.__myReviews[idx] = updated;
      closeAllModals();
    } catch (err) { alert(err.message); }
  };
  openModal('profileReviewEditModal');
}

function initStarsForProfile(form, selector) {
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

function openDeleteReviewModal(id) {
  const root = document.getElementById('site-modals') || document.body;
  let modal = document.getElementById('confirmDeleteReviewModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'confirmDeleteReviewModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content" style="max-width:480px;">
        <button class="icon-btn modal-close" data-close-modal>
          <span class="material-symbols-outlined">close</span>
        </button>
        <h2 class="section-title" style="padding:0 0 1rem 0;">Удалить отзыв</h2>
        <p style="color:var(--text-secondary);font-size:0.95rem;">Вы уверены, что хотите удалить свой отзыв? Действие нельзя отменить.</p>
        <div style="display:flex;gap:0.75rem;margin-top:1rem;">
          <button class="btn btn-danger" id="confirmDeleteReviewBtn">Удалить</button>
          <button class="btn btn-secondary" data-close-modal>Отмена</button>
        </div>
      </div>`;
    root.appendChild(modal);
  }
  const btn = modal.querySelector('#confirmDeleteReviewBtn');
  if (btn) {
    btn.onclick = async () => {
      try {
        await Api.deleteReview(id);
        const card = document.querySelector(`.review-item[data-review-id="${id}"]`);
        if (card) card.remove();
        window.__myReviews = (window.__myReviews || []).filter((x) => String(x.review_id) !== String(id));
        closeAllModals();
      } catch (err) { alert(err.message); }
    };
  }
  openModal('confirmDeleteReviewModal');
}

function initProfileActions() {
  const editBtn = document.getElementById('editProfileBtn');
  const form = document.getElementById('profileForm');
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  
  if (editBtn && form) {
    editBtn.addEventListener('click', () => {
      document.querySelector('.profile-nav-link[href="#settings"]').click();
    });
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      
      // Создаем модальное окно подтверждения
      const modalHtml = `
        <div class="modal-backdrop"></div>
        <div class="modal">
          <div class="modal-content">
            <button class="modal-close" id="closeConfirmModal">
              <span class="material-symbols-outlined">close</span>
            </button>
            <h2 class="modal-title">Подтверждение</h2>
            <div style="padding: 1rem 0;">
              <p>Вы уверены, что хотите сохранить изменения в профиле?</p>
            </div>
            <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
              <button type="button" class="btn btn-primary" id="confirmSave">Да, сохранить</button>
              <button type="button" class="btn btn-secondary" id="cancelSave">Отмена</button>
            </div>
          </div>
        </div>
      `;
      
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = modalHtml;
      document.body.appendChild(modalContainer);
      
      // Закрытие модального окна
      document.getElementById('closeConfirmModal')?.addEventListener('click', () => {
        modalContainer.remove();
      });
      
      document.getElementById('cancelSave')?.addEventListener('click', () => {
        modalContainer.remove();
      });
      
      document.querySelector('.modal-backdrop')?.addEventListener('click', () => {
        modalContainer.remove();
      });
      
      // Подтверждение сохранения
      document.getElementById('confirmSave')?.addEventListener('click', async () => {
        try {
          await Api.updateProfile({
            username: fd.get('username'),
            email: fd.get('email'),
            about: fd.get('about')
          });
          modalContainer.remove();
          
          // Показываем уведомление об успехе
          const successModal = `
            <div class="modal-backdrop"></div>
            <div class="modal">
              <div class="modal-content">
                <h2 class="modal-title">Успешно!</h2>
                <div style="padding: 1rem 0; text-align: center;">
                  <span class="material-symbols-outlined" style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;">check_circle</span>
                  <p>Профиль успешно обновлён</p>
                </div>
                <div style="display: flex; justify-content: center; margin-top: 1.5rem;">
                  <button type="button" class="btn btn-primary" id="closeSuccessModal">OK</button>
                </div>
              </div>
            </div>
          `;
          
          const successContainer = document.createElement('div');
          successContainer.innerHTML = successModal;
          document.body.appendChild(successContainer);
          
          document.getElementById('closeSuccessModal')?.addEventListener('click', () => {
            successContainer.remove();
            location.reload();
          });
          
          document.querySelector('.modal-backdrop')?.addEventListener('click', () => {
            successContainer.remove();
            location.reload();
          });
          
        } catch (err) {
          modalContainer.remove();
          alert(err.message);
        }
      });
    });
  }
  
  if (changeAvatarBtn) {
    changeAvatarBtn.addEventListener('click', async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        
        // Показываем модальное окно загрузки
        const uploadModal = `
          <div class="modal-backdrop"></div>
          <div class="modal">
            <div class="modal-content">
              <h2 class="modal-title">Загрузка аватара</h2>
              <div style="padding: 1rem 0; text-align: center;">
                <span class="material-symbols-outlined" style="font-size: 3rem; color: var(--text-secondary-dark); margin-bottom: 1rem;">cloud_upload</span>
                <p>Пожалуйста, подождите...</p>
              </div>
            </div>
          </div>
        `;
        
        const uploadContainer = document.createElement('div');
        uploadContainer.innerHTML = uploadModal;
        document.body.appendChild(uploadContainer);
        
        try {
          await Api.uploadAvatar(file);
          uploadContainer.remove();
          
          // Показываем уведомление об успехе
          const successModal = `
            <div class="modal-backdrop"></div>
            <div class="modal">
              <div class="modal-content">
                <h2 class="modal-title">Успешно!</h2>
                <div style="padding: 1rem 0; text-align: center;">
                  <span class="material-symbols-outlined" style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;">check_circle</span>
                  <p>Аватар успешно обновлён</p>
                </div>
                <div style="display: flex; justify-content: center; margin-top: 1.5rem;">
                  <button type="button" class="btn btn-primary" id="closeAvatarSuccess">OK</button>
                </div>
              </div>
            </div>
          `;
          
          const successContainer = document.createElement('div');
          successContainer.innerHTML = successModal;
          document.body.appendChild(successContainer);
          
          document.getElementById('closeAvatarSuccess')?.addEventListener('click', () => {
            successContainer.remove();
            location.reload();
          });
          
          document.querySelector('.modal-backdrop')?.addEventListener('click', () => {
            successContainer.remove();
            location.reload();
          });
          
        } catch (err) {
          uploadContainer.remove();
          alert(err.message);
        }
      };
      input.click();
    });
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
