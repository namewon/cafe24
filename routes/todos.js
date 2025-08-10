const express = require('express');

function createTodosRouter(dbPool) {
    const router = express.Router();

    // 투두리스트 목록 보기
    router.get('/', async (req, res, next) => {
        try {
            const [todos] = await dbPool.query('SELECT * FROM todos ORDER BY id DESC');
            res.render('todos', { todos }); // views/todos.ejs 필요
        } catch (error) {
            next(error);
        }
    });

    // 투두 추가
    router.post('/add', async (req, res, next) => {
        try {
            const { task } = req.body;
            if (task) {
                await dbPool.execute('INSERT INTO todos (task, completed) VALUES (?, ?)', [task, false]);
            }
            res.redirect('/todos');
        } catch (error) {
            next(error);
        }
    });

    // 투두 완료/미완료 처리 (토글)
    router.post('/toggle/:id', async (req, res, next) => {
        try {
            const { id } = req.params;
            await dbPool.execute('UPDATE todos SET completed = NOT completed WHERE id = ?', [id]);
            res.redirect('/todos');
        } catch (error) {
            next(error);
        }
    });

    // 투두 삭제
    router.post('/delete/:id', async (req, res, next) => {
        try {
            await dbPool.execute('DELETE FROM todos WHERE id = ?', [req.params.id]);
            res.redirect('/todos');
        } catch (error) {
            next(error);
        }
    });

    return router;
}

module.exports = createTodosRouter;