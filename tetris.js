const canvas = document.getElementById('tetrisCanvas'); // 게임 보드를 위한 캔버스 요소
const ctx = canvas.getContext('2d'); // 2D 컨텍스트 가져오기

const nextCanvas = document.getElementById('nextBlockCanvas'); // 다음 블록 표시를 위한 캔버스 요소
const nextCtx = nextCanvas.getContext('2d'); // 2D 컨텍스트 가져오기

const rows = 20; // 세로 블록 수
const columns = 10; // 가로 블록 수
const blockSize = 30; // 각 블록의 크기 (픽셀)

let score = 0; // 점수 초기화
let startTime = null; // 게임 시작 시간
let timerInterval; // 타이머 인터벌 변수

function createBoard(rows, columns) { // 게임 보드 생성
    const board = [];
    for (let row = 0; row < rows; row++) {
        board.push(new Array(columns).fill(0));
    }
    return board;
}

const gameBoard = createBoard(rows, columns); // 게임 보드 생성

// 블록 정의
const blocks = [
    { shape: [[1, 1, 1], [0, 1, 0]], color: 'cyan' }, // T 블록
    { shape: [[1, 1], [1, 1]], color: 'yellow' }, // O 블록
    { shape: [[1, 1, 1, 1]], color: 'blue' }, // I 블록
    { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' }, // S 블록
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' }, // Z 블록
    { shape: [[1, 0, 0], [1, 1, 1]], color: 'orange' }, // 새로운 모양 1
    { shape: [[1]], color: 'purple' }, // 새로운 모양 2
    { shape: [[1, 1], [1, 0], [1, 1]], color: 'pink' } // 새로운 모양 3
];

let currentBlock; // 현재 블록
let currentX = 4; // 현재 블록의 X 위치
let currentY = 0; // 현재 블록의 Y 위치

let nextBlock; // 다음 블록

const backgroundMusic = document.getElementById('backgroundMusic');  // 음악 요소 참조

function updateTimer() { // 타이머 업데이트 함수
    const currentTime = new Date();
    const elapsedTime = currentTime - startTime;
    const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsedTime % (1000 * 60)) / 1000);
    document.getElementById('timer').innerText = `Time: ${hours}H ${minutes}M ${seconds}S`;
}

function drawBoard() { // 게임 보드 그리기 함수
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            if (gameBoard[row][col] !== 0) {
                ctx.fillStyle = gameBoard[row][col];
                ctx.fillRect(col * blockSize, row * blockSize, blockSize, blockSize);
                ctx.strokeRect(col * blockSize, row * blockSize, blockSize, blockSize);
            } else {
                ctx.strokeStyle = 'gray';
                ctx.strokeRect(col * blockSize, row * blockSize, blockSize, blockSize);
            }
        }
    }
    document.getElementById('score').innerText = `Score: ${score}`;
}

function drawBlock(shape, color, x, y) { // 블록 그리기 함수
    ctx.fillStyle = color;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                ctx.fillRect((x + col) * blockSize, (y + row) * blockSize, blockSize, blockSize);
                ctx.strokeRect((x + col) * blockSize, (y + row) * blockSize, blockSize, blockSize);
            }
        }
    }
}

function lockBlock() { // 현재 블록을 보드에 고정
    for (let row = 0; row < currentBlock.shape.length; row++) {
        for (let col = 0; col < currentBlock.shape[row].length; col++) {
            if (currentBlock.shape[row][col] !== 0) { // 블록의 셀이 채워져 있으면
                gameBoard[currentY + row][currentX + col] = currentBlock.color; // 블록을 보드에 고정
            }
        }
    }
    clearFullRows(); // 가득 찬 줄 제거
}

function clearFullRows() { // 가득 찬 줄을 제거하는 함수
    let rowsCleared = 0; // 제거된 줄 수
    for (let row = 0; row < rows; row++) {
        if (gameBoard[row].every(cell => cell !== 0)) { // 모든 셀이 블록으로 채워졌다면
            gameBoard.splice(row, 1); // 해당 줄 제거
            gameBoard.unshift(new Array(columns).fill(0)); // 맨 위에 새로운 빈 줄 추가
            rowsCleared++; // 제거된 줄 수 증가
        }
    }
    score += rowsCleared * 100; // 점수 계산
    document.getElementById('score').innerText = `Score: ${score}`; // 점수 표시 업데이트
}

