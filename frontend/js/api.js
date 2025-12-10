const API_BASE_URL = '/api';

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = 'Ошибка запроса';
    let data = null;
    try {
      data = await response.json();
      message = data.error || message;
    } catch (_) {}
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Утилиты для работы с основными сущностями
const Api = {
  getPopularMovies() {
    return apiRequest('/movies/popular');
  },
  getGenres() {
    return apiRequest('/movies/genres');
  },
  searchMovies(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/movies/search?${query}`);
  },
  getMovieBySlug(slug) {
    return apiRequest(`/movies/slug/${encodeURIComponent(slug)}`);
  },
  getMovieById(id) {
    return apiRequest(`/movies/${id}`);
  },
  getMovieReviews(movieId) {
    return apiRequest(`/reviews/movie/${movieId}`);
  },
  getLatestReviews(params = {}) {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/reviews/latest${q ? `?${q}` : ''}`);
  },
  updateReview(id, payload) {
    return apiRequest(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  deleteReview(id) {
    return apiRequest(`/reviews/${id}`, { method: 'DELETE' });
  },
  createReview(payload) {
    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getPopularActors() {
    return apiRequest('/actors/popular');
  },
  getPopularDirectors() {
    return apiRequest('/directors/popular');
  },
  searchActors(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/actors/search?${query}`);
  },
  searchDirectors(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/directors/search?${query}`);
  },
  authLogin(payload) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  authRegister(payload) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getCurrentUser() {
    return apiRequest('/auth/me');
  },
  updateProfile(payload) {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  uploadAvatar(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);
    return fetch(`${API_BASE_URL}/auth/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    }).then(async (res) => {
      if (!res.ok) {
        let message = 'Ошибка загрузки аватара';
        try {
          const d = await res.json();
          message = d.error || message;
        } catch (_) {}
        throw new Error(message);
      }
      return res.json();
    });
  },
  uploadPoster(file) {
    const token = localStorage.getItem('token');
    const fd = new FormData();
    fd.append('file', file);
    return fetch(`${API_BASE_URL}/admin/upload/poster`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd }).then(async (res) => {
      if (!res.ok) { let m = 'Ошибка загрузки постера'; try { const d = await res.json(); m = d.error || m; } catch(_){} throw new Error(m); } return res.json();
    });
  },
  uploadBackdrop(file) {
    const token = localStorage.getItem('token');
    const fd = new FormData();
    fd.append('file', file);
    return fetch(`${API_BASE_URL}/admin/upload/backdrop`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd }).then(async (res) => {
      if (!res.ok) { let m = 'Ошибка загрузки фона'; try { const d = await res.json(); m = d.error || m; } catch(_){} throw new Error(m); } return res.json();
    });
  },
  uploadPersonPhoto(file) {
    const token = localStorage.getItem('token');
    const fd = new FormData();
    fd.append('file', file);
    return fetch(`${API_BASE_URL}/admin/upload/person`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd }).then(async (res) => {
      if (!res.ok) { let m = 'Ошибка загрузки фото'; try { const d = await res.json(); m = d.error || m; } catch(_){} throw new Error(m); } return res.json();
    });
  },
  getUserReviews(userId) {
    const path = userId ? `/reviews/user/${userId}` : '/reviews/user';
    return apiRequest(path);
  },
  getBookmarks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/bookmarks${query ? `?${query}` : ''}`);
  },
  getBookmarkFolders() {
    return apiRequest('/bookmarks/folders');
  },
  addBookmark(payload) {
    return apiRequest('/bookmarks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  updateBookmark(id, payload) {
    return apiRequest(`/bookmarks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  deleteBookmark(id) {
    return apiRequest(`/bookmarks/${id}`, { method: 'DELETE' });
  },
  adminGetUsers(params = {}) {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${q ? `?${q}` : ''}`);
  },
  adminUpdateUser(id, payload) {
    return apiRequest(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  adminDeleteUser(id) {
    return apiRequest(`/admin/users/${id}`, { method: 'DELETE' });
  },
  adminGetStats() {
    return apiRequest('/admin/stats');
  },
  adminApproveReview(id) {
    return apiRequest(`/admin/reviews/${id}/approve`, { method: 'POST' });
  },
  adminRejectReview(id, payload = {}) {
    return apiRequest(`/admin/reviews/${id}/reject`, { method: 'POST', body: JSON.stringify(payload) });
  },
  adminCreateMovie(payload) {
    return apiRequest('/admin/movies', { method: 'POST', body: JSON.stringify(payload) });
  },
  adminUpdateMovie(id, payload) {
    return apiRequest(`/admin/movies/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  adminDeleteMovie(id) {
    return apiRequest(`/admin/movies/${id}`, { method: 'DELETE' });
  },
  adminCreateGenre(payload) {
    return apiRequest('/genres', { method: 'POST', body: JSON.stringify(payload) });
  },
  adminUpdateGenre(id, payload) {
    return apiRequest(`/genres/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  adminDeleteGenre(id) {
    return apiRequest(`/genres/${id}`, { method: 'DELETE' });
  }
};


