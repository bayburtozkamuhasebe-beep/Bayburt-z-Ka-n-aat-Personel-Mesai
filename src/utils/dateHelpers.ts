import { DayRecord, Personnel, AdvancePayment } from '../types';

export const MONTHS = [
  { index: 1, name: 'OCAK', short: 'Oca', code: '01' },
  { index: 2, name: 'ŞUBAT', short: 'Şub', code: '02' },
  { index: 3, name: 'MART', short: 'Mar', code: '03' },
  { index: 4, name: 'NİSAN', short: 'Nis', code: '04' },
  { index: 5, name: 'MAYIS', short: 'May', code: '05' },
  { index: 6, name: 'HAZİRAN', short: 'Haz', code: '06' },
  { index: 7, name: 'TEMMUZ', short: 'Tem', code: '07' },
  { index: 8, name: 'AĞUSTOS', short: 'Ağu', code: '08' },
  { index: 9, name: 'EYLÜL', short: 'Eyl', code: '09' },
  { index: 10, name: 'EKİM', short: 'Eki', code: '10' },
  { index: 11, name: 'KASIM', short: 'Kas', code: '11' },
  { index: 12, name: 'ARALIK', short: 'Ara', code: '12' },
];

export const WEEKDAYS_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('tr-TR').format(num);
};

export const getDaysInMonthArray = (year: number, month: number) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dayOfWeek = date.getDay(); // 0 is Sun, 6 is Sat
    days.push({
      day: d,
      date,
      dayOfWeek,
      weekdayName: WEEKDAYS_TR[dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isSunday: dayOfWeek === 0,
    });
  }
  return days;
};

export interface PersonnelMonthSummary {
  personnelId: string;
  totalDaysWorked: number; // 1.0 or 0.5 sum
  fullDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  sickDays: number;
  totalOvertimeHours: number;
  regularWageEarned: number;
  overtimeWageEarned: number;
  totalEarned: number;
  totalAdvance: number;
  netPayable: number;
}

export const calculatePersonnelMonthSummary = (
  person: Personnel,
  monthRecords: Record<string, DayRecord> | undefined,
  advances: AdvancePayment[]
): PersonnelMonthSummary => {
  let fullDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let sickDays = 0;
  let totalOvertimeHours = 0;

  if (monthRecords) {
    Object.values(monthRecords).forEach((rec) => {
      if (rec.status === 'full') {
        fullDays += 1;
      } else if (rec.status === 'half') {
        halfDays += 1;
      } else if (rec.status === 'absent') {
        absentDays += 1;
      } else if (rec.status === 'leave') {
        leaveDays += 1;
      } else if (rec.status === 'sick') {
        sickDays += 1;
      }

      if (rec.overtimeHours && rec.overtimeHours > 0) {
        totalOvertimeHours += Number(rec.overtimeHours);
      }
    });
  }

  const totalDaysWorked = fullDays + halfDays * 0.5;
  const regularWageEarned = totalDaysWorked * person.dailyWage;
  const overtimeWageEarned = totalOvertimeHours * person.hourlyOvertimeWage;
  const totalEarned = regularWageEarned + overtimeWageEarned;

  const totalAdvance = advances
    .filter((a) => a.personnelId === person.id)
    .reduce((sum, a) => sum + Number(a.amount || 0), 0);

  const netPayable = totalEarned - totalAdvance;

  return {
    personnelId: person.id,
    totalDaysWorked,
    fullDays,
    halfDays,
    absentDays,
    leaveDays,
    sickDays,
    totalOvertimeHours,
    regularWageEarned,
    overtimeWageEarned,
    totalEarned,
    totalAdvance,
    netPayable,
  };
};

export const createWhatsAppSummary = (
  person: Personnel,
  summary: PersonnelMonthSummary,
  monthName: string,
  year: number
): string => {
  const text = `🏗️ *BAYBURT ÖZ-KA İNŞAAT*
📋 *Personel Mesai & Hakediş Bildirimi*
---------------------------------------
👤 *Personel:* ${person.name}
🔨 *Görev:* ${person.role}
📍 *Şantiye:* ${person.site}
📅 *Dönem:* ${monthName} ${year}

⏱️ *Çalışılan Gün:* ${summary.totalDaysWorked} Gün (Yevmiye: ${formatCurrency(person.dailyWage)})
🌙 *Fazla Mesai:* ${summary.totalOvertimeHours} Saat (Saatlik: ${formatCurrency(person.hourlyOvertimeWage)})

💰 *Yevmiye Tutarı:* ${formatCurrency(summary.regularWageEarned)}
⚡ *Mesai Tutarı:* ${formatCurrency(summary.overtimeWageEarned)}
💵 *Toplam Hak Ediş:* ${formatCurrency(summary.totalEarned)}
🔻 *Kesilen Avans:* ${formatCurrency(summary.totalAdvance)}
---------------------------------------
⭐ *NET ÖDENECEK TUTAR:* ${formatCurrency(summary.netPayable)}
---------------------------------------
Bayburt Öz-Ka İnşaat Muhasebe Birimi`;

  return encodeURIComponent(text);
};
