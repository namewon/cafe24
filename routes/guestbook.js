const express = require('express');

function createGuestbookRouter(dbPool) {
    const router = express.Router();

    // 방명록 목록 보기 (GET /guestbook)
    router.get('/', async (req, res, next) => {
        try {
            // 'guestbook' 테이블이 데이터베이스에 존재해야 합니다.
            const [entries] = await dbPool.query('SELECT * FROM guestbook ORDER BY id DESC');
            // 'views/guestbook.ejs' 뷰 파일이 있어야 합니다.
            res.render('guestbook', { entries });
        } catch (error) {
            next(error);
        }
    });

    // 방명록 글쓰기 (POST /guestbook)
    router.post('/', async (req, res, next) => {
        try {
            const { name, message } = req.body;
            await dbPool.execute('INSERT INTO guestbook (name, message) VALUES (?, ?)', [name, message]);
            res.redirect('/guestbook');
        } catch (error) {
            next(error);
        }
    });

    return router;
}

module.exports = createGuestbookRouter;