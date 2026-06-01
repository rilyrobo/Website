// ── Price table ───────────────────────────────────────────────────────────────
const prices = {
    "2d": {
        sketch:     { portrait: 8,  upperhalf: 10, fullbody: 12 },
        lineart:    { portrait: 12, upperhalf: 14, fullbody: 16 },
        flatcolors: { portrait: 16, upperhalf: 18, fullbody: 20 },
        shading:    { portrait: 20, upperhalf: 22, fullbody: 24 },
        charMult: 0.5
    },
    "3d": {
        lowpoly:  { low: 150, high: 225 },
        midpoly:  { low: 225, high: 300 },
        highpoly: { low: 300, high: 500 },
        clothPerItem: { low: 30, high: 100 },
        propPerItem:  { low: 50, high: 100 },
        togglePer: 10, exprPer: 10, dynbonesPer: 10, quest: 50
    },
    bg: { splash: 20, vague: 40, mid: 60, full: 150 },
    rig: { basic: 30, mid: 65, advanced: 100 },
    tex: { low: 30, high: 100 },
    additional: { nsfw: 0.20, rush: 0.25, commercial: 0.50 }
};

// ── Calculator state ──────────────────────────────────────────────────────────
const state = {
    type: '2d',
    style: 'sketch', coverage: 'portrait', chars: 1, bg: 0,
    mesh: 'lowpoly', tex: 30, rig: 0,
    cloth: 0, props: 0, toggles: 0, exprs: 0, dynbones: 0, quest: false,
    nsfw: false, rush: false, commercial: false
};

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    buildCalculator();
    initTosModal();
    initNavImageScroll();
    initCommissionSlider();
    setPriceLabels();
});

