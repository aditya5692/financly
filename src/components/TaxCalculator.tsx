import React, { useState, ChangeEvent } from 'react';
import {
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  AlertTitle,
  Grid,
  Button,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  Tabs,
  Tab,
  Paper as MuiPaper
} from '@mui/material';
import { ArrowBack, CheckCircle, AccountBalance, Receipt, Savings, Calculate, Info } from '@mui/icons-material';
import { 
  TaxRegime, 
  TaxDetails, 
  TaxBreakdown, 
  TaxSavingsRecommendation,
  DeductionsType,
  UserData
} from '../types/tax';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { styled } from '@mui/material/styles';

// types/tax.ts
export interface TaxRegimeResult {
  regime: 'old' | 'new' | 'revised';
  totalTax: number;
  effectiveTaxRate: number;
  taxableIncome: number;
  totalDeductions?: number;
}

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.main,
    borderRadius: '8px 8px 0 0',
  }
}));

const TaxCalculator: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [userData, setUserData] = useState<UserData>({
    basicSalary: 0,
    variableSalary: 0,
    otherIncome: 0,
    deductions: {
      section80C: 0,
      section80D: 0,
      hraExemption: 0,
      lta: 0,
      nps: 0,
      standardDeduction: 50000,
      otherDeductions: 0
    }
  });
  const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdown | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recommendations, setRecommendations] = useState<TaxSavingsRecommendation[]>([]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!userData.basicSalary || userData.basicSalary <= 0) newErrors.basicSalary = 'Valid basic salary required';
    if (userData.variableSalary < 0) newErrors.variableSalary = 'Cannot be negative';
    if (userData.otherIncome < 0) newErrors.otherIncome = 'Cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateTaxSavingsRecommendations = (totalIncome: number, currentDeductions: DeductionsType): TaxSavingsRecommendation[] => {
    const recommendations: TaxSavingsRecommendation[] = [];
    
    // Check Section 80C utilization
    if (currentDeductions.section80C < 150000) {
      recommendations.push({
        type: 'section80C',
        description: `You can save up to ₹${(150000 - currentDeductions.section80C).toLocaleString('en-IN')} more by utilizing Section 80C fully`,
        potentialSavings: (150000 - currentDeductions.section80C) * 0.3,
        applicableRegimes: ['old']
      });
    }

    // Check Section 80D utilization
    if (currentDeductions.section80D < 25000) {
      recommendations.push({
        type: 'section80D',
        description: `Consider health insurance premium deduction under Section 80D (up to ₹25,000)`,
        potentialSavings: (25000 - currentDeductions.section80D) * 0.3,
        applicableRegimes: ['old']
      });
    }

    // Check NPS utilization
    if (currentDeductions.nps < 50000) {
      recommendations.push({
        type: 'nps',
        description: `Additional NPS contribution of up to ₹${(50000 - currentDeductions.nps).toLocaleString('en-IN')} can save tax`,
        potentialSavings: (50000 - currentDeductions.nps) * 0.3,
        applicableRegimes: ['old']
      });
    }

    // Check HRA optimization
    if (currentDeductions.hraExemption < 50000) {
      recommendations.push({
        type: 'hra',
        description: 'Consider optimizing HRA exemption by providing rent receipts',
        potentialSavings: 15000,
        applicableRegimes: ['old']
      });
    }

    return recommendations;
  };

  const calculateTax = (income: number, deductions: DeductionsType, regime: TaxRegime): TaxDetails => {
    let taxableIncome = income;
    let totalDeductions = 0;
    
    if (regime === 'old') {
      totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
      taxableIncome -= totalDeductions;
    } else {
      taxableIncome -= deductions.standardDeduction;
    }

    taxableIncome = Math.max(0, taxableIncome);

    const slabs = {
      old: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250000, max: 500000, rate: 0.05 },
        { min: 500000, max: 1000000, rate: 0.2 },
        { min: 1000000, max: Infinity, rate: 0.3 }
      ],
      new: [
        { min: 0, max: 300000, rate: 0 },
        { min: 300000, max: 600000, rate: 0.05 },
        { min: 600000, max: 900000, rate: 0.1 },
        { min: 900000, max: 1200000, rate: 0.15 },
        { min: 1200000, max: 1500000, rate: 0.2 },
        { min: 1500000, max: Infinity, rate: 0.3 }
      ],
      revised: [
        { min: 0, max: 300000, rate: 0 },
        { min: 300000, max: 600000, rate: 0.05 },
        { min: 600000, max: 900000, rate: 0.1 },
        { min: 900000, max: 1200000, rate: 0.15 },
        { min: 1200000, max: 1500000, rate: 0.2 },
        { min: 1500000, max: Infinity, rate: 0.3 }
      ]
    }[regime];

    let tax = 0;
    for (const slab of slabs) {
      if (taxableIncome > slab.min) {
        const amountInSlab = Math.min(taxableIncome - slab.min, slab.max - slab.min);
        tax += amountInSlab * slab.rate;
      }
    }

    const totalTax = tax * 1.04; // Including 4% cess
    const effectiveTaxRate = (totalTax / income) * 100;

    return {
      regime,
      totalTax,
      effectiveTaxRate,
      taxableIncome,
      totalDeductions: regime === 'old' ? totalDeductions : undefined
    };
  };

  const handleCalculate = () => {
    if (!validateInputs()) return;

    const totalIncome = userData.basicSalary + userData.variableSalary + userData.otherIncome;
    
    // Generate tax savings recommendations
    const taxRecommendations = generateTaxSavingsRecommendations(totalIncome, userData.deductions);
    setRecommendations(taxRecommendations);

    // Calculate tax for all regimes
    const breakdown: TaxBreakdown = {
      old: calculateTax(totalIncome, userData.deductions, 'old'),
      new: calculateTax(totalIncome, userData.deductions, 'new'),
      revised: calculateTax(totalIncome, userData.deductions, 'revised'),
      recommendedRegime: 'old'
    };

    // Determine recommended regime
    const taxes = [breakdown.old, breakdown.new, breakdown.revised];
    breakdown.recommendedRegime = taxes.reduce((prev, curr) => 
      curr.totalTax < prev.totalTax ? curr : prev
    ).regime;

    setTaxBreakdown(breakdown);
    setActiveStep(1);
  };

  const handleUpdateUserData = (field: keyof UserData | keyof DeductionsType, value: number) => {
    setUserData(prev => ({
      ...prev,
      ...(field in prev.deductions ? {
        deductions: {
          ...prev.deductions,
          [field]: value
        }
      } : {
        [field]: value
      })
    }));
  };

  const handleApplyRecommendation = (recommendation: TaxSavingsRecommendation) => {
    switch (recommendation.type) {
      case 'section80C':
        handleUpdateUserData('section80C', Math.min(150000, userData.deductions.section80C + 50000));
        break;
      case 'section80D':
        handleUpdateUserData('section80D', Math.min(25000, userData.deductions.section80D + 5000));
        break;
      case 'nps':
        handleUpdateUserData('nps', Math.min(50000, userData.deductions.nps + 10000));
        break;
      case 'hra':
        handleUpdateUserData('hraExemption', Math.min(50000, userData.deductions.hraExemption + 15000));
        break;
    }
    handleCalculate(); // Recalculate tax after applying recommendation
  };

  const TaxRecommendations = ({ breakdown }: { breakdown: TaxBreakdown }) => {
    const recommendations = [];
    
    if (userData.deductions.section80C < 150000) {
      recommendations.push(
        `Maximize Section 80C investments (₹${(150000 - userData.deductions.section80C).toLocaleString()} remaining)`
      );
    }
    
    if (userData.deductions.nps < 50000) {
      recommendations.push(
        `Additional NPS contributions can save ₹${((50000 - userData.deductions.nps) * 0.3).toLocaleString()} tax`
      );
    }
    
    if (userData.deductions.hraExemption === 0 && userData.basicSalary > 0) {
      recommendations.push("Claim HRA exemption if renting accommodation");
    }

    return (
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircle color="success" sx={{ mr: 1 }} />
            Optimization Opportunities
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {recommendations.length > 0 ? (
            <List dense>
              {recommendations.map((rec, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={`• ${rec}`} 
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Great job! You're maximizing tax benefits effectively.
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  const IncomeForm: React.FC<{
    userData: UserData;
    errors: Record<string, string>;
    onUpdate: (field: keyof UserData | keyof DeductionsType, value: number) => void;
    onCalculate: () => void;
    max80C: number;
    max80D: number;
    maxNPS: number;
  }> = ({ userData, errors, onUpdate, onCalculate, max80C, max80D, maxNPS }) => {
    const getMaxLimit = (field: keyof DeductionsType): number => {
      switch (field) {
        case 'section80C': return max80C;
        case 'section80D': return max80D;
        case 'standardDeduction': return 50000;
        case 'nps': return maxNPS;
        default: return 999999999;
      }
    };

    const handleDeductionChange = (field: keyof DeductionsType) => (
      e: ChangeEvent<HTMLInputElement>
    ) => {
      const value = e.target.value;
      // Allow empty string for continuous typing
      if (value === '') {
        onUpdate(field, 0);
        return;
      }
      
      // Only process if the input is a valid number
      if (/^\d*\.?\d*$/.test(value)) {
        const numericValue = Number(value);
        const finalValue = Math.min(numericValue, getMaxLimit(field));
        onUpdate(field, finalValue);
      }
    };

    const handleIncomeChange = (field: keyof UserData) => (
      e: ChangeEvent<HTMLInputElement>
    ) => {
      const value = e.target.value;
      // Allow empty string for continuous typing
      if (value === '') {
        onUpdate(field, 0);
        return;
      }

      // Only process if the input is a valid number
      if (/^\d*\.?\d*$/.test(value)) {
        const numericValue = Number(value);
        if (numericValue >= 0) {
          onUpdate(field, numericValue);
        }
      }
    };

    const renderTextField = (
      label: string,
      field: keyof UserData | keyof DeductionsType,
      tooltip: string,
      isDeduction: boolean = false,
      maxLimit?: number
    ) => (
      <Tooltip 
        title={tooltip}
        placement="top-start"
        arrow
        sx={{
          '& .MuiTooltip-tooltip': {
            bgcolor: 'rgba(0, 0, 0, 0.87)',
            color: 'white',
            fontSize: '0.875rem',
            padding: '8px 12px',
            borderRadius: '4px'
          }
        }}
      >
        <TextField
          fullWidth
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {label}
              <Info fontSize="small" color="action" />
            </Box>
          }
          type="text"
          inputMode="numeric"
          value={isDeduction 
            ? userData.deductions[field as keyof DeductionsType].toString().replace(/^0+(?=\d)/, '')
            : userData[field as keyof UserData].toString().replace(/^0+(?=\d)/, '')
          }
          onChange={isDeduction ? handleDeductionChange(field as keyof DeductionsType) : handleIncomeChange(field as keyof UserData)}
          error={!!errors[field]}
          helperText={maxLimit ? `Maximum limit: ₹${maxLimit.toLocaleString()}` : errors[field]}
          required
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
            style: { textAlign: 'left' }
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
        />
      </Tooltip>
    );

    return (
      <Box>
        {/* Income Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ 
            color: 'primary.main',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <AccountBalance color="primary" />
            Income Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              {renderTextField(
                "Basic Salary",
                "basicSalary",
                "Enter your annual basic salary amount before any deductions"
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderTextField(
                "Variable Salary",
                "variableSalary",
                "Enter your annual variable pay, bonuses, and other performance-linked compensation"
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderTextField(
                "Other Income",
                "otherIncome",
                "Enter any other taxable income like rental income, interest income, etc."
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Exemptions Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ 
            color: 'secondary.main',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Receipt color="secondary" />
            Exemptions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              {renderTextField(
                "HRA Exemption",
                "hraExemption",
                "House Rent Allowance exemption based on your rent payments and city of residence",
                true
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderTextField(
                "LTA",
                "lta",
                "Leave Travel Allowance exemption for domestic travel expenses",
                true
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Deductions Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ 
            color: 'success.main',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Savings color="success" />
            Deductions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              {renderTextField(
                "Section 80C Deductions",
                "section80C",
                "Investments in PPF, ELSS, EPF, Life Insurance Premium, etc. Maximum limit: ₹1.5 lakh",
                true,
                max80C
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderTextField(
                "Section 80D Deductions",
                "section80D",
                "Health Insurance Premium for self and family. Maximum limit: ₹25,000 (₹50,000 for senior citizens)",
                true,
                max80D
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderTextField(
                "NPS Contributions",
                "nps",
                "Additional tax benefit for National Pension System contributions under Section 80CCD(1B). Maximum limit: ₹50,000",
                true,
                maxNPS
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderTextField(
                "Other Deductions",
                "otherDeductions",
                "Other eligible deductions under various sections like 80E (Education Loan), 80G (Donations), etc.",
                true
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Calculate Button */}
        <Button 
          variant="contained" 
          onClick={onCalculate} 
          fullWidth
          size="large"
          startIcon={<Calculate />}
          sx={{ 
            mt: 2,
            py: 1.5,
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          Calculate Tax Liability
        </Button>
      </Box>
    );
  };

  const TaxSummary: React.FC<{ 
    breakdown: TaxBreakdown;
    recommendations: TaxSavingsRecommendation[];
    onApplyRecommendation: (recommendation: TaxSavingsRecommendation) => void;
  }> = ({ breakdown, recommendations, onApplyRecommendation }) => {
    const [selectedRegime, setSelectedRegime] = React.useState<TaxRegime>(
      breakdown.recommendedRegime
    );

    const totalIncome = breakdown[selectedRegime].taxableIncome + 
      (breakdown[selectedRegime].totalDeductions || 0);

    const chartData = [
      {
        name: 'Total Income',
        amount: totalIncome,
        fill: '#E3F2FD'
      },
      {
        name: 'Taxable Income',
        amount: breakdown[selectedRegime].taxableIncome,
        fill: '#90CAF9'
      },
      {
        name: 'Tax Payable',
        amount: breakdown[selectedRegime].totalTax,
        fill: '#42A5F5'
      }
    ];

    return (
      <Box>
        {/* Title Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            Summary - FY 2024-2025 (AY 2025-2026)
            <Tooltip title="Tax calculation summary for the financial year">
              <Info fontSize="small" color="action" />
            </Tooltip>
          </Typography>
        </Box>

        {/* Regime Selection */}
        <Tabs 
          value={selectedRegime}
          onChange={(_, newValue: TaxRegime) => setSelectedRegime(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <StyledTab 
            value="new" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                New regime
                {breakdown.recommendedRegime === 'new' && (
                  <Box 
                    sx={{ 
                      bgcolor: 'success.light',
                      color: 'success.main',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    Recommended
                  </Box>
                )}
              </Box>
            }
          />
          <StyledTab 
            value="old" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Old regime
                {breakdown.recommendedRegime === 'old' && (
                  <Box 
                    sx={{ 
                      bgcolor: 'success.light',
                      color: 'success.main',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    Recommended
                  </Box>
                )}
              </Box>
            }
          />
        </Tabs>

        <Grid container spacing={3}>
          {/* Left Column - Chart and Basic Info */}
          <Grid item xs={12} md={6}>
            {/* Bar Chart */}
            <Box sx={{ height: 300, mb: 3 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis 
                    type="number" 
                    tickFormatter={(value: number) => `₹${(value/1000).toFixed(0)}K`} 
                  />
                  <YAxis type="category" dataKey="name" />
                  <Bar dataKey="amount" />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" color="text.secondary">Total income</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ₹{totalIncome.toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Exemption and deduction
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ₹{(breakdown[selectedRegime].totalDeductions || 0).toLocaleString()}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {selectedRegime === 'old' && (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Standard Deductions: ₹{userData.deductions.standardDeduction.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Chapter VI A Deductions: ₹{(
                            userData.deductions.section80C +
                            userData.deductions.section80D +
                            userData.deductions.nps
                          ).toLocaleString()}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" color="text.secondary">Tax payable</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    ₹{breakdown[selectedRegime].totalTax.toLocaleString()}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Income tax: ₹{(breakdown[selectedRegime].totalTax * 0.96).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Health and education cess: ₹{(breakdown[selectedRegime].totalTax * 0.04).toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Right Column - Recommendations and Additional Info */}
          <Grid item xs={12} md={6}>
            {/* Tax Savings Alert */}
            {breakdown.recommendedRegime !== selectedRegime && (
              <Alert 
                severity="info" 
                sx={{ mb: 3 }}
                action={
                  <Button 
                    color="info" 
                    size="small"
                    onClick={() => {
                      if (breakdown.recommendedRegime === 'old' || breakdown.recommendedRegime === 'new') {
                        setSelectedRegime(breakdown.recommendedRegime);
                      }
                    }}
                  >
                    Switch Regime
                  </Button>
                }
              >
                You can save ₹{Math.abs(
                  breakdown[selectedRegime].totalTax - breakdown[breakdown.recommendedRegime].totalTax
                ).toLocaleString()} by switching to the {breakdown.recommendedRegime} regime
              </Alert>
            )}

            {/* Recommendations Section */}
            {recommendations.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: 'success.main',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <CheckCircle color="success" />
                  Tax Savings Opportunities
                </Typography>
                <Grid container spacing={2}>
                  {recommendations.map((rec, index) => (
                    <Grid item xs={12} key={index}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderColor: 'success.light',
                          '&:hover': {
                            borderColor: 'success.main',
                            bgcolor: 'success.light',
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {rec.description}
                            </Typography>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => onApplyRecommendation(rec)}
                              startIcon={<CheckCircle />}
                            >
                              Apply
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Filing Information */}
            <Alert 
              severity="info" 
              sx={{ 
                bgcolor: 'info.light',
                color: 'info.dark',
                '& .MuiAlert-icon': {
                  color: 'info.main'
                }
              }}
            >
              <AlertTitle>ITR filing due date: July 31, 2025</AlertTitle>
              Tax calculations include 4% health and education cess. 
              Actual liability may vary based on document submission.
            </Alert>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ 
        fontWeight: 700, 
        color: 'primary.main',
        mb: 4,
        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
      }}>
        Smart Tax Planner 2024-25
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step><StepLabel>Income Details</StepLabel></Step>
        <Step><StepLabel>Tax Analysis</StepLabel></Step>
      </Stepper>

      {activeStep === 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              <IncomeForm
                userData={userData}
                errors={errors}
                onUpdate={handleUpdateUserData}
                onCalculate={handleCalculate}
                max80C={150000}
                max80D={100000}
                maxNPS={50000}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card 
              variant="outlined" 
              sx={{ 
                mb: 2,
                borderColor: 'info.light',
                bgcolor: 'info.light',
                '&:hover': {
                  boxShadow: 3,
                  borderColor: 'info.main'
                }
              }}
            >
              <CardContent>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'info.dark' }}>
                  Quick Tax Tips
                </Typography>
                <Divider sx={{ mb: 2, borderColor: 'info.main' }} />
                <List dense>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="• Standard deduction: ₹50,000 for all employees"
                      primaryTypographyProps={{ color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="• Section 80C limit: ₹1.5 lakh (EPF, PPF, ELSS, etc.)"
                      primaryTypographyProps={{ color: 'text.primary' }}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary="• NPS additional deduction: ₹50,000 under 80CCD(1B)"
                      primaryTypographyProps={{ color: 'text.primary' }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h5" component="div" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Tax Breakdown
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={() => setActiveStep(0)}
                  size="small"
                  sx={{ 
                    textTransform: 'none',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      bgcolor: 'primary.light'
                    }
                  }}
                >
                  Modify Inputs
                </Button>
              </Box>
              {taxBreakdown && <TaxSummary breakdown={taxBreakdown} recommendations={recommendations} onApplyRecommendation={handleApplyRecommendation} />}
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 2, 
                  borderRadius: 1,
                  bgcolor: 'info.light',
                  color: 'info.dark',
                  '& .MuiAlert-icon': {
                    color: 'info.main'
                  }
                }}
              >
                Note: Tax calculations include 4% health and education cess. 
                Actual liability may vary based on document submission.
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default TaxCalculator;