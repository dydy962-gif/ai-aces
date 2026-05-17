/**
 * Vercel Serverless Function: SAM3 / YOLO 호출 (Netlify 버전 포팅)
 * 
 * 변경 (2026-05-17): Netlify → Vercel 이전
 * - exports.handler → export default
 * - event/context → req/res
 * - statusCode → res.status()
 * - body 문자열 → JSON.parse 자동 (Vercel은 자동 파싱)
 * 
 * 호출:
 *   POST /api/sam-yolo
 *   Body: { mode: "sam3" | "yolo" | "poll", image, prompt, predictionId }
 * 
 * 응답:
 *   - 시작: { success: true, predictionId, getUrl }
 *   - 폴링: { success: true, status, output }
 * 
 * 환경변수: REPLICATE_API_TOKEN
 */

const REPLICATE_MODELS = {
  sam3: {
    version: '753fe4dbdd890a55e176f19b0603ae1b43c9e7fbd916070df53ffdb2451c7a57',
    owner: 'yodagg/sam3-image-seg'
  },
  yolo: {
    version: 'fd1305d3fc19e81540542f51c2530cf8f393e28cc6ff4976337c3e2b75c7c292',
    owner: 'franz-biz/yolo-world-xl'
  }
};

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return res.status(500).json({ 
      error: 'REPLICATE_API_TOKEN 환경변수 없음' 
    });
  }

  try {
    // Vercel은 req.body가 자동으로 파싱됨 (Netlify와 다름)
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { mode, image, prompt, points, point_labels, class_names, predictionId } = body;

    // === 폴링 모드: prediction ID로 상태 조회 ===
    if (mode === 'poll') {
      if (!predictionId) {
        return res.status(400).json({ error: 'predictionId 필요' });
      }
      
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      
      if (!pollRes.ok) {
        const errText = await pollRes.text();
        return res.status(pollRes.status).json({ 
          error: `폴링 실패 (${pollRes.status})`, 
          detail: errText 
        });
      }
      
      const result = await pollRes.json();
      return res.status(200).json({
        success: true,
        status: result.status,
        output: result.output,
        error: result.error,
        logs: result.logs,  // 디버깅용 — Replicate 로그 그대로 전달
        predict_time: result.metrics?.predict_time
      });
    }

    // === 시작 모드: SAM3 또는 YOLO 호출 ===
    if (!image) {
      return res.status(400).json({ error: 'image 필수' });
    }

    let modelInfo, input;

    if (mode === 'sam3' || !mode) {
      modelInfo = REPLICATE_MODELS.sam3;
      // SAM3 입력 — visualize_output은 true 필수 (모델이 출력에 강제)
      input = {
        image: image,
        prompt: prompt || 'apple',
        max_masks: 50,
        return_polygons: true,
        multimask_output: false,
        visualize_output: true  // ⚠️ false면 "validation error for Output visualization" 에러 발생
      };
      console.log('[sam-yolo] SAM3 input:', JSON.stringify({...input, image: '...(생략)'}));
    } else if (mode === 'yolo') {
      modelInfo = REPLICATE_MODELS.yolo;
      input = {
        input_media: image,
        class_names: class_names || 'apple, red apple, fuji apple',
        score_thr: 0.15,
        nms_thr: 0.5,
        max_num_boxes: 50,
        return_json: true
      };
    } else {
      return res.status(400).json({ error: 'mode는 sam3, yolo, poll 중 하나' });
    }

    // Replicate prediction 시작 — 결과 안 기다림
    const startRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ version: modelInfo.version, input: input })
    });

    if (!startRes.ok) {
      const errorText = await startRes.text();
      console.error('[Replicate Start] 오류:', errorText);
      return res.status(startRes.status).json({ 
        error: `Replicate API 시작 실패 (${startRes.status})`,
        detail: errorText
      });
    }

    const prediction = await startRes.json();
    
    // 즉시 ID만 반환 (폴링 없음 → 타임아웃 회피)
    return res.status(200).json({
      success: true,
      predictionId: prediction.id,
      status: prediction.status,
      mode: mode || 'sam3'
    });

  } catch (error) {
    console.error('[sam-yolo] 오류:', error);
    return res.status(500).json({ error: error.message || '알 수 없는 오류' });
  }
}