function drawNextBlock() { // 다음 블록 그리기 함수
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height); // 이전 내용 지우기
    const shape = nextBlock.shape;
    const offsetX = Math.floor((nextCanvas.width / blockSize - shape[0].length) / 2); // 중앙 배치 X 오프셋
    const offsetY = Math.floor((nextCanvas.height / blockSize - shape.length) / 2); // 중앙 배치 Y 오프셋
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) { // 셀이 채워진 경우
                nextCtx.fillStyle = nextBlock.color; // 색상 설정
                nextCtx.fillRect((col + offsetX) * blockSize, (row + offsetY) * blockSize, blockSize, blockSize); // 블록 그리기
                nextCtx.strokeRect((col + offsetX) * blockSize, (row + offsetY) * blockSize, blockSize, blockSize); // 블록 테두리 그리기
            }
        }
    }
}

function setNextBlock() { // 다음 블록 설정 함수
    nextBlock = blocks[Math.floor(Math.random() * blocks.length)]; // 랜덤으로 다음 블록 설정
    drawNextBlock(); // 다음 블록 그리기
}

function spawnAndDrawNewBlock() { // 새로운 블록 생성 및 그리기 함수
    if (nextBlock) { // 이미 다음 블록이 설정된 경우
        currentBlock = nextBlock; // 다음 블록을 현재 블록으로 가져오기
        currentX = 4; // X 위치 초기화
        currentY = 0; // Y 위치 초기화
        setNextBlock(); // 새로운 다음 블록 설정
    } else {
        setNextBlock(); // 초기 실행 시 다음 블록 설정
        spawnAndDrawNewBlock();
    }
    if (!canMove(currentX, currentY)) { // 블록을 배치할 공간이 부족한 경우
        alert('Game Over'); // 게임 오버 알림
        clearInterval(timerInterval); // 타이머 중지
        return;
    }
    draw(); // 화면 그리기
    backgroundMusic.play();  // 게임 시작 시 음악 재생
}

function moveBlock(event) { // 키보드 입력 처리
    if (!startTime) {
        startTime = new Date(); // 최초 아래 방향키를 누르면 시작 시간 설정
        timerInterval = setInterval(updateTimer, 1000); // 1초마다 타이머 업데이트
    }
    if (event.key === 'ArrowLeft') {
        if (canMove(currentX - 1, currentY)) {
            currentX -= 1; // 왼쪽으로 이동
        }
    } else if (event.key === 'ArrowRight') {
        if (canMove(currentX + 1, currentY)) {
            currentX += 1; // 오른쪽으로 이동
        }
    } else if (event.key === 'ArrowDown') {
        if (canMove(currentX, currentY + 1)) {
            currentY += 1; // 아래로 이동
        } else {
            lockBlock(); // 블록 고정
            spawnAndDrawNewBlock(); // 새로운 블록 생성
        }
    } else if (event.key === 'ArrowUp') {
        rotateBlock(); // 위 방향키 입력 시 블록 회전
    }
    draw(); // 화면 갱신
}

function rotateBlock() { // 블록 회전 함수
    const newShape = currentBlock.shape[0].map((_, index) =>
        currentBlock.shape.map(row => row[index]).reverse()
    ); // 블록을 시계방향으로 회전

    if (canMove(currentX, currentY, newShape)) { // 회전 후 블록을 이동할 수 있는지 확인
        currentBlock.shape = newShape; // 회전한 모양으로 업데이트
    }
}

function canMove(newX, newY, shape = currentBlock.shape) { // 블록 이동 가능 여부 체크
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) { // 블록의 셀이 채워져 있는 경우
                const x = newX + col; // 새로운 X 위치
                const y = newY + row; // 새로운 Y 위치
                // 유효한 위치인지 검사
                if (y >= rows || x < 0 || x >= columns || gameBoard[y][x] !== 0) {
                    return false; // 범위를 넘어가면 또는 이미 존재하는 블록이 있으면 false
                }
            }
        }
    }
    return true; // 이동 가능
}

function draw() { // 화면 갱신 함수
    drawBoard(); // 게임 보드 그리기
    drawBlock(currentBlock.shape, currentBlock.color, currentX, currentY); // 현재 블록 그리기
}

document.addEventListener('keydown', moveBlock); // 키보드 이벤트 리스너 추가

spawnAndDrawNewBlock(); // 첫 번째 블록 생성 및 그리기