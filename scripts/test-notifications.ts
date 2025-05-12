import { supabase } from '../lib/supabase';

/**
 * Test script for notifications
 * Run this script to test the notification system
 */
async function testNotifications() {
  try {
    console.log('Testing notifications system...');
    
    // 1. Check if the notifikasi table exists
    console.log('Checking notifikasi table...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('notifikasi')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('Error checking notifikasi table:', tableError);
      return;
    }
    
    console.log('Notifikasi table exists:', tableInfo ? 'Yes' : 'No');
    
    // 2. Get a list of members to create notifications for
    console.log('Fetching members...');
    const { data: members, error: membersError } = await supabase
      .from('anggota')
      .select('id, nama_lengkap')
      .limit(5);
    
    if (membersError) {
      console.error('Error fetching members:', membersError);
      return;
    }
    
    console.log(`Found ${members?.length || 0} members`);
    
    if (!members || members.length === 0) {
      console.error('No members found');
      return;
    }
    
    // 3. Create test notifications for each member
    for (const member of members) {
      console.log(`Creating test notifications for member: ${member.nama_lengkap} (${member.id})`);
      
      const now = new Date().toISOString();
      const notifications = [
        // Personal notification
        {
          anggota_id: member.id,
          judul: `Notifikasi Personal untuk ${member.nama_lengkap}`,
          pesan: 'Ini adalah notifikasi personal untuk Anda.',
          jenis: 'info',
          is_read: false,
          created_at: now,
          updated_at: now
        },
        // Transaction notification
        {
          anggota_id: member.id,
          judul: 'Transaksi Berhasil',
          pesan: 'Transaksi simpanan sebesar Rp 100.000 berhasil dilakukan.',
          jenis: 'transaksi',
          is_read: false,
          data: { transaction_id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}` },
          created_at: now,
          updated_at: now
        },
        // Due date notification
        {
          anggota_id: member.id,
          judul: 'Pembayaran Jatuh Tempo',
          pesan: 'Anda memiliki pembayaran yang jatuh tempo dalam 3 hari.',
          jenis: 'jatuh_tempo',
          is_read: false,
          data: { 
            loan_id: `LOAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            amount: 500000,
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          created_at: now,
          updated_at: now
        }
      ];
      
      // Insert notifications
      const { error: insertError } = await supabase
        .from('notifikasi')
        .insert(notifications);
      
      if (insertError) {
        console.error(`Error creating notifications for member ${member.id}:`, insertError);
      } else {
        console.log(`Successfully created ${notifications.length} notifications for member ${member.id}`);
      }
    }
    
    // 4. Create system notifications visible to all members
    console.log('Creating system notifications...');
    
    const now = new Date().toISOString();
    const systemNotifications = [
      // System notification
      {
        anggota_id: members[0].id, // We need to assign it to a member, but it will be visible to all
        judul: 'Pemeliharaan Sistem',
        pesan: 'Sistem akan mengalami pemeliharaan pada tanggal 20 Mei 2025 pukul 23:00 - 01:00 WIB.',
        jenis: 'sistem',
        is_read: false,
        created_at: now,
        updated_at: now
      },
      // Announcement notification
      {
        anggota_id: members[0].id, // We need to assign it to a member, but it will be visible to all
        judul: 'Pengumuman Rapat Anggota Tahunan',
        pesan: 'Rapat Anggota Tahunan akan dilaksanakan pada tanggal 25 Mei 2025 pukul 09:00 WIB di Aula Koperasi Fatihul Barokah.',
        jenis: 'pengumuman',
        is_read: false,
        created_at: now,
        updated_at: now
      }
    ];
    
    // Insert system notifications
    const { error: sysInsertError } = await supabase
      .from('notifikasi')
      .insert(systemNotifications);
    
    if (sysInsertError) {
      console.error('Error creating system notifications:', sysInsertError);
    } else {
      console.log(`Successfully created ${systemNotifications.length} system notifications`);
    }
    
    console.log('Notification test completed successfully!');
  } catch (error) {
    console.error('Error in testNotifications:', error);
  }
}

// Run the test
testNotifications();
