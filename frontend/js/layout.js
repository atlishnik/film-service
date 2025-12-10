// Общий хедер, футер и модальные окна

document.addEventListener('DOMContentLoaded', () => {
  initLayout();
  initAuth();
  initSearch();
});

function initLayout() {
  const headerPlaceholder = document.getElementById('site-header');
  const footerPlaceholder = document.getElementById('site-footer');
  const modalsPlaceholder = document.getElementById('site-modals');

  if (headerPlaceholder) {
    headerPlaceholder.innerHTML = getHeaderHtml();
    initHeaderAuthState();
  }
  if (footerPlaceholder) {
    footerPlaceholder.innerHTML = getFooterHtml();
  }
  if (modalsPlaceholder) {
    modalsPlaceholder.innerHTML = getModalsHtml();
  }
}

async function initHeaderAuthState() {
  const actions = document.querySelector('.header-actions');
  if (!actions) return;
  const token = localStorage.getItem('token');
  if (!token) {
    actions.innerHTML = `<button class="btn btn-secondary small" id="openLoginModal">Войти</button>`;
    return;
  }
  try {
    const me = await Api.getCurrentUser();
    const user = me?.data || me;
    actions.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <a href="/pages/profile.html" class="flex items-center gap-3 text-white" style="text-decoration:none">
          <div class="user-avatar" style="background-image:url('${user?.avatar_url || '/images/avatars/default-avatar.png'}')"></div>
          <span style="font-weight:600;">${user?.username || 'Пользователь'}</span>
        </a>
        ${user?.role === 'ADMIN' ? `<a class="btn btn-primary small" href="/pages/admin.html">Админ</a>` : ''}
        <button class="btn btn-secondary small" id="logoutBtn">Выйти</button>
      </div>
    `;
  } catch (_) {
    actions.innerHTML = `<button class="btn btn-secondary small" id="openLoginModal">Войти</button>`;
  }
}

function getHeaderHtml() {
  return `
  <header class="header">
    <div class="container" style="display:flex;align-items:center;justify-content:space-between;gap:1rem;">
      <div style="display:flex;align-items:center;gap:2rem;min-width:0;">
        <a href="/index.html" class="flex items-center gap-3 text-white" style="text-decoration:none">
          <div class="logo-icon">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 class="logo-text">Film Service</h2>
        </a>
        <nav class="main-nav">
          <a class="nav-link" href="/pages/movies.html">Фильмы</a>
          <a class="nav-link" href="/pages/actors.html">Актёры</a>
          <a class="nav-link" href="/pages/directors.html">Режиссёры</a>
        </nav>
        <div class="search-container" id="headerSearchContainer">
          <div class="search-input-group">
            <span class="material-symbols-outlined search-icon">search</span>
            <input id="headerSearchInput" class="search-input" type="text" placeholder="Поиск: фильмы, актёры, режиссёры" />
          </div>
          <div id="headerSearchResults" class="search-results hidden"></div>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary small" id="openLoginModal">Войти</button>
      </div>
    </div>
  </header>
  `;
}

function getFooterHtml() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <div class="logo-icon">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
            </svg>
          </div>
          <p class="footer-copyright">© 2024 Film Service</p>
        </div>
        <nav class="footer-nav">
          <a class="footer-link" href="#">О проекте</a>
          <a class="footer-link" href="#">Помощь</a>
          <a class="footer-link" href="#">Контакты</a>
        </nav>
        <div class="footer-social">
          <a class="social-link" href="#"><span class="material-symbols-outlined">share</span></a>
        </div>
      </div>
    </div>
  </footer>
  `;
}

function getModalsHtml() {
  return `
  <div class="modal-backdrop hidden" id="modalBackdrop"></div>

  <div class="modal hidden" id="loginModal">
    <div class="modal-content auth-compact">
      <button class="icon-btn modal-close" data-close-modal>
        <span class="material-symbols-outlined">close</span>
      </button>
      <h2 class="section-title" style="padding:0 0 1rem 0;">Вход</h2>
      <form id="loginForm" class="modal-form">
        <label class="modal-field">
          <span>Email</span>
          <input type="email" name="email" required />
        </label>
        <label class="modal-field">
          <span>Пароль</span>
          <input type="password" name="password" required />
        </label>
        <button type="submit" class="btn btn-primary full-width">Войти</button>
      </form>
      <p style="margin-top:1rem;font-size:0.875rem;color:var(--text-secondary);">
        Нет аккаунта?
        <button type="button" id="switchToRegister" class="btn btn-secondary small">Зарегистрироваться</button>
      </p>
    </div>
  </div>

  <div class="modal hidden" id="registerModal">
    <div class="modal-content auth-compact">
      <button class="icon-btn modal-close" data-close-modal>
        <span class="material-symbols-outlined">close</span>
      </button>
      <h2 class="section-title" style="padding:0 0 1rem 0;">Регистрация</h2>
      <form id="registerForm" class="modal-form">
        <label class="modal-field">
          <span>Логин</span>
          <input type="text" name="username" required />
        </label>
        <label class="modal-field">
          <span>Email</span>
          <input type="email" name="email" required />
        </label>
        <label class="modal-field">
          <span>Пароль</span>
          <input type="password" name="password" required />
        </label>
        <button type="submit" class="btn btn-primary full-width">Создать аккаунт</button>
      </form>
      <p style="margin-top:1rem;font-size:0.875rem;color:var(--text-secondary);">
        Уже есть аккаунт?
        <button type="button" id="switchToLogin" class="btn btn-secondary small">Войти</button>
      </p>
    </div>
  </div>

  
  `;
}

function openModal(id) {
  const modal = document.getElementById(id);
  const backdrop = document.getElementById('modalBackdrop');
  if (!modal || !backdrop) return;
  modal.classList.remove('hidden');
  backdrop.classList.remove('hidden');
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  const backdrop = document.getElementById('modalBackdrop');
  if (backdrop) backdrop.classList.add('hidden');
}

function initAuth() {
  document.body.addEventListener('click', (e) => {
    const loginBtn = e.target.closest('#openLoginModal');

    if (loginBtn) {
      openModal('loginModal');
    }
    const logoutBtn = e.target.closest('#logoutBtn');
    if (logoutBtn) {
      localStorage.removeItem('token');
      location.reload();
    }
    if (e.target.id === 'switchToRegister') {
      closeAllModals();
      openModal('registerModal');
    }
    if (e.target.id === 'switchToLogin') {
      closeAllModals();
      openModal('loginModal');
    }
    if (e.target.hasAttribute('data-close-modal') || e.target.closest('[data-close-modal]')) {
      closeAllModals();
    }
    if (e.target.id === 'modalBackdrop') {
      closeAllModals();
    }
  });

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      try {
        const resp = await Api.authLogin({
          email: formData.get('email'),
          password: formData.get('password')
        });
        const token = resp?.data?.token || resp?.token;
        if (token) localStorage.setItem('token', token);
        const user = resp?.data?.user || null;
        closeAllModals();
        if (user?.role === 'ADMIN') {
          location.href = '/pages/admin.html';
        } else {
          location.reload();
        }
      } catch (err) {
        const msg = err?.message || '';
        if ((err && err.status === 403) || (msg.toLowerCase().includes('заблок'))) {
          showBlockedModal('Вы заблокированы администратором');
        } else {
          alert(msg);
        }
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      try {
        const payload = {
          username: formData.get('username'),
          email: formData.get('email'),
          password: formData.get('password')
        };
        if (!payload.username || payload.username.length < 3) {showAuthNotice('Логин менее 3 символов'); return; }
        if (!payload.password || payload.password.length < 6) { showAuthNotice('Пароль менее 6 символов', 'danger'); return; }
        await Api.authRegister(payload);
        alert('Регистрация успешна. Теперь войдите.');
        closeAllModals();
        openModal('loginModal');
      } catch (err) {
        alert(err.message);
      }
    });
  }
}

