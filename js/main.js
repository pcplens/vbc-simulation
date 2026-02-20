// main.js - Application bootstrap
import { applyPreset, updateProgress } from './ui.js';
import { captureBaseline, runTests } from './tests.js';

// Expose test functions to browser console
window.runTests = runTests;
window.captureBaseline = captureBaseline;

// Initialize application
applyPreset('realistic');
updateProgress();
