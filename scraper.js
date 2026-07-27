const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');

// Securely grab the keys from GitHub Actions environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const parser = new Parser();

async function runScraper() {
  console.log("Waking up scraper...");
  
  // A public RSS feed for credit card news (e.g., Doctor of Credit)
  const feedUrl = 'https://www.doctorofcredit.com/category/credit-cards/feed/';
  
  try {
    let feed = await parser.parseURL(feedUrl);
    console.log(`Found ${feed.items.length} deals in the RSS feed.`);

    // Optional: Clear out the old deals in your database so the list stays fresh
    const { error: deleteError } = await supabase
      .from('live_deals')
      .delete()
      .neq('id', 0); // Deletes everything
      
    if (deleteError) console.error("Error clearing old deals:", deleteError);

    let newDeals = [];
    
    // Grab the 5 most recent posts
    for (let i = 0; i < 5; i++) {
      let item = feed.items[i];
      if (item) {
        newDeals.push({
          brand: 'Latest Deal', 
          offer: item.title, 
          expires: 'Recent News' 
        });
      }
    }

    // Insert the new deals into Supabase
    if (newDeals.length > 0) {
      const { data, error } = await supabase.from('live_deals').insert(newDeals);
      if (error) throw error;
      console.log(`Successfully inserted ${newDeals.length} deals into Supabase!`);
    }
    
  } catch (err) {
    console.error("Scraper encountered an error:", err);
  }
}

runScraper();
