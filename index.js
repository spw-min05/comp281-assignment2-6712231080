import * as THREE from 'three'; // three จากที่กำหนดใน importmap
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { M3D, createLabel2D, FPS } from './utils-module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

	// Ground with thickness: use a thin box so the ground has visible depth
	const groundHeight = 0.4; // adjust this value to change thickness
	const geometryGround = new THREE.BoxGeometry(10, groundHeight, 10);
	const materialGround = new THREE.MeshStandardMaterial({ color: 0x4b8a2f, roughness: 1.0, side: THREE.DoubleSide });
	const meshGround = new THREE.Mesh(geometryGround, materialGround);
	// Position so the top surface is at y = 0-
	meshGround.position.set(0, -groundHeight / 2, 0);
	meshGround.receiveShadow = true;
	M3D.scene.add(meshGround);

	// helper: place any object so its lowest point sits exactly on ground top (y=0)
	function placeOnGround(object3d) {
		// compute bounding box in world space
		const box = new THREE.Box3().setFromObject(object3d);
		if (!box.isEmpty()) {
			const minY = box.min.y;
			// shift object so minY becomes 0 (ground top)
			object3d.position.y -= minY;
		}
	}

	// --- Simple mountains (two peaks) placed behind the scene ---
	(function addMountains() {
		const mountainMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4f2f, roughness: 1.0 });
		// Left mountain (bigger, further)
		const geomLeft = new THREE.ConeGeometry(3.0, 4.5, 4); // low-poly cone (4 sides gives a pyramid-like mountain)
		const leftMountain = new THREE.Mesh(geomLeft, mountainMaterial);
		leftMountain.position.set(-5, 0, -8);
		leftMountain.rotation.y = 0.2;
		placeOnGround(leftMountain);
		leftMountain.receiveShadow = true;
		leftMountain.castShadow = true;
		M3D.scene.add(leftMountain);

		// Right mountain (smaller, closer)
		const geomRight = new THREE.ConeGeometry(2.2, 3.5, 4);
		const rightMountain = new THREE.Mesh(geomRight, mountainMaterial);
		rightMountain.position.set(4, 0, -7);
		rightMountain.rotation.y = -0.3;
		rightMountain.receiveShadow = true;
		rightMountain.castShadow = true;
		placeOnGround(rightMountain);
		M3D.scene.add(rightMountain);

		
	})();

	// --- River across the middle of the scene (centered on ground) ---
	(function addRiver() {
		const riverWidth = 2.0;
		const riverLength = 20.0;
		const riverHeight = 0.02; // very thin
		const riverGeom = new THREE.BoxGeometry(riverLength, riverHeight, riverWidth);
		const riverMat = new THREE.MeshStandardMaterial({ color: 0x3aa0d6, metalness: 0.0, roughness: 0.35, transparent: true, opacity: 0.9 });
		const river = new THREE.Mesh(riverGeom, riverMat);
		// top of river should sit at y = 0 (ground top). Box is centered, so raise by riverHeight/2
		river.position.set(0, riverHeight / 2, 0);
		river.receiveShadow = true;
		M3D.scene.add(river);

		// shores: two slightly overlapping planes to hide hard edges
		const shoreWidth = 0.5; // width of each shore strip
		const shoreLength = riverLength + 1.0; // a bit longer to overlap
		const shoreGeom = new THREE.BoxGeometry(shoreLength, 0.02, shoreWidth);
		const shoreMat = new THREE.MeshStandardMaterial({ color: 0x4b8a2f, roughness: 1.0 });
		const shoreLeft = new THREE.Mesh(shoreGeom, shoreMat);
		const shoreRight = shoreLeft.clone();
		// position: left is negative z
		shoreLeft.position.set(0, 0.01, -(riverWidth / 2 + shoreWidth / 2 - 0.05));
		shoreRight.position.set(0, 0.01, (riverWidth / 2 + shoreWidth / 2 - 0.05));
		shoreLeft.receiveShadow = true;
		shoreRight.receiveShadow = true;
		M3D.scene.add(shoreLeft);
		M3D.scene.add(shoreRight);
	})();


	
	// --- Simple clouds (groups of spheres) ---
	(function addClouds() {
		const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
		function makeCloud(x, y, z, scale=1) {
			const g = new THREE.Group();
			const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.8 * scale, 12, 12), cloudMaterial);
			s1.position.set(-0.6 * scale, 0, 0);
			const s2 = new THREE.Mesh(new THREE.SphereGeometry(1.0 * scale, 12, 12), cloudMaterial);
			s2.position.set(0.4 * scale, 0.1 * scale, 0);
			const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.7 * scale, 12, 12), cloudMaterial);
			s3.position.set(1.0 * scale, -0.1 * scale, 0);
			[g.add(s1), g.add(s2), g.add(s3)];
			g.position.set(x, y, z);
			g.scale.set(scale, scale, scale);
			M3D.scene.add(g);
		}
		makeCloud(-2, 4.0, -6, 1.2);
		makeCloud(2, 3.5, -5.5, 1.0);
		makeCloud(5, 4.2, -7.5, 0.9);
		makeCloud(0.5, 4.6, -9, 1.3);
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
				M3D.scene.add(model);
				// create a small forest by cloning this tree 10 times at fixed positions
				const treeGroup = new THREE.Group();
				const fixedPositions = [
					[-3.5, 0, -2.5],
					[-2.0, 0, -1.0],
					[-1.0, 0, 1.5],
					[0.5, 0, -3.0],
					[1.5, 0, -0.5],
					[2.8, 0, 1.0],
					[3.2, 0, -2.0],
					[-0.5, 0, 2.8],
					[-2.8, 0, 2.0],
					[0.0, 0, 0.8]
				];
				const fixedScales = [1.1, 0.9, 1.2, 0.8, 1.0, 1.3, 0.95, 1.15, 0.85, 1.05];
				const fixedRotations = [0, 0.3, -0.2, 0.8, -1.0, 0.5, -0.6, 0.2, 1.2, -0.4];
				for (let i = 0; i < fixedPositions.length; i++) {
					const clone = model.clone(true);
					const [x, y, z] = fixedPositions[i];
					const s = fixedScales[i] || 1;
					const r = fixedRotations[i] || 0;
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
				model.position.set(3, 0, 2);
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
					frameModel(model);
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



		// add basic lighting so MeshStandardMaterial is visible
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
		M3D.scene.add(ambientLight);

		const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
		dirLight.position.set(5, 10, 7.5);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.width = 1024;
		dirLight.shadow.mapSize.height = 1024;
		M3D.scene.add(dirLight);

		// helper: frame model in view by computing its bounding box
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
		// TODO: อัปเดตสถานะของวัตถุต่างๆ ที่ต้องการในแต่ละเฟรม (เช่น การเคลื่อนที่, การหมุน ฯลฯ)


		// RENDER scene and camera
		M3D.renderer.render(M3D.scene, M3D.camera); // เรนเดอร์ฉาก
		M3D.cssRenderer.render(M3D.scene, M3D.camera); // เรนเดอร์ CSS2DRenderer
		console.log(`FPS: ${FPS.fps}`); // แสดงค่า FPS ในคอนโซล
	}
}