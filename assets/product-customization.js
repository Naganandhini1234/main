/**
 * ============================================================================
 *                    MYOP PERSONALIZED PERFUME LOGIC
 * ============================================================================
 * 
 * This module handles the complete customization flow:
 * 1. Canvas drawing (text engraving with font preview)
 * 2. Modal interactions (scent selection)
 * 3. Form management (properties syncing)
 * 4. Gift options (wrap, personal note)
 * ============================================================================
 */

// ============================================================================
// 0️⃣ INITIALIZATION - Entry Point
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
  // Guard clauses to ensure we're on the right page
  if (!window.MYOP_CONFIG) return;
  if (window.isMyopPersonalizedPDP === false) return;

  const config = window.MYOP_CONFIG;
  const sectionEl = document.getElementById(`shopify-section-${config.sectionId}`);
  
  if (!sectionEl) return;

  /**
   * Initialize all 4 independent modules
   * Each module manages its own state and DOM interactions
   */
  MyopCanvasManager.init(sectionEl, config);      // 1. Text engraving
  MyopModalManager.init(sectionEl, config);       // 2. Scent selection
  MyopFormManager.init(sectionEl, config);        // 3. Cart properties
  MyopGiftOptions.init(sectionEl);                // 4. Gift wrap/note
});

// ============================================================================
// 1️⃣ CANVAS MANAGER - Text Engraving Preview
// ============================================================================

const MyopCanvasManager = {
  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────
  canvas: null,
  ctx: null,
  backgroundImage: new Image(),
  selectedFont: 'Classic',        // Default font
  engravingText: '',              // User's engraved text
  engravingInputField: null,
  fontButtons: [],
  
  /**
   * INITIALIZATION
   * Finds DOM elements, sets up event listeners, loads fonts
   */
  init(sectionEl, config) {
    this.engravingInputField = sectionEl.querySelector(
      `#engravingText-${config.sectionId}`
    );
    
    this.fontButtons = sectionEl.querySelectorAll('.myop-font-option');
    this.canvas = document.getElementById('myop-canvas-pdp');
    
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    
    // Setup canvas dimensions
    this.canvas.width = 450;
    this.canvas.height = 450;
    
    // Load background image from product
    this.backgroundImage.crossOrigin = 'anonymous';
    this.backgroundImage.onload = () => this.drawCanvas();
    this.backgroundImage.onerror = () => {
      this.drawFallbackBackground();
      this.drawCanvas();
    };
    
    // Set background to first product image
    this.backgroundImage.src = window.myopFirstImageUrl;
    
    // Load web fonts (must be available before drawing)
    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load('16px "Playful"'),
        document.fonts.load('16px "Classic"'),
        document.fonts.load('16px "Elegant"')
      ]).then(() => this.drawCanvas());
      
      document.fonts.ready.then(() => this.drawCanvas());
    }
    
    // ─────────────────────────────────────────────────────────────
    // EVENT LISTENERS
    // ─────────────────────────────────────────────────────────────
    
    // 🎯 When user types engraving text
    if (this.engravingInputField) {
      this.engravingInputField.addEventListener('input', (e) => {
        this.engravingText = e.target.value.slice(0, 12); // Max 12 chars
        this.drawCanvas();
        MyopFormManager.updateButtonsState(); // Enable/disable ATC
      });
    }
    
    // 🎨 When user selects a font
    this.fontButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.fontButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedFont = btn.dataset.fontStyle || 'Classic';
        this.drawCanvas();
        MyopFormManager.updateButtonsState();
      });
    });
    
    // Set default active font
    this.setDefaultFont();
    this.drawCanvas();
  },
  
  // ─────────────────────────────────────────────────────────────
  // CANVAS DRAWING LOGIC
  // ─────────────────────────────────────────────────────────────
  
  /**
   * Main drawing function
   * Clears canvas → Draws background → Draws text
   */
  drawCanvas() {
    if (!this.canvas || !this.ctx) return;
    
    // 1️⃣ Get font metrics based on selected font
    const fontMetrics = this.getFontMetrics(this.selectedFont);
    
    // 2️⃣ Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 3️⃣ Draw background image
    if (this.backgroundImage && this.backgroundImage.complete) {
      this.ctx.drawImage(
        this.backgroundImage,
        0, 0,
        this.canvas.width,
        this.canvas.height
      );
    } else {
      this.drawFallbackBackground();
    }
    
    // 4️⃣ Draw engraved text if provided
    if (this.engravingText) {
      this.drawEngravedText(fontMetrics);
    }
    
    // 5️⃣ Update product image with canvas
    this.replaceFirstImage();
  },
  
  /**
   * Get font-specific metrics (size, position, width)
   * Different fonts have different rendering requirements
   */
  getFontMetrics(fontStyle) {
    const metrics = {
      'Classic': { fontSize: 20, xPos: 155, maxWidth: 90 },
      'Elegant': { fontSize: 20, xPos: 159, maxWidth: 95 },
      'Playful': { fontSize: 18, xPos: 155, maxWidth: 90 }
    };
    return metrics[fontStyle] || metrics['Classic'];
  },
  
  /**
   * Draw text on canvas with word wrapping
   * Handles multi-line text, special characters (j, f, J)
   */
  drawEngravedText(fontMetrics) {
    const { fontSize, xPos, maxWidth } = fontMetrics;
    
    // Setup canvas text styles
    this.ctx.font = `${fontSize}px ${this.selectedFont}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillStyle = "#000000"; // Black text
    this.ctx.shadowColor = 'transparent';
    
    // Wrap text to multiple lines if needed
    let numLines = this.wrapText(
      this.ctx,
      this.engravingText,
      xPos,
      237,        // Y position
      maxWidth,
      20          // Line height
    );
    
    // ─────────────────────────────────────────────────────────────
    // SPECIAL CASE: Elegant font with ascending characters (j, f)
    // ─────────────────────────────────────────────────────────────
    
    if (this.selectedFont === 'Elegant' && 
        (this.engravingText.charAt(0) === 'j' ||
         this.engravingText.charAt(0) === 'J' ||
         this.engravingText.charAt(0) === 'f')) {
      
      // Redraw with different positioning
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(
        this.backgroundImage,
        0, 0,
        this.canvas.width,
        this.canvas.height
      );
      numLines = this.wrapText(
        this.ctx,
        this.engravingText,
        163,        // Adjusted X position
        235,        // Adjusted Y position
        75,         // Smaller max width
        20
      );
    }
    
    // ─────────────────────────────────────────────────────────────
    // FONT SIZE REDUCTION: If text spans >2 lines
    // ─────────────────────────────────────────────────────────────
    
    if (numLines > 2) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(
        this.backgroundImage,
        0, 0,
        this.canvas.width,
        this.canvas.height
      );
      
      const reducedFontSize = fontSize - 2; // Shrink by 2px
      this.ctx.font = `${reducedFontSize}px ${this.selectedFont}`;
      
      this.wrapText(
        this.ctx,
        this.engravingText,
        235,
        235,
        maxWidth,
        20
      );
    }
  },
  
  /**
   * Wrap text to fit within maxWidth
   * Returns: number of lines
   */
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const lines = [];
    const words = text.split(' ');
    const maxchar = 6; // Max characters per word
    
    for (let word of words) {
      let currentLine = lines.pop() || '';
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;
      
      // If line fits AND doesn't exceed max chars, keep it
      if (testWidth <= maxWidth && testLine.length <= maxchar) {
        lines.push(testLine);
      } else {
        // Push current line and start new one
        if (currentLine) lines.push(currentLine);
        
        if (ctx.measureText(word).width <= maxWidth && 
            word.length <= maxchar) {
          lines.push(word);
        } else {
          // Break word if too long
          let subLine = '';
          for (let char of word) {
            let testSubLine = subLine + char;
            if (ctx.measureText(testSubLine).width > maxWidth || 
                testSubLine.length > maxchar) {
              lines.push(subLine);
              subLine = char;
            } else {
              subLine = testSubLine;
            }
          }
          if (subLine) lines.push(subLine);
        }
      }
    }
    
    // Center text vertically if multiple lines
    if (lines.length > 1) {
      y = y - (lines.length * 7); // Offset for centering
    }
    
    // Draw each line
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineHeight);
    }
    
    return lines.length;
  },
  
  /**
   * Fallback background if image fails to load
   */
  drawFallbackBackground() {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.strokeStyle = '#ddd';
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
  },
  
  /**
   * Replace product image with canvas drawing
   * Updates both mobile and desktop image elements
   */
  replaceFirstImage() {
    if (!this.canvas) return;
    
    const imgData = this.canvas.toDataURL('image/png');
    
    // Get both mobile and desktop images
    const mobileImg = document.querySelector(
      '.product__media.card.media--adapt_first img'
    );
    const desktopImg = document.querySelector(
      'sticky-element .product__media[data-media-type="image"] img'
    );
    
    // Update mobile image
    if (mobileImg) {
      mobileImg.src = imgData;
      mobileImg.removeAttribute('srcset');
      mobileImg.removeAttribute('sizes');
    }
    
    // Update desktop image
    if (desktopImg) {
      desktopImg.src = imgData;
      desktopImg.removeAttribute('srcset');
      desktopImg.removeAttribute('sizes');
    }
  },
  
  /**
   * Set default font to Classic on page load
   */
  setDefaultFont() {
    this.fontButtons.forEach((btn) => {
      btn.classList.remove('active');
      if (btn.dataset.fontStyle === 'Classic') {
        btn.classList.add('active');
      }
    });
    this.selectedFont = 'Classic';
  }
};

// ============================================================================
// 2️⃣ MODAL MANAGER - Scent Selection
// ============================================================================

const MyopModalManager = {
  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────
  modal: null,                    // Popup 1 (Overview)
  modalDetail: null,              // Popup 2 (Details)
  scentCards: [],
  selectedCard: null,
  selectedVariantId: null,
  selectedName: '',
  selectedPrice: null,
  selectedImageUrl: '',
  
  /**
   * INITIALIZATION
   */
  init(sectionEl, config) {
    this.modal = sectionEl.querySelector(`#myop-modal-${config.sectionId}`);
    this.modalDetail = sectionEl.querySelector('#myop-detail-modal');
    this.scentCards = sectionEl.querySelectorAll('.myop-scent-card');
    
    if (!this.modal) return;
    
    // ─────────────────────────────────────────────────────────────
    // EVENT LISTENERS
    // ─────────────────────────────────────────────────────────────
    
    // 🎁 Open modal when "Choose Perfume" button clicked
    const openBtn = sectionEl.querySelector('.myop-open-modal');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        this.openModal(sectionEl, config);
      });
    }
    
    // 🔚 Close on backdrop click
    const backdrop = this.modal.querySelector('.myop-modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeAllModals());
    }
    
    // 📋 Detail modal backdrop
    const backdropDetail = this.modalDetail.querySelector('.myop-modal-backdrop');
    if (backdropDetail) {
      backdropDetail.addEventListener('click', () => this.closeAllModals());
    }
    
    // 📦 Scent card selection
    this.scentCards.forEach((card) => {
      card.addEventListener('click', () => {
        this.selectScent(card, sectionEl);
      });
    });
    
    // ⬅️ Back button (from detail to overview)
    const backBtn = this.modalDetail.querySelector('.myop-detail-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.openListModal();
      });
    }
    
    // ✅ Apply button
    const applyBtn = this.modalDetail.querySelector('.myop-modal-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.applyScentSelection(sectionEl);
      });
    }
  },
  
  /**
   * OPEN OVERVIEW MODAL
   * Shows list of all scents with images
   */
  openModal(sectionEl, config) {
    this.modal.classList.add('is-open');
    document.body.style.overflow = "hidden";
    
    // Restore previously selected scent if available
    const savedVariantId = sectionEl.dataset.selectedVariantId || null;
    
    if (savedVariantId) {
      // Find and highlight previously selected card
      const matchCard = Array.from(this.scentCards).find(
        card => card.dataset.variantId?.toString() === savedVariantId?.toString()
      );
      
      if (matchCard) {
        matchCard.classList.add('active');
        this.selectedCard = matchCard;
      }
    }
  },
  
  /**
   * OPEN DETAIL MODAL
   * Shows details for selected scent (notes, intensity, personality)
   */
  openDetailModal(card) {
    this.modal.classList.remove('is-open');
    this.modalDetail.classList.add('is-open');
    document.body.style.overflow = "hidden";
    
    // Update detail modal with selected scent data
    const titleEl = this.modalDetail.querySelector('.myop-detail-title');
    const priceEl = this.modalDetail.querySelector('.myop-detail-price');
    const bannerImg = this.modalDetail.querySelector('#myop-detail-banner-img');
    
    if (titleEl) titleEl.textContent = card.dataset.title;
    if (priceEl) priceEl.textContent = card.dataset.price 
      ? `Rs. ${card.dataset.price}` 
      : '';
    if (bannerImg) bannerImg.src = card.dataset.bannerImg || '';
    
    // Inject scent details (notes, intensity, personality images)
    this.injectScrollSections(card);
  },
  
  /**
   * SELECT SCENT
   * User clicks a scent card → load its details
   */
  selectScent(card, sectionEl) {
    // Remove previous selection
    this.scentCards.forEach(c => c.classList.remove('active'));
    
    // Select new card
    card.classList.add('active');
    this.selectedCard = card;
    
    // Store selection data
    this.selectedName = card.dataset.title || '';
    this.selectedVariantId = card.dataset.variantId || '';
    this.selectedImageUrl = card.dataset.image || '';
    this.selectedPrice = card.dataset.price || '';
    
    // Open detail view
    this.openDetailModal(card);
  },
  
  /**
   * INJECT SCROLL SECTIONS
   * Populate detail modal with scent notes, intensity, personality
   */
  injectScrollSections(card) {
    const track = this.modalDetail.querySelector('.myop-detail-track');
    if (!track) return;
    
    // Destroy previous slick carousel if exists
    if ($(track).hasClass('slick-initialized')) {
      $(track).slick('unslick');
    }
    track.innerHTML = '';
    
    // Get scent detail images from metafields
    const topNotes = card.dataset.topNotes || '';
    const middleNotes = card.dataset.middleNotes || '';
    const baseNotes = card.dataset.baseNotes || '';
    const intensity = card.dataset.intensityImg || '';
    const personality = card.dataset.personalityImg || '';
    
    // Build slides
    if (topNotes || middleNotes || baseNotes) {
      track.insertAdjacentHTML('beforeend', `
        <div class="myop-slide">
          <h4>PERFUME NOTES</h4>
          <div class="myop-notes-row">
            ${topNotes ? `<img src="${topNotes}">` : ''}
            ${middleNotes ? `<img src="${middleNotes}">` : ''}
            ${baseNotes ? `<img src="${baseNotes}">` : ''}
          </div>
        </div>
      `);
    }
    
    if (intensity) {
      track.insertAdjacentHTML('beforeend', `
        <div class="myop-slide">
          <h4>INTENSITY</h4>
          <img src="${intensity}" class="myop-full-img intensity_img">
        </div>
      `);
    }
    
    if (personality) {
      track.insertAdjacentHTML('beforeend', `
        <div class="myop-slide">
          <h4>PERSONALITY</h4>
          <img src="${personality}" class="myop-full-img personality_img">
        </div>
      `);
    }
    
    // Initialize slick carousel for slide navigation
    $(track).slick({
      dots: true,
      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      prevArrow: window.slickPrevArrow,
      nextArrow: window.slickNextArrow
    });
  },
  
  /**
   * APPLY SCENT SELECTION
   * User clicks Apply → save selection to dataset & form, close modals
   */
  applyScentSelection(sectionEl) {
    if (!this.selectedCard) return;
    
    // Update preview button to show selected scent
    const previewBtn = sectionEl.querySelector('.myop-scent-preview-btn');
    const previewBox = previewBtn.querySelector('.myop-scent-preview-box');
    const defaultLabel = previewBtn.querySelector('.myop-scent-label-default');
    
    previewBtn.classList.add('has-scent');
    previewBox.style.display = 'block';
    defaultLabel.style.display = 'none';
    
    // Update banner image
    const bannerImg = previewBox.querySelector('.myop-scent-banner-preview');
    bannerImg.src = this.selectedCard.dataset.bannerImg || '';
    
    // Update overlay text
    const overlay = previewBox.querySelector('.myop-scent-name-overlay');
    overlay.textContent = this.selectedName;
    
    // Save to dataset for persistence
    sectionEl.dataset.selectedVariantId = this.selectedVariantId;
    sectionEl.dataset.selectedScentName = this.selectedName;
    sectionEl.dataset.selectedScentImage = this.selectedImageUrl;
    
    // Update variant ID in cart form
    const atcForm = sectionEl.querySelector('form[action="/cart/add"]');
    if (atcForm) {
      let idInput = atcForm.querySelector('input[name="id"]');
      if (!idInput) {
        idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        atcForm.appendChild(idInput);
      }
      idInput.value = this.selectedVariantId;
    }
    
    // Update price display
    const priceEl = sectionEl.querySelector('.myop-heading-price');
    if (priceEl && this.selectedPrice) {
      priceEl.textContent = `Rs. ${this.selectedPrice}`;
      priceEl.classList.add('visible');
    }
    
    // Update EMI form with new variant
    const emiWrapper = document.getElementById(
      `ProductFormInstallment-${sectionEl.id.split('-').pop()}`
    );
    if (emiWrapper) {
      const emiForm = emiWrapper.closest('form');
      if (emiForm) {
        const emiIdInput = emiForm.querySelector('input[name="id"]');
        if (emiIdInput) emiIdInput.value = this.selectedVariantId;
      }
    }
    
    MyopFormManager.updateButtonsState();
    this.closeAllModals();
  },
  
  /**
   * OPEN LIST MODAL
   * Go back to scent selection overview
   */
  openListModal() {
    this.modalDetail.classList.remove('is-open');
    this.modal.classList.add('is-open');
    document.body.style.overflow = "hidden";
  },
  
  /**
   * CLOSE ALL MODALS
   */
  closeAllModals() {
    this.modal.classList.remove("is-open");
    this.modalDetail.classList.remove("is-open");
    document.body.style.overflow = "";
  }
};

