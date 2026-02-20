// ═══════════════════════════════════════════════════════════════
//  Premium Particle Sphere — Corona Halo Effect
//  Bright scattered rim · Dark center · Warm→Cool gradient
//  Speaking = dramatic rim expansion + color intensification
// ═══════════════════════════════════════════════════════════════

window.sphereState = 'idle';
window.updateSphereState = function (s) { window.sphereState = s; };

var scene, camera, renderer;
var particles, particleMat;
var clock = new THREE.Clock();
var intensity = 0, target = 0;

// ── Simplex 3D Noise ──
var NOISE = [
    'vec3 mod289(vec3 x){return x-floor(x/289.0)*289.0;}',
    'vec4 mod289(vec4 x){return x-floor(x/289.0)*289.0;}',
    'vec4 permute(vec4 x){return mod289((x*34.0+1.0)*x);}',
    'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
    'float snoise(vec3 v){',
    '  const vec2 C=vec2(1.0/6.0,1.0/3.0);',
    '  const vec4 D=vec4(0.0,0.5,1.0,2.0);',
    '  vec3 i=floor(v+dot(v,C.yyy));',
    '  vec3 x0=v-i+dot(i,C.xxx);',
    '  vec3 g=step(x0.yzx,x0.xyz);',
    '  vec3 l=1.0-g;',
    '  vec3 i1=min(g,l.zxy);',
    '  vec3 i2=max(g,l.zxy);',
    '  vec3 x1=x0-i1+C.xxx;',
    '  vec3 x2=x0-i2+C.yyy;',
    '  vec3 x3=x0-D.yyy;',
    '  i=mod289(i);',
    '  vec4 p=permute(permute(permute(',
    '    i.z+vec4(0.0,i1.z,i2.z,1.0))',
    '    +i.y+vec4(0.0,i1.y,i2.y,1.0))',
    '    +i.x+vec4(0.0,i1.x,i2.x,1.0));',
    '  float n_=0.142857142857;',
    '  vec3 ns=n_*D.wyz-D.xzx;',
    '  vec4 j=p-49.0*floor(p*ns.z*ns.z);',
    '  vec4 x_=floor(j*ns.z);',
    '  vec4 y_=floor(j-7.0*x_);',
    '  vec4 x=x_*ns.x+ns.yyyy;',
    '  vec4 y=y_*ns.x+ns.yyyy;',
    '  vec4 h=1.0-abs(x)-abs(y);',
    '  vec4 b0=vec4(x.xy,y.xy);',
    '  vec4 b1=vec4(x.zw,y.zw);',
    '  vec4 s0=floor(b0)*2.0+1.0;',
    '  vec4 s1=floor(b1)*2.0+1.0;',
    '  vec4 sh=-step(h,vec4(0.0));',
    '  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;',
    '  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
    '  vec3 p0=vec3(a0.xy,h.x);',
    '  vec3 p1=vec3(a0.zw,h.y);',
    '  vec3 p2=vec3(a1.xy,h.z);',
    '  vec3 p3=vec3(a1.zw,h.w);',
    '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
    '  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
    '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);',
    '  m=m*m;',
    '  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
    '}'
].join('\n');

