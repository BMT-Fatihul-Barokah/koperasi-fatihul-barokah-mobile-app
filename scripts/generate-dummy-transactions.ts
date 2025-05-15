import { supabase } from '../lib/supabase';

interface TabunganInfo {
  id: string;
  anggota_id: string;
  nomor_rekening: string;
  jenis_nama: string;
}

interface TransactionData {
  tipe_transaksi: 'masuk' | 'keluar';
  kategori: string;
  deskripsi: string;
  jumlah: number;
  reference_number: string;
  created_at: string;
}

/**
 * Generate dummy transactions for tabungan accounts
 */
async function generateDummyTransactions() {
  try {
    console.log('Starting to generate dummy transactions...');
    
    // Get tabungan accounts to add transactions to
    const { data: tabunganList, error: tabunganError } = await supabase
      .from('tabungan')
      .select(`
        id,
        anggota_id,
        nomor_rekening,
        jenis_tabungan:jenis_tabungan_id(nama)
      `)
      .in('id', [
        '5a192e68-e859-48f6-944d-aa929d600047',
        'e23cb8f4-d25a-4737-b86c-e21eb1b0c2f4',
        'eb78af38-b344-4233-bd5f-d06526ce5a1e',
        '524b4555-75e5-4216-8ed0-7ff41955e6a4',
        '4e2f598b-c868-4c36-945e-548acc565c40'
      ]);
    
    if (tabunganError) {
      console.error('Error fetching tabungan accounts:', tabunganError);
      return;
    }
    
    if (!tabunganList || tabunganList.length === 0) {
      console.log('No tabungan accounts found');
      return;
    }
    
    // Process each tabungan account
    for (const tabungan of tabunganList) {
      const tabunganInfo: TabunganInfo = {
        id: tabungan.id,
        anggota_id: tabungan.anggota_id,
        nomor_rekening: tabungan.nomor_rekening,
        jenis_nama: tabungan.jenis_tabungan.nama
      };
      
      // Check existing transaction count
      const { count: transactionCount, error: countError } = await supabase
        .from('transaksi')
        .select('*', { count: 'exact', head: true })
        .eq('tabungan_id', tabunganInfo.id);
      
      if (countError) {
        console.error(`Error counting transactions for ${tabunganInfo.nomor_rekening}:`, countError);
        continue;
      }
      
      // Only add transactions if there are fewer than 5
      if (transactionCount && transactionCount >= 5) {
        console.log(`Skipping ${tabunganInfo.nomor_rekening} - already has ${transactionCount} transactions`);
        continue;
      }
      
      console.log(`Generating transactions for ${tabunganInfo.nomor_rekening}...`);
      
      // Generate 5-10 transactions
      const transactionCount2 = Math.floor(Math.random() * 5) + 5;
      
      for (let i = 0; i < transactionCount2; i++) {
        // Generate transaction data
        const transactionData = generateRandomTransaction(tabunganInfo);
        
        // Insert transaction
        const { error: insertError } = await supabase
          .from('transaksi_api')
          .insert({
            tabungan_id: tabunganInfo.id,
            anggota_id: tabunganInfo.anggota_id,
            tipe_transaksi: transactionData.tipe_transaksi,
            kategori: transactionData.kategori,
            deskripsi: transactionData.deskripsi,
            reference_number: transactionData.reference_number,
            jumlah: transactionData.jumlah,
            created_at: transactionData.created_at
          });
        
        if (insertError) {
          console.error(`Error inserting transaction for ${tabunganInfo.nomor_rekening}:`, insertError);
        } else {
          console.log(`Transaction added for ${tabunganInfo.nomor_rekening}: ${transactionData.tipe_transaksi} - ${transactionData.kategori} - ${transactionData.jumlah}`);
        }
        
        // Add a small delay between transactions
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('Finished generating dummy transactions');
  } catch (error) {
    console.error('Error in generateDummyTransactions:', error);
  }
}

/**
 * Generate random transaction data
 */
function generateRandomTransaction(tabunganInfo: TabunganInfo): TransactionData {
  // Determine transaction type (70% masuk, 30% keluar)
  const isIncoming = Math.random() < 0.7;
  const tipe_transaksi = isIncoming ? 'masuk' : 'keluar';
  
  let kategori: string;
  let deskripsi: string;
  let jumlah: number;
  
  if (isIncoming) {
    // Determine kategori for incoming transactions
    const kategoriOptions = ['setoran', 'bagi_hasil', 'bonus'];
    kategori = kategoriOptions[Math.floor(Math.random() * kategoriOptions.length)];
    
    // Generate amount between 50,000 and 500,000
    jumlah = Math.floor(Math.random() * 450000) + 50000;
    
    // Create description based on kategori
    switch (kategori) {
      case 'setoran':
        deskripsi = `Setoran tabungan ${tabunganInfo.jenis_nama}`;
        break;
      case 'bagi_hasil':
        const monthsAgo = Math.floor(Math.random() * 3);
        const date = new Date();
        date.setMonth(date.getMonth() - monthsAgo);
        const monthYear = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        deskripsi = `Bagi hasil ${tabunganInfo.jenis_nama} bulan ${monthYear}`;
        break;
      default:
        deskripsi = `Bonus tabungan ${tabunganInfo.jenis_nama}`;
    }
  } else {
    // Determine kategori for outgoing transactions
    kategori = Math.random() < 0.7 ? 'penarikan' : 'biaya_admin';
    
    // Generate amount based on kategori
    if (kategori === 'penarikan') {
      jumlah = Math.floor(Math.random() * 190000) + 10000;
      deskripsi = `Penarikan tabungan ${tabunganInfo.jenis_nama}`;
    } else {
      jumlah = Math.floor(Math.random() * 4000) + 1000;
      deskripsi = `Biaya administrasi bulanan ${tabunganInfo.jenis_nama}`;
    }
  }
  
  // Generate reference number
  const prefix = tipe_transaksi === 'masuk' 
    ? (kategori === 'setoran' ? 'SETOR-' : kategori === 'bagi_hasil' ? 'BAGI-' : 'BONUS-')
    : (kategori === 'penarikan' ? 'TARIK-' : 'ADMIN-');
  
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 1000);
  const reference_number = `${prefix}${tabunganInfo.nomor_rekening}-${dateStr}${randomNum}`;
  
  // Generate random date within the last 30 days
  const daysAgo = Math.floor(Math.random() * 29) + 1;
  const transactionDate = new Date();
  transactionDate.setDate(transactionDate.getDate() - daysAgo);
  transactionDate.setHours(
    Math.floor(Math.random() * 24),
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60)
  );
  
  return {
    tipe_transaksi,
    kategori,
    deskripsi,
    jumlah,
    reference_number,
    created_at: transactionDate.toISOString()
  };
}

// Execute the function
generateDummyTransactions()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });
