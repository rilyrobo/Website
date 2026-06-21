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
    initStaticExampleGalleries();
    setPriceLabels();
});

// ── Shared modal scroll-lock (reference counted) ───────────────────────────────
// Multiple modals can stack (e.g. TOS opened from inside the commission
// form). A simple add/remove of 'modal-open' breaks if the inner modal
// closes first — it would unlock scroll while the outer modal is still
// open. window.modalLock tracks how many modals are currently open and
// only releases the body lock once that count returns to zero.
window.modalLockCount = window.modalLockCount || 0;

window.acquireModalLock = function () {
    window.modalLockCount++;
    document.body.classList.add('modal-open');
};

window.releaseModalLock = function () {
    window.modalLockCount = Math.max(0, window.modalLockCount - 1);
    if (window.modalLockCount === 0) {
        document.body.classList.remove('modal-open');
    }
};

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
        <button class="calc-request-btn" id="calc-request-btn" onclick="openCommissionForm()" disabled>
            Request This Commission
        </button>
    </div>

    <!-- Intake form modal -->
    <div class="form-modal" id="commission-form-modal">
        <div class="form-modal-content">
            <button class="close form-close" onclick="closeCommissionForm()" aria-label="Close">&times;</button>

            <div class="form-progress">
                <div class="form-progress-step active" data-step="1">1<span>Brief</span></div>
                <div class="form-progress-line"></div>
                <div class="form-progress-step" data-step="2">2<span>References</span></div>
                <div class="form-progress-line"></div>
                <div class="form-progress-step" data-step="3">3<span>Review</span></div>
            </div>

            <!-- Step 1: Brief -->
            <div class="form-step active" id="form-step-1">
                <h3 class="form-step-title">Tell me about your commission</h3>

                <label class="form-label" for="cf-name">Your name / handle</label>
                <input type="text" id="cf-name" class="form-input" placeholder="How should I address you?">

                <label class="form-label" for="cf-contact">Best way to reach you</label>
                <input type="text" id="cf-contact" class="form-input" placeholder="Discord, email, or Twitter handle">

                <label class="form-label" for="cf-charname">Character name <span class="form-optional">(optional)</span></label>
                <input type="text" id="cf-charname" class="form-input" placeholder="e.g. Mireille the Ringmaster">

                <label class="form-label" for="cf-desc">Describe the vibe &amp; concept</label>
                <textarea id="cf-desc" class="form-textarea" rows="4" placeholder="Personality, mood, key features — anything that helps me see what you see."></textarea>

                <label class="form-label" for="cf-nonneg">Non-negotiable details <span class="form-optional">(optional)</span></label>
                <textarea id="cf-nonneg" class="form-textarea" rows="2" placeholder="Hair colour, specific markings, must-have accessories, etc."></textarea>

                <div class="form-grid-2">
                    <div>
                        <label class="form-label" for="cf-usage">Where will this be used?</label>
                        <select id="cf-usage" class="form-select">
                            <option value="personal">Personal use only</option>
                            <option value="streaming">Streaming / content creation</option>
                            <option value="commercial">Commercial / business use</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label" for="cf-deadline">Preferred deadline <span class="form-optional">(optional)</span></label>
                        <input type="text" id="cf-deadline" class="form-input" placeholder="e.g. flexible, or by Aug 1">
                    </div>
                </div>

                <button class="calc-request-btn" onclick="formGoToStep(2)">Continue</button>
            </div>

            <!-- Step 2: References -->
            <div class="form-step" id="form-step-2">
                <h3 class="form-step-title">References</h3>
                <p class="form-step-hint">Links to mood boards, character sheets, or existing art help me match your vision faster. You can also just describe what you have — files can be sent after I confirm the commission.</p>

                <label class="form-label" for="cf-refs">Reference links <span class="form-optional">(optional)</span></label>
                <textarea id="cf-refs" class="form-textarea" rows="3" placeholder="Pinterest board, DeviantArt favourites, Twitter thread, etc. — one per line"></textarea>

                <label class="form-label" for="cf-notes">Anything else I should know?</label>
                <textarea id="cf-notes" class="form-textarea" rows="3" placeholder="Open floor — questions, special requests, scheduling notes."></textarea>

                <div class="form-btn-row">
                    <button class="calc-request-btn secondary" onclick="formGoToStep(1)">Back</button>
                    <button class="calc-request-btn" onclick="formGoToStep(3)">Review</button>
                </div>
            </div>

            <!-- Step 3: Review -->
            <div class="form-step" id="form-step-3">
                <h3 class="form-step-title">Review your request</h3>
                <p class="form-step-hint">This is an estimate based on the calculator. I'll confirm the final price once I've reviewed your brief.</p>

                <div class="form-summary" id="form-summary"></div>

                <label class="form-tos-row" for="cf-tos-agree">
                    <input type="checkbox" id="cf-tos-agree" onchange="formUpdateSubmitState()">
                    <span>I've read and agree to the <a href="#" onclick="openTosFromForm(event)">Terms of Service</a></span>
                </label>

                <div class="form-btn-row">
                    <button class="calc-request-btn secondary" onclick="formGoToStep(2)">Back</button>
                    <button class="calc-request-btn" id="cf-submit-btn" onclick="submitCommissionForm()" disabled>Send Request</button>
                </div>
            </div>

            <!-- Confirmation -->
            <div class="form-step" id="form-step-confirm">
                <div class="form-confirm-icon">✓</div>
                <h3 class="form-step-title">Request ready to send</h3>
                <p class="form-step-hint">Your commission request has been prepared. Choose how you'd like to send it:</p>
                <div class="form-send-options" id="form-send-options"></div>
                <button class="calc-request-btn secondary" onclick="closeCommissionForm()">Close</button>
            </div>
        </div>
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
let lastCalcResult = null;

function renderCalcResult(total, lines, addons, base) {
    const totalEl     = document.getElementById('calc-total');
    const breakdownEl = document.getElementById('calc-breakdown');
    const requestBtn  = document.getElementById('calc-request-btn');
    if (!totalEl || !breakdownEl) return;

    if (base === 0) {
        totalEl.textContent = '—';
        breakdownEl.innerHTML = '<p class="calc-result-empty">Select options above to see your estimate.</p>';
        if (requestBtn) requestBtn.disabled = true;
        lastCalcResult = null;
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

    if (requestBtn) requestBtn.disabled = false;
    lastCalcResult = { total, lines, addons, base, type: state.type };
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

    // .page ancestors use CSS transform for their slide-in animation, and a
    // transformed ancestor becomes the containing block for position:fixed
    // children — breaking true viewport-fixed centering. Move the modal to
    // be a direct child of <body> so it escapes that ancestor entirely.
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const closeBtn   = modal.querySelector('.close');
    const tosContent = document.getElementById('tos-content');

    function openModal() {
        modal.style.display = 'flex';
        window.acquireModalLock();
    }
    function closeModal() {
        modal.style.display = 'none';
        window.releaseModalLock();
    }

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        fetch('tos.html')
            .then(r => r.text())
            .then(html => { if (tosContent) tosContent.innerHTML = html; openModal(); })
            .catch(err => console.error('TOS load error:', err));
    });
    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
    });
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
// ── Shared example-media lightbox (used by both the JS-built commission
// slider and the static .examples reference galleries in the HTML) ───────────
let exampleModalRefs = null;

function getExampleModalRefs() {
    if (exampleModalRefs) return exampleModalRefs;

    const modal      = document.getElementById('example-image-modal');
    const modalImg   = document.getElementById('example-image-modal-img');
    const modalVideo = document.getElementById('example-image-modal-video');
    if (!modal) return null;

    // .page ancestors use CSS transform for their slide-in animation, and a
    // transformed ancestor becomes the containing block for position:fixed
    // children — breaking true viewport-fixed centering. Move the modal to
    // be a direct child of <body> so it escapes that ancestor entirely.
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const closeBtn = modal.querySelector('.close');
    const videoSrc = modalVideo?.querySelector('source');

    function closeModal() {
        modal.style.display = 'none';
        if (modalVideo) { modalVideo.pause(); modalVideo.style.display = 'none'; }
        if (modalImg)   modalImg.style.display = 'block';
        window.releaseModalLock?.();
    }

    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
    });

    exampleModalRefs = { modal, modalImg, modalVideo, videoSrc, closeModal };
    return exampleModalRefs;
}

