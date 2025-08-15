/**
 * Financly Tax Calculator
 * Core calculation module
 * Version: 1.0.0
 */

const TAX_YEARS = {
    "2025-26": {
        newRegime: {
            standardDeduction: 50000,
            rebateLimit: 700000,
            rebateAmount: 25000,
            slabs: [
                { min: 0, max: 300000, rate: 0 },
                { min: 300000, max: 600000, rate: 0.05 },
                { min: 600000, max: 900000, rate: 0.10 },
                { min: 900000, max: 1200000, rate: 0.15 },
                { min: 1200000, max: 1500000, rate: 0.20 },
                { min: 1500000, max: Infinity, rate: 0.30 }
            ]
        },
        oldRegime: {
            standardDeduction: 50000,
            rebateLimit: 500000,
            rebateAmount: 12500,
            slabs: [
                { min: 0, max: 250000, rate: 0 },
                { min: 250000, max: 500000, rate: 0.05 },
                { min: 500000, max: 1000000, rate: 0.20 },
                { min: 1000000, max: Infinity, rate: 0.30 }
            ]
        }
    }
};

class TaxCalculator {
    constructor(year = "2025-26") {
        this.taxYear = year;
        this.taxParams = TAX_YEARS[year];
    }

    calculateTax(income, regime = 'new') {
        const params = regime === 'new' ? this.taxParams.newRegime : this.taxParams.oldRegime;
        let tax = 0;
        let taxableIncome = Math.max(0, income - params.standardDeduction);

        // Calculate tax using slabs
        params.slabs.forEach(slab => {
            if (taxableIncome > slab.min) {
                const taxableAmount = Math.min(taxableIncome - slab.min, slab.max - slab.min);
                tax += taxableAmount * slab.rate;
            }
        });

        // Apply rebate
        if (taxableIncome <= params.rebateLimit) {
            tax = Math.max(0, tax - Math.min(tax, params.rebateAmount));
        }

        // Add 4% cess
        tax = Math.round(tax * 1.04);

        return {
            grossIncome: income,
            standardDeduction: params.standardDeduction,
            taxableIncome: taxableIncome,
            tax: tax,
            effectiveRate: ((tax / income) * 100).toFixed(2),
            inHandMonthly: Math.round((income - tax) / 12),
            regime: regime
        };
    }

    compareRegimes(income) {
        const newRegimeTax = this.calculateTax(income, 'new');
        const oldRegimeTax = this.calculateTax(income, 'old');
        
        return {
            newRegime: newRegimeTax,
            oldRegime: oldRegimeTax,
            recommended: newRegimeTax.tax <= oldRegimeTax.tax ? 'new' : 'old',
            savings: Math.abs(newRegimeTax.tax - oldRegimeTax.tax)
        };
    }

    generateInsights(income, comparison) {
        const insights = [];
        const saving = comparison.savings;
        const betterRegime = comparison.recommended;

        insights.push({
            type: 'regime',
            icon: '💡',
            title: 'Regime Recommendation',
            description: `The ${betterRegime} regime is better for you. You can save ₹${saving.toLocaleString('en-IN')} annually.`
        });

        if (income > 1500000) {
            insights.push({
                type: 'high-income',
                icon: '📈',
                title: 'High Income Benefits',
                description: 'Consider tax-saving investments like ELSS mutual funds for dual benefits.'
            });
        }

        return insights;
    }
}

// Export for modern browsers
export default TaxCalculator;

// CommonJS support
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaxCalculator;
}