// ============================================================================
// 3️⃣ FORM MANAGER - Cart Properties & Button States
// ============================================================================

const MyopFormManager = {
  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────
  atcForm: null,
  engravingPropInput: null,
  fontPropInput: null,
  
  /**
   * INITIALIZATION
   */
  init(sectionEl, config) {
    this.atcForm = sectionEl.querySelector('.add-to-cart-close form[action="/cart/add"]');
    
    if (!this.atcForm) return;
    
    // Create hidden property inputs for cart
    this.ensurePropInputs();
    
    // Initial button lock
    this.lockBuyButtons(true);
  },
  
  /**
   * ENSURE HIDDEN PROPERTY INPUTS EXIST
   * These send engraving & font data to Shopify cart
   */
  ensurePropInputs() {
    if (!this.atcForm) return;
    
    // Create hidden engraving text input
    if (!this.engravingPropInput) {
      this.engravingPropInput = document.createElement('input');
      this.engravingPropInput.type = 'hidden';
      this.engravingPropInput.name = 'properties[Text for Engraving]';
      this.atcForm.appendChild(this.engravingPropInput);
    }
    
    // Create hidden font style input
    if (!this.fontPropInput) {
      this.fontPropInput = document.createElement('input');
      this.fontPropInput.type = 'hidden';
      this.fontPropInput.name = 'properties[Font Style]';
      this.atcForm.appendChild(this.fontPropInput);
    }
  },
  
  /**
   * SYNC FORM PROPERTIES
   * Updates hidden inputs with current engraving & font values
   */
  syncFormProps() {
    if (!this.atcForm) return;
    
    const engraving = MyopCanvasManager.engravingText || '';
    const font = MyopCanvasManager.selectedFont || '';
    
    this.engravingPropInput.value = engraving;
    this.fontPropInput.value = font;
  },
  
  /**
   * UPDATE BUTTON STATE
   * Determines if "Add to Cart" button should be enabled/disabled
   * 
   * Requirements:
   * ✅ Scent selected (variant ID set)
   * ✅ Engraving text provided (1+ chars)
   * ✅ Font selected
   * ✅ If personal note checked → must have note text
   */
  updateButtonsState() {
    const sectionEl = document.querySelector('[data-selected-variant-id]');
    
    const hasScent = !!sectionEl?.dataset.selectedVariantId;
    const hasEngraving = MyopCanvasManager.engravingText?.length > 0;
    const hasFont = !!MyopCanvasManager.selectedFont;
    
    // Gift options logic
    const noteCheckbox = document.getElementById('myop-personal-note');
    const noteText = document.getElementById('myop-note-text');
    const noteChecked = noteCheckbox?.checked;
    const noteFilled = noteText?.value.trim().length > 0;
    
    // If note checkbox ON but textarea empty → BLOCK purchase
    const validNote = !noteChecked || (noteChecked && noteFilled);
    
    const canPurchase = hasScent && hasEngraving && hasFont && validNote;
    
    this.lockBuyButtons(!canPurchase);
    this.syncFormProps();
  },
  
  /**
   * LOCK/UNLOCK BUY BUTTONS
   * @param {boolean} lock - true = disable buttons, false = enable
   */
  lockBuyButtons(lock) {
    if (!this.atcForm) return;
    
    const submitBtn = this.atcForm.querySelector('button[type="submit"][name="add"]');
    const paymentBtn = this.atcForm.querySelector('.shopify-payment-button__button');
    
    [submitBtn, paymentBtn].forEach((btn) => {
      if (!btn) return;
      btn.disabled = lock;
      btn.classList.toggle('myop-locked', lock);
      btn.style.opacity = lock ? '0.5' : '1';
      btn.style.pointerEvents = lock ? 'none' : 'auto';
    });
  },
  
  /**
   * RESET FORM AFTER PURCHASE
   * Called after successful ATC or Buy Now
   */
  resetForm(sectionEl) {
    // Clear engraving & font
    MyopCanvasManager.engravingText = '';
    MyopCanvasManager.selectedFont = 'Classic';
    
    // Clear scent selection
    MyopModalManager.selectedVariantId = null;
    MyopModalManager.selectedName = '';
    
    // Reset UI
    const previewBtn = sectionEl.querySelector('.myop-scent-preview-btn');
    const previewBox = previewBtn?.querySelector('.myop-scent-preview-box');
    const defaultLabel = previewBtn?.querySelector('.myop-scent-label-default');
    
    if (previewBtn) {
      previewBtn.classList.remove('has-scent');
      previewBox.style.display = 'none';
      defaultLabel.style.display = 'block';
    }
    
    this.lockBuyButtons(true);
    this.syncFormProps();
  }
};