function initSearch() {
  const input = document.getElementById('headerSearchInput');
  const results = document.getElementById('headerSearchResults');
  if (!input || !results) return;

  let controller = null;
  input.addEventListener('input', async () => {
    const query = input.value.trim();
    if (!query) {
      results.classList.add('hidden');
      results.innerHTML = '';
      return;
    }
    results.classList.remove('hidden');
    results.innerHTML = '<div class="search-result-info">Идёт поиск...</div>';
    if (controller) controller.abort();
    controller = new AbortController();
    try {
      const [movies, actors, directors] = await Promise.all([
        Api.searchMovies({ query }),
        Api.searchActors({ search: query }),
        Api.searchDirectors({ search: query })
      ]);
      results.innerHTML = `
        <div class="search-group">
          <div class="search-group-title">Фильмы</div>
          ${renderSearchList(movies?.data || [], 'movie')}
        </div>
        <div class="search-group">
          <div class="search-group-title">Актёры</div>
          ${renderSearchList(actors?.data || [], 'actor')}
        </div>
        <div class="search-group">
          <div class="search-group-title">Режиссёры</div>
          ${renderSearchList(directors?.data || [], 'director')}
        </div>
      `;
    } catch (err) {
      results.innerHTML = `<div class="search-result-error">${err.message}</div>`;
    }
  });

  document.addEventListener('click', (e) => {
    const container = document.getElementById('headerSearchContainer');
    if (!container) return;
    if (!container.contains(e.target)) {
      results.classList.add('hidden');
    }
  });
}