// Opens the lightbox showing either a still image or a video, picking
// whichever matches the given showcase URL's extension.
function openExampleMediaModal(showcaseUrl) {
    const refs = getExampleModalRefs();
    if (!refs) return;
    const { modal, modalImg, modalVideo, videoSrc } = refs;

    const isVideo = /\.(webm|mp4)$/i.test(showcaseUrl);
    if (isVideo && modalVideo && videoSrc) {
        if (modalImg) modalImg.style.display = 'none';
        modalVideo.style.display = 'block';
        videoSrc.src = showcaseUrl;
        modalVideo.load();
        modalVideo.play();
    } else if (modalImg) {
        if (modalVideo) modalVideo.style.display = 'none';
        modalImg.style.display = 'block';
        modalImg.src = showcaseUrl;
    }
    modal.style.display = 'flex';
    window.acquireModalLock?.();
}

// ── Commission media showcase slider (JS-generated thumbnails) ────────────────
function initCommissionSlider() {
    const slider = document.querySelector('.commissions-slider');
    if (!slider) return;
    if (!getExampleModalRefs()) return;

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
        el.addEventListener('click', () => openExampleMediaModal(media.showcase));
        slider.appendChild(el);
    });
}

// ── Static example reference galleries (2D / 3D / VRChat price sections) ──────
// These are plain <img class="example-image"> tags already in index.html —
// no JS builds them, so they need their click listeners attached directly.
// Clicking shows the same image full-size in the shared lightbox above.
function initStaticExampleGalleries() {
    if (!getExampleModalRefs()) return;

    document.querySelectorAll('.examples .example-image').forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => openExampleMediaModal(img.src));
    });
}

// ── Commission intake form ──────────────────────────────────────────────────────
// Set this to your preferred contact channel. 'discord' shows a copy-to-clipboard
// summary (since Discord has no mailto-style deep link), 'email' opens the user's
// mail client with the summary pre-filled.
// Mirrors the URLs already used in script.js's `contacts` array — kept
// separate here so this file has no load-order dependency on script.js.
const COMMISSION_CONTACT = {
    email: 'RilyRobo@gmail.com',
    twitterUrl: 'https://twitter.com/RilyRobo',
    kofiUrl: 'https://www.ko-fi.com/RilyRobo',
    discordUrl: 'https://discordapp.com/users/277498825403531264',
    icons: {
        twitter: 'https://img.icons8.com/?size=100&id=phOKFKYpe00C&format=png&color=ffffff',
        kofi:    'https://img.icons8.com/?size=100&id=8342&format=png&color=ffffff',
        discord: 'https://img.icons8.com/?size=100&id=30888&format=png&color=ffffff'
    }
};

function openCommissionForm() {
    if (!lastCalcResult) return;
    const modal = document.getElementById('commission-form-modal');
    if (!modal) return;

    // .page ancestors use CSS transform for their slide-in animation, and a
    // transformed ancestor becomes the containing block for position:fixed
    // children — breaking true viewport-fixed centering and scroll. Move the
    // modal to be a direct child of <body> so it escapes that ancestor.
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    formGoToStep(1);
    window.acquireModalLock();
}

function closeCommissionForm() {
    const modal = document.getElementById('commission-form-modal');
    if (!modal) return;
    modal.style.display = 'none';
    window.releaseModalLock();
}

function formGoToStep(step) {
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    document.getElementById('form-step-' + step)?.classList.add('active');

    const isNumericStep = typeof step === 'number';

    document.querySelectorAll('.form-progress-step').forEach(el => {
        const n = parseInt(el.dataset.step);
        el.classList.toggle('active', isNumericStep && n === step);
        el.classList.toggle('done', isNumericStep && n < step);
    });
    const progressEl = document.querySelector('.form-progress');
    if (progressEl) progressEl.style.display = isNumericStep ? 'flex' : 'none';

    if (step === 3) {
        buildFormSummary();
        formUpdateSubmitState();
    }

    const content = document.querySelector('.form-modal-content');
    if (content) content.scrollTop = 0;
}

