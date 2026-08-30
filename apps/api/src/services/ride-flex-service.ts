import {
  type GenerateRideStoryRequest,
  type GenerateRideStoryResponse,
  type RideEffortRating,
} from '@goweskit/contracts';

export interface RideFlexServiceOptions {
  geminiApiKey?: string | null;
  openaiApiKey?: string | null;
  fetchFn?: typeof fetch;
}

interface LlmStoryOutput {
  title?: string;
  highlight?: string;
  captions?: {
    athlete?: string;
    humor?: string;
    technical?: string;
  };
}

export class RideFlexService {
  private readonly geminiApiKey: string | null;
  private readonly openaiApiKey: string | null;
  private readonly fetchFn: typeof fetch;

  public constructor(options: RideFlexServiceOptions = {}) {
    this.geminiApiKey = options.geminiApiKey ?? null;
    this.openaiApiKey = options.openaiApiKey ?? null;
    this.fetchFn = options.fetchFn ?? globalThis.fetch;
  }

  public async generateStory(
    input: GenerateRideStoryRequest,
  ): Promise<GenerateRideStoryResponse> {
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

    // 1. Deterministic Effort calculation
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

    // 2. Deterministic Calorie estimation
    const intensityFactor =
      avgSpeed > 26 || elevationGainMeters > 400
        ? 11.5
        : avgSpeed > 20
          ? 9.0
          : 7.0;
    const estimatedCaloriesKcal = Math.round(
      durationMinutes * intensityFactor * (70 / 60),
    );

    // 3. Indonesian Cycling Culinary Equivalency
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

    // 4. Climb grade score
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

    // 5. Mechanic safety advisory
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

    // 6. Default Deterministic Story & Captions
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

    const highlight =
      elevationGainMeters > 300
        ? `Berhasil melibas tanjakan +${elevationGainMeters}m dengan rata-rata kecepatan ${avgSpeed} km/h.`
        : `Menyelesaikan rute sejauh ${distanceKm} km dalam waktu ${durationMinutes} menit dengan ritme stabil.`;

    const athleteCaption = `🎯 ${distanceKm} km · +${elevationGainMeters}m Elevasi · Avg ${avgSpeed} km/h. Sesi latihan konsisten mempertahankan power output & cadence stabil bersama ${bikeName}. Fokus pada recovery dan nutrisi setelah membakar estimasi ~${estimatedCaloriesKcal} kcal.`;

    const humorCaption = `🚴 Gowes niatnya cuma cari sarapan tipis-tipis, tau-tau speedometer tembus ${distanceKm} km dengan tanjakan ${elevationGainMeters}m! Kaki auto bergetar pas pesen ${foodEquivalency}. Yang penting kopi dapet, konten dapet, flexing jalan! 😂☕`;

    const technicalCaption = `⚙️ Rute: ${routeName || 'City to Hills'} (${distanceKm} km). Setup drivetrain pada ${bikeName} bekerja mulus di gradien ${climbGradeScore}. Kecepatan rata-rata ${avgSpeed} km/h dengan efisiensi putaran crank optimal.${weatherTempC ? ` Suhu udara sekitar ${weatherTempC}°C.` : ''}`;

    let finalTitle = title;
    let finalHighlight = highlight;
    let finalAthlete = athleteCaption;
    let finalHumor = humorCaption;
    let finalTechnical = technicalCaption;

    // 7. Optional LLM Enhancement (Google Gemini / OpenAI)
    if (this.geminiApiKey) {
      const llmResult = await this.tryGenerateGemini({
        distanceKm,
        elevationGainMeters,
        durationMinutes,
        avgSpeed,
        bikeName,
        routeName,
        effortRating,
        foodEquivalency,
        climbGradeScore,
      });

      if (llmResult?.title) finalTitle = llmResult.title;
      if (llmResult?.highlight) finalHighlight = llmResult.highlight;
      if (llmResult?.captions?.athlete) finalAthlete = llmResult.captions.athlete;
      if (llmResult?.captions?.humor) finalHumor = llmResult.captions.humor;
      if (llmResult?.captions?.technical) finalTechnical = llmResult.captions.technical;
    }

    return {
      title: finalTitle,
      highlight: finalHighlight,
      effortRating,
      estimatedCaloriesKcal,
      foodEquivalency,
      averageSpeedKmh: avgSpeed,
      climbGradeScore,
      captions: {
        athlete: finalAthlete,
        humor: finalHumor,
        technical: finalTechnical,
      },
      mechanicTip,
      suggestedHashtags,
      generatedAt: new Date().toISOString(),
    };
  }

  private async tryGenerateGemini(params: {
    distanceKm: number;
    elevationGainMeters: number;
    durationMinutes: number;
    avgSpeed: number;
    bikeName: string;
    routeName?: string;
    effortRating: string;
    foodEquivalency: string;
    climbGradeScore: string;
  }): Promise<LlmStoryOutput | null> {
    try {
      const prompt = `Anda adalah Agentic AI Ride Coach & Storyteller GowesKit (platform sepeda Indonesia).
Buat caption sosial media & flexing ride sinematik dalam bahasa Indonesia yang seru dan natural berdasarkan data:
- Jarak: ${params.distanceKm} km
- Elevasi: +${params.elevationGainMeters} m (${params.climbGradeScore})
- Durasi: ${params.durationMinutes} menit (Avg ${params.avgSpeed} km/h)
- Sepeda: ${params.bikeName}
- Rute: ${params.routeName || 'Rute Eksplorasi'}
- Tingkat Beban: ${params.effortRating}
- Makanan Setara: ${params.foodEquivalency}

Kembalikan format JSON persis seperti ini:
{
  "title": "Judul gowes catchy dengan emoji",
  "highlight": "Ringkasan performa 1-2 kalimat",
  "captions": {
    "athlete": "Caption gaya atlet fokus endurance & pace (pakai hashtag)",
    "humor": "Caption humor/santai khas goweser Indonesia (soal sarapan/ngopi/nanjak)",
    "technical": "Caption gearhead breakdown teknis performa sepeda"
  }
}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;
      const response = await this.fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(3500),
      });

      if (!response.ok) return null;
      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;

      const parsed = JSON.parse(text) as LlmStoryOutput;
      return parsed;
    } catch {
      return null;
    }
  }
}
