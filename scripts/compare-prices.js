const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllGemstones() {
  const allGemstones = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('gemstones')
      .select('serial_number, price_amount, price_per_carat, weight_carats')
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('❌ Error fetching gemstones:', error);
      break;
    }

    if (data && data.length > 0) {
      allGemstones.push(...data);
      from += batchSize;
      hasMore = data.length === batchSize;
      console.log(`📊 Fetched ${allGemstones.length} gemstones so far...`);
    } else {
      hasMore = false;
    }
  }

  return allGemstones;
}

async function main() {
  console.log('🔍 Loading CSV import report...');
  const reportData = JSON.parse(fs.readFileSync('csv-import-report-2025-09-14.json', 'utf8'));
  
  // Create map of report gemstones
  const reportMap = new Map();
  const allReportStones = [...(reportData.updated_stones || []), ...(reportData.created_stones || [])];
  
  allReportStones.forEach(stone => {
    if (stone.serial_number) {
      reportMap.set(stone.serial_number, {
        price_amount: stone.price_amount,
        weight_carats: stone.weight_carats
      });
    }
  });

  console.log(`📋 Found ${reportMap.size} gemstones in import report`);
  console.log('🔍 Fetching all gemstones from database...');

  const dbGemstones = await getAllGemstones();
  console.log(`📊 Found ${dbGemstones.length} gemstones in database`);

  // Compare prices
  const discrepancies = [];
  const notInReport = [];
  const notInDB = [];

  // Check gemstones in database
  dbGemstones.forEach(dbStone => {
    const reportStone = reportMap.get(dbStone.serial_number);
    
    if (!reportStone) {
      notInReport.push(dbStone.serial_number);
      return;
    }

    // Compare price_amount
    if (dbStone.price_amount !== reportStone.price_amount) {
      discrepancies.push({
        serial_number: dbStone.serial_number,
        report_price_amount: reportStone.price_amount,
        db_price_amount: dbStone.price_amount,
        difference: dbStone.price_amount - reportStone.price_amount,
        difference_percent: ((dbStone.price_amount - reportStone.price_amount) / reportStone.price_amount * 100).toFixed(2),
        weight_carats: dbStone.weight_carats,
        price_per_carat: dbStone.price_per_carat,
        report_price_dollars: (reportStone.price_amount / 100).toFixed(2),
        db_price_dollars: (dbStone.price_amount / 100).toFixed(2)
      });
    }
  });

  // Check gemstones in report but not in DB
  reportMap.forEach((reportStone, serialNumber) => {
    const dbStone = dbGemstones.find(s => s.serial_number === serialNumber);
    if (!dbStone) {
      notInDB.push(serialNumber);
    }
  });

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📊 PRICE COMPARISON REPORT');
  console.log('='.repeat(80));
  console.log(`\n✅ Total gemstones in report: ${reportMap.size}`);
  console.log(`✅ Total gemstones in database: ${dbGemstones.length}`);
  console.log(`\n🔍 Discrepancies found: ${discrepancies.length}`);
  console.log(`⚠️  In DB but not in report: ${notInReport.length}`);
  console.log(`⚠️  In report but not in DB: ${notInDB.length}`);

  if (discrepancies.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('❌ PRICE DISCREPANCIES:');
    console.log('-'.repeat(80));
    
    // Group by difference type
    const exact100x = discrepancies.filter(d => Math.abs(d.difference_percent - 9900) < 1);
    const otherDiscrepancies = discrepancies.filter(d => Math.abs(d.difference_percent - 9900) >= 1);

    if (exact100x.length > 0) {
      console.log(`\n🔴 ${exact100x.length} gemstones with 100x price difference (likely conversion error):`);
      exact100x.slice(0, 10).forEach(d => {
        console.log(`  ${d.serial_number}: Report $${d.report_price_dollars} → DB $${d.db_price_dollars} (diff: ${d.difference_percent}%)`);
      });
      if (exact100x.length > 10) {
        console.log(`  ... and ${exact100x.length - 10} more`);
      }
    }

    if (otherDiscrepancies.length > 0) {
      console.log(`\n🟡 ${otherDiscrepancies.length} gemstones with other price differences:`);
      otherDiscrepancies.slice(0, 10).forEach(d => {
        console.log(`  ${d.serial_number}: Report $${d.report_price_dollars} → DB $${d.db_price_dollars} (diff: ${d.difference_percent}%)`);
      });
      if (otherDiscrepancies.length > 10) {
        console.log(`  ... and ${otherDiscrepancies.length - 10} more`);
      }
    }

    // Save full report to file
    const reportFile = 'price-discrepancy-report.json';
    fs.writeFileSync(reportFile, JSON.stringify({
      summary: {
        total_discrepancies: discrepancies.length,
        exact_100x_difference: exact100x.length,
        other_differences: otherDiscrepancies.length,
        not_in_report: notInReport.length,
        not_in_db: notInDB.length
      },
      discrepancies: discrepancies,
      not_in_report: notInReport,
      not_in_db: notInDB
    }, null, 2));
    console.log(`\n💾 Full report saved to: ${reportFile}`);
  } else {
    console.log('\n✅ No price discrepancies found! All prices match.');
  }

  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);