// ── Build the calculator HTML inside #commission-calculator ───────────────────
function buildCalculator() {
    const root = document.getElementById('commission-calculator');
    if (!root) return;

    root.innerHTML = `
    <div class="calc-type-tabs">
        <button class="calc-tab active" data-type="2d" onclick="calcSwitchType('2d',this)">
            <span class="calc-tab-icon">✏️</span>
            <span>2D Art</span>
        </button>
        <button class="calc-tab" data-type="3d" onclick="calcSwitchType('3d',this)">
            <span class="calc-tab-icon">📦</span>
            <span>3D / Avatar</span>
        </button>
    </div>

    <!-- 2D panel -->
    <div id="calc-panel-2d" class="calc-panel active">

        <div class="calc-card">
            <div class="calc-card-title">Style</div>
            <div class="calc-chip-group" id="calc-style-chips">
                <button class="calc-chip active" data-val="sketch"    onclick="calcSelectChip(this,'calc-style-chips','style')">Sketch <em>$8+</em></button>
                <button class="calc-chip"        data-val="lineart"   onclick="calcSelectChip(this,'calc-style-chips','style')">Line Art <em>$12+</em></button>
                <button class="calc-chip"        data-val="flatcolors"onclick="calcSelectChip(this,'calc-style-chips','style')">Flat Colours <em>$16+</em></button>
                <button class="calc-chip"        data-val="shading"   onclick="calcSelectChip(this,'calc-style-chips','style')">Full Shading <em>$20+</em></button>
            </div>
        </div>

        <div class="calc-card">
            <div class="calc-card-title">Coverage</div>
            <div class="calc-chip-group" id="calc-coverage-chips">
                <button class="calc-chip active" data-val="portrait"  onclick="calcSelectChip(this,'calc-coverage-chips','coverage')">Portrait <em>head &amp; shoulders</em></button>
                <button class="calc-chip"        data-val="upperhalf" onclick="calcSelectChip(this,'calc-coverage-chips','coverage')">Upper Half</button>
                <button class="calc-chip"        data-val="fullbody"  onclick="calcSelectChip(this,'calc-coverage-chips','coverage')">Full Body</button>
            </div>
        </div>

        <div class="calc-card">
            <div class="calc-card-title">Characters</div>
            <div class="calc-stepper-row">
                <span class="calc-stepper-label">Number of characters</span>
                <div class="calc-stepper">
                    <button class="calc-step-btn" id="chars-minus" onclick="calcStep('chars',-1)" disabled>−</button>
                    <span class="calc-step-val" id="chars-val">1</span>
                    <button class="calc-step-btn" onclick="calcStep('chars',1)">+</button>
                </div>
            </div>
            <p class="calc-hint" id="chars-hint">First character included. Each additional is +50% of base.</p>
        </div>

        <div class="calc-card">
            <div class="calc-card-title">Background</div>
            <div class="calc-slider-row">
                <input type="range" min="0" max="150" step="1" value="0" id="bg-slider" oninput="calcBgSlide()">
                <span class="calc-slider-val" id="bg-val">$0</span>
            </div>
            <p class="calc-hint" id="bg-hint">None — transparent or plain colour</p>
        </div>
    </div>

    <!-- 3D panel -->
    <div id="calc-panel-3d" class="calc-panel">

        <div class="calc-card">
            <div class="calc-card-title">Base Mesh</div>
            <div class="calc-chip-group" id="calc-mesh-chips">
                <button class="calc-chip active" data-val="lowpoly"  onclick="calcSelectChip(this,'calc-mesh-chips','mesh')">Low-Poly <em>$150–225</em></button>
                <button class="calc-chip"        data-val="midpoly"  onclick="calcSelectChip(this,'calc-mesh-chips','mesh')">Mid-Poly <em>$225–300</em></button>
                <button class="calc-chip"        data-val="highpoly" onclick="calcSelectChip(this,'calc-mesh-chips','mesh')">High-Poly <em>$300–500+</em></button>
            </div>
            <p class="calc-hint" id="mesh-hint">Quest / mobile ready. Minimal geometry, optimised for performance.</p>
        </div>

        <div class="calc-card">
            <div class="calc-card-title">Texturing</div>
            <div class="calc-slider-row">
                <input type="range" min="30" max="100" step="1" value="30" id="tex-slider" oninput="calcTexSlide()">
                <span class="calc-slider-val" id="tex-val">$30</span>
            </div>
            <p class="calc-hint">Simple flat textures → complex PBR materials with hand-painting</p>
        </div>

        <div class="calc-card">
            <div class="calc-card-title">Rigging</div>
            <div class="calc-slider-row">
                <input type="range" min="0" max="100" step="1" value="0" id="rig-slider" oninput="calcRigSlide()">
                <span class="calc-slider-val" id="rig-val">$0</span>
            </div>
            <p class="calc-hint" id="rig-hint">No rigging</p>
        </div>

        <div class="calc-card">
            <div class="calc-card-title">Clothing &amp; Props</div>
            <div class="calc-stepper-row">
                <span class="calc-stepper-label">Custom clothing items</span>
                <div class="calc-stepper">
                    <button class="calc-step-btn" id="cloth-minus" onclick="calcStep('cloth',-1)" disabled>−</button>
                    <span class="calc-step-val" id="cloth-val">0</span>
                    <button class="calc-step-btn" onclick="calcStep('cloth',1)">+</button>
                </div>
            </div>
            <div class="calc-stepper-row">
                <span class="calc-stepper-label">Props</span>
                <div class="calc-stepper">
                    <button class="calc-step-btn" id="props-minus" onclick="calcStep('props',-1)" disabled>−</button>
                    <span class="calc-step-val" id="props-val">0</span>
                    <button class="calc-step-btn" onclick="calcStep('props',1)">+</button>
                </div>
            </div>
        </div>

        <div class="calc-card">
            <div class="calc-card-title">VRChat Extras</div>
            <div class="calc-stepper-row">
                <span class="calc-stepper-label">Toggle setups</span>
                <div class="calc-stepper">
                    <button class="calc-step-btn" id="toggles-minus" onclick="calcStep('toggles',-1)" disabled>−</button>
                    <span class="calc-step-val" id="toggles-val">0</span>
                    <button class="calc-step-btn" onclick="calcStep('toggles',1)">+</button>
                </div>
            </div>
            <div class="calc-stepper-row">
                <span class="calc-stepper-label">Custom expressions</span>
                <div class="calc-stepper">
                    <button class="calc-step-btn" id="exprs-minus" onclick="calcStep('exprs',-1)" disabled>−</button>
                    <span class="calc-step-val" id="exprs-val">0</span>
                    <button class="calc-step-btn" onclick="calcStep('exprs',1)">+</button>
                </div>
            </div>
            <div class="calc-stepper-row">
                <span class="calc-stepper-label">Dynamic bones / physics chains</span>
                <div class="calc-stepper">
                    <button class="calc-step-btn" id="dynbones-minus" onclick="calcStep('dynbones',-1)" disabled>−</button>
                    <span class="calc-step-val" id="dynbones-val">0</span>
                    <button class="calc-step-btn" onclick="calcStep('dynbones',1)">+</button>
                </div>
            </div>
            <div class="calc-toggle-row" onclick="calcToggle('quest')">
                <div class="calc-toggle-left">
                    <span class="calc-toggle-label">Quest / mobile optimisation</span>
                    <span class="calc-toggle-sub">+$50 flat fee</span>
                </div>
                <div class="calc-toggle-switch" id="quest-toggle"></div>
            </div>
        </div>
    </div>

    <!-- Add-ons (shared) -->
    <div class="calc-card">
        <div class="calc-card-title">Add-ons</div>
        <div class="calc-toggle-row" onclick="calcToggle('nsfw')">
            <div class="calc-toggle-left">
                <span class="calc-toggle-label">NSFW / adult content</span>
                <span class="calc-toggle-sub">+20% of base price</span>
            </div>
            <div class="calc-toggle-switch" id="nsfw-toggle"></div>
        </div>
        <div class="calc-toggle-row" onclick="calcToggle('rush')">
            <div class="calc-toggle-left">
                <span class="calc-toggle-label">Rush order</span>
                <span class="calc-toggle-sub">+25% — priority queue placement</span>
            </div>
            <div class="calc-toggle-switch" id="rush-toggle"></div>
        </div>
        <div class="calc-toggle-row" onclick="calcToggle('commercial')">
            <div class="calc-toggle-left">
                <span class="calc-toggle-label">Commercial use</span>
                <span class="calc-toggle-sub">+50% — covers commercial licensing</span>
            </div>
            <div class="calc-toggle-switch" id="commercial-toggle"></div>
        </div>
    </div>

    <!-- Result -->
    <div class="calc-result" id="calc-result">
        <div class="calc-result-header">
            <span class="calc-result-label">Estimate</span>
            <span class="calc-result-total" id="calc-total">—</span>
        </div>
        <div id="calc-breakdown"><p class="calc-result-empty">Select options above to see your estimate.</p></div>
    </div>`;

    calcUpdatePrice();
}

