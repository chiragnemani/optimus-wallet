if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed', err));
}

// Built-in Credit Card Catalog with Auto Perks
const CARD_CATALOG = [
  { id: 'amex_gold', name: 'American Express Gold', bestCategory: 'dining', rates: { dining: '4x Points', groceries: '4x Points', travel: '3x Points', default: '1x Points' }, deals: ['Uber Eats: $10/mo Credit', 'Resy: $10/mo Credit'] },
  { id: 'chase_sapphire_pref', name: 'Chase Sapphire Preferred', bestCategory: 'dining', rates: { dining: '3x Points', travel: '2x Points', streaming: '3x Points', online: '3x Points', default: '1x Points' }, deals: ['Lyft: 5x Points Multiplier', 'DoorDash DashPass Subscription'] },
  { id: 'chase_freedom_flex', name: 'Chase Freedom Flex', bestCategory: 'dining', rates: { dining: '3x Points', drugstores: '3x Points', default: '1% Cash Back' }, deals: ['Quarterly 5% Rotating Categories'] },
  { id: 'capone_venture_x', name: 'Capital One Venture X', bestCategory: 'travel', rates: { travel: '10x Miles on Hotels/Cars', flights: '5x Miles', default: '2x Miles on Everything' }, deals: ['$300 Travel Credit', 'Hertz President’s Circle Status'] },
  { id: 'citi_double_cash', name: 'Citi Double Cash', bestCategory: 'other', rates: { default: '2% Flat Cash Back' }, deals: ['0% Intro APR Deals'] },
  { id: 'apple_card', name: 'Apple Card', bestCategory: 'other', rates: { apple: '3% Cash Back', online: '2% Cash Back (Apple Pay)', default: '1% Cash Back' }, deals: ['3% Cash Back at Nike, Walgreens, Uber'] },
  { id: 'discover_it', name: 'Discover it Cash Back', bestCategory: 'online', rates: { quarterly: '5% Cash Back', default: '1% Cash Back' }, deals: ['First Year Unlimited Cashback Match'] },
  { id: 'prime_visa', name: 'Amazon Prime Visa', bestCategory: 'online', rates: { online: '5% Cash Back at Amazon & Whole Foods', dining: '2%', gas: '2%', default: '1%' }, deals: ['Instant 5% Back at Amazon.com'] }
];

// Merchant to Category Database
const MERCHANT_MAP = {
  'amazon': { category: 'online', customPerk: 'Best: Amazon Prime Visa (5%)' },
  'target': { category: 'groceries', customPerk: 'Best: Target RedCard (5%) or Groceries Card' },
  'walmart': { category: 'groceries', customPerk: 'Best: Groceries Card' },
  'instacart': { category: 'groceries', customPerk: 'Best: Groceries Card (e.g. Amex Gold 4x)' },
  'uber': { category: 'travel', customPerk: 'Best: Amex Gold ($10 Credit) or Chase Sapphire (5x)' },
  'ubereats': { category: 'dining', customPerk: 'Best: Amex Gold (4x + $10 Credit)' },
  'lyft': { category: 'travel', customPerk: 'Best: Chase Sapphire Preferred (5x Points)' },
  'amc': { category: 'streaming', customPerk: 'Best: Entertainment / Streaming Card' },
  'starbucks': { category: 'dining', customPerk: 'Best: Dining Card (e.g. Amex Gold 4x)' },
  'netflix': { category: 'streaming', customPerk: 'Best: Streaming Card (e.g. Chase Sapphire 3x)' }
};

// Initial User Wallet (Default state)
let userCards = JSON.parse(localStorage.getItem('optimus_user_cards')) || [
  CARD_CATALOG[0], // Amex Gold
  CARD_CATALOG[1]  // Chase Sapphire
];

let bills = JSON.parse(localStorage.getItem('optimus_bills')) || [
  { id: 1, name: "Netflix", amount: 15.99, date: "2026-08-01" }
];

// Tab Switching
document.querySelectorAll('.nav-item').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    
    button.classList.add('active');
    document.getElementById(button.dataset.tab).classList.add('active');
  });
});

// Card Recommendation Logic
const categorySelect = document.getElementById('category-select');
const merchantSearch = document.getElementById('merchant-search');

categorySelect.addEventListener('change', () => {
  merchantSearch.value = '';
  updateRecommendation();
});

