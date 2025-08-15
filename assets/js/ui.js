/**
 * Financly Tax Calculator
 * UI interaction module
 * Version: 1.0.0
 */

import TaxCalculator from './calculator.js';

class TaxCalculatorUI {
    constructor() {
        this.calculator = new TaxCalculator();
        this.initializeUI();
        this.setupEventListeners();
        this.setupCache();
    }

    initializeUI() {
        this.elements = {
            incomeInput: document.getElementById('annualIncome'),
            calculateBtn: document.querySelector('.calculate-btn'),
            resultModal: document.getElementById('resultModal'),
            regimeTabs: document.querySelectorAll('.regime-btn'),
            insightsList: document.getElementById('insightsList')
        };
    }

    setupEventListeners() {
        // Income input formatting
        this.elements.incomeInput.addEventListener('input', (e) => this.formatIncome(e.target));

        // Calculate button
        this.elements.calculateBtn.addEventListener('click', () => this.handleCalculate());

        // Regime switching
        this.elements.regimeTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchRegime(tab.dataset.regime));
        });

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }

    setupCache() {
        // Load cached data
        const cached = this.loadFromCache();
        if (cached) {
            this.elements.incomeInput.value = parseInt(cached.income).toLocaleString('en-IN');
            if (cached.regime) {
                this.switchRegime(cached.regime);
            }
        }

        // Setup auto-save
        window.addEventListener('beforeunload', () => this.saveToCache());
    }

    formatIncome(input) {
        let value = input.value.replace(/[^\d]/g, '');
        if (value) {
            value = parseInt(value).toLocaleString('en-IN');
        }
        input.value = value;
    }

    async handleCalculate() {
        const income = this.elements.incomeInput.value.replace(/[^\d]/g, '');
        if (!income) {
            this.showError('Please enter your annual income');
            return;
        }

        try {
            const comparison = this.calculator.compareRegimes(parseInt(income));
            const insights = this.calculator.generateInsights(parseInt(income), comparison);
            
            this.displayResults(comparison);
            this.displayInsights(insights);
            this.saveToCache();
            
            this.elements.resultModal.classList.add('active');
        } catch (error) {
            this.showError('An error occurred while calculating tax');
            console.error('Calculation error:', error);
        }
    }

    displayResults(comparison) {
        // Update new regime results
        document.getElementById('newRegimeTax').textContent = 
            '₹' + comparison.newRegime.tax.toLocaleString('en-IN');
        document.getElementById('newRegimeRate').textContent = 
            comparison.newRegime.effectiveRate + '%';
        document.getElementById('newRegimeInHand').textContent = 
            '₹' + comparison.newRegime.inHandMonthly.toLocaleString('en-IN');

        // Update old regime results
        document.getElementById('oldRegimeTax').textContent = 
            '₹' + comparison.oldRegime.tax.toLocaleString('en-IN');
        document.getElementById('oldRegimeRate').textContent = 
            comparison.oldRegime.effectiveRate + '%';
        document.getElementById('oldRegimeInHand').textContent = 
            '₹' + comparison.oldRegime.inHandMonthly.toLocaleString('en-IN');

        // Update comparison
        document.getElementById('betterRegime').textContent = 
            comparison.recommended === 'new' ? 'New' : 'Old';
        document.getElementById('savingsAmount').textContent = 
            '₹' + comparison.savings.toLocaleString('en-IN');
    }

    displayInsights(insights) {
        this.elements.insightsList.innerHTML = '';
        insights.forEach((insight, index) => {
            setTimeout(() => {
                const insightElement = document.createElement('div');
                insightElement.className = 'insight-item';
                insightElement.innerHTML = `
                    <div class="insight-icon">${insight.icon}</div>
                    <div class="insight-content">
                        <h4>${insight.title}</h4>
                        <p>${insight.description}</p>
                    </div>
                `;
                this.elements.insightsList.appendChild(insightElement);
            }, index * 200);
        });
    }

    showError(message) {
        // Implement your error display logic
        alert(message);
    }

    saveToCache() {
        try {
            const data = {
                income: this.elements.incomeInput.value.replace(/[^\d]/g, ''),
                regime: document.querySelector('.regime-btn.active')?.dataset.regime,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('financly_tax_calculator', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save to cache:', e);
        }
    }

    loadFromCache() {
        try {
            const cached = localStorage.getItem('financly_tax_calculator');
            if (!cached) return null;

            const data = JSON.parse(cached);
            const cacheAge = new Date() - new Date(data.timestamp);
            
            // Clear cache if older than 24 hours
            if (cacheAge > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('financly_tax_calculator');
                return null;
            }

            return data;
        } catch (e) {
            console.warn('Failed to load from cache:', e);
            return null;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.taxCalculator = new TaxCalculatorUI();
});
