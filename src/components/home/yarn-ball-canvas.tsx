"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function YarnBallCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Dimensions
    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5.2;

    // Renderer with shadow support
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    currentMount.appendChild(renderer.domElement);

    // Group to hold the entire scene
    const group = new THREE.Group();
    scene.add(group);

    // Helper: Create a procedural knitted yarn canvas texture for bump mapping
    const createKnitTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Base gray color for bump map (neutral)
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, 128, 128);

      // Draw repeating knit stitch columns
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let col = 0; col < 128; col += 16) {
        // Draw interlinked wave patterns representing twist in wool fibers
        ctx.strokeStyle = "#ffffff"; // Highlights (bumps)
        ctx.beginPath();
        for (let y = -8; y <= 136; y += 8) {
          const shift = (y / 8) % 2 === 0 ? 5 : -5;
          ctx.lineTo(col + 8 + shift, y);
        }
        ctx.stroke();

        ctx.strokeStyle = "#1a1a1a"; // Shadows (valleys)
        ctx.beginPath();
        for (let y = -8; y <= 136; y += 8) {
          const shift = (y / 8) % 2 === 0 ? -5 : 5;
          ctx.lineTo(col + 8 + shift, y);
        }
        ctx.stroke();
      }

      // Add a bit of fine fiber noise
      for (let i = 0; i < 600; i++) {
        const x = Math.random() * 128;
        const y = Math.random() * 128;
        const radius = Math.random() * 1.2;
        ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#000000";
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
      return texture;
    };

    const bumpMap = createKnitTexture();

    // Reusable materials
    const mainYarnColor = new THREE.Color("#C02942"); // Brand Crimson Red
    const yarnMaterial = new THREE.MeshStandardMaterial({
      color: mainYarnColor,
      roughness: 0.95,
      metalness: 0.02,
      bumpMap: bumpMap || undefined,
      bumpScale: 0.035,
    });

    const coreMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#8A1C2E"), // Darker crimson core
      roughness: 0.95,
      bumpMap: bumpMap || undefined,
      bumpScale: 0.02,
    });

    const hookMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#CCCCCC"),
      roughness: 0.2,
      metalness: 0.85,
    });

    const hookHandleMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#2B2D42"), // matte dark grip
      roughness: 0.7,
    });

    // 1. Yarn Ball Core (Sphere)
    const coreGeo = new THREE.SphereGeometry(1.18, 32, 32);
    const core = new THREE.Mesh(coreGeo, coreMaterial);
    core.castShadow = true;
    core.receiveShadow = true;
    group.add(core);

    // 2. Wrap yarn strands (detailed torus layout)
    const strandsCount = 42;
    const strandGeometries: THREE.TorusGeometry[] = [];

    for (let i = 0; i < strandsCount; i++) {
      const radius = 1.19 + Math.random() * 0.07;
      const thickness = 0.038 + Math.random() * 0.008;
      
      const strandGeo = new THREE.TorusGeometry(radius, thickness, 10, 64);
      strandGeometries.push(strandGeo);
      
      const strand = new THREE.Mesh(strandGeo, yarnMaterial);
      strand.rotation.x = Math.random() * Math.PI;
      strand.rotation.y = Math.random() * Math.PI;
      strand.rotation.z = Math.random() * Math.PI;
      
      strand.castShadow = true;
      strand.receiveShadow = true;
      group.add(strand);
    }

    // 3. Add loose fuzzy fibers (tiny bezier lines for organic/woolly silhouette)
    const fiberCount = 120;
    const fiberMaterial = new THREE.LineBasicMaterial({
      color: mainYarnColor,
      transparent: true,
      opacity: 0.6,
      linewidth: 1, // Note: width > 1 is not supported by WebGL on most platforms, standard width of 1 is fine
    });

    const fiberGeometries: THREE.BufferGeometry[] = [];

    for (let i = 0; i < fiberCount; i++) {
      // Generate random point on sphere surface
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      const r = 1.25;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const p0 = new THREE.Vector3(x, y, z);
      
      // Extend outward
      const height = 0.04 + Math.random() * 0.12;
      const p2 = p0.clone().multiplyScalar(1 + height / r);
      
      // Curve offset
      const p1 = p0.clone().add(p2).multiplyScalar(0.5);
      p1.x += (Math.random() - 0.5) * 0.08;
      p1.y += (Math.random() - 0.5) * 0.08;
      p1.z += (Math.random() - 0.5) * 0.08;

      const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
      const points = curve.getPoints(5);
      
      const fiberGeo = new THREE.BufferGeometry().setFromPoints(points);
      fiberGeometries.push(fiberGeo);

      const line = new THREE.Line(fiberGeo, fiberMaterial);
      group.add(line);
    }

    // 4. Upgraded Crochet Hook
    const hookGroup = new THREE.Group();
    
    // Needle metal shaft
    const shaftGeo = new THREE.CylinderGeometry(0.042, 0.042, 3.2, 16);
    const shaft = new THREE.Mesh(shaftGeo, hookMaterial);
    shaft.position.y = 0.5;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    hookGroup.add(shaft);

    // Tip hook curve (modeled from multiple segments)
    const tipCurveGeo = new THREE.TorusGeometry(0.09, 0.036, 8, 16, Math.PI * 1.1);
    const tipCurve = new THREE.Mesh(tipCurveGeo, hookMaterial);
    tipCurve.position.set(0.06, 2.1, 0);
    tipCurve.rotation.z = -Math.PI / 3;
    tipCurve.castShadow = true;
    hookGroup.add(tipCurve);

    // Needle flat rubber grip/handle
    const handleGeo = new THREE.BoxGeometry(0.12, 1.8, 0.06);
    const handle = new THREE.Mesh(handleGeo, hookHandleMaterial);
    handle.position.y = -1.2;
    handle.castShadow = true;
    handle.receiveShadow = true;
    hookGroup.add(handle);

    // Rotate and position hook inside the yarn ball
    hookGroup.rotation.z = Math.PI / 4;
    hookGroup.rotation.x = Math.PI / 8;
    group.add(hookGroup);

    // Soft Shadow-casting Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight1.position.set(4, 7, 4);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    dirLight1.shadow.camera.near = 0.5;
    dirLight1.shadow.camera.far = 12;
    // Tight orthographic camera bounds for crisp shadows
    dirLight1.shadow.camera.left = -2;
    dirLight1.shadow.camera.right = 2;
    dirLight1.shadow.camera.top = 2;
    dirLight1.shadow.camera.bottom = -2;
    dirLight1.shadow.bias = -0.0005;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf5d061, 0.65); // Brand gold fill
    dirLight2.position.set(-4, -1, 3);
    scene.add(dirLight2);

    setLoading(false);

    // Mouse Tracking for Parallax
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      targetX = (x / rect.width) * 2 - 1;
      targetY = -(y / rect.height) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto rotation
      group.rotation.y += 0.002;
      group.rotation.x += 0.0008;

      // Lerp for smooth interactive cursor tilt
      currentX += (targetX - currentX) * 0.045;
      currentY += (targetY - currentY) * 0.045;

      group.rotation.y = currentX * 0.7 + (group.rotation.y % (Math.PI * 2));
      group.rotation.x = -currentY * 0.6 + (group.rotation.x % (Math.PI * 2));

      // Gentle floating animation
      group.position.y = Math.sin(Date.now() * 0.0012) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!currentMount) return;
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight || 450;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }

      // Dispose
      coreGeo.dispose();
      coreMaterial.dispose();
      yarnMaterial.dispose();
      hookMaterial.dispose();
      hookHandleMaterial.dispose();
      shaftGeo.dispose();
      tipCurveGeo.dispose();
      handleGeo.dispose();
      strandGeometries.forEach((g) => g.dispose());
      fiberGeometries.forEach((g) => g.dispose());
      fiberMaterial.dispose();
      if (bumpMap) bumpMap.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[350px] sm:h-[450px] flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-rose-pink border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}
