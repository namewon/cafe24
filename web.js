//// 1. 모듈 로드
require('dotenv').config(); // .env 파일의 환경 변수를 로드합니다.
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const http = require('http');
const axios = require('axios');
const { Server } = require("socket.io");

// 2. Express 앱 설정
const app = express();
const server = http.createServer(app); // Express 앱으로 http 서버 생성
const io = new Server(server); // http 서버에 Socket.IO를 연결
const PORT = 8001;
const cheerio = require('cheerio'); // HTML 파싱을 위해 cheerio 추가

// 라우터 모듈 로드
const createGuestbookRouter = require('./routes/guestbook');
const createBlogRouter = require('./routes/blog');
const createTodosRouter = require('./routes/todos');
const createNewsRouter = require('./routes/news');

// EJS 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// POST 요청 본문(body)을 파싱하기 위한 미들웨어
app.use(express.urlencoded({ extended: true }));

// 3. DB 연결 풀(Pool) 생성
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 4. 라우트(경로) 설정

// 메인 페이지: 프로젝트 목록 보여주기
app.get('/', async (req, res, next) => { // next 파라미터 추가
    try {
        const [projects] = await dbPool.query('SELECT * FROM projects ORDER BY id');
        res.render('index', { projects: projects }); // views/index.ejs 렌더링
    } catch (error) {
        next(error); // 오류를 중앙 처리기로 전달
    }
});

// --- 방명록 라우트 ---
// dbPool을 주입하여 라우터를 생성하고 사용합니다.
app.use('/guestbook', createGuestbookRouter(dbPool));

// --- 블로그 라우트 ---
app.use('/blog', createBlogRouter(dbPool));

// --- 채팅 라우트 ---
app.get('/chat', (req, res) => {
    res.render('chat'); // views/chat.ejs 렌더링
});

// --- 투두리스트 라우트 ---
app.use('/todos', createTodosRouter(dbPool));

// --- 뉴스 검색 라우트 ---
app.use('/news', createNewsRouter(dbPool));

// 5. Socket.IO 연결 처리
io.on('connection', (socket) => {
    console.log('✅ 유저가 채팅에 접속했습니다.');

    // 'chat message' 이벤트를 받으면, 접속한 모든 클라이언트에게 메시지를 보냅니다.
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('🔌 유저의 접속이 끊어졌습니다.');
    });
});

// 5-1. 중앙 오류 처리 미들웨어 (모든 라우트 뒤에 위치해야 합니다)
app.use((err, req, res, next) => {
    console.error(err.stack); // 오류 스택을 콘솔에 출력

    // 오류 객체에 status 코드가 있으면 사용하고, 없으면 500(서버 오류)으로 처리
    const status = err.status || 500;
    const message = status === 500 ? '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' : err.message;
    
    res.status(status).render('error', { message: message, error: {} });
});

// 6. 서버 실행 (app.listen -> server.listen)
server.listen(PORT, async () => {
    try {
        // 서버 시작 시 DB 연결 테스트
        const connection = await dbPool.getConnection();
        console.log('✅ 데이터베이스에 성공적으로 연결되었습니다.');
        connection.release();
        console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    } catch (error) {
        console.error('❌ 데이터베이스 연결에 실패했습니다:', error);
    }
});