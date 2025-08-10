const express = require('express');

function createBlogRouter(dbPool) {
    const router = express.Router();

    // 블로그 글 목록
    router.get('/', async (req, res, next) => {
        try {
            const [posts] = await dbPool.query('SELECT * FROM blog ORDER BY id DESC');
            res.render('blog/list', { posts }); // views/blog/list.ejs 필요
        } catch (error) {
            next(error);
        }
    });

    // 새 글 작성 폼
    router.get('/write', (req, res) => {
        res.render('blog/write'); // views/blog/write.ejs 필요
    });

    // 새 글 작성 처리
    router.post('/write', async (req, res, next) => {
        try {
            const { title, content } = req.body;
            if (!title || !content) {
                // 간단한 유효성 검사: 제목과 내용이 모두 있어야 함
                // 실제 프로덕션에서는 더 정교한 유효성 검사가 필요합니다.
                return res.status(400).send('제목과 내용을 모두 입력해주세요. <a href="/blog/write">돌아가기</a>');
            }
            await dbPool.execute('INSERT INTO blog (title, content) VALUES (?, ?)', [title, content]);
            res.redirect('/blog');
        } catch (error) {
            next(error);
        }
    });

    // 글 상세 보기
    router.get('/:id', async (req, res, next) => {
        try {
            const [rows] = await dbPool.query('SELECT * FROM blog WHERE id = ?', [req.params.id]);
            if (rows.length > 0) {
                res.render('blog/view', { post: rows[0] }); // views/blog/view.ejs 필요
            } else {
                const error = new Error('게시물을 찾을 수 없습니다.');
                error.status = 404;
                next(error);
            }
        } catch (error) {
            next(error);
        }
    });

    return router;
}

module.exports = createBlogRouter;