import { supabase } from '../lib/supabase';
import { NotificationService } from './notification.service';
import { Pembiayaan } from './pinjaman.service';
import { format, addMonths, isWithinInterval, addDays, isSameDay } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Logger } from '../lib/logger';

/**
 * Service for handling loan due date notifications
 */
export const LoanNotificationService = {
  /**
   * Check for upcoming loan installments and create notifications
   * This function should be called periodically (e.g., daily) to check for upcoming installments
   */
  async checkAndCreateDueDateNotifications(): Promise<void> {
    try {
      Logger.debug('Loan', 'Checking for upcoming loan installments');
      
      // Get all active loans
      const { data: activeLoans, error } = await supabase
        .from('pembiayaan')
        .select('*')
        .eq('status', 'aktif');
      
      if (error) {
        Logger.error('Loan', 'Error fetching active loans', error);
        return;
      }
      
      if (!activeLoans || activeLoans.length === 0) {
        Logger.debug('Loan', 'No active loans found');
        return;
      }
      
      Logger.debug('Loan', `Found ${activeLoans.length} active loans`);
      
      // Get current date
      const now = new Date();
      
      // Check each loan for upcoming installments
      for (const loan of activeLoans) {
        await this.processLoanInstallments(loan, now);
      }
      
      Logger.debug('Loan', 'Finished checking for upcoming loan installments');
    } catch (error) {
      Logger.error('Loan', 'Error in checkAndCreateDueDateNotifications', error);
    }
  },
  
  /**
   * Process loan installments for a single loan
   * @param loan The loan to process
   * @param currentDate The current date
   */
  async processLoanInstallments(loan: Pembiayaan, currentDate: Date): Promise<void> {
    try {
      // Parse loan creation date and final due date
      const loanStartDate = new Date(loan.created_at);
      const loanDueDate = new Date(loan.jatuh_tempo);
      
      // Calculate the day of the month for installments (same as loan creation date)
      const installmentDay = loanStartDate.getDate();
      
      // Calculate the loan term in months based on the due date
      const startYear = loanStartDate.getFullYear();
      const startMonth = loanStartDate.getMonth();
      const dueYear = loanDueDate.getFullYear();
      const dueMonth = loanDueDate.getMonth();
      
      // Calculate number of months between start date and due date
      let loanTermMonths = (dueYear - startYear) * 12 + (dueMonth - startMonth);
      
      // Handle short-term loans (less than one month)
      if (loanTermMonths <= 0) {
        loanTermMonths = 1; // Treat as a single payment loan
        Logger.debug('Loan', `Short-term loan detected, treating as ${loanTermMonths} month term`, { loanId: loan.id });
      } else {
        Logger.debug('Loan', `Loan term calculated as ${loanTermMonths} months`, { loanId: loan.id });
      }
      
      // Calculate all installment dates
      const installmentDates: Date[] = [];
      
      // For short-term loans, use the due date directly
      if (loanTermMonths === 1 && loanStartDate.getMonth() === loanDueDate.getMonth() && 
          loanStartDate.getFullYear() === loanDueDate.getFullYear()) {
        installmentDates.push(loanDueDate);
      } else {
        // For regular loans, calculate installment dates based on term
        for (let i = 1; i <= loanTermMonths; i++) {
          const installmentDate = addMonths(loanStartDate, i);
          // Ensure the installment date is on the same day of month as the start date
          installmentDate.setDate(installmentDay);
          installmentDates.push(installmentDate);
        }
      }
      
      Logger.debug('Loan', `Generated ${installmentDates.length} installment dates`, { loanId: loan.id });
      
      // Check for upcoming installments (within 3 days)
      const upcomingInstallments = installmentDates.filter(date => 
        isWithinInterval(date, {
          start: currentDate,
          end: addDays(currentDate, 3)
        })
      );
      
      // Check for today's installment
      const todayInstallment = installmentDates.find(date => 
        isSameDay(date, currentDate)
      );
      
      Logger.debug('Loan', 'Found installments', { 
        loanId: loan.id, 
        upcomingCount: upcomingInstallments.length, 
        hasTodayInstallment: !!todayInstallment 
      });
      
      // Check for existing notifications for this loan in the last 3 days using NotificationService
      // to avoid duplicate notifications
      const threeDaysAgo = addDays(currentDate, -3).toISOString();
      
      // Get jatuh_tempo notifications for this member
      const jatuhTempoNotifications = await NotificationService.getNotificationsByType(loan.anggota_id, 'jatuh_tempo');
      
      if (!jatuhTempoNotifications) {
        Logger.error('Loan', 'Error getting jatuh_tempo notifications');
        return;
      }
      
      // Filter notifications by creation date and for this specific loan
      const loanNotifications = jatuhTempoNotifications.filter(notification => {
        // Check if the notification was created in the last 3 days
        const isRecent = new Date(notification.created_at) >= new Date(threeDaysAgo);
        
        if (!isRecent) return false;
        
        try {
          // Parse the data field
          const data = typeof notification.data === 'string' 
            ? JSON.parse(notification.data) 
            : notification.data;
          
          // Check if this notification is for the current loan
          return data && data.loanId === loan.id;
        } catch (e) {
          Logger.error('Loan', 'Error parsing notification data', e);
          return false;
        }
      });
      
      // If there's an installment today and no notification has been sent
      if (todayInstallment && !loanNotifications.some(n => {
        try {
          const data = typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
          return data && data.installmentDate === todayInstallment.toISOString();
        } catch (e) {
          return false;
        }
      })) {
        await this.createDueDateNotification(
          loan,
          todayInstallment,
          'Pembayaran Angsuran Hari Ini',
          `Pembayaran angsuran pembiayaan ${loan.jenis_pembiayaan} jatuh tempo hari ini. Silakan lakukan pembayaran secepatnya.`
        );
      }
      // For upcoming installments, send reminders
      else if (upcomingInstallments.length > 0) {
        for (const installmentDate of upcomingInstallments) {
          // Skip if notification already exists for this installment
          if (loanNotifications.some(n => {
            try {
              const data = typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
              return data && data.installmentDate === installmentDate.toISOString();
            } catch (e) {
              return false;
            }
          })) {
            continue;
          }
          
          // Calculate days until installment
          const daysUntil = Math.ceil((installmentDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Create notification
          await this.createDueDateNotification(
            loan,
            installmentDate,
            `Pengingat Pembayaran Angsuran`,
            `Pembayaran angsuran pembiayaan ${loan.jenis_pembiayaan} akan jatuh tempo dalam ${daysUntil} hari. Silakan siapkan pembayaran Anda.`
          );
        }
      }
    } catch (error) {
      Logger.error('Loan', 'Error processing loan installments', error);
    }
  },
  
  /**
   * Create a due date notification
   * @param loan The loan
   * @param installmentDate The installment date
   * @param title The notification title
   * @param message The notification message
   */
  async createDueDateNotification(
    loan: Pembiayaan,
    installmentDate: Date,
    title: string,
    message: string
  ): Promise<boolean> {
    try {
      Logger.debug('Loan', 'Creating due date notification', { loanId: loan.id });
      
      const formattedDate = format(installmentDate, 'dd MMMM yyyy', { locale: idLocale });
      
      // Calculate the loan term in months based on the due date
      const loanStartDate = new Date(loan.created_at);
      const loanDueDate = new Date(loan.jatuh_tempo);
      const startYear = loanStartDate.getFullYear();
      const startMonth = loanStartDate.getMonth();
      const dueYear = loanDueDate.getFullYear();
      const dueMonth = loanDueDate.getMonth();
      let loanTermMonths = (dueYear - startYear) * 12 + (dueMonth - startMonth);
      
      // Handle short-term loans (less than one month)
      if (loanTermMonths <= 0) {
        loanTermMonths = 1; // Treat as a single payment loan
        Logger.debug('Loan', `Short-term loan detected in notification creation, treating as ${loanTermMonths} month term`, { loanId: loan.id });
      }
      
      // Calculate the installment amount based on the total payment and loan term
      const installmentAmount = Math.round(loan.total_pembayaran / loanTermMonths);
      
      console.log(`Calculated installment amount: ${installmentAmount} for loan ${loan.id} with term ${loanTermMonths} months`);
      
      // Create notification data as a JSON string to ensure proper JSONB storage
      const notificationData = JSON.stringify({
        loanId: loan.id,
        installmentDate: installmentDate.toISOString(),
        installmentAmount: installmentAmount,
        loanType: loan.jenis_pembiayaan,
        totalPayment: loan.total_pembayaran,
        remainingPayment: loan.sisa_pembayaran
      });
      
      // Create the notification
      const result = await NotificationService.createNotification({
        anggota_id: loan.anggota_id,
        judul: title,
        pesan: `${message} (${formattedDate})`,
        jenis: 'jatuh_tempo',
        is_read: false,
        data: notificationData,
        source: 'global' // Adding the required source property
      });
      
      if (result.success) {
        console.log(`Due date notification created successfully for loan ${loan.id} with notification ID: ${result.id}`);
      } else {
        console.error(`Failed to create due date notification for loan ${loan.id}`);
      }
      
      return result.success;
    } catch (error) {
      console.error('Error creating due date notification:', error);
      return false;
    }
  },
  
  /**
   * Check for upcoming loan installments for a specific member
   * @param memberId The member ID
   */
  async checkMemberLoanInstallments(memberId: string): Promise<void> {
    try {
      Logger.info('Loan', 'Checking loan installments for member', { memberId });
      
      // Get all active loans for this member
      const { data: activeLoans, error } = await supabase
        .from('pembiayaan')
        .select('*')
        .eq('anggota_id', memberId)
        .eq('status', 'aktif');
      
      if (error) {
        Logger.error('Loan', 'Error fetching active loans for member', error);
        return;
      }
      
      if (!activeLoans || activeLoans.length === 0) {
        Logger.debug('Loan', 'No active loans found for member', { memberId });
        return;
      }
      
      Logger.debug('Loan', 'Found active loans for member', { memberId, count: activeLoans.length });
      
      // Get current date
      const now = new Date();
      
      // Check each loan for upcoming installments
      for (const loan of activeLoans) {
        await this.processLoanInstallments(loan, now);
      }
      
      Logger.debug('Loan', 'Finished checking loan installments for member', { memberId });
    } catch (error) {
      Logger.error('Loan', 'Error checking loan installments for member', error);
      throw error;
    }
  }
};