merchantSearch.addEventListener('input', () => {
  const query = merchantSearch.value.toLowerCase().trim();
  if (query && MERCHANT_MAP[query]) {
    const mapped = MERCHANT_MAP[query];
    categorySelect.value = mapped.category;
  }
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

  // Find best card in user's wallet
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

// Render User Wallet Cards
function renderCards() {
  const list = document.getElementById('cards-list');
  list.innerHTML = '';

  if (userCards.length === 0) {
    list.innerHTML = `<p style="text-align:center; color: var(--text-muted);">Your wallet is empty.</p>`;
    return;
  }

  userCards.forEach((card, index) => {
    list.innerHTML += `
      <div class="glass-card list-item">
        <div>
          <strong>${card.name}</strong>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">Top perk: ${card.rates[card.bestCategory] || card.rates.default}</p>
        </div>
        <button class="btn-delete" onclick="deleteCard(${index})">Delete</button>
      </div>
    `;
  });
}

// Delete Card
window.deleteCard = function(index) {
  userCards.splice(index, 1);
  localStorage.setItem('optimus_user_cards', JSON.stringify(userCards));
  renderCards();
  renderDeals();
  updateRecommendation();
};

// Render Auto Deals for Active Cards
function renderDeals() {
  const list = document.getElementById('deals-list');
  list.innerHTML = '';

  let activeDealsCount = 0;
  userCards.forEach(card => {
    if (card.deals) {
      card.deals.forEach(deal => {
        activeDealsCount++;
        list.innerHTML += `
          <div class="glass-card list-item">
            <div>
              <strong>${card.name} Benefit</strong>
              <p style="font-size: 13px; color: var(--accent-color); font-weight: 600; margin-top: 2px;">${deal}</p>
            </div>
            <span style="font-size: 11px; color: var(--text-muted);">Active Card Perk</span>
          </div>
        `;
      });
    }
  });

  if (activeDealsCount === 0) {
    list.innerHTML = `<p style="text-align:center; color: var(--text-muted);">Add cards to unlock active deals.</p>`;
  }
}

// Render Bills
function renderBills() {
  const list = document.getElementById('bills-list');
  list.innerHTML = '';
  let total = 0;

  bills.forEach((bill, index) => {
    total += parseFloat(bill.amount);
    list.innerHTML += `
      <div class="glass-card list-item">
        <div>
          <strong>${bill.name}</strong>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">Due: ${bill.date}</p>
        </div>
        <div style="display:flex; align-items:center; gap: 10px;">
          <strong>$${parseFloat(bill.amount).toFixed(2)}</strong>
          <button class="btn-delete" onclick="deleteBill(${index})">Delete</button>
        </div>
      </div>
    `;
  });

  document.getElementById('total-bill-amount').innerText = `$${total.toFixed(2)}`;
}

// Delete Bill
window.deleteBill = function(index) {
  bills.splice(index, 1);
  localStorage.setItem('optimus_bills', JSON.stringify(bills));
  renderBills();
};

// Modal Handlers & Catalog Population
document.getElementById('btn-add-card').addEventListener('click', () => {
  const catalogSelect = document.getElementById('catalog-card-select');
  catalogSelect.innerHTML = '';
  CARD_CATALOG.forEach(card => {
    catalogSelect.innerHTML += `<option value="${card.id}">${card.name}</option>`;
  });
  document.getElementById('modal-card').classList.add('open');
});

document.getElementById('btn-add-bill').addEventListener('click', () => document.getElementById('modal-bill').classList.add('open'));

document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('modal-card').classList.remove('open');
    document.getElementById('modal-bill').classList.remove('open');
  });
});

// Save Selected Card from Catalog
document.getElementById('btn-save-card').addEventListener('click', () => {
  const selectedId = document.getElementById('catalog-card-select').value;
  const catalogCard = CARD_CATALOG.find(c => c.id === selectedId);

  if (catalogCard && !userCards.some(c => c.id === catalogCard.id)) {
    userCards.push(catalogCard);
    localStorage.setItem('optimus_user_cards', JSON.stringify(userCards));
    renderCards();
    renderDeals();
    updateRecommendation();
  }
  document.getElementById('modal-card').classList.remove('open');
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

// Initialize
renderCards();
renderDeals();
renderBills();
updateRecommendation();
