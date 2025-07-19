// =====================================================
// エミュレータコード
// =====================================================

class CLcd {
	static LCD_WIDTH = 128;
	static LCD_HEIGHT = 64;

	constructor(canvasId) {
		const canvas = document.getElementById(canvasId);
		this.ctx = canvas.getContext('2d');

		this.cellSize = 8; // 1ドットのスケーリング倍率

		this.fgColor = "limegreen";
		this.bgColor = "#001030"; // すごく濃い紺色
		//this.bgColor = "#001030"; // すごく濃い紺色

		canvas.width = CLcd.LCD_WIDTH * this.cellSize;
		canvas.height = CLcd.LCD_HEIGHT * this.cellSize;

		this.ctx.fillStyle = this.bgColor;
		this.ctx.fillRect(0, 0, canvas.width, canvas.height);

		this.fb = new Uint8Array(CLcd.LCD_WIDTH * CLcd.LCD_HEIGHT);
	}

	setColors(fg, bg) {
		this.fgColor = fg;
		this.bgColor = bg;
		this.clear();
	}

	setPixel(x, y, on = true) {
		if (x < 0 || x >= CLcd.LCD_WIDTH || y < 0 || y >= CLcd.LCD_HEIGHT) return;

		const idx = y * CLcd.LCD_WIDTH + x;
		this.fb[idx] = on ? 1 : 0;

		const px = x * this.cellSize;
		const py = y * this.cellSize;

		this.ctx.fillStyle = on ? this.fgColor : this.bgColor;
		this.ctx.fillRect(
			px + 1, py + 1,
			this.cellSize - 2, this.cellSize - 2
		); // 内側に描画して、格子を表現
	}

	drawRect(x, y, w, h, on = true) {
		for (let yy = y; yy < y + h; yy++) {
			for (let xx = x; xx < x + w; xx++) {
				this.setPixel(xx, yy, on);
			}
		}
	}

	drawLine(x0, y0, x1, y1, on = true) {
		let dx = Math.abs(x1 - x0);
		let dy = -Math.abs(y1 - y0);
		let sx = x0 < x1 ? 1 : -1;
		let sy = y0 < y1 ? 1 : -1;
		let err = dx + dy;

		while (true) {
			this.setPixel(x0, y0, on);
			if (x0 === x1 && y0 === y1) break;
			let e2 = 2 * err;
			if (e2 >= dy) { err += dy; x0 += sx; }
			if (e2 <= dx) { err += dx; y0 += sy; }
		}
	}

	clear() {
		this.ctx.fillStyle = this.bgColor;
		this.ctx.fillRect(0, 0, CLcd.LCD_WIDTH * this.cellSize, CLcd.LCD_HEIGHT * this.cellSize);
		this.fb.fill(0);
	}
}

class CHMIMouseInput { 
    static isDragging = false;
    static startX = 0;
    static startY = 0; 
    constructor(theCbOnMouseDown, theCbOnMouseMove, theCbOnMouseUp) {
        this.cbOnMouseDown = theCbOnMouseDown;
        this.cbOnMouseMove = theCbOnMouseMove;
        this.cbOnMouseUp = theCbOnMouseUp;  
        document.addEventListener("mousedown", (e) => {
        	this.isDragging = true;
        	this.startX = e.clientX;
        	this.startY = e.clientY;
            this.cbOnMouseDown();
        }); 
        document.addEventListener("mousemove", (e) => {
        	if (!this.isDragging) return;    
        	const dx = e.clientX - this.startX;
        	const dy = e.clientY - this.startY;
            this.cbOnMouseMove(dx, dy);
        }); 
        document.addEventListener("mouseup", () => {
        	this.isDragging = false;
            mouseDragStartY = racketR.curInfo.curPos.y
            mouseDragDy = 0
            this.cbOnMouseUp();
        }); 
    }
}

// =====================================================
// ピンポンで使用するパーツのクラス
// =====================================================