// ═══════════════════════════════════════════════════════════════
//  VERTEX SHADER — Corona/Halo effect
//  Edge particles = BRIGHT, LARGE, scattered outward
//  Center particles = dim, small, see-through
// ═══════════════════════════════════════════════════════════════
var particleVS = NOISE + '\n' + [
    'uniform float uTime;',
    'uniform float uIntensity;',
    'uniform float uPointSize;',
    '',
    'varying vec3 vColor;',
    'varying float vAlpha;',
    '',
    'void main(){',
    '  vec3 pos = position;',
    '  vec3 nrm = normalize(position);',
    '  float t = uTime;',
    '',
    '  // ═══ DISPLACEMENT ═══',
    '  // Base: gentle organic breathing',
    '  float n1 = snoise(nrm * 0.8 + t * 0.15) * 0.05;',
    '',
    '  // Speaking: flowing waves - CALM & BIG',
    '  // Slower speed for "calm" feel, higher amplitude for "big" pulse',
    '  float st = t * 1.5; // Slower wave speed (was 3.0)',
    '  ',
    '  // Wave 1: Vertical distinct bands (voice frequency visualization)',
    '  float w1 = sin(nrm.y * 5.0 - st) * 0.2; // Fewer bands, bigger waves',
    '  ',
    '  // Wave 2: Horizontal organic flow',
    '  float w2 = sin(nrm.x * 4.0 + st * 0.7) * 0.1;',
    '  ',
    '  // Noise: Finely textured jitter - reduced for calmness',
    '  float n2 = snoise(nrm * 2.5 + vec3(0, st, 0)) * 0.05;',
    '  ',
    '  // Combine: Base breathing + Speaking pulse (Big amplitude)',
    '  float speakDisp = (w1 + w2 + n2) * uIntensity * 2.0; // BIG pulse',
    '  ',
    '  float disp = n1 + speakDisp;',
    '  vec3 newPos = pos + nrm * disp;',
    '',
    '  // ═══ FRESNEL (edge detection) ═══',
    '  vec4 mvPos = modelViewMatrix * vec4(newPos, 1.0);',
    '  vec3 viewDir = normalize(-mvPos.xyz);',
    '  vec3 vNrm = normalize(normalMatrix * nrm);',
    '  float facing = dot(viewDir, vNrm);',  // 1=front, 0=edge, -1=back
    '  float rim = 1.0 - abs(facing);',
    '  rim = pow(rim, 1.5);', // smooth edge falloff
    '',
    '  // ═══ RIM SCATTER — push edge particles outward for halo ═══',
    '  float scatter = snoise(nrm * 3.0 + t * 0.5) * rim * 0.15;',
    '  scatter += snoise(nrm * 6.0 - t * 0.3) * rim * 0.08;',
    '  newPos += nrm * scatter * (1.0 + uIntensity * 2.0);',
    '',
    '  // Recalculate mvPos after scatter',
    '  mvPos = modelViewMatrix * vec4(newPos, 1.0);',
    '',
    '  // ═══ COLOR — warm→cool gradient (orange/pink→purple→cyan/blue) ═══',
    '  float height = nrm.y * 0.5 + 0.5;', // 0=bottom, 1=top
    '  float angle = atan(nrm.x, nrm.z) / 6.2832 + 0.5;',
    '  float ci = fract(height + angle * 0.15 + t * 0.02);',
    '',
    '  // 5-color palette matching GREEN website theme',
    '  vec3 cGold     = vec3(1.0, 0.85, 0.30);',   // premium gold
    '  vec3 cMint     = vec3(0.40, 0.95, 0.75);',   // bright mint/emerald
    '  vec3 cTeal     = vec3(0.05, 0.70, 0.80);',   // deep teal
    '  vec3 cForest   = vec3(0.02, 0.35, 0.25);',   // dark forest green
    '  vec3 cWhite    = vec3(0.90, 1.00, 0.95);',   // white-green highlight
    '',
    '  vec3 color;',
    '  if (ci < 0.20)      color = mix(cGold, cMint, ci / 0.20);',
    '  else if (ci < 0.40) color = mix(cMint, cTeal, (ci - 0.20) / 0.20);',
    '  else if (ci < 0.60) color = mix(cTeal, cForest, (ci - 0.40) / 0.20);',
    '  else if (ci < 0.80) color = mix(cForest, cWhite, (ci - 0.60) / 0.20);',
    '  else                color = mix(cWhite, cGold, (ci - 0.80) / 0.20);',
    '',
    '  // ═══ BRIGHTNESS: Balanced solid look ═══',
    '  // Rim is still brighter, but center is fully visible',
    '  float rimBright = rim * 1.5;',
    '  float centerBright = max(facing, 0.0) * 0.8;',
    '  color *= (0.6 + centerBright + rimBright);',
    '',
    '  // Speaking energy pulse',
    '  color *= 1.0 + uIntensity * 1.2;',
    '  color *= 1.0 + sin(t * 7.0) * uIntensity * 0.2;',
    '',
    '  vColor = color;',
    '',
    '  // ═══ ALPHA: Hollow shell look ═══',
    '  // Front: 0.1, Rim: 1.0. Back: 0.1 (depth)',
    '  // Removed heavy center fill to clear the "circle"',
    '  vAlpha = 0.1 + rim * 0.9 + uIntensity * 0.2;',
    '  vAlpha = clamp(vAlpha, 0.0, 1.0);',
    '',
    '  // ═══ POINT SIZE: Uniform premium dots ═══',
    '  float sizeMod = 0.8 + rim * 0.5 + uIntensity * 0.3;',
    '  gl_PointSize = uPointSize * sizeMod;',
    '',
    '  gl_Position = projectionMatrix * mvPos;',
    '}'
].join('\n');