// ============================================================================
// 4️⃣ GIFT OPTIONS - Gift Wrap & Personal Note
// ============================================================================

const MyopGiftOptions = {
  /**
   * INITIALIZATION
   */
  init(sectionEl) {
    const giftWrap = document.getElementById('myop-gift-wrap');
    const noteCheckbox = document.getElementById('myop-personal-note');
    const noteText = document.getElementById('myop-note-text');
    const noteWrap = document.querySelector('.myop-note-field');
    
    if (!noteCheckbox) return;
    
    // ──────────���──────────────────────────────────────────────────
    // GIFT WRAP CHECKBOX
    // ─────────────────────────────────────────────────────────────
    
    if (giftWrap) {
      giftWrap.addEventListener('change', function() {
        let giftWrapInput = sectionEl.querySelector(
          'input[name="properties[Free Gift Wrap]"]'
        );
        
        if (!giftWrapInput) {
          giftWrapInput = document.createElement('input');
          giftWrapInput.type = 'hidden';
          giftWrapInput.name = 'properties[Free Gift Wrap]';
          sectionEl.querySelector('form[action="/cart/add"]')
            .appendChild(giftWrapInput);
        }
        
        giftWrapInput.value = this.checked ? 'Yes' : '';
      });
    }
    
    // ─────────────────────────────────────────────────────────────
    // PERSONAL NOTE CHECKBOX
    // ─────────────────────────────────────────────────────────────
    
    noteCheckbox.addEventListener('change', function() {
      if (this.checked) {
        // Show textarea
        noteWrap.style.display = 'block';
        noteText.focus();
      } else {
        // Hide textarea & clear
        noteWrap.style.display = 'none';
        noteText.value = '';
      }
      
      // Update button state (note must be filled if checked)
      MyopFormManager.updateButtonsState();
    });
    
    // ─────────────────────────────────────────────────────────────
    // PERSONAL NOTE TEXT INPUT
    // ─────────────────────────────────────────────────────────────
    
    if (noteText) {
      noteText.addEventListener('input', function() {
        let noteInput = sectionEl.querySelector(
          'input[name="properties[Personal Note]"]'
        );
        
        if (!noteInput && this.value.trim()) {
          noteInput = document.createElement('input');
          noteInput.type = 'hidden';
          noteInput.name = 'properties[Personal Note]';
          sectionEl.querySelector('form[action="/cart/add"]')
            .appendChild(noteInput);
        }
        
        if (noteInput) {
          noteInput.value = this.value.trim();
        }
        
        // Update button state
        MyopFormManager.updateButtonsState();
      });
    }
  }
};

// ============================================================================
// EXPORT FOR USE
// ============================================================================

window.MyopCanvasManager = MyopCanvasManager;
window.MyopModalManager = MyopModalManager;
window.MyopFormManager = MyopFormManager;
window.MyopGiftOptions = MyopGiftOptions;