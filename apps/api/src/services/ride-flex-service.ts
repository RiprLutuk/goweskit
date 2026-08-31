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
    gravel?: string;
  };
  photoVisualInsight?: string;
  recommendedTheme?: 'alpine' | 'gravel' | 'sunset' | 'crit' | 'cafe' | 'topo';
  trainingInsight?: string;
  mechanicTip?: string;
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
      cyclistPersona,
      heartRateBpm,
      cadenceRpm,
      powerWatts,
      photoBase64,
      photoMimeType,
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
    } else if (
      distanceKm >= 40 ||
      elevationGainMeters >= 400 ||
      avgSpeed >= 28
    ) {
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
      '#GowesPagi',
      `#${bikeName.replaceAll(/\s+/g, '')}`,
    ];

    // 6. Default Deterministic Story & Captions
    let title: string;
    if (effortRating === 'legendary') {
      title = routeName
        ? `⚔️ ${routeName}: Ekspedisi ${String(distanceKm)}km Legendaris!`
        : `⚔️ Ekspedisi Legendaris: ${String(distanceKm)}km Penakluk Elevasi!`;
    } else if (effortRating === 'epic') {
      title = routeName
        ? `🔥 ${routeName}: +${String(elevationGainMeters)}m Elevasi Tuntas!`
        : `🔥 Epic Century Mission: +${String(elevationGainMeters)}m Elevasi Tuntas!`;
    } else if (effortRating === 'hard') {
      title = routeName
        ? `⚡ ${routeName}: ${String(avgSpeed)} km/h Fast Pace!`
        : `⚡ Fast Tempo Run: ${String(avgSpeed)} km/h Tanpa Ampun!`;
    } else if (effortRating === 'recovery') {
      title = routeName
        ? `☕ ${routeName}: Recovery Ride Santai`
        : `☕ Recovery Ride Santai: Putaran Tipis Menikmati Pagi`;
    } else {
      title = routeName
        ? `🚴 ${routeName}: ${String(distanceKm)}km Rolling Pace`
        : `🚴 Morning Rolling Loop: ${String(distanceKm)}km Solid Pace`;
    }

    const highlight =
      elevationGainMeters > 300
        ? `Berhasil melibas tanjakan +${String(elevationGainMeters)}m dengan rata-rata kecepatan ${String(avgSpeed)} km/h.`
        : `Menyelesaikan rute sejauh ${String(distanceKm)} km dalam waktu ${String(durationMinutes)} menit dengan ritme stabil.`;

    const athleteCaption = `🎯 ${String(distanceKm)} km · +${String(elevationGainMeters)}m Elevasi · Avg ${String(avgSpeed)} km/h${powerWatts ? ` · ${String(powerWatts)}W Avg Power` : ''}. Sesi latihan konsisten mempertahankan power output & cadence stabil bersama ${bikeName}. Fokus pada recovery dan nutrisi setelah membakar estimasi ~${String(estimatedCaloriesKcal)} kcal.`;

    const humorCaption = `🚴 Gowes niatnya cuma cari sarapan tipis-tipis, tau-tau speedometer tembus ${String(distanceKm)} km dengan tanjakan ${String(elevationGainMeters)}m! Kaki auto bergetar pas pesen ${foodEquivalency}. Yang penting kopi dapet, konten dapet, flexing jalan! 😂☕`;

    const routeLabel =
      routeName === undefined || routeName.length === 0
        ? 'City to Hills'
        : routeName;
    const technicalCaption = `⚙️ Rute: ${routeLabel} (${String(distanceKm)} km). Setup drivetrain pada ${bikeName} bekerja mulus di gradien ${climbGradeScore}. Kecepatan rata-rata ${String(avgSpeed)} km/h dengan efisiensi putaran crank optimal.${weatherTempC ? ` Suhu udara sekitar ${String(weatherTempC)}°C.` : ''}`;

    let finalTitle = title;
    let finalHighlight = highlight;
    let finalAthlete = athleteCaption;
    let finalHumor = humorCaption;
    let finalTechnical = technicalCaption;
    let finalGravel: string | undefined = undefined;
    let finalPhotoVisualInsight: string | undefined = undefined;
    let finalRecommendedTheme:
      'alpine' | 'gravel' | 'sunset' | 'crit' | 'cafe' | 'topo' | undefined =
      undefined;
    let finalTrainingInsight: string | undefined = undefined;

    // 7. Generative LLM Enhancement (Google Gemini Multimodal / Vision)
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
        cyclistPersona,
        heartRateBpm,
        cadenceRpm,
        powerWatts,
        photoBase64,
        photoMimeType,
      });

      if (llmResult?.title) finalTitle = llmResult.title;
      if (llmResult?.highlight) finalHighlight = llmResult.highlight;
      if (llmResult?.captions?.athlete)
        finalAthlete = llmResult.captions.athlete;
      if (llmResult?.captions?.humor) finalHumor = llmResult.captions.humor;
      if (llmResult?.captions?.technical)
        finalTechnical = llmResult.captions.technical;
      if (llmResult?.captions?.gravel) finalGravel = llmResult.captions.gravel;
      if (llmResult?.photoVisualInsight)
        finalPhotoVisualInsight = llmResult.photoVisualInsight;
      if (llmResult?.recommendedTheme)
        finalRecommendedTheme = llmResult.recommendedTheme;
      if (llmResult?.trainingInsight)
        finalTrainingInsight = llmResult.trainingInsight;
      if (llmResult?.mechanicTip) mechanicTip = llmResult.mechanicTip;
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
        ...(finalGravel ? { gravel: finalGravel } : {}),
      },
      photoVisualInsight: finalPhotoVisualInsight,
      recommendedTheme: finalRecommendedTheme,
      trainingInsight: finalTrainingInsight,
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
    routeName: string | undefined;
    effortRating: string;
    foodEquivalency: string;
    climbGradeScore: string;
    cyclistPersona: string;
    heartRateBpm?: number | undefined;
    cadenceRpm?: number | undefined;
    powerWatts?: number | undefined;
    photoBase64?: string | undefined;
    photoMimeType?: string | undefined;
  }): Promise<LlmStoryOutput | null> {
    const geminiApiKey = this.geminiApiKey;
    if (geminiApiKey === null) return null;

    try {
      const promptRouteName =
        params.routeName === undefined || params.routeName.length === 0
          ? 'Rute Eksplorasi'
          : params.routeName;

      const telemetryStr = [
        params.heartRateBpm
          ? `Heart Rate: ${String(params.heartRateBpm)} BPM`
          : null,
        params.cadenceRpm ? `Cadence: ${String(params.cadenceRpm)} RPM` : null,
        params.powerWatts ? `Power: ${String(params.powerWatts)} Watts` : null,
      ]
        .filter(Boolean)
        .join(', ');

      const prompt = `Anda adalah Agentic AI Ride Coach & Storyteller GowesKit (platform cycling pintar Indonesia).
Analisis sesi gowes ini dan buat caption sosial media sinematik dalam bahasa Indonesia yang seru, otentik, dan natural:
- Jarak: ${String(params.distanceKm)} km
- Elevasi: +${String(params.elevationGainMeters)} m (${params.climbGradeScore})
- Durasi: ${String(params.durationMinutes)} menit (Avg ${String(params.avgSpeed)} km/h)
- Sepeda: ${params.bikeName}
- Rute: ${promptRouteName}
- Tingkat Beban: ${params.effortRating}
- Makanan Setara: ${params.foodEquivalency}
- Persona Pilihan: ${params.cyclistPersona}
${telemetryStr ? `- Telemetri Sensor: ${telemetryStr}` : ''}
${params.photoBase64 ? '- Foto Sesi: (Lihat gambar terlampir untuk mendeskripsikan suasana tempat/pemandangan)' : ''}

Kembalikan format JSON persis seperti ini:
{
  "title": "Judul gowes catchy dengan emoji",
  "highlight": "Ringkasan performa 1-2 kalimat",
  "captions": {
    "athlete": "Caption gaya atlet fokus endurance & power output",
    "humor": "Caption humor/santai khas goweser Indonesia (soal sarapan/ngopi/nanjak)",
    "technical": "Caption gearhead breakdown teknis performa sepeda & komponen",
    "gravel": "Caption petualangan eksplorasi alam & gravel ride"
  },
  "photoVisualInsight": "Pengamatan visual singkat dari foto (jika ada) atau suasana rute",
  "recommendedTheme": "alpine" | "gravel" | "sunset" | "crit" | "cafe" | "topo",
  "trainingInsight": "Insight fisiologis singkat mengenai intensitas, hidrasi, dan recovery time",
  "mechanicTip": "Tips perawatan preventif mekanik sepeda berdasarkan rute & elevasi"
}`;

      const contentsParts: {
        text?: string;
        inline_data?: { mime_type: string; data: string };
      }[] = [];

      // If photo base64 provided, add vision inline_data part
      if (params.photoBase64) {
        const cleanBase64 = params.photoBase64.replace(
          /^data:image\/[a-z]+;base64,/,
          '',
        );
        contentsParts.push({
          inline_data: {
            mime_type: params.photoMimeType ?? 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      contentsParts.push({ text: prompt });

      // Try gemini-1.5-flash
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      const response = await this.fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: contentsParts }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(7500),
      });

      if (!response.ok) return null;
      const data = (await response.json()) as {
        candidates?: {
          content?: { parts?: { text?: string }[] };
        }[];
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
