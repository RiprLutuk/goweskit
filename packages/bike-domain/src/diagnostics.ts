export type DiagnosticCategory =
  | 'drivetrain'
  | 'brakes'
  | 'cockpit_headset'
  | 'wheels_tires'
  | 'suspension'
  | 'frame_bottom_bracket';

export type DiagnosticSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface DiagnosticSymptom {
  id: string;
  title: string;
  description: string;
  category: DiagnosticCategory;
  categoryName: string;
  componentCode?: string;
  severity: DiagnosticSeverity;
  probableCauses: string[];
  inspectionSteps: string[];
  quickFix: string;
  proShopRecommendedIf: string;
  standardTorqueNm?: string;
}

export const DIAGNOSTIC_SYMPTOMS: readonly DiagnosticSymptom[] = [
  {
    id: 'bb_creak',
    title: 'Bunyi "Creak/Klotok" Saat Mengayuh Bertenaga',
    description:
      'Terdengar bunyi decit atau berderit dari area tengah sepeda saat berdiri di pedal atau melibas tanjakan.',
    category: 'frame_bottom_bracket',
    categoryName: 'Bottom Bracket & Crank',
    componentCode: 'bottom_bracket',
    severity: 'medium',
    probableCauses: [
      'Drat Bottom Bracket (BSA/T47) kering atau kurang torsi pengencangan.',
      'Bearing BB aus atau terkontaminasi air/pasir sehabis cuci atau gowes hujan.',
      'Baut chainring atau crank arm kendur.',
    ],
    inspectionSteps: [
      'Pegang kedua ujung crank arm dan goyang menyilang tegak lurus frame; periksa ada tidaknya celah/oblak (play).',
      'Lepas crankset, putar bearing BB dengan jari; bearing yang sehat terasa halus, bukan kasar atau berpasir.',
      'Periksa kekencangan baut chainring dan baut pinch crank.',
    ],
    quickFix:
      'Buka cup BB, bersihkan drat frame, beri anti-seize / waterproof grease, dan kencangkan sesuai torsi pabrikan.',
    proShopRecommendedIf:
      'Drat frame rusak/cross-threaded atau BB tipe PressFit memerlukan alat bearing press/extraction khusus.',
    standardTorqueNm: '35–45 Nm (Cup BB), 12–14 Nm (Crank Pinch Bolts Shimano)',
  },
  {
    id: 'chain_skip',
    title: 'Rantai Loncat / Slip Saat Gowes Keras di Gir Kecil',
    description:
      'Rantai mendadak terasa melompati gigi kaset saat rider memberikan tenaga kayuhan kuat.',
    category: 'drivetrain',
    categoryName: 'Drivetrain & Kaset',
    componentCode: 'cassette',
    severity: 'high',
    probableCauses: [
      'Rantai telah melar (wear > 0.75%) dipadukan dengan kaset baru atau sebaliknya (kaset aus).',
      'B-Tension screw pada RD terlalu jauh sehingga rantai kurang melingkari cog kaset.',
      'Stiff link (ada mata rantai yang macet/kaku setelah pemotongan/pemasangan).',
    ],
    inspectionSteps: [
      'Gunakan Chain Checker tool: jika indikator 0.75% masuk, rantai wajib diganti.',
      'Periksa kelancaran setiap pin mata rantai dengan memutar mundur drivetrain secara manual.',
      'Amati profil gigi kaset: gigi yang aus tampak seperti "sirip hiu" (shark-fin profile).',
    ],
    quickFix:
      'Ganti rantai baru jika melar. Lenturkan mata rantai yang kaku ke arah menyamping secara perlahan.',
    proShopRecommendedIf:
      'Kaset sudah aus parah di beberapa cog dan membutuhkan penggantian kaset + rantai satu set.',
    standardTorqueNm: '40 Nm (Cassette Lockring)',
  },
  {
    id: 'ghost_shift',
    title: 'Operan Gigi Pindah Sendiri (Ghost Shifting)',
    description:
      'Gigi berpindah sendiri atau berisik melompat naik-turun tanpa rider menekan tombol shifter.',
    category: 'drivetrain',
    categoryName: 'Rear Derailleur & Shifter',
    componentCode: 'rear_derailleur',
    severity: 'medium',
    probableCauses: [
      'Tegangan kabel shifter kendur atau housing kabel kotor/berkarat.',
      'Derailleur Hanger (anting RD) bengkok akibat benturan atau sepeda terjatuh.',
      'Baut limit screw H / L atau B-gap tidak presisi.',
    ],
    inspectionSteps: [
      'Lihat dari belakang sepeda: pastikan pulley cage RD sejajar vertikal lurus dengan cog kaset aktif.',
      'Periksa apakah kabel shifter bergerak bebas di dalam outer casing tanpa hambatan gesekan.',
    ],
    quickFix:
      'Putar barrel adjuster pada shifter: putar berlawanan arah jarum jam jika rantai lambat naik ke gir lebih besar.',
    proShopRecommendedIf:
      'Hanger RD bengkok dan memerlukan pelurusan presisi dengan Derailleur Hanger Alignment Gauge (DAG).',
    standardTorqueNm: '8–10 Nm (RD Mount Bolt)',
  },
  {
    id: 'disc_squeal',
    title: 'Rem Cakram Berdecit Keras / Rem Blong',
    description:
      'Rem mengeluarkan bunyi jeritan nyaring saat ditarik dan daya cengkeram berkurang drastis.',
    category: 'brakes',
    categoryName: 'Sistem Pengereman',
    componentCode: 'disc_brake',
    severity: 'critical',
    probableCauses: [
      'Kampas rem (pads) atau rotor terkontaminasi minyak, pelumas rantai spray, atau sabun cuci.',
      'Permukaan kampas terglazing (hangus mengkilap) karena pengereman panjang tanpa jeda.',
      'Kaliper rem tidak lurus (*misaligned*) terhadap piringan rotor.',
    ],
    inspectionSteps: [
      'Periksa permukaan rotor: apakah ada lapisan minyak atau noda gelap mengkilap.',
      'Lepas kampas rem dan amati ketebalan compound (minimal 1 mm) dan permukaannya.',
    ],
    quickFix:
      'Bersihkan rotor dengan Isopropyl Alcohol (IPA 99%). Amplas halus permukaan kampas dan bersihkan residunya.',
    proShopRecommendedIf:
      'Minyak rem hidrolik bocor dari piston kaliper (butuh seal rebuild / kaliper baru).',
    standardTorqueNm: '6–8 Nm (Brake Caliper Bolts), 4–6 Nm (6-Bolt Rotor), 40 Nm (Centerlock)',
  },
  {
    id: 'spongy_lever',
    title: 'Tuas Rem Hidrolik Amblas / Terasa Lembek',
    description:
      'Tuas rem harus ditarik sangat dalam hingga mendekati handlegrip sebelum rem mulai menggigit.',
    category: 'brakes',
    categoryName: 'Sistem Pengereman Hidrolik',
    componentCode: 'hydraulic_brake',
    severity: 'critical',
    probableCauses: [
      'Terdapat gelembung udara di dalam selang minyak rem hidrolik.',
      'Kampas rem sudah terlalu tipis sehingga piston keluar terlalu jauh.',
      'Kebocoran cairan minyak rem (Mineral Oil / DOT fluid) di sambungan selang atau lever.',
    ],
    inspectionSteps: [
      'Pompa tuas rem berkali-kali: jika tuas terasa mengeras setelah dipompa, ada udara di dalam sistem.',
      'Periksa sambungan selang (olive & barb) pada lever dan kaliper dari rembesan oli.',
    ],
    quickFix:
      'Lakukan bleeding sistem rem hidrolik menggunakan funnel kit dan minyak rem yang sesuai spesifikasi (jangan mencampur Mineral Oil dengan DOT fluid!).',
    proShopRecommendedIf:
      'Memerlukan pemotongan selang internal routing atau penggantian master cylinder lever yang rusak.',
    standardTorqueNm: '5–7 Nm (Hose Connecting Bolt)',
  },
  {
    id: 'headset_play',
    title: 'Setang / Fork Terasa Oblak Saat Mengerem Depan',
    description:
      'Terdengar bunyi jedug atau getaran pada area leher sepeda (*headtube*) saat mengerem di jalan bergelombang.',
    category: 'cockpit_headset',
    categoryName: 'Headset & Cockpit',
    componentCode: 'headset',
    severity: 'high',
    probableCauses: [
      'Preload baut top cap headset kurang kencang sebelum baut stem dikunci.',
      'Spacer headset kurang tinggi (kurang 3 mm di atas ujung steerer tube fork).',
      'Bearing headset aus atau pecah.',
    ],
    inspectionSteps: [
      'Tarik tuas rem depan, letakkan jari di sambungan mangkok headset atas & bawah, lalu dorong sepeda maju-mundur.',
      'Jika terasa ada gerakan maju-mundur di antara fork steerer dan frame, headset dalam kondisi kendur.',
    ],
    quickFix:
      'Kendurkan 2 baut penjepit stem samping -> Kencangkan baut top cap atas secukupnya hingga oblak hilang tapi setang tetap berputar lancar -> Kencangkan kembali baut stem samping sesuai torsi 5 Nm.',
    proShopRecommendedIf:
      'Steerer tube fork aus/tergerus atau cup headset pada frame longgar.',
    standardTorqueNm: '2–3 Nm (Top Cap Preload), 5–6 Nm (Stem Pinch Bolts)',
  },
];

export function getDiagnosticSymptomById(id: string): DiagnosticSymptom | undefined {
  return DIAGNOSTIC_SYMPTOMS.find((s) => s.id === id);
}

export function getDiagnosticSymptomsByCategory(category: DiagnosticCategory): readonly DiagnosticSymptom[] {
  return DIAGNOSTIC_SYMPTOMS.filter((s) => s.category === category);
}

export function searchDiagnosticSymptoms(query: string): readonly DiagnosticSymptom[] {
  const q = query.trim().toLowerCase();
  if (!q) return DIAGNOSTIC_SYMPTOMS;
  return DIAGNOSTIC_SYMPTOMS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.probableCauses.some((c) => c.toLowerCase().includes(q)) ||
      s.categoryName.toLowerCase().includes(q),
  );
}