class CObjBase {
	constructor(x, y, w, h, ax = 1, ay = 1) {
        this.curInfo = {
		    curPos: { x: x, y: y},
		    size: { w: w, l: h },
		    acccel: { x: ax, y: ay },
            status: { isMove: true }
        }
		this.initInfo = JSON.parse(JSON.stringify(this.curInfo));
	}
    GetLeftEdge()   { return this.curInfo.curPos.x;  };
    GetRightEdge()  { return this.curInfo.curPos.x + this.curInfo.size.w - 1; }
    GetTopEdge()    { return this.curInfo.curPos.y;  }
    GetBottomEdge() { return this.curInfo.curPos.y + this.curInfo.size.l - 1; }
    GetCenterX()    { return this.curInfo.curPos.x + Math.floor(this.curInfo.size.w / 2);}
    GetCenterY()    { return this.curInfo.curPos.y + Math.floor(this.curInfo.size.l / 2);}

    OnHitHorizontalWall() {  this.curInfo.acccel.x *= -1;  }
    OnHitVerticalWall() {  this.curInfo.acccel.y *= -1;  }

	CheckHitWall() {
        if (this.curInfo.curPos.x < 0) {
            this.curInfo.curPos.x = 0;  // 画面の左端に固定
            this.OnHitHorizontalWall();
        }
    
        if (this.curInfo.curPos.x + this.curInfo.size.w > CLcd.LCD_WIDTH) {
            this.curInfo.curPos.x = CLcd.LCD_WIDTH - this.curInfo.size.w;
            this.OnHitHorizontalWall();
        }
    
        if (this.curInfo.curPos.y <= 0) {
            this.curInfo.curPos.y = 0;
            this.OnHitVerticalWall();
        }
    
        if (this.curInfo.curPos.y + this.curInfo.size.l > CLcd.LCD_HEIGHT) {
            this.curInfo.curPos.y = CLcd.LCD_HEIGHT - this.curInfo.size.l;
            this.OnHitVerticalWall();
        }
	}

	Move() {
        if(!this.curInfo.status.isMove) return;
		this.curInfo.curPos.x += this.curInfo.acccel.x;
		this.curInfo.curPos.y += this.curInfo.acccel.y;
		this.CheckHitWall();
	}
    Erase(theLcd)   { theLcd.drawRect(this.curInfo.curPos.x, this.curInfo.curPos.y, this.curInfo.size.w, this.curInfo.size.l, false) };
    Draw(theLcd)    { theLcd.drawRect(this.curInfo.curPos.x, this.curInfo.curPos.y, this.curInfo.size.w, this.curInfo.size.l, true) };
    SetPos(theX, theY) { this.curInfo.curPos.x = theX; this.curInfo.curPos.y = theY;   };
    SetLcdCenter(){
        this.curInfo.curPos.x = CLcd.LCD_WIDTH / 2 - Math.floor(this.curInfo.size.w / 2);
        this.curInfo.curPos.y = CLcd.LCD_HEIGHT / 2 - Math.floor(this.curInfo.size.l / 2);
    };
    SetPosY(theY) { 
        if (theY + this.curInfo.size.l > CLcd.LCD_HEIGHT - 1 ){
            this.curInfo.curPos.y = CLcd.LCD_HEIGHT - this.curInfo.size.l;
        }
        else if(theY < 0) {
            this.curInfo.curPos.y = 0;
        }else {
            this.curInfo.curPos.y = theY;
        }
    };
}

class Cball extends CObjBase {
    OnHitHorizontalWall() {  
        // this.status.isMove = false;
        this.curInfo = JSON.parse(JSON.stringify(this.initInfo));
        this.SetLcdCenter();

    };