// ═══════════════════════════════════════════════════════════════
//  FRAGMENT SHADER — Glowing dot
// ═══════════════════════════════════════════════════════════════
var particleFS = [
    'varying vec3 vColor;',
    'varying float vAlpha;',
    '',
    'void main(){',
    '  vec2 uv = gl_PointCoord - 0.5;',
    '  float d = length(uv);',
    '  if(d > 0.5) discard;',
    '',
    '  // Bright core + soft glow falloff',
    '  float core = 1.0 - smoothstep(0.0, 0.15, d);',
    '  float glow = 1.0 - smoothstep(0.0, 0.50, d);',
    '  glow = pow(glow, 1.5);',
    '',
    '  vec3 col = vColor * (0.6 + core * 0.6);',
    '  float alpha = (core * 0.9 + glow * 0.4) * vAlpha;',
    '',
    '  gl_FragColor = vec4(col, alpha);',
    '}'
].join('\n');

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
function initSphere() {
    var canvas = document.getElementById('holo-sphere');
    if (!canvas) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.8; // Enough room so sphere never clips

    renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    var s = Math.min(canvas.clientWidth, canvas.clientHeight);
    if (s < 10) s = 500;
    renderer.setSize(s, s);

    // ── 25k Fibonacci particles ──
    var COUNT = 25000;
    var positions = new Float32Array(COUNT * 3);
    var normals = new Float32Array(COUNT * 3);
    var golden = Math.PI * (3 - Math.sqrt(5));

    for (var i = 0; i < COUNT; i++) {
        var y = 1 - (i / (COUNT - 1)) * 2;
        var r = Math.sqrt(1 - y * y);
        var th = golden * i;
        var x = Math.cos(th) * r;
        var z = Math.sin(th) * r;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        normals[i * 3] = x;
        normals[i * 3 + 1] = y;
        normals[i * 3 + 2] = z;
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

    var dpr = Math.min(window.devicePixelRatio, 2);
    var ptSize = (s / 200) * dpr;

    particleMat = new THREE.ShaderMaterial({
        vertexShader: particleVS,
        fragmentShader: particleFS,
        uniforms: {
            uTime: { value: 0 },
            uIntensity: { value: 0 },
            uPointSize: { value: ptSize }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geo, particleMat);
    scene.add(particles);


}

// ═══════════════════════════════════════════════════════════════
//  ANIMATION
// ═══════════════════════════════════════════════════════════════
var dataArray = null, envelope = 0;

function animate() {
    requestAnimationFrame(animate);
    if (!particleMat || !renderer) return;

    var t = clock.getElapsedTime();

    switch (window.sphereState) {
        case 'listening':
            target = 0.18 + Math.sin(t * 4) * 0.07;
            break;

        case 'speaking':
            var gotAudio = false;
            if (window.audioAnalyser) {
                try {
                    if (!dataArray) dataArray = new Uint8Array(window.audioAnalyser.frequencyBinCount);
                    window.audioAnalyser.getByteFrequencyData(dataArray);
                    var sum = 0, bins = Math.floor(dataArray.length * 0.5);
                    for (var i = 0; i < bins; i++) sum += dataArray[i];
                    var avg = sum / bins;
                    if (avg > 2) {
                        var v = 0.25 + Math.pow(avg / 255, 1.2) * 0.60;
                        v = Math.min(v, 0.80);
                        envelope += ((v > envelope) ? 0.25 : 0.04) * (v - envelope);
                        target = envelope;
                        gotAudio = true;
                    }
                } catch (e) { }
            }
            if (!gotAudio) {
                target = 0.45 + Math.sin(t * 3.5) * 0.12
                    + Math.sin(t * 6.0) * 0.05;
            }
            break;

        default:
            target = 0;
            envelope = 0;
    }

    intensity += (target - intensity) * 0.06;

    particleMat.uniforms.uTime.value = t;
    particleMat.uniforms.uIntensity.value = intensity;

    // Rotation - COMPLETELY STATIC. NO MOVEMENT.
    // user requested NO ROTATION, only pulse.
    particles.rotation.set(0, 0, 0);



    renderer.render(scene, camera);
}

// ═══════════════════════════════════════════════════════════════
//  RESIZE + BOOT
// ═══════════════════════════════════════════════════════════════
function onResize() {
    var c = document.getElementById('holo-sphere');
    if (!c || !renderer) return;
    var w = c.clientWidth, h = c.clientHeight;
    renderer.setSize(w, h);
    if (particleMat) {
        var dpr = Math.min(window.devicePixelRatio, 2);
        particleMat.uniforms.uPointSize.value = (Math.min(w, h) / 200) * dpr;
    }
}

window.addEventListener('load', function () {
    initSphere();
    if (renderer) animate();
    var c = document.getElementById('holo-sphere');
    if (c) c.addEventListener('click', function () {
        var btn = document.getElementById('voice-toggle');
        if (btn) btn.click();
    });
});
window.addEventListener('resize', onResize);
