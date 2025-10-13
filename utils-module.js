import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function getContext(canavasId) {
	const canvas = document.querySelector(canavasId);
	const ctx = canvas.getContext("2d");

	return ctx;
}

const FPS = {
	lastTime : 0,
	deltaTime : 0,
	fps : 0,
	update : function() {
		const currentTime = performance.now();
		this.deltaTime = currentTime - this.lastTime;
		this.fps = (1000 / this.deltaTime).toFixed(2);
		this.lastTime = currentTime;
		return this.fps;
	},
	show : function(ctx, x, y, color = "green", font = "14px Tahoma") {
		ctx.fillStyle = color;
		ctx.font = font;
		ctx.fillText(`FPS: ${this.fps}`, x, y);
	},
};

let keys = {};
document.addEventListener("keydown", function(event) {
	keys[event.key] = true; // บันทึกปุ่มที่กด
});
document.addEventListener("keyup", function(event) {
	keys[event.key] = false; // ลบปุ่มที่ปล่อย
});

let mouse = { x: 0, y: 0, isDown: false };
document.addEventListener("mousemove", function(event) {
	mouse.x = event.offsetX; // ใช้ offsetX เพื่อให้ได้ตำแหน่งสัมพัทธ์กับ canvas
	mouse.y = event.offsetY; // ใช้ offsetY เพื่อให้ได้ตำแหน่งสัมพัทธ์กับ canvas
});
document.addEventListener("mousedown", function(event) {
	mouse.isDown = true; // ตั้งค่าว่าเมาส์กดอยู่
});

let touch = { x: 0, y: 0, isDown: false };
document.addEventListener("touchmove", function(event) {
	const touchEvent = event.touches[0]; // ใช้ touch แรก (นิ้วแรก)
	touch.x = touchEvent.pageX - ctx.canvas.offsetLeft; // คำนวณตำแหน่งสัมพัทธ์กับ canvas
	touch.y = touchEvent.pageY - ctx.canvas.offsetTop; // คำนวณตำแหน่งสัมพัทธ์กับ canvas
});

// Main 3D Object
const M3D = {}; // กำหนดตัวแปร M3D เป็นวัตถุว่าง เพื่อใช้เก็บข้อมูลต่างๆ ที่เกี่ยวข้องกับ 3D
M3D.scene = new THREE.Scene({ antialias: true }); // สร้าง Scene ใหม่สำหรับ 3D
M3D.scene.background = new THREE.Color(0x333333); // กำหนดสีพื้นหลังของฉาก

M3D.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
M3D.camera.position.set(3, 3, 3); // กำหนดตำแหน่งกล้อง
M3D.camera.lookAt(0, 0, 0); // กำหนดมุมมองกล้อง

M3D.renderer = new THREE.WebGLRenderer({ antialias: true });
M3D.renderer.setSize(window.innerWidth, window.innerHeight);
//document.body.appendChild(M3D.renderer.domElement); // เพิ่ม renderer (canvas) ลงใน body ของ HTML

M3D.cssRenderer = new CSS2DRenderer(); // สร้าง CSS2DRenderer สำหรับการแสดงผลข้อความ 2D บนฉาก 3D
M3D.cssRenderer.setSize(window.innerWidth, window.innerHeight);
M3D.cssRenderer.domElement.style.position = 'absolute'; // กำหนดตำแหน่งของ CSS2DRenderer เป็น absolute
M3D.cssRenderer.domElement.style.top = '0'; // กำหนดตำแหน่งด้านบนของ CSS2DRenderer
M3D.cssRenderer.domElement.style.left = '0'; // กำหนดตำแหน่งด้านซ้ายของ CSS2DRenderer
M3D.cssRenderer.domElement.style.pointerEvents = 'none'; // ป้องกันไม่ให้ CSS2DRenderer รับการคลิก
//document.body.appendChild(M3D.cssRenderer.domElement); // เพิ่ม CSS2DRenderer ลงใน body ของ HTML

window.addEventListener('resize', onWindowResize, false); // เมื่อขนาดหน้าต่างเปลี่ยนแปลง ให้เรียกใช้ฟังก์ชัน onWindowResize
// ฟังก์ชันสำหรับการปรับขนาด renderer และ CSS2DRenderer เมื่อขนาดหน้าต่างเปลี่ยนแปลง
function onWindowResize() {
	M3D.renderer.setSize(window.innerWidth, window.innerHeight); // ปรับขนาด renderer (canvas) เมื่อขนาดหน้าต่างเปลี่ยนแปลง
	M3D.cssRenderer.setSize(window.innerWidth, window.innerHeight); // กำหนดขนาดของ CSS2DRenderer
	// ปรับอัตราส่วนของกล้องเมื่อขนาดหน้าต่างเปลี่ยนแปลง เฉพาะสำหรับ PerspectiveCamera
	M3D.camera.aspect = window.innerWidth / window.innerHeight;
	M3D.camera.updateProjectionMatrix();
	// สำหรับ OrthographicCamera จะต้องปรับขนาดของกล้องด้วย
	// M3D.camera.left = -window.innerWidth / 2;
	// M3D.camera.right = window.innerWidth / 2;
	// M3D.camera.top = window.innerHeight / 2;
	// M3D.camera.bottom = -window.innerHeight / 2;
	// M3D.camera.updateProjectionMatrix();
}

// controls
M3D.controls = new OrbitControls(M3D.camera, M3D.renderer.domElement);

// สร้างข้อความ 2D ที่จะแสดงบนฉาก 3D และแนบไปกับวัตถุ 3D
function createLabel2D(parent, text, position, size= '24px', color = 'white', backgroundColor = 'rgba(0, 0, 0, 0.5)') {
	const labelCube = document.createElement('span'); // สร้าง div สำหรับข้อความ
	labelCube.textContent = text; // กำหนดข้อความที่จะแสดง
	labelCube.style.fontSize = size; // กำหนดขนาดตัวอักษร
	labelCube.style.color = color; // กำหนดสีข้อความ
	labelCube.style.backgroundColor = backgroundColor;
	labelCube.style.pointerEvents = 'none'; // ป้องกันไม่ให้ข้อความรับการคลิก
	const cssLabel = new CSS2DObject(labelCube); // สร้าง CSS2DObject จาก div ที่สร้างขึ้น
	cssLabel.position.set(position.x, position.y, position.z); // กำหนดตำแหน่งของข้อความในฉาก
	parent.add(cssLabel); // เพิ่มข้อความลงใน cube mesh
}

export { getContext, FPS, keys, mouse, touch, M3D, createLabel2D };