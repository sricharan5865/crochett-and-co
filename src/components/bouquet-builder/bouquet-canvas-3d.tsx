"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface BouquetCanvas3DProps {
  quantities: Record<string, number>;
  wrapping: string;
}

export default function BouquetCanvas3D({ quantities, wrapping }: BouquetCanvas3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // Reference parameters to update loop
  const quantitiesRef = useRef(quantities);
  const wrappingRef = useRef(wrapping);

  useEffect(() => {
    quantitiesRef.current = quantities;
    wrappingRef.current = wrapping;
  }, [quantities, wrapping]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight || 300;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 4.8);

    // Renderer with shadow mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    // Groups
    const bouquetGroup = new THREE.Group();
    scene.add(bouquetGroup);

    const flowersGroup = new THREE.Group();
    const wrappingGroup = new THREE.Group();
    bouquetGroup.add(flowersGroup);
    bouquetGroup.add(wrappingGroup);

    // 1. Procedural Knitted Wool Texture for Yarn/Crochet Look
    const createKnitTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, 64, 64);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#ffffff";
      for (let col = 0; col < 64; col += 8) {
        ctx.beginPath();
        for (let y = -4; y <= 68; y += 4) {
          const shift = (y / 4) % 2 === 0 ? 2 : -2;
          ctx.lineTo(col + 4 + shift, y);
        }
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);
      return texture;
    };

    const bumpMap = createKnitTexture();

    // Reusable Materials
    const materials = {
      stem: new THREE.MeshStandardMaterial({ color: "#4F772D", roughness: 0.9 }),
      leaf: new THREE.MeshStandardMaterial({ color: "#31572C", roughness: 0.95, side: THREE.DoubleSide }),
      rosePetal: new THREE.MeshStandardMaterial({ color: "#C02942", roughness: 0.9, bumpMap: bumpMap || undefined, bumpScale: 0.025 }), // Brand red
      tulipPetal: new THREE.MeshStandardMaterial({ color: "#FFB5A7", roughness: 0.9, bumpMap: bumpMap || undefined, bumpScale: 0.02 }),
      sunflowerDisk: new THREE.MeshStandardMaterial({ color: "#3F2E21", roughness: 0.95 }),
      sunflowerPetal: new THREE.MeshStandardMaterial({ color: "#F5D061", roughness: 0.8, bumpMap: bumpMap || undefined, bumpScale: 0.02 }), // Brand gold
      daisyCenter: new THREE.MeshStandardMaterial({ color: "#F5D061", roughness: 0.9 }), // Brand gold
      daisyPetal: new THREE.MeshStandardMaterial({ color: "#FFFFFF", roughness: 0.9, bumpMap: bumpMap || undefined, bumpScale: 0.015 }),
      lavenderBloom: new THREE.MeshStandardMaterial({ color: "#A29BFE", roughness: 0.95, bumpMap: bumpMap || undefined, bumpScale: 0.03 }),
      lilyPetal: new THREE.MeshStandardMaterial({ color: "#F7CAD0", roughness: 0.9, bumpMap: bumpMap || undefined, bumpScale: 0.02 }),
      babysBreath: new THREE.MeshStandardMaterial({ color: "#FFFFFF", roughness: 0.9 }),
      carnationPetal: new THREE.MeshStandardMaterial({ color: "#E05A75", roughness: 0.9, bumpMap: bumpMap || undefined, bumpScale: 0.03 }), // Rich pink
      
      // Wrappers
      wrapKraft: new THREE.MeshStandardMaterial({ color: "#C6AC8F", roughness: 0.92, side: THREE.DoubleSide }),
      wrapStandard: new THREE.MeshStandardMaterial({ color: "#FDF6EC", roughness: 0.85, side: THREE.DoubleSide }), // Brand cream
      wrapLuxury: new THREE.MeshStandardMaterial({ color: "#111111", roughness: 0.7, side: THREE.DoubleSide }), // Matte black outer wrap
      wrapGold: new THREE.MeshStandardMaterial({ color: "#E4B34F", roughness: 0.4, metalness: 0.35, side: THREE.DoubleSide }), // Gold inner wrap
      wrapSatin: new THREE.MeshStandardMaterial({ color: "#9B5DE5", roughness: 0.2, metalness: 0.15, side: THREE.DoubleSide }),
      ribbonRed: new THREE.MeshStandardMaterial({ color: "#E76F51", roughness: 0.45 }),
      ribbonGold: new THREE.MeshStandardMaterial({ color: "#E4B34F", roughness: 0.3, metalness: 0.2 }),
      ribbonBlue: new THREE.MeshStandardMaterial({ color: "#A9DEF9", roughness: 0.35, metalness: 0.1 }),
    };

    // Shared Geometries
    const geometries = {
      stem: new THREE.CylinderGeometry(0.018, 0.018, 2.2, 8),
      leaf: new THREE.ConeGeometry(0.06, 0.18, 4),
      rosePetal: new THREE.BoxGeometry(0.12, 0.18, 0.012),
      daisyPetal: new THREE.BoxGeometry(0.038, 0.14, 0.008),
      disk: new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16),
      lavenderBlob: new THREE.SphereGeometry(0.05, 8, 8),
      wrapCone1: new THREE.CylinderGeometry(1.25, 0.2, 2.0, 16, 1, true),
      wrapCone2: new THREE.CylinderGeometry(1.3, 0.22, 2.0, 16, 1, true),
      ribbonRing: new THREE.TorusGeometry(0.24, 0.035, 8, 24),
      bowLoop: new THREE.TorusGeometry(0.11, 0.025, 8, 24, Math.PI * 1.6),
      bowTail: new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8),
    };

    // Build unique flower models programmatically with high detail
    const createFlowerMesh = (type: string) => {
      const flower = new THREE.Group();

      // Stem
      const stem = new THREE.Mesh(geometries.stem, materials.stem);
      stem.position.y = -1.1;
      stem.castShadow = true;
      stem.receiveShadow = true;
      flower.add(stem);

      // Add green leaves branching off the stem
      for (let i = 0; i < 2; i++) {
        const leaf = new THREE.Mesh(geometries.leaf, materials.leaf);
        leaf.position.set(0, -0.6 - i * 0.4, 0);
        // Rotate leaves outwards and slightly up
        leaf.rotation.z = i % 2 === 0 ? 0.8 : -0.8;
        leaf.rotation.y = Math.random() * Math.PI;
        leaf.scale.set(1, 1, 0.2);
        leaf.castShadow = true;
        flower.add(leaf);
      }

      switch (type) {
        case "roses": {
          const head = new THREE.Group();
          // Model spiral rose petals (Fibonacci distribution for realistic bloom)
          const petalCount = 18;
          for (let i = 0; i < petalCount; i++) {
            const petal = new THREE.Mesh(geometries.rosePetal, materials.rosePetal);
            const phi = i * 137.5 * (Math.PI / 180);
            const r = 0.045 * Math.sqrt(i);
            
            petal.position.set(Math.cos(phi) * r, 0.02 + i * 0.007, Math.sin(phi) * r);
            petal.rotation.y = -phi + Math.PI / 2;
            // Flare petals outward as they get farther from the center
            petal.rotation.x = 0.25 + r * 0.5;
            
            petal.castShadow = true;
            petal.receiveShadow = true;
            head.add(petal);
          }
          head.position.y = 0.05;
          flower.add(head);
          break;
        }

        case "tulips": {
          const head = new THREE.Group();
          // Layered tulip cup with 6 petals (3 inner, 3 outer)
          for (let i = 0; i < 6; i++) {
            const petal = new THREE.Mesh(geometries.rosePetal, materials.tulipPetal);
            const angle = (i / 6) * Math.PI * 2;
            const r = i < 3 ? 0.06 : 0.095;
            
            petal.position.set(Math.cos(angle) * r, 0.08, Math.sin(angle) * r);
            petal.rotation.y = -angle;
            petal.rotation.x = i < 3 ? 0.12 : 0.25; // outer ones flare more
            petal.scale.set(0.8, 1.4, 0.5);
            
            petal.castShadow = true;
            petal.receiveShadow = true;
            head.add(petal);
          }
          flower.add(head);
          break;
        }

        case "sunflowers": {
          const head = new THREE.Group();
          head.rotation.x = Math.PI / 6;

          // Textured central seed disk
          const disk = new THREE.Mesh(geometries.disk, materials.sunflowerDisk);
          disk.rotation.x = Math.PI / 2;
          disk.castShadow = true;
          disk.receiveShadow = true;
          head.add(disk);

          // Render seed bumps programmatically
          const seedCount = 40;
          const seedGeo = new THREE.SphereGeometry(0.016, 6, 6);
          const seedMat = new THREE.MeshStandardMaterial({ color: "#251B14", roughness: 0.9 });
          for (let i = 0; i < seedCount; i++) {
            const seed = new THREE.Mesh(seedGeo, seedMat);
            const phi = i * 137.5 * (Math.PI / 180);
            const r = 0.024 * Math.sqrt(i);
            if (r < 0.16) {
              seed.position.set(Math.cos(phi) * r, 0.022, Math.sin(phi) * r);
              head.add(seed);
            }
          }

          // Double layer yellow petals
          const petalCount = 20;
          for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            
            // Inner row
            const petal1 = new THREE.Mesh(geometries.daisyPetal, materials.sunflowerPetal);
            petal1.position.set(Math.cos(angle) * 0.24, 0, Math.sin(angle) * 0.24);
            petal1.rotation.y = -angle;
            petal1.rotation.z = Math.PI / 2;
            petal1.rotation.x = 0.1;
            petal1.scale.set(1.1, 1.6, 0.6);
            petal1.castShadow = true;
            head.add(petal1);

            // Outer row (staggered and flared)
            const angle2 = angle + Math.PI / petalCount;
            const petal2 = new THREE.Mesh(geometries.daisyPetal, materials.sunflowerPetal);
            petal2.position.set(Math.cos(angle2) * 0.26, -0.015, Math.sin(angle2) * 0.26);
            petal2.rotation.y = -angle2;
            petal2.rotation.z = Math.PI / 2;
            petal2.rotation.x = 0.25; // flare more
            petal2.scale.set(1.1, 1.5, 0.6);
            petal2.castShadow = true;
            head.add(petal2);
          }
          flower.add(head);
          break;
        }

        case "daisies": {
          const head = new THREE.Group();
          head.rotation.x = Math.PI / 8;

          // Daisy yellow center
          const center = new THREE.Mesh(geometries.lavenderBlob, materials.daisyCenter);
          center.scale.set(2.4, 0.8, 2.4);
          center.castShadow = true;
          head.add(center);

          // Radial white petals
          const petalCount = 18;
          for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const petal = new THREE.Mesh(geometries.daisyPetal, materials.daisyPetal);
            petal.position.set(Math.cos(angle) * 0.18, 0, Math.sin(angle) * 0.18);
            petal.rotation.y = -angle;
            petal.rotation.z = Math.PI / 2;
            petal.scale.set(1, 1.2, 0.6);
            petal.castShadow = true;
            head.add(petal);
          }
          flower.add(head);
          break;
        }

        case "lavender": {
          const head = new THREE.Group();
          // Lavender spiral bloom clusters
          const tiers = 6;
          for (let j = 0; j < tiers; j++) {
            const height = j * 0.13;
            const size = 1.0 - j * 0.08;
            
            for (let k = 0; k < 5; k++) {
              const bloom = new THREE.Mesh(geometries.lavenderBlob, materials.lavenderBloom);
              const angle = (k / 5) * Math.PI * 2 + j * 0.5; // rotate each tier slightly
              
              bloom.position.set(Math.cos(angle) * 0.065, height, Math.sin(angle) * 0.065);
              bloom.scale.set(size, size * 1.1, size);
              bloom.castShadow = true;
              head.add(bloom);
            }
          }
          flower.add(head);
          break;
        }

        case "lilies": {
          const head = new THREE.Group();
          head.rotation.x = Math.PI / 8;

          const center = new THREE.Mesh(geometries.lavenderBlob, new THREE.MeshStandardMaterial({ color: "#DDA15E", roughness: 0.9 }));
          center.scale.set(0.6, 0.6, 0.6);
          head.add(center);

          // Star lily open petals (curved)
          const petalCount = 6;
          for (let i = 0; i < petalCount; i++) {
            const petal = new THREE.Mesh(geometries.rosePetal, materials.lilyPetal);
            const angle = (i / petalCount) * Math.PI * 2;
            petal.position.set(Math.cos(angle) * 0.15, 0.06, Math.sin(angle) * 0.15);
            petal.rotation.y = -angle;
            petal.rotation.x = 0.4;
            petal.scale.set(1.1, 1.8, 0.5);
            petal.castShadow = true;
            head.add(petal);
          }
          flower.add(head);
          break;
        }

        case "babys-breath": {
          // Delicate multi-branched sprig
          const head = new THREE.Group();
          const branches = 8;
          for (let i = 0; i < branches; i++) {
            const sprig = new THREE.Group();
            sprig.position.set(
              (Math.random() - 0.5) * 0.25,
              0.1 + Math.random() * 0.25,
              (Math.random() - 0.5) * 0.25
            );
            
            const blossom = new THREE.Mesh(geometries.lavenderBlob, materials.babysBreath);
            blossom.scale.set(0.38, 0.38, 0.38);
            blossom.castShadow = true;
            sprig.add(blossom);
            
            // tiny sub-stem
            const subStemGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.3, 4);
            const subStem = new THREE.Mesh(subStemGeo, materials.stem);
            subStem.position.y = -0.15;
            subStem.rotation.z = (Math.random() - 0.5) * 0.8;
            sprig.add(subStem);
            head.add(sprig);
          }
          flower.add(head);
          break;
        }

        case "carnations": {
          const head = new THREE.Group();
          // Ruffled head using grouped overlapping scaled shells
          const ruffCount = 14;
          for (let i = 0; i < ruffCount; i++) {
            const ruffle = new THREE.Mesh(geometries.rosePetal, materials.carnationPetal);
            ruffle.position.set(
              (Math.random() - 0.5) * 0.1,
              0.05 + (Math.random() - 0.5) * 0.08,
              (Math.random() - 0.5) * 0.1
            );
            ruffle.rotation.set(
              Math.random() * Math.PI,
              Math.random() * Math.PI,
              Math.random() * Math.PI
            );
            ruffle.scale.set(0.65, 0.65, 0.65);
            ruffle.castShadow = true;
            head.add(ruffle);
          }
          head.scale.set(1.25, 1.25, 1.25);
          flower.add(head);
          break;
        }
      }

      return flower;
    };

    // Upgraded Layered and Creased Wrapping Paper & Bow
    let currentWrappingStyle = "";
    const updateWrappingPaper = (style: string) => {
      // Clear previous wrap components
      while (wrappingGroup.children.length > 0) {
        const obj = wrappingGroup.children[0];
        wrappingGroup.remove(obj);
      }

      let innerMat = materials.wrapKraft;
      let outerMat = materials.wrapKraft;
      let ribMat = materials.ribbonRed;

      if (style === "standard") {
        innerMat = materials.wrapStandard;
        outerMat = materials.wrapStandard;
        ribMat = materials.ribbonRed;
      } else if (style === "luxury") {
        innerMat = materials.wrapGold; // Gold inner sheet
        outerMat = materials.wrapLuxury; // Matte Black outer sheet
        ribMat = materials.ribbonGold; // Shiny Gold bow ribbon
      } else if (style === "satin") {
        innerMat = materials.wrapSatin;
        outerMat = materials.wrapSatin;
        ribMat = materials.ribbonBlue; // Satin blue ribbon
      }

      // Layer 1 - Inner Wrap (flared slightly higher)
      const paper1 = new THREE.Mesh(geometries.wrapCone1, innerMat);
      paper1.position.y = -0.47;
      paper1.scale.set(0.98, 1.02, 0.98);
      paper1.castShadow = true;
      paper1.receiveShadow = true;
      wrappingGroup.add(paper1);

      // Layer 2 - Outer Wrap (slightly offset and rotated for layers)
      const paper2 = new THREE.Mesh(geometries.wrapCone2, outerMat);
      paper2.position.y = -0.5;
      paper2.rotation.y = Math.PI / 6; // rotate slightly for layers
      paper2.scale.set(1.04, 0.96, 1.04);
      paper2.castShadow = true;
      paper2.receiveShadow = true;
      wrappingGroup.add(paper2);

      // Ribbon Band around paper
      const ribbonBand = new THREE.Mesh(geometries.ribbonRing, ribMat);
      ribbonBand.position.set(0, -0.55, 0);
      ribbonBand.rotation.x = Math.PI / 2;
      ribbonBand.castShadow = true;
      wrappingGroup.add(ribbonBand);

      // Model a full 3D ribbon bow tied in front
      const bowGroup = new THREE.Group();
      bowGroup.position.set(0, -0.55, 0.27); // tie in front

      // Left Bow Loop
      const loopL = new THREE.Mesh(geometries.bowLoop, ribMat);
      loopL.position.set(-0.08, 0, 0);
      loopL.rotation.y = Math.PI / 6;
      loopL.rotation.z = Math.PI / 6;
      loopL.castShadow = true;
      bowGroup.add(loopL);

      // Right Bow Loop
      const loopR = new THREE.Mesh(geometries.bowLoop, ribMat);
      loopR.position.set(0.08, 0, 0);
      loopR.rotation.y = -Math.PI / 6;
      loopR.rotation.z = -Math.PI / 6;
      loopR.rotation.x = Math.PI; // flip
      loopR.castShadow = true;
      bowGroup.add(loopR);

      // Bow Knot center
      const knotGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const knot = new THREE.Mesh(knotGeo, ribMat);
      knot.scale.set(1.2, 1, 0.8);
      knot.castShadow = true;
      bowGroup.add(knot);

      // Ribbon Tails hanging down
      const tailL = new THREE.Mesh(geometries.bowTail, ribMat);
      tailL.position.set(-0.05, -0.16, 0.02);
      tailL.rotation.z = Math.PI / 6;
      tailL.castShadow = true;
      bowGroup.add(tailL);

      const tailR = new THREE.Mesh(geometries.bowTail, ribMat);
      tailR.position.set(0.05, -0.16, 0.02);
      tailR.rotation.z = -Math.PI / 6;
      tailR.castShadow = true;
      bowGroup.add(tailR);

      wrappingGroup.add(bowGroup);

      // Special Luxury box outer shell
      if (style === "luxury") {
        const boxGeo = new THREE.CylinderGeometry(0.85, 0.85, 1.7, 16);
        const box = new THREE.Mesh(boxGeo, materials.wrapLuxury);
        box.position.y = -0.7;
        box.castShadow = true;
        box.receiveShadow = true;
        wrappingGroup.add(box);
        boxGeo.dispose();
      }

      currentWrappingStyle = style;
    };

    // Rebuild the customized arrangement
    const rebuildFlowers = () => {
      while (flowersGroup.children.length > 0) {
        const obj = flowersGroup.children[0];
        flowersGroup.remove(obj);
      }

      const activeList: string[] = [];
      Object.entries(quantitiesRef.current).forEach(([id, qty]) => {
        for (let i = 0; i < qty; i++) {
          activeList.push(id);
        }
      });

      const count = activeList.length;
      activeList.forEach((type, idx) => {
        const flowerMesh = createFlowerMesh(type);
        
        if (count === 1) {
          flowerMesh.position.set(0, 0.35, 0);
          flowerMesh.rotation.set(0, 0, 0);
        } else {
          // Spread inside wrapping cone in a clean spiral pattern
          const theta = idx * 2.39996;
          const r = 0.38 * Math.sqrt(idx / count);
          
          const x = r * Math.cos(theta);
          const z = r * Math.sin(theta);
          const y = 0.45 - r * 0.35 + (Math.random() * 0.06); 

          flowerMesh.position.set(x, y, z);
          
          // Outer flare angle rotation
          flowerMesh.rotation.z = -x * 0.45;
          flowerMesh.rotation.x = z * 0.45;
          flowerMesh.rotation.y = Math.random() * Math.PI;
        }

        flowersGroup.add(flowerMesh);
      });
    };

    // Initial render setup
    rebuildFlowers();
    updateWrappingPaper(wrappingRef.current);
    setLoading(false);

    // Soft lighting with shadow maps
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.25);
    dirLight.position.set(4, 9, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 12;
    dirLight.shadow.camera.left = -2.5;
    dirLight.shadow.camera.right = 2.5;
    dirLight.shadow.camera.top = 2.5;
    dirLight.shadow.camera.bottom = -2.5;
    dirLight.shadow.bias = -0.0006;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffe5ec, 0.45); // pink fill
    fillLight.position.set(-4, -1, -2);
    scene.add(fillLight);

    // Click and drag Orbit rotation logic
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y,
      };

      bouquetGroup.rotation.y += deltaMove.x * 0.008;
      bouquetGroup.rotation.x += deltaMove.y * 0.008;
      bouquetGroup.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, bouquetGroup.rotation.x));

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        isDragging = true;
        previousMousePosition = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
        };
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isDragging || event.touches.length !== 1) return;

      const deltaMove = {
        x: event.touches[0].clientX - previousMousePosition.x,
        y: event.touches[0].clientY - previousMousePosition.y,
      };

      bouquetGroup.rotation.y += deltaMove.x * 0.008;
      bouquetGroup.rotation.x += deltaMove.y * 0.008;
      bouquetGroup.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, bouquetGroup.rotation.x));

      previousMousePosition = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    dom.addEventListener("touchstart", onTouchStart, { passive: true });
    dom.addEventListener("touchmove", onTouchMove, { passive: true });
    dom.addEventListener("touchend", onTouchEnd);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto rotation when idle
      if (!isDragging) {
        bouquetGroup.rotation.y += 0.0035;
      }

      // Check state updates
      if (JSON.stringify(quantitiesRef.current) !== JSON.stringify(quantities)) {
        // Quantities have changed, rebuild arrangement
        rebuildFlowers();
      }
      if (wrappingRef.current !== currentWrappingStyle) {
        updateWrappingPaper(wrappingRef.current);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!currentMount) return;
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("touchstart", onTouchStart);
      dom.removeEventListener("touchmove", onTouchMove);
      dom.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", handleResize);

      if (currentMount && dom) {
        currentMount.removeChild(dom);
      }

      // Clean resources
      Object.values(geometries).forEach((g) => g.dispose());
      Object.values(materials).forEach((m) => m.dispose());
      if (bumpMap) bumpMap.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[300px] flex items-center justify-center bg-[#FAF9F6]/50 rounded-2xl border border-border/40 overflow-hidden cursor-grab active:cursor-grabbing">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-3 border-rose-pink border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-background/80 border border-border/40 text-[10px] text-muted-foreground rounded-md select-none pointer-events-none">
        Drag to Orbit 🔄
      </div>
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}