// Keeps the Send Request button locked until the TOS checkbox is ticked.
function formUpdateSubmitState() {
    const checkbox  = document.getElementById('cf-tos-agree');
    const submitBtn = document.getElementById('cf-submit-btn');
    if (!checkbox || !submitBtn) return;
    submitBtn.disabled = !checkbox.checked;
    if (checkbox.checked) {
        checkbox.closest('.form-tos-row')?.classList.remove('form-tos-row-error');
    }
}

// Opens the TOS modal from inside the commission form without losing
// the form's current progress — the form stays open underneath.
function openTosFromForm(e) {
    e.preventDefault();
    const tosModal = document.getElementById('tos-modal');
    const tosBtn   = document.getElementById('open-tos-modal-button');
    if (tosModal && tosBtn) {
        tosBtn.click();
    }
}

function buildFormSummary() {
    const summaryEl = document.getElementById('form-summary');
    if (!summaryEl || !lastCalcResult) return;

    const get = id => document.getElementById(id)?.value?.trim() || '';
    const name     = get('cf-name')     || 'Not provided';
    const contact  = get('cf-contact')  || 'Not provided';
    const charname = get('cf-charname');
    const desc     = get('cf-desc')     || 'Not provided';
    const nonneg   = get('cf-nonneg');
    const usageSel = document.getElementById('cf-usage');
    const usage    = usageSel ? usageSel.options[usageSel.selectedIndex].text : '';
    const deadline = get('cf-deadline');
    const refs     = get('cf-refs');
    const notes    = get('cf-notes');

    const typeLabel = lastCalcResult.type === '2d' ? '2D Art' : '3D / Avatar';

    let lines = `
        <div class="form-summary-section">
            <div class="form-summary-label">Commission type</div>
            <div class="form-summary-value">${escapeHtmlForm(typeLabel)}</div>
        </div>
        <div class="form-summary-section">
            <div class="form-summary-label">Configuration</div>
            <div class="form-summary-breakdown">`;

    lastCalcResult.lines.forEach(l => {
        lines += `<div class="form-summary-row"><span>${escapeHtmlForm(l.label)}</span><span>$${l.amount.toFixed(0)}</span></div>`;
    });
    if (lastCalcResult.addons.length) {
        lines += `<div class="form-summary-row subtotal"><span>Subtotal</span><span>$${lastCalcResult.base.toFixed(0)}</span></div>`;
        lastCalcResult.addons.forEach(a => {
            lines += `<div class="form-summary-row addon"><span>${escapeHtmlForm(a.label)}</span><span>+$${a.amount.toFixed(0)}</span></div>`;
        });
    }
    lines += `<div class="form-summary-row total"><span>Estimated total</span><span>$${lastCalcResult.total.toFixed(0)}</span></div>`;
    lines += `</div></div>`;

    lines += `
        <div class="form-summary-section">
            <div class="form-summary-label">Brief</div>
            <div class="form-summary-text"><strong>From:</strong> ${escapeHtmlForm(name)} (${escapeHtmlForm(contact)})</div>
            ${charname ? `<div class="form-summary-text"><strong>Character:</strong> ${escapeHtmlForm(charname)}</div>` : ''}
            <div class="form-summary-text"><strong>Concept:</strong> ${escapeHtmlForm(desc)}</div>
            ${nonneg ? `<div class="form-summary-text"><strong>Non-negotiables:</strong> ${escapeHtmlForm(nonneg)}</div>` : ''}
            <div class="form-summary-text"><strong>Usage:</strong> ${escapeHtmlForm(usage)}</div>
            ${deadline ? `<div class="form-summary-text"><strong>Deadline:</strong> ${escapeHtmlForm(deadline)}</div>` : ''}
            ${refs ? `<div class="form-summary-text"><strong>References:</strong> ${escapeHtmlForm(refs)}</div>` : ''}
            ${notes ? `<div class="form-summary-text"><strong>Notes:</strong> ${escapeHtmlForm(notes)}</div>` : ''}
        </div>`;

    summaryEl.innerHTML = lines;
}

