// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed', err));
}

// Default Data Arrays
const defaultCards = [
  { id: 1, name: "Amex Gold", category: "dining", perk: "4x Points on Dining & Groceries" },
  { id: 2, name: "Chase Sapphire Preferred", category: "travel", perk: "3x Points on Travel & Flights" },
  { id: 3, name: "Citi Double Cash", category: "other", perk: "2% Unlimited Cash Back" }
];

const defaultDeals = [
  { id: 1, brand: "Starbucks", offer: "10% Cash Back", expires: "Ends in 4 days" },
  { id: 2, brand: "Uber Eats", offer: "$10 Statement Credit", expires: "Renews monthly" },
  { id: 3, brand: "Target", offer: "5% Direct Discount", expires: "Ongoing" }
];

const defaultBills = [
  { id: 1, name: "Netflix", amount: 15.99, date: "2026-08-01" },
  { id: 2, name: "Equinox Gym", amount: 120.00, date: "2026-08-05" }
];

// Persistent LocalStorage
let cards = JSON.parse(localStorage.getItem('optimus_cards')) || defaultCards;
let deals = defaultDeals;
let bills = JSON.parse(localStorage.getItem('optimus_bills')) || defaultBills;

// Navigation
document.querySelectorAll('.nav-item').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    
    button.classList.add('active');
    document.getElementById(button.dataset.tab).classList.add('active');
  });
});

// Recommendation Logic
const categorySelect = document.getElementById('category-select');
categorySelect.addEventListener('change', updateRecommendation);

function updateRecommendation() {
  const selectedCat = categorySelect.value;
  const matchedCard = cards.find(c => c.category === selectedCat) || cards.find(c => c.category === 'other') || cards[0];

  if (matchedCard) {
    document.getElementById('best-card-name').innerText = matchedCard.name;
    document.getElementById('best-card-perk').innerText = matchedCard.perk;
  }
}

// Render Saved Cards
function renderCards() {
  const list = document.getElementById('cards-list');
  list.innerHTML = '';
  cards.forEach(card => {
    list.innerHTML += `
      <div class="glass-card list-item">
        <div>
          <strong>${card.name}</strong>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">${card.perk}</p>
        </div>
      </div>
    `;
  });
}

// Render Deals
function renderDeals() {
  const list = document.getElementById('deals-list');
  list.innerHTML = '';
  deals.forEach(deal => {
    list.innerHTML += `
      <div class="glass-card list-item">
        <div>
          <strong>${deal.brand}</strong>
          <p style="font-size: 13px; color: var(--accent-color); font-weight: 600; margin-top: 2px;">${deal.offer}</p>
        </div>
        <span style="font-size: 11px; color: var(--text-muted);">${deal.expires}</span>
      </div>
    `;
  });
}

// Render Bills
function renderBills() {
  const list = document.getElementById('bills-list');
  list.innerHTML = '';
  let total = 0;

  bills.forEach(bill => {
    total += parseFloat(bill.amount);
    list.innerHTML += `
      <div class="glass-card list-item">
        <div>
          <strong>${bill.name}</strong>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">Due: ${bill.date}</p>
        </div>
        <strong>$${parseFloat(bill.amount).toFixed(2)}</strong>
      </div>
    `;
  });

  document.getElementById('total-bill-amount').innerText = `$${total.toFixed(2)}`;
}

// Modal Handlers
document.getElementById('btn-add-card').addEventListener('click', () => document.getElementById('modal-card').classList.add('open'));
document.getElementById('btn-add-bill').addEventListener('click', () => document.getElementById('modal-bill').classList.add('open'));

document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('modal-card').classList.remove('open');
    document.getElementById('modal-bill').classList.remove('open');
  });
});

// Save Card
document.getElementById('btn-save-card').addEventListener('click', () => {
  const name = document.getElementById('input-card-name').value;
  const best = document.getElementById('input-card-best').value.toLowerCase();
  const perk = document.getElementById('input-card-rate').value;

  if (name && perk) {
    cards.push({ id: Date.now(), name, category: best || 'other', perk });
    localStorage.setItem('optimus_cards', JSON.stringify(cards));
    renderCards();
    updateRecommendation();
    document.getElementById('modal-card').classList.remove('open');
  }
});

// Save Bill
document.getElementById('btn-save-bill').addEventListener('click', () => {
  const name = document.getElementById('input-bill-name').value;
  const amount = document.getElementById('input-bill-amount').value;
  const date = document.getElementById('input-bill-date').value;

  if (name && amount) {
    bills.push({ id: Date.now(), name, amount, date });
    localStorage.setItem('optimus_bills', JSON.stringify(bills));
    renderBills();
    document.getElementById('modal-bill').classList.remove('open');
  }
});

// Initialize App
updateRecommendation();
renderCards();
renderDeals();
renderBills();
