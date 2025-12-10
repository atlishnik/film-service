document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('actorsFilter');
  const resetBtn = document.getElementById('resetActorsFilter');
  const actorsCountEl = document.getElementById('actorsCount');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      loadActors(new FormData(form));
    });
  }

  if (resetBtn && form) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      loadActors();
    });
  }

  loadActors();
});

async function loadActors(formData) {
  const params = {};
  if (formData) {
    for (const [key, value] of formData.entries()) {
      if (value) params[key] = value;
    }
  }
  try {
    const res = await Api.searchActors(params);
    renderActors(res.data || res);
  } catch (e) {
    console.error(e);
    renderActors([]);
  }
}

function renderActors(actors) {
  const container = document.getElementById('actorsList');
  const actorsCountEl = document.getElementById('actorsCount');
  
  if (!container) return;
  
  const count = actors?.length || 0;
  if (actorsCountEl) {
    actorsCountEl.textContent = `${count} ${getCountWord(count, 'actor')}`;
  }
  
  if (!actors || !actors.length) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = actors
    .map(
      (a) => `
      <a class="person-card" href="/pages/person.html?type=actor&id=${a.actor_id || a.id}">
        <div class="person-photo" style="background-image:url('${a.photo_url || '/images/persons/default-actor.jpg'}')"></div>
        <div class="person-info">
          <p class="person-name">${a.full_name}</p>
          <div class="person-details">
            ${a.country ? `<span>${a.country}</span>` : ''}
            ${a.birth_year ? `<span>Род. ${a.birth_year}</span>` : ''}
            ${a.movies_count ? `<span>Фильмов: ${a.movies_count}</span>` : ''}
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