function buildPlainTextSummary() {
    const get = id => document.getElementById(id)?.value?.trim() || '';
    const name     = get('cf-name')     || 'Not provided';
    const contact  = get('cf-contact')  || 'Not provided';
    const charname = get('cf-charname');
    const desc     = get('cf-desc')     || 'Not provided';
    const nonneg   = get('cf-nonneg');
    const usageSel = document.getElementById('cf-usage');
    const usage    = usageSel ? usageSel.options[usageSel.selectedIndex].text : '';
    const deadline = get('cf-deadline');
    const refs     = get('cf-refs');
    const notes    = get('cf-notes');

    const typeLabel = lastCalcResult.type === '2d' ? '2D Art' : '3D / Avatar';

    let text = `COMMISSION REQUEST\n\n`;
    text += `Type: ${typeLabel}\n\n`;
    text += `Configuration:\n`;
    lastCalcResult.lines.forEach(l => { text += `  - ${l.label}: $${l.amount.toFixed(0)}\n`; });
    if (lastCalcResult.addons.length) {
        text += `  Subtotal: $${lastCalcResult.base.toFixed(0)}\n`;
        lastCalcResult.addons.forEach(a => { text += `  - ${a.label}: +$${a.amount.toFixed(0)}\n`; });
    }
    text += `  Estimated total: $${lastCalcResult.total.toFixed(0)}\n\n`;
    text += `From: ${name} (${contact})\n`;
    if (charname) text += `Character: ${charname}\n`;
    text += `Concept: ${desc}\n`;
    if (nonneg)   text += `Non-negotiables: ${nonneg}\n`;
    text += `Usage: ${usage}\n`;
    if (deadline) text += `Deadline: ${deadline}\n`;
    if (refs)     text += `References: ${refs}\n`;
    if (notes)    text += `Notes: ${notes}\n`;
    text += `\n(This is an estimate — final price confirmed after review.)`;

    return text;
}

function submitCommissionForm() {
    const tosCheckbox = document.getElementById('cf-tos-agree');
    if (!tosCheckbox?.checked) {
        tosCheckbox?.closest('.form-tos-row')?.classList.add('form-tos-row-error');
        return;
    }

    formGoToStep('confirm');

    const plainText = buildPlainTextSummary();
    const optionsEl = document.getElementById('form-send-options');
    if (!optionsEl) return;

    const subject = encodeURIComponent('Commission Request — ' + (lastCalcResult.type === '2d' ? '2D Art' : '3D / Avatar'));
    const mailtoBody = encodeURIComponent(plainText);
    const mailtoUrl = `mailto:${COMMISSION_CONTACT.email}?subject=${subject}&body=${mailtoBody}`;

    optionsEl.innerHTML = `
        <a href="${mailtoUrl}" class="calc-request-btn form-send-btn" target="_blank" rel="noopener noreferrer">
            Send via Email
        </a>

        <div class="form-copy-row">
            <button class="calc-request-btn form-send-btn secondary form-copy-btn" onclick="copyCommissionSummary(this)">
                Copy to Clipboard <span class="form-copy-hint">paste into a DM</span>
            </button>
        </div>

        <div class="form-copy-row">
            <a href="${COMMISSION_CONTACT.twitterUrl}" class="form-contact-icon" target="_blank" rel="noopener noreferrer" aria-label="Message on Twitter / X" title="Twitter / X">
                <img src="${COMMISSION_CONTACT.icons.twitter}" alt="">
            </a>
            <a href="${COMMISSION_CONTACT.kofiUrl}" class="form-contact-icon" target="_blank" rel="noopener noreferrer" aria-label="Message on Ko-fi" title="Ko-fi">
                <img src="${COMMISSION_CONTACT.icons.kofi}" alt="">
            </a>
            <a href="${COMMISSION_CONTACT.discordUrl}" class="form-contact-icon" target="_blank" rel="noopener noreferrer" aria-label="Message on Discord" title="Discord">
                <img src="${COMMISSION_CONTACT.icons.discord}" alt="">
            </a>
        </div>
        <p class="form-copy-caption">Copy the summary, then open whichever platform you'd like to send it through.</p>`;
}

function copyCommissionSummary(btn) {
    const text = buildPlainTextSummary();
    navigator.clipboard.writeText(text).then(() => {
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = 'Copied!';
            setTimeout(() => { btn.innerHTML = original; }, 1800);
        }
    }).catch(() => {
        alert('Could not copy automatically — please select and copy the summary manually.');
    });
}

function escapeHtmlForm(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Close modal on backdrop click or Escape key
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('commission-form-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeCommissionForm();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            closeCommissionForm();
        }
    });
});