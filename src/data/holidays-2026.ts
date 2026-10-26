export type HolidayKind = "general" | "provincial" | "local" | "restricted";

export type Holiday = {
  date: string;
  name: string;
  scope: string;
  kind: HolidayKind;
  subjectToMoon?: boolean;
};

const general = (date: string, name: string, subjectToMoon = false): Holiday => ({
  date,
  name,
  scope: "All J&K",
  kind: "general",
  subjectToMoon,
});

const scoped = (
  date: string,
  name: string,
  scope: string,
  kind: Exclude<HolidayKind, "general">,
  subjectToMoon = false,
): Holiday => ({ date, name, scope, kind, subjectToMoon });

export const holidays2026: Holiday[] = [
  general("2026-01-05", "Guru Gobind Singh Ji's Birthday"),
  general("2026-01-17", "Shab-i-Miraj", true),
  general("2026-01-26", "Republic Day"),
  general("2026-02-15", "Mahashivratri"),
  general("2026-03-17", "Shab-i-Qadr", true),
  general("2026-03-19", "1st Navratra"),
  general("2026-03-20", "Jumat-ul-Vida", true),
  general("2026-03-21", "Nauroz", true),
  general("2026-03-21", "Eid-ul-Fitr", true),
  general("2026-03-26", "Ramanavami"),
  general("2026-04-14", "Baisakhi"),
  general("2026-04-14", "Birthday of Dr. B. R. Ambedkar"),
  general("2026-05-01", "Buddha Purnima"),
  general("2026-05-27", "Eid-ul-Azha", true),
  general("2026-05-28", "Eid-ul-Azha", true),
  general("2026-06-26", "Ashoora", true),
  general("2026-07-05", "Guru Hargobind Ji's Birthday"),
  general("2026-08-15", "Independence Day"),
  general("2026-08-26", "Eid-i-Milad-ul-Nabi", true),
  general("2026-08-28", "Friday following Eid-i-Milad-ul-Nabi", true),
  general("2026-09-04", "Janamashtami"),
  general("2026-09-23", "Birthday of Maharaja Hari Singh Ji"),
  general("2026-10-02", "Mahatma Gandhi's Birthday"),
  general("2026-10-20", "Mahanavami"),
  general("2026-10-20", "Dussehra"),
  general("2026-10-26", "Accession Day"),
  general("2026-11-08", "Diwali"),
  general("2026-11-24", "Guru Nanak Dev Ji's Birthday"),
  general("2026-12-25", "Christmas Day"),

  scoped("2026-01-23", "Friday following Shab-i-Miraj", "Kashmir Province", "provincial", true),
  scoped("2026-05-23", "Urs Shah-i-Hamdan Sahib", "Kashmir Province", "provincial", true),
  scoped("2026-06-22", "Mela Khir Bhawani", "Kashmir Province", "provincial"),
  scoped("2026-10-09", "Urs Sheikh Noor-ud-Din Sahib", "Kashmir Province", "provincial", true),

  scoped("2026-01-13", "Lohri", "Jammu Province", "provincial"),
  scoped("2026-02-01", "Shri Guru Ravi Das's Birthday", "Jammu Province", "provincial"),
  scoped("2026-03-04", "Holi", "Jammu Province", "provincial"),
  scoped("2026-03-26", "Mela Bahu Fort", "Jammu District", "local"),
  scoped("2026-03-31", "Mahavir Jayanti", "Jammu District", "local"),
  scoped("2026-04-03", "Good Friday", "Jammu District", "local"),
  scoped("2026-06-21", "Urs Shah Farid-ud-Din Sahib", "Kishtwar District", "local", true),
  scoped("2026-07-21", "Sarthal Devi Ji Yatra", "Kishtwar District", "local"),
  scoped("2026-07-22", "Sarthal Devi Ji Yatra", "Kishtwar District", "local"),
  scoped("2026-09-09", "Kailash Yatra", "Tehsil Bhaderwah & Tehsil Bhalla", "local"),
  scoped("2026-09-10", "Kailash Yatra", "Tehsil Bhaderwah & Tehsil Bhalla", "local"),
  scoped("2026-09-17", "Mela Pat", "Tehsil Bhaderwah & Tehsil Bhalla", "local"),
  scoped("2026-09-18", "Mela Pat", "Tehsil Bhaderwah & Tehsil Bhalla", "local"),
  scoped("2026-11-10", "Urs Shah Asrar-ud-Din Sahib", "Kishtwar, Doda & Ramban Districts", "local", true),

  scoped("2026-04-19", "Parshuram Jayanti", "Jammu Province", "restricted"),
  scoped("2026-06-16", "Martyr's Day of Guru Arjun Dev Ji", "All J&K", "restricted"),
  scoped("2026-06-29", "Kabir Jayanti", "Jammu Province", "restricted"),
  scoped("2026-08-28", "Raksha Bandhan", "All J&K", "restricted"),
];

export function holidaysOn(date: string): Holiday[] {
  return holidays2026.filter((holiday) => holiday.date === date);
}
