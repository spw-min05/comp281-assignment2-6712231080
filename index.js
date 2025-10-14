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

	// Ground with thickness: use a thin box so the ground has visible depth
	const groundHeight = 0.4; // adjust this value to change thickness
	const geometryGround = new THREE.BoxGeometry(10, groundHeight, 10);
	const materialGround = new THREE.MeshStandardMaterial({ color: 0x4b8a2f, roughness: 1.0, side: THREE.DoubleSide });
	const meshGround = new THREE.Mesh(geometryGround, materialGround);
	// Position so the top surface is at y = 0-
	meshGround.position.set(0, -groundHeight / 2, 0);//เป็นพื้นดิน
	meshGround.receiveShadow = true;//รับเงา
	M3D.scene.add(meshGround);

	// พื้น: ใช้กล่องบางๆ ให้มีความหนาเล็กน้อย (มองเห็นขอบ)

	// วางวัตถุใด ๆ ให้จุดต่ำสุดอยู่ที่ระดับพื้น (y=0)
	// (ใช้กับโมเดลที่โหลดเข้ามาได้)
	function placeOnGround(object3d) {
		// compute bounding box in world space
		const box = new THREE.Box3().setFromObject(object3d);
		if (!box.isEmpty()) {
			const minY = box.min.y;
			// shift object so minY becomes 0 (ground top)
			object3d.position.y -= minY;
		}
	}

	// helper: ย้ายวัตถุให้แตะพื้น (y=0) โดยใช้ bounding box

	// เก็บข้อมูลกลุ่มเมฆและนาฬิกาเพื่อทำอนิเมชันเมฆ
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

	// คือเเม่น้ำ
	(function addRiver() {
		// make river deeper so surface sits below ground level
		const riverWidth = 2.0; // ความกว้าง
		const riverLength = 10; // ความยาว
		const riverDepth = 0.4; // total depth of river (box height)
		const riverTopOffset = 0.05; 
		const riverGeom = new THREE.BoxGeometry(riverLength, riverDepth, riverWidth);
		const riverMat = new THREE.MeshStandardMaterial({ color: 0x3aa0d6, metalness: 0.0, roughness: 0.35, transparent: true, opacity: 0.95 });
		const river = new THREE.Mesh(riverGeom, riverMat);
		// compute center y so top sits at riverTopOffset (topY = centerY + riverDepth/2)
		const riverCenterY = riverTopOffset - (riverDepth / 2);
		river.position.set(0, riverCenterY, 0);
		river.receiveShadow = true;
		M3D.scene.add(river);

		// shores: two slightly overlapping strips that sit on top of the ground and overlap the river edge
		const shoreWidth = 0.6;  //ความกว้างของชายฝั่งแต่ละด้าน
		const shoreLength = riverLength + 1.0; // a bit longer to overlap
		const shoreHeight = 0.04; // thin but visible
		const shoreGeom = new THREE.BoxGeometry(shoreLength, shoreHeight, shoreWidth);
		const shoreMat = new THREE.MeshStandardMaterial({ color: 0x4b8a2f, roughness: 1.0 });
		const shoreLeft = new THREE.Mesh(shoreGeom, shoreMat);
		const shoreRight = shoreLeft.clone();

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

		// definitions for clouds (base positions)
		const cloudDefs = [
			{ x: 0, y: 2, z: 0, scale: 0.5 },
			{ x: 0, y: 2.5, z: -2, scale: 0.6 },
			{ x: 0, y: 2.2, z: -1, scale: 0.5 },
			{ x: 0.5, y: 2, z: 1, scale: 0.7 }
		];

		// สร้างเมฆและเก็บข้อมูลเล็กๆ สำหรับทำอนิเมชัน (base position, amplitude, speed)
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

		const loader = new GLTFLoader(); // สร้าง GLTFLoader
		// load stylized_tree
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
				// don't add the single source model; we'll add clones instead
				// create a small forest by cloning this tree 10 times at fixed positions
				const treeGroup = new THREE.Group();
				// deterministic offsets within each cluster (10 offsets total)
				const offsets = [
					[-0.6, 0, -0.4], [0.2, 0, -0.6], [0.8, 0, 0.1], [-0.3, 0, 0.6],
					[-0.8, 0, 0.5], [0.1, 0, 0.9], [0.6, 0, -0.2], [-1.2, 0, 0.8],
					[1.0, 0, 0.6], [-0.4, 0, -1.0]
				];

				// place trees evenly along X with spacing ~0.7, centered at baseSpot
				const baseSpot = [1.6, 0, -1.75]; // center point for the row
				const spacing = 0.7; // distance between trees
				const count = offsets.length;
				const startX = baseSpot[0] - ((count - 1) / 2) * spacing;
				for (let i = 0; i < count; i++) {
					const clone = model.clone(true);
					const x = startX + i * spacing;
					const y = baseSpot[1];
					const z = baseSpot[2];
					const s = 1.0; // uniform scale for clarity
					const r = 0; // no rotation
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
				// position the whole group slightly above ground if needed
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

		// load abandoned_house
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

				// --- add model to scene ---
				M3D.scene.add(model);
				// add visual helpers to see where model is
				const axes = new THREE.AxesHelper(1);
				model.add(axes);
				const box = new THREE.BoxHelper(model, 0xff0000);
				M3D.scene.add(box);
				// point OrbitControls to model and frame it in view
				if (M3D.controls) {
					//frameModel(model);
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



		// เ
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
		lightSphere.userData.selectable = true; // allow selection by raycaster
		pointLight.add(lightSphere); // attach sphere so it follows the light

		// TransformControls to move the point light without moving the camera
		const transformControls = new TransformControls(M3D.camera, M3D.renderer.domElement);
		M3D.scene.add(transformControls);
		transformControls.attach(pointLight);
		transformControls.addEventListener('dragging-changed', (event) => {
			if (M3D.controls) M3D.controls.enabled = !event.value; // disable orbit while dragging
		});

		// เป็น
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

		// UPDATE state of objects here
		// animate clouds: small left-right oscillation that loops
		const t = cloudClock.getElapsedTime();
		for (let i = 0; i < cloudGroups.length; i++) {
			const c = cloudGroups[i];
			if (!c || !c.group) continue;
			const dx = Math.sin(t * c.speed + c.phase) * c.amp;
			c.group.position.x = c.baseX + dx;
			// gently bob up and down a little (optional, small amplitude)
			c.group.position.y = c.baseY + Math.sin(t * (c.speed * 0.6) + c.phase * 0.5) * (c.amp * 0.12);
		}


		// RENDER scene and camera
		M3D.renderer.render(M3D.scene, M3D.camera); // เรนเดอร์ฉาก
		M3D.cssRenderer.render(M3D.scene, M3D.camera); // เรนเดอร์ CSS2DRenderer
		console.log(`FPS: ${FPS.fps}`); // แสดงค่า FPS ในคอนโซล
	}
}