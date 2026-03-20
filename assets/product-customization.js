// Wait for DOM and config to be ready
document.addEventListener('DOMContentLoaded', function() {
  if (!window.MYOP_CONFIG) return;
  if (window.isMyopPersonalizedPDP === false) return;

  const config = window.MYOP_CONFIG;
  const sectionEl = document.getElementById(`shopify-section-${config.sectionId}`);
  
  if (!sectionEl) return;

  // Initialize all modules
  MyopCanvasManager.init(sectionEl, config);
  MyopModalManager.init(sectionEl, config);
  MyopFormManager.init(sectionEl, config);
  MyopGiftOptions.init(sectionEl);
});

const MyopCanvasManager = {
  init(sectionEl, config) {
    // Canvas drawing logic here
  },
  drawCanvas() { /* ... */ },
  replaceFirstImage() { /* ... */ }
};

const MyopModalManager = {
  init(sectionEl, config) {
    // Modal handling logic here
  },
  openModal() { /* ... */ },
  closeAllModals() { /* ... */ }
};

const MyopFormManager = {
  init(sectionEl, config) {
    // Form property and button logic here
  },
  syncFormProps() { /* ... */ },
  lockBuyButtons() { /* ... */ }
};

const MyopGiftOptions = {
  init(sectionEl) {
    // Gift wrap and personal note logic here
  }
};