// ── Type tabs ─────────────────────────────────────────────────────────────────
function calcSwitchType(type, btn) {
    state.type = type;
    document.querySelectorAll('.calc-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.calc-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('calc-panel-' + type).classList.add('active');
    calcUpdatePrice();
}

// ── Chip selectors ────────────────────────────────────────────────────────────
function calcSelectChip(el, groupId, stateKey) {
    document.querySelectorAll('#' + groupId + ' .calc-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    state[stateKey] = el.dataset.val;

    if (stateKey === 'mesh') {
        const hints = {
            lowpoly:  'Quest / mobile ready. Minimal geometry, optimised for performance.',
            midpoly:  'Balanced detail. Suitable for PC VR and most game engines.',
            highpoly: 'Cinematic or hero-asset quality. Rich geometry and surface detail.'
        };
        document.getElementById('mesh-hint').textContent = hints[el.dataset.val];
    }
    calcUpdatePrice();
}

// ── Steppers ──────────────────────────────────────────────────────────────────
const stepperConfig = {
    chars:    { min: 1,  max: 20, stateKey: 'chars'    },
    cloth:    { min: 0,  max: 20, stateKey: 'cloth'    },
    props:    { min: 0,  max: 20, stateKey: 'props'    },
    toggles:  { min: 0,  max: 30, stateKey: 'toggles'  },
    exprs:    { min: 0,  max: 30, stateKey: 'exprs'    },
    dynbones: { min: 0,  max: 20, stateKey: 'dynbones' }
};

function calcStep(key, dir) {
    const cfg = stepperConfig[key];
    state[cfg.stateKey] = Math.max(cfg.min, Math.min(cfg.max, state[cfg.stateKey] + dir));
    const val = state[cfg.stateKey];
    document.getElementById(key + '-val').textContent = val;
    const minusBtn = document.getElementById(key + '-minus');
    if (minusBtn) minusBtn.disabled = (val <= cfg.min);
    if (key === 'chars') {
        document.getElementById('chars-hint').textContent = val === 1
            ? 'First character included. Each additional is +50% of base.'
            : `${val - 1} extra character${val > 2 ? 's' : ''} — +${(val - 1) * 50}% added on top of base.`;
    }
    calcUpdatePrice();
}

// ── Sliders ───────────────────────────────────────────────────────────────────
function calcBgSlide() {
    const v = parseInt(document.getElementById('bg-slider').value);
    state.bg = v;
    document.getElementById('bg-val').textContent = '$' + v;
    const bg = prices.bg;
    const hint = v === 0          ? 'None — transparent or plain colour'
               : v <= bg.splash   ? 'Simple: gradient, splash colour, or filtered photo'
               : v <= bg.vague    ? 'Vague environment: loose shapes suggesting a setting'
               : v <= bg.mid      ? 'Detailed mid-ground: recognisable scene with some detail'
               :                    'Fully detailed: complex environment, fore / mid / background elements';
    document.getElementById('bg-hint').textContent = hint;
    calcUpdatePrice();
}

function calcTexSlide() {
    const v = parseInt(document.getElementById('tex-slider').value);
    state.tex = v;
    document.getElementById('tex-val').textContent = '$' + v;
    calcUpdatePrice();
}

function calcRigSlide() {
    const v = parseInt(document.getElementById('rig-slider').value);
    state.rig = v;
    document.getElementById('rig-val').textContent = '$' + v;
    const hint = v === 0             ? 'No rigging'
               : v <= prices.rig.basic ? 'Basic rig: standard humanoid bones, no advanced features'
               : v <= prices.rig.mid   ? 'Intermediate: IK chains, finger bones, facial controls'
               :                         'Advanced: full-body IK, dynamic secondary motion, custom constraints';
    document.getElementById('rig-hint').textContent = hint;
    calcUpdatePrice();
}

// ── Toggles ───────────────────────────────────────────────────────────────────
function calcToggle(key) {
    state[key] = !state[key];
    document.getElementById(key + '-toggle').classList.toggle('on', state[key]);
    calcUpdatePrice();
}

// ── Price calculation ─────────────────────────────────────────────────────────
function calcUpdatePrice() {
    const lines   = [];
    let base      = 0;

    if (state.type === '2d') {
        const b = prices["2d"][state.style][state.coverage];
        base += b;
        lines.push({ label: capStyle(state.style) + ' — ' + capCoverage(state.coverage), amount: b });

        if (state.chars > 1) {
            const extra = (state.chars - 1) * b * prices["2d"].charMult;
            base += extra;
            lines.push({ label: `+${state.chars - 1} extra character${state.chars > 2 ? 's' : ''} (+${(state.chars - 1) * 50}%)`, amount: extra });
        }
        if (state.bg > 0) {
            base += state.bg;
            lines.push({ label: 'Background', amount: state.bg });
        }

    } else {
        const mesh    = prices["3d"][state.mesh];
        const meshMid = Math.round((mesh.low + mesh.high) / 2);
        base += meshMid;
        lines.push({ label: capMesh(state.mesh) + ' mesh', amount: meshMid });

        base += state.tex;
        lines.push({ label: 'Texturing', amount: state.tex });

        if (state.rig > 0) {
            base += state.rig;
            lines.push({ label: 'Rigging', amount: state.rig });
        }
        if (state.cloth > 0) {
            const c = state.cloth * Math.round((prices["3d"].clothPerItem.low + prices["3d"].clothPerItem.high) / 2);
            base += c;
            lines.push({ label: `${state.cloth} clothing item${state.cloth > 1 ? 's' : ''}`, amount: c });
        }
        if (state.props > 0) {
            const p = state.props * Math.round((prices["3d"].propPerItem.low + prices["3d"].propPerItem.high) / 2);
            base += p;
            lines.push({ label: `${state.props} prop${state.props > 1 ? 's' : ''}`, amount: p });
        }
        if (state.toggles > 0) {
            const t = state.toggles * prices["3d"].togglePer;
            base += t;
            lines.push({ label: `${state.toggles} toggle setup${state.toggles > 1 ? 's' : ''}`, amount: t });
        }
        if (state.exprs > 0) {
            const e = state.exprs * prices["3d"].exprPer;
            base += e;
            lines.push({ label: `${state.exprs} custom expression${state.exprs > 1 ? 's' : ''}`, amount: e });
        }
        if (state.dynbones > 0) {
            const d = state.dynbones * prices["3d"].dynbonesPer;
            base += d;
            lines.push({ label: `${state.dynbones} dynamic bone chain${state.dynbones > 1 ? 's' : ''}`, amount: d });
        }
        if (state.quest) {
            base += prices["3d"].quest;
            lines.push({ label: 'Quest / mobile optimisation', amount: prices["3d"].quest });
        }
    }

    const addons = [];
    if (state.nsfw)       addons.push({ label: 'NSFW (+20%)',          amount: Math.round(base * prices.additional.nsfw)       });
    if (state.rush)       addons.push({ label: 'Rush order (+25%)',    amount: Math.round(base * prices.additional.rush)       });
    if (state.commercial) addons.push({ label: 'Commercial use (+50%)',amount: Math.round(base * prices.additional.commercial) });

    const addonTotal = addons.reduce((s, a) => s + a.amount, 0);
    const total      = base + addonTotal;

    renderCalcResult(total, lines, addons, base);
}

// ── Render result panel ───────────────────────────────────────────────────────
function renderCalcResult(total, lines, addons, base) {
    const totalEl     = document.getElementById('calc-total');
    const breakdownEl = document.getElementById('calc-breakdown');
    if (!totalEl || !breakdownEl) return;

    if (base === 0) {
        totalEl.textContent = '—';
        breakdownEl.innerHTML = '<p class="calc-result-empty">Select options above to see your estimate.</p>';
        return;
    }

    totalEl.textContent = '$' + total.toFixed(0);

    let html = '<div class="calc-breakdown-list">';
    lines.forEach(l => {
        html += `<div class="calc-breakdown-row"><span>${l.label}</span><span class="calc-breakdown-amt">$${l.amount.toFixed(0)}</span></div>`;
    });
    if (addons.length > 0) {
        html += `<div class="calc-breakdown-row subtotal"><span>Subtotal</span><span class="calc-breakdown-amt">$${base.toFixed(0)}</span></div>`;
        addons.forEach(a => {
            html += `<div class="calc-breakdown-row addon"><span>${a.label}</span><span class="calc-breakdown-amt">+$${a.amount.toFixed(0)}</span></div>`;
        });
    }
    html += '</div>';
    html += '<p class="calc-result-note">This is an estimate. Final price is confirmed after discussing your project in detail.</p>';
    breakdownEl.innerHTML = html;
}

// ── Label helpers ─────────────────────────────────────────────────────────────
function capStyle(s) {
    return { sketch: 'Sketch', lineart: 'Line Art', flatcolors: 'Flat Colours', shading: 'Full Shading' }[s] || s;
}
function capCoverage(s) {
    return { portrait: 'Portrait', upperhalf: 'Upper Half', fullbody: 'Full Body' }[s] || s;
}
function capMesh(s) {
    return { lowpoly: 'Low-Poly', midpoly: 'Mid-Poly', highpoly: 'High-Poly' }[s] || s;
}

// ── Static price labels (for the price list section) ─────────────────────────
function setPriceLabels() {
    const set   = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const range = (o)       => `$${o.low} – $${o.high}`;

    set('2d-sketch-portrait',        `$${prices["2d"].sketch.portrait}`);
    set('2d-sketch-upperhalf',       `$${prices["2d"].sketch.upperhalf}`);
    set('2d-sketch-fullbody',        `$${prices["2d"].sketch.fullbody}`);
    set('2d-lineart-portrait',       `$${prices["2d"].lineart.portrait}`);
    set('2d-lineart-upperhalf',      `$${prices["2d"].lineart.upperhalf}`);
    set('2d-lineart-fullbody',       `$${prices["2d"].lineart.fullbody}`);
    set('2d-flatcolors-portrait',    `$${prices["2d"].flatcolors.portrait}`);
    set('2d-flatcolors-upperhalf',   `$${prices["2d"].flatcolors.upperhalf}`);
    set('2d-flatcolors-fullbody',    `$${prices["2d"].flatcolors.fullbody}`);
    set('2d-shading-portrait',       `$${prices["2d"].shading.portrait}`);
    set('2d-shading-upperhalf',      `$${prices["2d"].shading.upperhalf}`);
    set('2d-shading-fullbody',       `$${prices["2d"].shading.fullbody}`);
    set('2d-adition-character',      `${prices["2d"].charMult * 100}%`);
    set('additional-rushOrder',      `+${prices.additional.rush * 100}%`);
    set('additional-commercialUse',  `+${prices.additional.commercial * 100}%`);
    set('additional-nsfw2d',         `+${prices.additional.nsfw * 100}%`);
    set('additional-nsfw3d',         `+${prices.additional.nsfw * 100}%`);
    set('additional-nsfw',           `+${prices.additional.nsfw * 100}%`);
}

// ── TOS modal ─────────────────────────────────────────────────────────────────
function initTosModal() {
    const btn   = document.getElementById('open-tos-modal-button');
    const modal = document.getElementById('tos-modal');
    if (!btn || !modal) return;
    const closeBtn   = modal.querySelector('.close');
    const tosContent = document.getElementById('tos-content');

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        fetch('tos.html')
            .then(r => r.text())
            .then(html => { if (tosContent) tosContent.innerHTML = html; modal.style.display = 'block'; })
            .catch(err => console.error('TOS load error:', err));
    });
    closeBtn?.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

// ── Nav hover image: switch between above/beside based on header visibility ───
function initNavImageScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    function check() {
        const rect       = header.getBoundingClientRect();
        const visiblePct = (Math.max(0, rect.bottom - Math.max(0, rect.top)) / rect.height) * 100;
        document.querySelectorAll('.nav-hover-image, .nav-hover-image-side').forEach(el => {
            el.classList.toggle('nav-hover-image',      visiblePct >= 10);
            el.classList.toggle('nav-hover-image-side', visiblePct <  10);
        });
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
}

// ── Commission media showcase slider ─────────────────────────────────────────
function initCommissionSlider() {
    const slider     = document.querySelector('.commissions-slider');
    const modal      = document.getElementById('example-image-modal');
    const modalImg   = document.getElementById('example-image-modal-img');
    const modalVideo = document.getElementById('example-image-modal-video');
    if (!slider || !modal) return;

    const closeBtn = modal.querySelector('.close');
    const videoSrc = modalVideo?.querySelector('source');

    const commissionMedia = [
        { icon: 'images/commissions/3d_scr_image01.gif',  showcase: 'images/commissions/3d_scr_image01.webm' },
        { icon: 'images/commissions/3d_scr_image02.gif',  showcase: 'images/commissions/3d_scr_image02.webm' },
        { icon: 'images/commissions/3d_scr_image03.gif',  showcase: 'images/commissions/3d_scr_image03.webm' },
    ];

    commissionMedia.forEach(media => {
        const isVideo = /\.(webm|mp4)$/i.test(media.icon);
        let el;
        if (isVideo) {
            el = document.createElement('video');
            el.src = media.icon; el.loop = true; el.muted = true; el.autoplay = true;
        } else {
            el = document.createElement('img');
            el.src = media.icon;
        }
        el.alt = 'Commission example';
        el.classList.add('example-image');

        el.addEventListener('click', () => {
            const isShowcaseVideo = /\.(webm|mp4)$/i.test(media.showcase);
            if (isShowcaseVideo && modalVideo && videoSrc) {
                if (modalImg) modalImg.style.display = 'none';
                modalVideo.style.display = 'block';
                videoSrc.src = media.showcase;
                modalVideo.load(); modalVideo.play();
            } else if (modalImg) {
                if (modalVideo) modalVideo.style.display = 'none';
                modalImg.style.display = 'block';
                modalImg.src = media.showcase;
            }
            modal.style.display = 'flex';
        });
        slider.appendChild(el);
    });

    function closeModal() {
        modal.style.display = 'none';
        if (modalVideo) { modalVideo.pause(); modalVideo.style.display = 'none'; }
        if (modalImg)   modalImg.style.display = 'block';
    }
    closeBtn?.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}