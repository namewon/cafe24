const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

// dbPool은 이 라우터에서 사용되지 않지만, 다른 라우터와의 일관성을 위해 매개변수를 유지합니다.
function createNewsRouter(_dbPool) {
    const router = express.Router();

    // .env 파일에서 네이버 API 인증 정보 가져오기
    const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

    // 뉴스 기사 URL에서 썸네일 이미지를 가져오는 도우미 함수
    const getThumbnail = async (url) => {
        // 유효한 URL이 아니면 즉시 null 반환
        if (!url || !url.startsWith('http')) {
            return null;
        }
        try {
            // 썸네일 요청에 3초 타임아웃 설정 및 헤더 강화
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
                },
                timeout: 3000 // 3초
            });
            const $ = cheerio.load(response.data);
            
            // Open Graph(og:image) 태그를 우선적으로 찾습니다. 가장 표준적인 방법입니다.
            const ogImage = $('meta[property="og:image"]').attr('content');
            if (ogImage) return ogImage;

            // 없다면 본문의 첫 번째 이미지를 찾습니다.
            const firstImage = $('#articleBodyContents img, .article_body img, #article_body img, #newsct_article img, article img').first().attr('src');
            return firstImage || null;
        } catch (error) {
            // 타임아웃, 403, 404, 파싱 오류 등 모든 에러를 여기서 처리합니다.
            // 썸네일 하나를 가져오지 못하더라도 전체 검색이 중단되지 않도록 null을 반환합니다.
            console.error(`[Thumbnail Error] URL: ${url} - ${error.message}`);
            return null;
        }
    };

    // 뉴스 검색 페이지 (초기 화면)
    router.get('/', (req, res) => {
        res.render('news', { articles: [], query: '' });
    });

    // 뉴스 검색 결과 처리
    router.get('/search', async (req, res, next) => {
        const { query } = req.query;
        if (!query) {
            return res.redirect('/news');
        }

        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            return next(new Error('.env 파일에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정해주세요.'));
        }

        const api_url = 'https://openapi.naver.com/v1/search/news.json';

        try {
            // 1. 네이버 API를 통해 뉴스 목록을 가져옵니다.
            const response = await axios.get(api_url, {
                params: { query, display: 10, sort: 'sim' },
                headers: {
                    'X-Naver-Client-Id': NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
                }
            });

            let articles = response.data.items || [];
            
            // 2. 각 기사의 썸네일을 병렬로 가져옵니다.
            //    - API 결과의 originallink (원본 기사 주소)를 사용합니다.
            //    - Promise.allSettled를 사용해 일부 썸네일 요청이 실패해도 전체가 중단되지 않도록 합니다.
            const thumbnailPromises = articles.map(article => getThumbnail(article.originallink));
            const thumbnailResults = await Promise.allSettled(thumbnailPromises);

            articles.forEach((article, index) => {
                const result = thumbnailResults[index];
                if (result.status === 'fulfilled') {
                    article.thumbnail = result.value;
                } else {
                    // Promise가 reject된 경우 (getThumbnail 내부에서 catch되지 않은 예외)
                    article.thumbnail = null;
                }
            });
            
            res.render('news', { articles, query });
        } catch (error) {
            if (error.response) { // API에서 직접 오류를 보낸 경우
                console.error('Naver API Error:', error.response.data);
                const apiError = error.response.data;
                // 네이버 API 에러 메시지(errorMessage)와 에러 코드(errorCode)를 함께 보여줍니다.
                return next(new Error(`네이버 API 오류: ${apiError.errorMessage} (코드: ${apiError.errorCode})`));
            }
            console.error(error);
            next(new Error('뉴스 정보를 가져오는 중 알 수 없는 오류가 발생했습니다.'));
        }
    });

    return router;
}

module.exports = createNewsRouter;
