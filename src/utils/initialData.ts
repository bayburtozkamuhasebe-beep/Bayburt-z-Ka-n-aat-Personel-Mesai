import { Personnel, AdvancePayment, SiteProject, AllAttendanceData } from '../types';

export const INITIAL_SITES: SiteProject[] = [
  { id: 'site-1', name: 'Bayburt TOKİ 4. Etap Konutları', location: 'Merkez / Bayburt' },
  { id: 'site-2', name: 'Aydıntepe Rezidans & İş Merkezi', location: 'Aydıntepe / Bayburt' },
  { id: 'site-3', name: 'Çoruh Köprüsü & Viyadük Projesi', location: 'Demirözü / Bayburt' },
  { id: 'site-4', name: 'Organize Sanayi Fabrika Şantiyesi', location: 'OSB / Bayburt' },
];

export const INITIAL_PERSONNEL: Personnel[] = [
  {
    id: 'p-1',
    name: 'Yaşar Karasapan',
    role: 'Şantiye Şefi',
    site: 'Bayburt TOKİ 4. Etap Konutları',
    phone: '0532 411 69 01',
    tcNo: '18492014820',
    dailyWage: 2800,
    hourlyOvertimeWage: 350,
    startDate: '2024-03-01',
    isActive: true,
    avatarColor: '#f59e0b',
  },
  {
    id: 'p-2',
    name: 'Mehmet Memiş',
    role: 'Kalıp Ustası (Ekip Başı)',
    site: 'Bayburt TOKİ 4. Etap Konutları',
    phone: '0543 822 54 22',
    tcNo: '23940182490',
    dailyWage: 2100,
    hourlyOvertimeWage: 260,
    startDate: '2024-04-15',
    isActive: true,
    avatarColor: '#10b981',
  },
  {
    id: 'p-3',
    name: 'Osman Kılıç',
    role: 'Demirci Ustası',
    site: 'Bayburt TOKİ 4. Etap Konutları',
    phone: '0505 677 34 50',
    tcNo: '49281740192',
    dailyWage: 1950,
    hourlyOvertimeWage: 245,
    startDate: '2024-05-10',
    isActive: true,
    avatarColor: '#06b6d4',
  },
  {
    id: 'p-4',
    name: 'Harun Polat',
    role: 'Sıva & Boya Ustası',
    site: 'Aydıntepe Rezidans & İş Merkezi',
    phone: '0536 933 21 87',
    tcNo: '30194827104',
    dailyWage: 1850,
    hourlyOvertimeWage: 230,
    startDate: '2024-06-01',
    isActive: true,
    avatarColor: '#ec4899',
  },
  {
    id: 'p-5',
    name: 'Ali Rıza Saka',
    role: 'Kule Vinç Operatörü',
    site: 'Çoruh Köprüsü & Viyadük Projesi',
    phone: '0544 519 88 12',
    tcNo: '58201948211',
    dailyWage: 2500,
    hourlyOvertimeWage: 310,
    startDate: '2024-02-18',
    isActive: true,
    avatarColor: '#8b5cf6',
  },
  {
    id: 'p-6',
    name: 'İbrahim Bayburtlu',
    role: 'Ekskavatör & Kepçe Operatörü',
    site: 'Organize Sanayi Fabrika Şantiyesi',
    phone: '0537 204 15 90',
    tcNo: '10948271649',
    dailyWage: 2400,
    hourlyOvertimeWage: 300,
    startDate: '2024-05-01',
    isActive: true,
    avatarColor: '#f97316',
  },
  {
    id: 'p-7',
    name: 'Dursun Çakır',
    role: 'Kalıpçı / Demirci Kalfası',
    site: 'Bayburt TOKİ 4. Etap Konutları',
    phone: '0553 490 82 71',
    tcNo: '48201948291',
    dailyWage: 1600,
    hourlyOvertimeWage: 200,
    startDate: '2024-06-15',
    isActive: true,
    avatarColor: '#14b8a6',
  },
  {
    id: 'p-8',
    name: 'Mustafa Durmuş',
    role: 'Elektrik & Tesisat Ustası',
    site: 'Aydıntepe Rezidans & İş Merkezi',
    phone: '0533 891 22 40',
    tcNo: '39401928401',
    dailyWage: 2000,
    hourlyOvertimeWage: 250,
    startDate: '2024-03-20',
    isActive: true,
    avatarColor: '#eab308',
  },
  {
    id: 'p-9',
    name: 'Serkan Aslan',
    role: 'Çelik Konstrüksiyon Kaynakçısı',
    site: 'Çoruh Köprüsü & Viyadük Projesi',
    phone: '0541 332 90 19',
    tcNo: '29481920491',
    dailyWage: 2200,
    hourlyOvertimeWage: 275,
    startDate: '2024-04-01',
    isActive: true,
    avatarColor: '#ef4444',
  },
];

// Initial seeded attendance for 2026-09
export const generateInitialAttendance = (year: number, month: number): AllAttendanceData => {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthData: Record<string, Record<string, { status: 'full' | 'half' | 'absent' | 'leave' | 'sick' | 'holiday' | 'empty'; overtimeHours: number; note?: string }>> = {};

  INITIAL_PERSONNEL.forEach((person, idx) => {
    monthData[person.id] = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const isSunday = date.getDay() === 0;

      if (isSunday) {
        monthData[person.id][day] = { status: 'holiday', overtimeHours: 0 };
      } else if (day <= 22) {
        // Pre-fill realistic working days up to 22
        if (day === 5 || day === 17) {
          // overtime evening pour day
          monthData[person.id][day] = { status: 'full', overtimeHours: idx % 2 === 0 ? 3 : 2, note: 'Beton dökümü' };
        } else if (day === 12 && idx === 3) {
          monthData[person.id][day] = { status: 'half', overtimeHours: 0, note: 'Yarım gün hastane' };
        } else if (day === 19 && idx === 6) {
          monthData[person.id][day] = { status: 'leave', overtimeHours: 0, note: 'Özel izin' };
        } else {
          // Regular full working day with occasional 1-2 hours overtime
          const ot = (day + idx) % 4 === 0 ? 2 : 0;
          monthData[person.id][day] = { status: 'full', overtimeHours: ot };
        }
      } else {
        // Rest of the month
        monthData[person.id][day] = { status: 'empty', overtimeHours: 0 };
      }
    }
  });

  return { [monthKey]: monthData };
};

export const INITIAL_ADVANCES: AdvancePayment[] = [
  {
    id: 'adv-1',
    personnelId: 'p-2',
    monthKey: '2026-09',
    date: '2026-09-08',
    amount: 5000,
    note: 'Elden nakit avans (Kalıp malzemesi ve aile masrafı)',
  },
  {
    id: 'adv-2',
    personnelId: 'p-3',
    monthKey: '2026-09',
    date: '2026-09-11',
    amount: 4000,
    note: 'Banka havalesi avans',
  },
  {
    id: 'adv-3',
    personnelId: 'p-6',
    monthKey: '2026-09',
    date: '2026-09-15',
    amount: 7500,
    note: 'Yakıt ve şahsi acil avans',
  },
  {
    id: 'adv-4',
    personnelId: 'p-7',
    monthKey: '2026-09',
    date: '2026-09-18',
    amount: 3000,
    note: 'Elden nakit teslim',
  },
];