    OnHitRacket(theRacket){
        const div = 4;

        const distanceFromCenter = Math.abs(theRacket.GetCenterY() - this.GetCenterY());
        const isHitUpper = (Math.sign(theRacket.GetCenterY() - this.GetCenterY()) >= 0);
        const isHitL = (Math.sign(this.curInfo.acccel.x) < 0);
        const rktHfSize = Math.floor(theRacket.curInfo.size.l / 2);
        

        // this.curInfo.acccel.x *= -1;
        console.log(
            "distanceFromCenter = " + distanceFromCenter + "\n" +
            "isHitUpper = " + isHitUpper + "\n" +
            "isHitR = " + isHitL + "\n" +
            "rktHfSize = " + rktHfSize
        );

        if (distanceFromCenter <= Math.floor(rktHfSize / div) * 1){
            console.log("hit center");
            this.curInfo.acccel.x = isHitL ? 5 : -5;
            this.curInfo.acccel.y = 0;
        }
        else if (distanceFromCenter <= Math.floor(rktHfSize / div) * 2){
            console.log("hit center2");
            this.curInfo.acccel.x = isHitL ? 4 : -4;
            this.curInfo.acccel.y = isHitUpper ? -1 : 1;
        }
        else if (distanceFromCenter <= Math.floor(rktHfSize / div) * 3){
            console.log("hit center3");
            this.curInfo.acccel.x = isHitL ? 3: -3;
            this.curInfo.acccel.y = isHitUpper ? -2 : 2;
        }
        else if (distanceFromCenter <= Math.floor(rktHfSize / div) * 4){
            console.log("hit center4");
            this.curInfo.acccel.x = isHitL ? 2 : -2;
            this.curInfo.acccel.y = isHitUpper ? -3 : 3;
        }
        else {
            console.log("hit center5");
            this.curInfo.acccel.x = isHitL ? 1 : -1;
            this.curInfo.acccel.y = isHitUpper ? -4 : 4;
        }


        const rktX = theRacket.curInfo.curPos.x;
        const rktW = theRacket.curInfo.size.w;

        // 衝突後、ボールをラケット外へ押し出す（X方向だけでOK）
        if (this.curInfo.curPos.x < CLcd.LCD_WIDTH / 2) {
            // 左ラケット → 右に押し出す
            this.curInfo.curPos.x = rktX + rktW;
        } else {
            // 右ラケット → 左に押し出す
            this.curInfo.curPos.x = rktX - this.curInfo.size.w;
        }
    };

    CheckHitRacket(theRacket){
		if (
	        this.GetLeftEdge() <= theRacket.GetRightEdge() &&
	        this.GetRightEdge() >= theRacket.GetLeftEdge() &&
	        this.GetBottomEdge() >= theRacket.GetTopEdge() &&
	        this.GetTopEdge() <= theRacket.GetBottomEdge()
		) {
            
			this.OnHitRacket(theRacket);
		}
    };
    Move(theRacketL, theRacketR) {
        if(!this.curInfo.status.isMove) return;
		this.curInfo.curPos.x += this.curInfo.acccel.x;
		this.curInfo.curPos.y += this.curInfo.acccel.y;
        this.CheckHitRacket(theRacketL);
        this.CheckHitRacket(theRacketR);
        this.CheckHitWall();
    };
}

// =====================================================
// 実行部
// =====================================================

// 初期化と描画
const lcd = new CLcd('lcd');
mouseDragStartY = 0;
mouseDragDy = 0;
const mouseInput = new CHMIMouseInput(
    function(){
        mouseDragStartY = racketR.curInfo.curPos.y;
    },
    function(dx, dy){
        mouseDragDy = dy;
        // console.log("dx =", dx, "dy =", mouseDragDy);
    },
    function(){
        mouseDragStartY = racketR.curInfo.curPos.y;
        mouseDragDy = 0;
    },
);

const ball = new Cball(CLcd.LCD_WIDTH / 2,CLcd.LCD_HEIGHT / 2,5,5,1,1);
const racketL = new CObjBase(2, 0, 2, 20, 0, 1);
const racketR = new CObjBase(CLcd.LCD_WIDTH - 2 - 2, CLcd.LCD_HEIGHT / 2, 2, 20, 0, 1);

// =====================================================
// サイクリック実行
// =====================================================

function update() {
  // LCDやcanvasを毎フレーム更新
    racketL.Erase(lcd);
    racketR.Erase(lcd);
    ball.Erase(lcd);

    racketL.SetPosY(mouseDragStartY + mouseDragDy);
    racketL.Draw(lcd);


    racketR.SetPosY(mouseDragStartY + mouseDragDy);
    racketR.Draw(lcd);



    ball.Move(racketL, racketR);
    ball.Draw(lcd);
}


setInterval(() => {
  update();
}, 50); // ← 1000ミリ秒 = 1秒