function renderSearchList(items, type) {
  if (!items.length) return '<p style="font-size:0.875rem;color:var(--text-secondary);">Ничего не найдено</p>';
  return `
    <ul class="search-list">
      ${items
        .map((item) => {
          let href = '#';
          if (type === 'movie') href = `/pages/movie.html?slug=${encodeURIComponent(item.slug)}`;
          if (type === 'actor') href = `/pages/person.html?type=actor&id=${item.actor_id || item.id}`;
          if (type === 'director') href = `/pages/person.html?type=director&id=${item.director_id || item.id}`;
          const title =
            type === 'movie'
              ? `${item.title} (${item.release_year || ''})`
              : item.full_name || item.name;
          return `<li class="search-item"><a class="search-link" href="${href}">${title}</a></li>`;
        })
        .join('')}
    </ul>
  `;
}


function showAuthNotice(message, kind) {
  const root = document.body;
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="modal-backdrop" id="authNoticeBackdrop"></div>
    <div class="modal" id="authNoticeModal">
      <div class="modal-content" style="max-width:480px;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <span class="material-symbols-outlined" id="authNoticeIcon" style="font-size:40px;"></span>
          <h2 class="section-title" id="authNoticeText" style="padding:0;">Сообщение</h2>
          <button class="icon-btn" id="authNoticeClose" style="margin-left:auto;">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    </div>`;
  root.appendChild(container);
  const iconEl = container.querySelector('#authNoticeIcon');
  const textEl = container.querySelector('#authNoticeText');
  const color = (kind || 'danger') === 'danger' ? '#ef4444' : '#22c55e';
  const icon = (kind || 'danger') === 'danger' ? 'block' : 'check_circle';
  if (iconEl) { iconEl.textContent = icon; iconEl.style.color = color; }
  if (textEl) textEl.textContent = message || 'Сообщение';
  container.querySelector('#authNoticeBackdrop')?.addEventListener('click', () => { container.remove(); });
  container.querySelector('#authNoticeClose')?.addEventListener('click', () => { container.remove(); });
}

function showBlockedModal(message) {
  const root = document.body;
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="modal-backdrop" id="blockedBackdrop"></div>
    <div class="modal" id="blockedUserModal">
      <div class="modal-content" style="max-width:520px;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <span class="material-symbols-outlined" style="font-size:44px;color:#ef4444;">lock</span>
          <h2 class="section-title" style="padding:0;">${message || 'Вы заблокированы администратором'}</h2>
          <button class="icon-btn" id="blockedClose" style="margin-left:auto;">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div style="margin-top:0.75rem;color:var(--text-secondary);font-size:0.95rem;">Если вы считаете, что это ошибка, обратитесь к администратору.</div>
        <div style="display:flex;gap:0.75rem;margin-top:1rem;">
          <button class="btn btn-secondary" id="blockedOkBtn">Понятно</button>
        </div>
      </div>
    </div>`;
  root.appendChild(container);
  const remove = () => container.remove();
  container.querySelector('#blockedBackdrop')?.addEventListener('click', remove);
  container.querySelector('#blockedClose')?.addEventListener('click', remove);
  container.querySelector('#blockedOkBtn')?.addEventListener('click', remove);
}
