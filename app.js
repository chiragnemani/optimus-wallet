// --- 1. SUPABASE CONNECTION ---
// Paste your Supabase credentials here between the quotes
const SUPABASE_URL = 'https://iiyebyenpnafqqiksghi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpeWVieWVucG5hZnFxaWtzZ2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMDgzMDUsImV4cCI6MjEwMDY4NDMwNX0.tseR2aEJlMBy0ZEuUUfjjnaicwc8EW_d3ibBEJDoFC4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed', err));
}

// --- 2. LOCAL DATA (User Wallet & Bills stay private on device) ---
const CARD_CATALOG = [
  { id: 'amex_gold', name: 'American Express Gold', bestCategory: 'dining', rates: { dining: '4x Points', groceries: '4x Points', default: '1x Points' } },
  { id: 'chase_sapphire_pref', name: 'Chase Sapphire Preferred', bestCategory: 'dining', rates: { dining: '3x Points', travel: '2x Points', default: '1x Points' } },
  { id: 'apple_card', name: 'Apple Card', bestCategory: 'other', rates: { apple: '3% Cash Back', online: '2% Cash Back (Apple Pay)', default: '1% Cash Back' } },
  { id: 'prime_visa', name: 'Amazon Prime Visa', bestCategory: 'online', rates: { online: '5% Cash Back at Amazon', default: '1%' } }
];

const MERCHANT_MAP = {
  'amazon': { category: 'online', customPerk: 'Best: Amazon Prime Visa (5%)' },
  'target': { category: 'groceries', customPerk: 'Best: Target RedCard (5%)' },
  'uber': { category: 'travel', customPerk: 'Best: Amex Gold ($10 Credit) or Chase Sapphire (5x)' },
  'apple': { category: 'other', customPerk: 'Best: Apple Card (3% via Apple Pay)' }
};

let userCards = JSON.parse(localStorage.getItem('optimus_user_cards')) || [];
let bills = JSON.parse(localStorage.getItem('optimus_bills')) || [];

// --- 3. FETCH LIVE DEALS FROM SUPABASE ---
async function fetchLiveDeals() {
  const list = document.getElementById('deals-list');
  try {
    const { data, error } = await supabase.from('live_deals').select('*');
    
    if (error) throw error;
    
    list.innerHTML = ''; // Clear loading text
    if (data.length === 0) {
      list.innerHTML = `<p style="text-align:center; color: var(--text-muted);">No live deals right now.</p>`;
      return;
    }

    data.forEach(deal => {
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
  } catch (err) {
    console.error('Error fetching deals:', err);
    list.innerHTML = `<p style="text-align:center; color: #ff3b30;">Failed to connect to database.</p>`;
  }
}

// --- 4. APP LOGIC ---
document.querySelectorAll('.nav-item').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(button.dataset.tab).classList.add('active');
  });
});

const categorySelect = document.getElementById('category-select');
const merchantSearch = document.getElementById('merchant-search');

categorySelect.addEventListener('change', () => { merchantSearch.value = ''; updateRecommendation(); });
merchantSearch.addEventListener('input', () => {
  const query = merchantSearch.value.toLowerCase().trim();
  if (query && MERCHANT_MAP[query]) categorySelect.value = MERCHANT_MAP[query].category;
  updateRecommendation();
});

function updateRecommendation() {
  if (userCards.length === 0) {
    document.getElementById('best-card-name').innerText = "No cards in wallet";
    document.getElementById('best-card-perk').innerText = "Tap 'Cards' tab to add your credit cards";
    return;
  }
  const selectedCat = categorySelect.value;
  const searchQuery = merchantSearch.value.toLowerCase().trim();
  let bestCard = userCards.find(c => c.bestCategory === selectedCat) || userCards[0];
  let perkText = bestCard.rates[selectedCat] || bestCard.rates.default || 'Standard Rewards';

  if (searchQuery && MERCHANT_MAP[searchQuery]) {
    document.getElementById('recommend-badge').innerText = `RECOMMENDED FOR ${searchQuery.toUpperCase()}`;
    perkText = MERCHANT_MAP[searchQuery].customPerk;
  } else {
    document.getElementById('recommend-badge').innerText = `BEST CARD TO USE`;
  }
  document.getElementById('best-card-name').innerText = bestCard.name;
  document.getElementById('best-card-perk').innerText = perkText;
}

function renderCards() {
  const list = document.getElementById('cards-list');
  list.innerHTML = userCards.length === 0 ? `<p style="text-align:center; color: var(--text-muted);">Your wallet is empty.</p>` : '';
  userCards.forEach((card, index) => {
    list.innerHTML += `
      <div class="glass-card list-item">
        <div><strong>${card.name}</strong><p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">Top perk: ${card.rates[card.bestCategory] || card.rates.default}</p></div>
        <button class="btn-delete" onclick="deleteCard(${index})">Delete</button>
      </div>`;
  });
}

window.deleteCard = function(index) {
  userCards.splice(index, 1);
  localStorage.setItem('optimus_user_cards', JSON.stringify(userCards));
  renderCards();
  updateRecommendation();
};

function renderBills() {
  const list = document.getElementById('bills-list');
  list.innerHTML = '';
  let total = 0;
  bills.forEach((bill, index) => {
    total += parseFloat(bill.amount);
    list.innerHTML += `
      <div class="glass-card list-item">
        <div><strong>${bill.name}</strong><p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">Due: ${bill.date}</p></div>
        <div style="display:flex; align-items:center; gap: 10px;"><strong>$${parseFloat(bill.amount).toFixed(2)}</strong><button class="btn-delete" onclick="deleteBill(${index})">Delete</button></div>
      </div>`;
  });
  document.getElementById('total-bill-amount').innerText = `$${total.toFixed(2)}`;
}

window.deleteBill = function(index) {
  bills.splice(index, 1);
  localStorage.setItem('optimus_bills', JSON.stringify(bills));
  renderBills();
};

document.getElementById('btn-add-card').addEventListener('click', () => {
  const catalogSelect = document.getElementById('catalog-card-select');
  catalogSelect.innerHTML = '';
  CARD_CATALOG.forEach(card => catalogSelect.innerHTML += `<option value="${card.id}">${card.name}</option>`);
  document.getElementById('modal-card').classList.add('open');
});

document.getElementById('btn-add-bill').addEventListener('click', () => document.getElementById('modal-bill').classList.add('open'));
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', () => {
  document.getElementById('modal-card').classList.remove('open');
  document.getElementById('modal-bill').classList.remove('open');
}));

document.getElementById('btn-save-card').addEventListener('click', () => {
  const selectedId = document.getElementById('catalog-card-select').value;
  const catalogCard = CARD_CATALOG.find(c => c.id === selectedId);
  if (catalogCard && !userCards.some(c => c.id === catalogCard.id)) {
    userCards.push(catalogCard);
    localStorage.setItem('optimus_user_cards', JSON.stringify(userCards));
    renderCards();
    updateRecommendation();
  }
  document.getElementById('modal-card').classList.remove('open');
});

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

// Init
renderCards();
renderBills();
updateRecommendation();
fetchLiveDeals(); // Fetch deals from backend!
