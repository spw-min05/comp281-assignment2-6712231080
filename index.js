import * as THREE from 'three'; // three จากที่กำหนดใน importmap
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { M3D, createLabel2D, FPS } from './utils-module.js';

document.addEventListener("DOMContentLoaded", main);

function main() {
	// ใช้ M3D ที่นำเข้ามา
	document.body.appendChild(M3D.renderer.domElement);
	document.body.appendChild(M3D.cssRenderer.domElement);

	M3D.renderer.setClearColor(0x333333); // กำหนดสีพื้นหลังของ renderer (canvas)
	M3D.renderer.setPixelRatio(window.devicePixelRatio); // ปรับความละเอียดของ renderer ให้เหมาะสมกับหน้าจอ
	M3D.renderer.shadowMap.enabled = true; // เปิดใช้งาน shadow map
	M3D.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // กำหนดประเภทของ shadow map
	M3D.renderer.physicallyCorrectLights = true; // เปิดใช้งานการคำนวณแสงแบบฟิสิกส์
	M3D.renderer.outputEncoding = THREE.sRGBEncoding; // กำหนดการเข้ารหัสสีของ renderer
	M3D.renderer.setAnimationLoop(animate); // ตั้งค่า animation loop

	// Prepaire objects here
	// TODO: วาดฉากทิวทัศน์ 3D ด้วย Three.js
	// ต้องมีครบ 6 อย่าง: ภูเขา, พระอาทิตย์, ท้องนา, ต้นไม้, บ้าน/กระท่อม, แม่น้ำ
	// องค์ประกอบอื่น ๆ เพิ่มเติมได้ตามต้องการ (เช่น ท้องฟ้า, ก้อนเมฆ ฯลฯ)

	
	// Stats
	const stats = new Stats(); // สร้าง Stats เพื่อตรวจสอบประสิทธิภาพ
	document.body.appendChild(stats.dom); // เพิ่ม Stats ลงใน body ของ HTML

	// GUI
	const gui = new GUI(); // สร้าง GUI สำหรับปรับแต่งค่าต่างๆ 


	function animate() {
		M3D.controls.update(); // อัปเดต controls
		stats.update(); // อัปเดต Stats
		FPS.update(); // อัปเดต FPS

		// UPDATE state of objects here
		// TODO: อัปเดตสถานะของวัตถุต่างๆ ที่ต้องการในแต่ละเฟรม (เช่น การเคลื่อนที่, การหมุน ฯลฯ)


		// RENDER scene and camera
		M3D.renderer.render(M3D.scene, M3D.camera); // เรนเดอร์ฉาก
		M3D.cssRenderer.render(M3D.scene, M3D.camera); // เรนเดอร์ CSS2DRenderer
		console.log(`FPS: ${FPS.fps}`); // แสดงค่า FPS ในคอนโซล
	}
}