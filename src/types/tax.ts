export type TaxRegime = 'old' | 'new' | 'revised';

export interface DeductionsType {
  section80C: number;
  section80D: number;
  hraExemption: number;
  lta: number;
  nps: number;
  standardDeduction: number;
  otherDeductions: number;
}

export interface UserData {
  basicSalary: number;
  variableSalary: number;
  otherIncome: number;
  housePropertyIncome: number;
  longTermCapitalGains: number;
  shortTermCapitalGains: number;
  deductions: DeductionsType;
}

export interface TaxDetails {
  regime: TaxRegime;
  totalTax: number;
  effectiveTaxRate: number;
  taxableIncome: number;
  totalDeductions?: number;
}

export interface TaxBreakdown {
  old: TaxDetails;
  new: TaxDetails;
  revised: TaxDetails;
  recommendedRegime: TaxRegime;
}

export interface TaxSavingsRecommendation {
  type: 'section80C' | 'section80D' | 'nps' | 'hra';
  description: string;
  potentialSavings: number;
  applicableRegimes: TaxRegime[];
} ;