import * as THREE from 'three'; // three จากที่กำหนดใน importmap (หลัก)
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { M3D, createLabel2D, FPS } from './utils-module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// สรุป: สคริปต์นี้สร้างฉาก 3D เล็กๆ มีพื้น ทะเลสาบ ภูเขา เมฆ ต้นไม้ และไฟที่ย้ายได้

// เริ่ม main เมื่อ DOM โหลดเสร็จ
document.addEventListener("DOMContentLoaded", main);

function main() {
	// main(): ตั้งค่า renderer, เพิ่มลงหน้า และเริ่ม loop
	// ใช้ M3D ที่นำเข้ามาจาก utils-module
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

	// เปิดพื้นด้วยกล่องบางๆ ให้มีความหนาเล็กน้อย (มองเห็นขอบ)
	const groundHeight = 0.4; // กำหนดความหนา
	const geometryGround = new THREE.BoxGeometry(10, groundHeight, 10);
	const materialGround = new THREE.MeshStandardMaterial({ color: 0x4b8a2f, roughness: 1.0, side: THREE.DoubleSide });
	const meshGround = new THREE.Mesh(geometryGround, materialGround);
	// Position so the top surface is at y = 0-
	meshGround.position.set(0, -groundHeight / 2, 0);
	meshGround.receiveShadow = true;//รับเงา
	M3D.scene.add(meshGround);

	// พื้น: ใช้กล่องบางๆ ให้มีความหนาเล็กน้อย (มองเห็นขอบ)

	// วางวัตถุใด ๆ ให้จุดต่ำสุดอยู่ที่ระดับพื้น (y=0)
	// (ใช้กับโมเดลที่โหลดเข้ามาได้)
	function placeOnGround(object3d) {
		// คำนวณ bounding box ในพื้นที่โลก
		const box = new THREE.Box3().setFromObject(object3d);
		if (!box.isEmpty()) {
			const minY = box.min.y;
			object3d.position.y -= minY;
		}
	}

	const cloudGroups = [];
	const cloudClock = new THREE.Clock();

	// ภูเขา
	(function addMountains() {
		const mountainMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4f2f, roughness: 1.0 });
		const geomLeft = new THREE.ConeGeometry(1.5, 2.5, 4); // ความสูง, ความกว้างฐาน, จำนวนด้าน
		const leftMountain = new THREE.Mesh(geomLeft, mountainMaterial);
		leftMountain.position.set(-3, 0, 3);
		placeOnGround(leftMountain);
		leftMountain.receiveShadow = true;
		leftMountain.castShadow = true;
		M3D.scene.add(leftMountain);

		// ภูเขา2
		const geomRight = new THREE.ConeGeometry(1.5, 2.5, 4); //ความสุง, ความกว้างฐาน, จำนวนด้าน
		const rightMountain = new THREE.Mesh(geomRight, mountainMaterial);
		rightMountain.position.set(-3, 0, -3); // ตำเเหน่งภูเขา
		rightMountain.receiveShadow = true;
		rightMountain.castShadow = true;
		placeOnGround(rightMountain);
		M3D.scene.add(rightMountain);

		
	})();

	// เเม่น้ำ
	(function addRiver() {
		const riverWidth = 2.0; 
		const riverLength = 10;
		const riverDepth = 0.4; // ความลึก
		const riverTopOffset = 0.05; // ผิสน้ำ
		const riverGeom = new THREE.BoxGeometry(riverLength, riverDepth, riverWidth);
		const riverMat = new THREE.MeshStandardMaterial({ color: 0x3aa0d6, metalness: 0.0, roughness: 0.35, transparent: true, opacity: 0.95 });
		const river = new THREE.Mesh(riverGeom, riverMat);
		const riverCenterY = riverTopOffset - (riverDepth / 2);
		river.position.set(0, riverCenterY, 0);
		river.receiveShadow = true;
		M3D.scene.add(river);

	})();


	
	// เมฆ: สร้างกลุ่มเมฆเล็กๆ ในท้องฟ้า
	(function addClouds() {
		const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
		function makeCloud(x, y, z, scale=0) {
			// สร้าง Group ของเมฆจาก 3 ลูกบอลเล็กๆ
			const g = new THREE.Group();
			const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.8 * scale, 12, 12), cloudMaterial);
			s1.position.set(-0.6 * scale, 0, 0);
			const s2 = new THREE.Mesh(new THREE.SphereGeometry(1.0 * scale, 12, 12), cloudMaterial);
			s2.position.set(0.4 * scale, 0.1 * scale, 0);
			const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.7 * scale, 12, 12), cloudMaterial);
			s3.position.set(1.0 * scale, -0.1 * scale, 0);
			g.add(s1); g.add(s2); g.add(s3);
			g.position.set(x, y, z);
			g.scale.set(scale, scale, scale);
			M3D.scene.add(g);
			return g; // คืนค่า group เพื่อเก็บสถานะ
		}

		// กำหนดตำแหน่งและขนาดของเมฆแต่ละกลุ่ม
		const cloudDefs = [
			{ x: 0, y: 2, z: 0, scale: 0.5 },
			{ x: 0, y: 2.5, z: -2, scale: 0.6 },
			{ x: 0, y: 2.2, z: -1, scale: 0.5 },
			{ x: 0.5, y: 2, z: 1, scale: 0.7 }
		];

		// สร้างเมฆและเก็บข้อมูลเล็กๆ สำหรับทำอนิเมชัน 
		cloudDefs.forEach((def, i) => {
			const g = makeCloud(def.x, def.y, def.z, def.scale);
			cloudGroups.push({
				group: g,
				baseX: def.x,
				baseY: def.y,
				baseZ: def.z,
				amp: 0.4 + (i * 0.05), // ความกว้างการแกว่งเล็กน้อย
				speed: 0.6 + (i * 0.1), // ความเร็วต่างกันเล็กน้อย
				phase: i * 0.8 // ช่วงเริ่มต้นต่างกัน
			});
		});
	})();

		const loader = new GLTFLoader(); 
		// load ต้นไม้
		loader.load(
			'assets/stylized_tree.glb',
			function(gltf) {
				console.log('GLTF loaded:', gltf);
				const model = gltf.scene;
				model.position.set(0, 0, 3);
				model.scale.set(1.25, 1.25, 1.25);
				model.traverse((child) => {
					if (child.isMesh) {
						child.castShadow = true;
						child.receiveShadow = true;
						console.log('Mesh found in gltf (tree):', child.name);
					}
				});

				// กำหนดตำแหน่งและขนาดของต้นไม้แต่ละต้น
				const offsets = [
					[-0.6, 0, -0.4], [0.2, 0, -0.6], [0.8, 0, 0.1], [-0.3, 0, 0.6],
					[-0.8, 0, 0.5], [0.1, 0, 0.9], [0.6, 0, -0.2], [-1.2, 0, 0.8],
					[1.0, 0, 0.6], [-0.4, 0, -1.0]
				];

				const baseSpot = [1.6, 0, -1.75]; // จุดศูนย์กลางสำหรับแถว
				const spacing = 0.7; // ระยะห่างระหว่างต้นไม้
				const count = offsets.length;
				const startX = baseSpot[0] - ((count - 1) / 2) * spacing;
				for (let i = 0; i < count; i++) {
					const clone = model.clone(true);
					const x = startX + i * spacing;
					const y = baseSpot[1];
					const z = baseSpot[2];
					const s = 1.0; // ขนาดเดียวกันทั้งหมด
					const r = 0; // ไม่มีการหมุน
					clone.position.set(x, y, z);
					clone.scale.set(s, s, s);
					clone.rotation.y = r;
					clone.traverse((c) => {
						if (c.isMesh) {
							c.castShadow = true;
							c.receiveShadow = true;
						}
					});
					treeGroup.add(clone);
				}
				// วางกลุ่มต้นไม้ทั้งหมด
				treeGroup.position.y = 0;
				M3D.scene.add(treeGroup);
				if (typeof loadEnd === 'function') loadEnd();
			},
			function(xhr) {
				console.log((xhr.loaded / xhr.total * 100).toFixed(1) + '% loaded');
			},
			function(error) {
				console.error('An error happened while loading the model (tree):', error);
			}
		);

		// load บ้านเเสนสุข
		loader.load(
			'assets/abandoned_house.glb',
			function(gltf) {
				console.log('GLTF loaded:', gltf);
				const model = gltf.scene;
				model.position.set(3, 0, -3);
				model.scale.set(0.15, 0.15, 0.15);
				model.traverse((child) => {
					if (child.isMesh) {
						child.castShadow = true;
						child.receiveShadow = true;
						console.log('Mesh found in gltf (house):', child.name);
					}
				});

				// วางวัตถุให้จุดต่ำสุดอยู่ที่ระดับพื้น
				M3D.scene.add(model);
				const axes = new THREE.AxesHelper(1);
				model.add(axes);
				const box = new THREE.BoxHelper(model, 0xff0000);
				M3D.scene.add(box);
				if (M3D.controls) {

				}
				if (typeof loadEnd === 'function') loadEnd();
			},
			function(xhr) {
				console.log((xhr.loaded / xhr.total * 100).toFixed(1) + '% loaded');
			},
			function(error) {
				console.error('An error happened while loading the model (house):', error);
			}
		);



		// แสงสว่างทั่วไป
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
		M3D.scene.add(ambientLight);
		// ทิศทางเเสง
		const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
		dirLight.position.set(5, 10, 7.5);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.width = 1024;
		dirLight.shadow.mapSize.height = 1024;
		M3D.scene.add(dirLight);

		// พระอาทิตย์
		const pointLight = new THREE.PointLight(0xfff2d6, 1.2, 30);
		pointLight.position.set(0, 2.5, 0);
		pointLight.castShadow = true;
		pointLight.shadow.mapSize.width = 1024;
		pointLight.shadow.mapSize.height = 1024;
		M3D.scene.add(pointLight);

		const lightSphereGeom = new THREE.SphereGeometry(0.18, 16, 16);
		const lightSphereMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffff88, emissiveIntensity: 0.9 });
		const lightSphere = new THREE.Mesh(lightSphereGeom, lightSphereMat);
		lightSphere.name = 'LightSphere';
		lightSphere.userData.selectable = true; // 
		pointLight.add(lightSphere); // 

		
		const transformControls = new TransformControls(M3D.camera, M3D.renderer.domElement);
		M3D.scene.add(transformControls);
		transformControls.attach(pointLight);
		transformControls.addEventListener('dragging-changed', (event) => {
			if (M3D.controls) M3D.controls.enabled = !event.value; // disable orbit while dragging
		});

		// เป็นฟังก์ชันสำหรับจัดกรอบโมเดล
		function frameModel(object3d, margin = 1.2) {
			const box = new THREE.Box3().setFromObject(object3d);
			const size = new THREE.Vector3();
			box.getSize(size);
			const center = new THREE.Vector3();
			box.getCenter(center);
			const maxSize = Math.max(size.x, size.y, size.z);
			const fov = M3D.camera.fov * (Math.PI / 180);
			let cameraZ = Math.abs(maxSize / 2 / Math.tan(fov / 2)) * margin;
			// place camera on z axis relative to center
			M3D.camera.position.copy(center.clone().add(new THREE.Vector3(0, cameraZ * 0.4, cameraZ)));
			M3D.camera.lookAt(center);
			if (M3D.controls) {
				M3D.controls.target.copy(center);
				M3D.controls.update();
			}
			console.log('Framed model. center:', center, 'size:', size, 'camera pos:', M3D.camera.position);
		}




	
	// Stats
	const stats = new Stats(); // สร้าง Stats เพื่อตรวจสอบประสิทธิภาพ
	document.body.appendChild(stats.dom); // เพิ่ม Stats ลงใน body ของ HTML

	// GUI
	const gui = new GUI(); // สร้าง GUI สำหรับปรับแต่งค่าต่างๆ 


	function animate() {
		M3D.controls.update(); // อัปเดต controls
		stats.update(); // อัปเดต Stats
		FPS.update(); // อัปเดต FPS

		// อนิเมชันเมฆ
		const t = cloudClock.getElapsedTime();
		for (let i = 0; i < cloudGroups.length; i++) {
			const c = cloudGroups[i];
			if (!c || !c.group) continue;
			const dx = Math.sin(t * c.speed + c.phase) * c.amp;
			c.group.position.x = c.baseX + dx;
			// 
			c.group.position.y = c.baseY + Math.sin(t * (c.speed * 0.6) + c.phase * 0.5) * (c.amp * 0.12);
		}


		// RENDER scene and camera
		M3D.renderer.render(M3D.scene, M3D.camera); // เรนเดอร์ฉาก
		M3D.cssRenderer.render(M3D.scene, M3D.camera); // เรนเดอร์ CSS2DRenderer
		console.log(`FPS: ${FPS.fps}`); // แสดงค่า FPS ในคอนโซล
	}
}