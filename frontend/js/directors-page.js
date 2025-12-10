document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('directorsFilter');
  const resetBtn = document.getElementById('resetDirectorsFilter');
  const directorsCountEl = document.getElementById('directorsCount');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      loadDirectors(new FormData(form));
    });
  }

  if (resetBtn && form) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      loadDirectors();
    });
  }

  loadDirectors();
});

async function loadDirectors(formData) {
  const params = {};
  if (formData) {
    for (const [key, value] of formData.entries()) {
      if (value) params[key] = value;
    }
  }
  try {
    const res = await Api.searchDirectors(params);
    renderDirectors(res.data || res);
  } catch (e) {
    console.error(e);
    renderDirectors([]);
  }
}

function renderDirectors(directors) {
  const container = document.getElementById('directorsList');
  const directorsCountEl = document.getElementById('directorsCount');
  
  if (!container) return;
  
  const count = directors?.length || 0;
  if (directorsCountEl) {
    directorsCountEl.textContent = `${count} ${getCountWord(count, 'director')}`;
  }
  
  if (!directors || !directors.length) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = directors
    .map(
      (d) => `
      <a class="person-card" href="/pages/person.html?type=director&id=${d.director_id || d.id}">
        <div class="person-photo" style="background-image:url('${d.photo_url || '/images/persons/default-actor.jpg'}')"></div>
        <div class="person-info">
          <p class="person-name">${d.full_name}</p>
          <div class="person-details">
            ${d.country ? `<span>${d.country}</span>` : ''}
            ${d.birth_year ? `<span>Род. ${d.birth_year}</span>` : ''}
            ${d.movies_count ? `<span>Фильмов: ${d.movies_count}</span>` : ''}
          </div>
        </div>
      </a>
    `
    )
    .join('');
}

function getCountWord(count, type) {
  const words = {
    'director': {
      one: 'режиссёр',
      few: 'режиссёра',
      many: 'режиссёров'
    },
    'actor': {
      one: 'актёр',
      few: 'актёра',
      many: 'актёров'
    }
  };
  
  const wordSet = words[type];
  if (!wordSet) return '';
  
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return wordSet.many;
  if (lastDigit === 1) return wordSet.one;
  if (lastDigit >= 2 && lastDigit <= 4) return wordSet.few;
  return wordSet.many;
}