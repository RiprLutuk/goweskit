import {
  type GenerateRideStoryRequest,
  type GenerateRideStoryResponse,
  type RideEffortRating,
} from '@goweskit/contracts';

export class RideFlexService {
  public generateStory(
    input: GenerateRideStoryRequest,
  ): GenerateRideStoryResponse {
    const {
      distanceKm,
      elevationGainMeters,
      durationMinutes,
      bikeName = 'Sepeda Kesayangan',
      routeName,
      weatherTempC,
    } = input;

    const hours = Math.max(durationMinutes / 60, 0.05);
    const avgSpeed = Number((distanceKm / hours).toFixed(1));

    // Effort calculation
    let effortRating: RideEffortRating = 'moderate';
    if (avgSpeed < 14 && elevationGainMeters < 50) {
      effortRating = 'recovery';
    } else if (distanceKm < 20 && elevationGainMeters < 150) {
      effortRating = 'easy';
    } else if (distanceKm >= 120 || elevationGainMeters >= 1800) {
      effortRating = 'legendary';
    } else if (distanceKm >= 75 || elevationGainMeters >= 900) {
      effortRating = 'epic';
    } else if (distanceKm >= 40 || elevationGainMeters >= 400 || avgSpeed >= 28) {
      effortRating = 'hard';
    }

    // Calorie estimation
    const intensityFactor =
      avgSpeed > 26 || elevationGainMeters > 400
        ? 11.5
        : avgSpeed > 20
          ? 9.0
          : 7.0;
    const estimatedCaloriesKcal = Math.round(
      durationMinutes * intensityFactor * (70 / 60),
    );

    // Food equivalency
    let foodEquivalency = '1 porsi Pisang Goreng Keju + Teh Manis Hangat 🍌☕';
    if (estimatedCaloriesKcal > 1100) {
      foodEquivalency =
        '1 porsi All-You-Can-Eat Sate Maranggi + Es Kelapa Muda Jumbo 🍢🥥';
    } else if (estimatedCaloriesKcal > 750) {
      foodEquivalency = '2 porsi Nasi Uduk Komplit Telur Balado & Bakwan 🍛';
    } else if (estimatedCaloriesKcal > 450) {
      foodEquivalency =
        '1 mangkok Bubur Ayam Spesial Komplit Telur Setengah Matang 🍲';
    } else if (estimatedCaloriesKcal > 280) {
      foodEquivalency = '1 porsi Pisang Goreng Keju & Es Kopi Susu Aren 🍌☕';
    }

    // Climb grade score
    let climbGradeScore = 'Flat Rolling (~1% avg)';
    if (elevationGainMeters >= 1200) {
      climbGradeScore = 'Hors Catégorie (HC Beast Climb) 🏔️🔥';
    } else if (elevationGainMeters >= 600) {
      climbGradeScore = 'Cat 2 Mountain Pass (~6-8%) ⛰️';
    } else if (elevationGainMeters >= 300) {
      climbGradeScore = 'Cat 3 Punchy Climb (~4-6%) 📈';
    } else if (elevationGainMeters >= 100) {
      climbGradeScore = 'Undulating Rolling Hills (~2-3%) 🌄';
    }

    // Title generation
    let title = routeName
      ? `${routeName} (${distanceKm}km)`
      : `Gowes Pagi Bersama ${bikeName}`;
    if (effortRating === 'legendary') {
      title = routeName
        ? `⚔️ ${routeName}: Ekspedisi ${distanceKm}km Legendaris!`
        : `⚔️ Ekspedisi Legendaris: ${distanceKm}km Penakluk Elevasi!`;
    } else if (effortRating === 'epic') {
      title = routeName
        ? `🔥 ${routeName}: +${elevationGainMeters}m Elevasi Tuntas!`
        : `🔥 Epic Century Mission: +${elevationGainMeters}m Elevasi Tuntas!`;
    } else if (effortRating === 'hard') {
      title = routeName
        ? `⚡ ${routeName}: ${avgSpeed} km/h Fast Pace!`
        : `⚡ Fast Tempo Run: ${avgSpeed} km/h Tanpa Ampun!`;
    } else if (effortRating === 'recovery') {
      title = routeName
        ? `☕ ${routeName}: Recovery Ride Santai`
        : `☕ Recovery Ride Santai: Putaran Tipis Menikmati Pagi`;
    } else {
      title = routeName
        ? `🚴 ${routeName}: ${distanceKm}km Rolling Pace`
        : `🚴 Morning Rolling Loop: ${distanceKm}km Solid Pace`;
    }

    // Highlight text
    const highlight =
      elevationGainMeters > 300
        ? `Berhasil melibas tanjakan +${elevationGainMeters}m dengan rata-rata kecepatan ${avgSpeed} km/h.`
        : `Menyelesaikan rute sejauh ${distanceKm} km dalam waktu ${durationMinutes} menit dengan ritme stabil.`;

    // Captions in 3 personas
    const athleteCaption = `🎯 ${distanceKm} km · +${elevationGainMeters}m Elevasi · Avg ${avgSpeed} km/h. Sesi latihan konsisten mempertahankan power output & cadence stabil bersama ${bikeName}. Fokus pada recovery dan nutrisi setelah membakar estimasi ~${estimatedCaloriesKcal} kcal.`;

    const humorCaption = `🚴 Gowes niatnya cuma cari sarapan tipis-tipis, tau-tau speedometer tembus ${distanceKm} km dengan tanjakan ${elevationGainMeters}m! Kaki auto bergetar pas pesen ${foodEquivalency}. Yang penting kopi dapet, konten dapet, flexing jalan! 😂☕`;

    const technicalCaption = `⚙️ Rute: ${routeName || 'City to Hills'} (${distanceKm} km). Setup drivetrain pada ${bikeName} bekerja mulus di gradien ${climbGradeScore}. Kecepatan rata-rata ${avgSpeed} km/h dengan efisiensi putaran crank optimal.${weatherTempC ? ` Suhu udara sekitar ${weatherTempC}°C.` : ''}`;

    // Mechanic advisory
    let mechanicTip =
      'Kondisi drivetrain prima. Berikan 1 tetes wet/dry lube pada setiap roller rantai.';
    if (elevationGainMeters > 500) {
      mechanicTip =
        'Tanjakan curam memberikan torsi tinggi pada cassette & bottom bracket. Periksa kekencangan baut crank dan keausan rantai dengan chain checker.';
    } else if (distanceKm > 80) {
      mechanicTip =
        'Gowes jarak jauh: bersihkan kotoran grit pada pulley derailleur dan periksa tekanan angin ban sebelum sesi berikutnya.';
    }

    const suggestedHashtags = [
      '#GowesKit',
      '#RideFlex',
      '#CyclingIndonesia',
      '#StravaKiller',
      '#GowesPagi',
      `#${bikeName.replaceAll(/\s+/g, '')}`,
    ];

    return {
      title,
      highlight,
      effortRating,
      estimatedCaloriesKcal,
      foodEquivalency,
      averageSpeedKmh: avgSpeed,
      climbGradeScore,
      captions: {
        athlete: athleteCaption,
        humor: humorCaption,
        technical: technicalCaption,
      },
      mechanicTip,
      suggestedHashtags,
      generatedAt: new Date().toISOString(),
    };
  }
}
