-- `projects` 테이블 생성
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  technologies VARCHAR(255),
  projectUrl VARCHAR(255)
);

-- 나중에 웹에 표시할 예시 데이터 삽입
INSERT INTO projects (title, description, technologies, projectUrl) VALUES
('개인 블로그', 'Node.js와 Express를 사용하여 만든 간단한 블로그입니다.', 'Node.js, Express, EJS, MySQL', '/blog'),
('디지털 방명록', '방문자가 메시지를 남길 수 있는 방명록입니다.', 'Node.js, Express, MySQL', '/guestbook'),
('투두리스트 앱', '할 일을 관리할 수 있는 간단한 웹 애플리케이션입니다.', 'Node.js, Express, React, MySQL', '/todos');

-- 방명록(guestbook) 글을 저장할 테이블 생성
CREATE TABLE guestbook_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (선택) 테스트용 데이터 삽입
INSERT INTO guestbook_entries (name, message) VALUES ('첫 방문자', '방명록이 잘 만들어졌네요!');

-- 투두리스트(todos) 항목을 저장할 테이블 생성
CREATE TABLE todos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task VARCHAR(255) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (선택) 테스트용 데이터 삽입
INSERT INTO todos (task, is_completed) VALUES ('방명록 기능 완성하기', TRUE), ('투두리스트 만들기', FALSE);

-- 블로그 게시글(posts)을 저장할 테이블 생성
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (선택) 테스트용 블로그 글 삽입
INSERT INTO posts (title, content) VALUES
('나의 첫 번째 블로그 글', '이것은 Node.js와 Express로 만든 나의 첫 번째 블로그 게시물입니다. \n\n마크다운을 지원하면 더 좋겠죠?'),
('두 번째 이야기', '블로그를 만드는 것은 정말 재미있습니다. 다음에는 어떤 기능을 추가해볼까요?');
