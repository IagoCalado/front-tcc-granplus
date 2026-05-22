import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "../../contexts/ThemeContext";

const NET_COMMON_OPTIONS = {
	mouseControls: true,
	touchControls: true,
	gyroControls: false,
	minHeight: 200.0,
	minWidth: 200.0,
	scale: 1.0,
	scaleMobile: 1.0,
	points: 12.0,
	maxDistance: 24.0,
	spacing: 18.0,
	showDots: true,
};

const THEME_CONFIG = {
	dark: {
		color: "#00d2ff",
		backgroundColor: "#050505",
		fallbackColor: "#00d2ff",
	},
	light: {
		color: "#111111",
		backgroundColor: "#eef6ff",
		fallbackColor: "#111111",
	},
};

// Alternativa de lona leve para garantir a visibilidade das partículas caso a canva falhe.
function createFallback(canvas, opts = {}) {
	const ctx = canvas.getContext("2d");
	let w = (canvas.width = canvas.clientWidth);
	let h = (canvas.height = canvas.clientHeight);
	const color = opts.color || "#00d2ff";
	const pointCount = opts.points || 36;
	const maxDist = opts.maxDistance || 160;
	const points = [];
	let rafId;

	function resize() {
		w = canvas.width = canvas.clientWidth || window.innerWidth;
		h = canvas.height = canvas.clientHeight || window.innerHeight;
	}

	function initPoints() {
		points.length = 0;
		for (let i = 0; i < pointCount; i++) {
			points.push({
				x: Math.random() * w,
				y: Math.random() * h,
				vx: (Math.random() - 0.5) * 0.4,
				vy: (Math.random() - 0.5) * 0.4,
			});
		}
	}

	function draw() {
		ctx.clearRect(0, 0, w, h);

		// desenhar linhas
		for (let i = 0; i < points.length; i++) {
			const p = points[i];
			for (let j = i + 1; j < points.length; j++) {
				const q = points[j];
				const dx = p.x - q.x;
				const dy = p.y - q.y;
				const d2 = dx * dx + dy * dy;
				if (d2 < maxDist * maxDist) {
					const alpha = 0.55 * (1 - d2 / (maxDist * maxDist));
					ctx.strokeStyle = `${color}`;
					ctx.globalAlpha = alpha * 0.9;
					ctx.lineWidth = 1;
					ctx.beginPath();
					ctx.moveTo(p.x, p.y);
					ctx.lineTo(q.x, q.y);
					ctx.stroke();
				}
			}
		}

		// pontos
		for (let i = 0; i < points.length; i++) {
			const p = points[i];
			ctx.beginPath();
			ctx.fillStyle = color;
			ctx.globalAlpha = 0.95;
			ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
			ctx.fill();
		}

		// mover
		for (let i = 0; i < points.length; i++) {
			const p = points[i];
			p.x += p.vx;
			p.y += p.vy;
			if (p.x < -10) p.x = w + 10;
			if (p.x > w + 10) p.x = -10;
			if (p.y < -10) p.y = h + 10;
			if (p.y > h + 10) p.y = -10;
		}

		rafId = requestAnimationFrame(draw);
	}

	function start() {
		resize();
		initPoints();
		rafId = requestAnimationFrame(draw);
		window.addEventListener("resize", resize);
	}

	function stop() {
		cancelAnimationFrame(rafId);
		window.removeEventListener("resize", resize);
	}

	start();
	return { stop };
}

const NeonParticles = () => {
	const containerRef = useRef(null);
	const canvasRef = useRef(null);
	const { theme } = useTheme();

	useEffect(() => {
		if (!containerRef.current) return undefined;

		const themeName = theme === "light" ? "light" : "dark";
		const activeTheme = THEME_CONFIG[themeName];
		const netOptions = {
			...NET_COMMON_OPTIONS,
			color: activeTheme.color,
			backgroundColor: activeTheme.backgroundColor,
		};

		let vantaEffect;
		let fallbackHandle;
		let isCancelled = false;
		const previousThree = window.THREE;
		window.THREE = THREE;

		// Tente o Vanta, mas se ele não inicializar em 700 ms, use o fallback
		const vantaPromise = import("vanta/dist/vanta.net.min").then((module) => {
			if (isCancelled || !containerRef.current) return null;
			try {
				vantaEffect = module.default({
					el: containerRef.current,
					...netOptions,
				});
				return vantaEffect;
			} catch {
				return null;
			}
		});

		const fallbackTimer = window.setTimeout(async () => {
			const resolved = await Promise.race([vantaPromise, Promise.resolve(null)]);
			if (!resolved && !isCancelled && canvasRef.current) {
				// start fallback
				fallbackHandle = createFallback(canvasRef.current, {
					color: activeTheme.fallbackColor,
					points: 360, /* Quantidade de particula */
					maxDistance: 140,
				});
			}
		}, 700);

		vantaPromise.catch(() => {});

		return () => {
			isCancelled = true;
			clearTimeout(fallbackTimer);
			if (vantaEffect && typeof vantaEffect.destroy === "function") {
				vantaEffect.destroy();
			}
			if (fallbackHandle && typeof fallbackHandle.stop === "function") {
				fallbackHandle.stop();
			}
			window.THREE = previousThree;
		};
	}, [theme]);

	return (
		<div ref={containerRef} className="login-particles" aria-hidden="true">
			<canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
		</div>
	);
};

export default NeonParticles;