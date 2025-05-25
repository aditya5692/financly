import React, { useState, ChangeEvent, useEffect } from 'react';
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
  Tabs as MuiTabs,
  Tab as MuiTab,
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
import IncomeForm from './IncomeForm';

const StyledTab = styled(MuiTab)(({ theme }) => ({
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
    housePropertyIncome: 0,
    longTermCapitalGains: 0,
    shortTermCapitalGains: 0,
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
  const [originalIncome, setOriginalIncome] = useState(0);
  const [menuTab, setMenuTab] = useState(0); // 0 = Income Tax Planner

  const validateInputs = (): boolean => {
    const totalIncome =
      Number(userData.basicSalary || 0) +
      Number(userData.variableSalary || 0) +
      Number(userData.otherIncome || 0) +
      Number(userData.housePropertyIncome || 0) +
      Number(userData.longTermCapitalGains || 0) +
      Number(userData.shortTermCapitalGains || 0);
    const newErrors: Record<string, string> = {};
    if (totalIncome <= 0) newErrors.totalIncome = 'Total income must be greater than zero';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateTaxSavingsRecommendations = (totalIncome: number, currentDeductions: DeductionsType): TaxSavingsRecommendation[] => {
    const recommendations: TaxSavingsRecommendation[] = [];
    const section80CNum = Number(currentDeductions.section80C || '0');
    const section80DNum = Number(currentDeductions.section80D || '0');
    const npsNum = Number(currentDeductions.nps || '0');
    const hraExemptionNum = Number(currentDeductions.hraExemption || '0');

    if (section80CNum < 150000) {
      recommendations.push({
        type: 'section80C',
        description: `You can save up to ₹${(150000 - section80CNum).toLocaleString('en-IN')} more by utilizing Section 80C fully`,
        potentialSavings: (150000 - section80CNum) * 0.3,
        applicableRegimes: ['old']
      });
    }
    if (section80DNum < 25000) {
      recommendations.push({
        type: 'section80D',
        description: `Consider health insurance premium deduction under Section 80D (up to ₹25,000)`,
        potentialSavings: (25000 - section80DNum) * 0.3,
        applicableRegimes: ['old']
      });
    }
    if (npsNum < 50000) {
      recommendations.push({
        type: 'nps',
        description: `Additional NPS contribution of up to ₹${(50000 - npsNum).toLocaleString('en-IN')} can save tax`,
        potentialSavings: (50000 - npsNum) * 0.3,
        applicableRegimes: ['old']
      });
    }
    if (hraExemptionNum < 50000) {
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
      totalDeductions = Object.values(deductions).reduce((a, b) => a + Number(b), 0);
      taxableIncome -= totalDeductions;
    } else {
      taxableIncome -= Number(deductions.standardDeduction);
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

    const totalTax = Math.round(tax * 1.04); // Including 4% cess and rounding off
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

    const totalIncome =
      Number(userData.basicSalary || 0) +
      Number(userData.variableSalary || 0) +
      Number(userData.otherIncome || 0) +
      Number(userData.housePropertyIncome || 0) +
      Number(userData.longTermCapitalGains || 0) +
      Number(userData.shortTermCapitalGains || 0);
    
    // Generate tax savings recommendations
    const taxRecommendations = generateTaxSavingsRecommendations(totalIncome, userData.deductions);
    setRecommendations(taxRecommendations);

    // Calculate tax for all regimes
    const breakdown: TaxBreakdown & { originalIncome: number } = {
      old: calculateTax(totalIncome, userData.deductions, 'old'),
      new: calculateTax(totalIncome, userData.deductions, 'new'),
      revised: calculateTax(totalIncome, userData.deductions, 'revised'),
      recommendedRegime: 'old',
      originalIncome: totalIncome
    };

    // Determine recommended regime
    const taxes = [breakdown.old, breakdown.new, breakdown.revised];
    const minTax = Math.min(...taxes.map(t => t.totalTax));
    const regimesWithMinTax = taxes.filter(t => t.totalTax === minTax).map(t => t.regime);
    breakdown.recommendedRegime = regimesWithMinTax[0]; // still pick one for tab default
    const isTie = regimesWithMinTax.length > 1;

    setTaxBreakdown(breakdown);
    setOriginalIncome(totalIncome);
    setActiveStep(1);
  };

  const handleUpdateUserData = (data: UserData) => {
    setUserData(data);
  };

  const handleApplyRecommendation = (recommendation: TaxSavingsRecommendation) => {
    switch (recommendation.type) {
      case 'section80C':
        handleUpdateUserData({
          ...userData,
          deductions: {
            ...userData.deductions,
            section80C: Math.min(150000, Number(userData.deductions.section80C || "0") + 50000)
          }
        });
        break;
      case 'section80D':
        handleUpdateUserData({
          ...userData,
          deductions: {
            ...userData.deductions,
            section80D: Math.min(25000, Number(userData.deductions.section80D || "0") + 5000)
          }
        });
        break;
      case 'nps':
        handleUpdateUserData({
          ...userData,
          deductions: {
            ...userData.deductions,
            nps: Math.min(50000, Number(userData.deductions.nps || "0") + 5000)
          }
        });
        break;
      case 'hra':
        handleUpdateUserData({
          ...userData,
          deductions: {
            ...userData.deductions,
            hraExemption: Math.min(50000, Number(userData.deductions.hraExemption || "0") + 5000)
          }
        });
        break;
      default:
        // No action
        break;
    }
    handleCalculate(); // Recalculate tax after applying recommendation
  };

  const TaxRecommendations = ({ breakdown }: { breakdown: TaxBreakdown }) => {
    const recommendations = [];
    
    if (Number(userData.deductions.section80C || "0") < 150000) {
      recommendations.push(
        `Maximize Section 80C investments (₹${(150000 - Number(userData.deductions.section80C || "0")).toLocaleString()} remaining)`
      );
    }
    
    if (Number(userData.deductions.nps || "0") < 50000) {
      recommendations.push(
        `Additional NPS contributions can save ₹${((50000 - Number(userData.deductions.nps || "0")) * 0.3).toLocaleString()} tax`
      );
    }
    
    if (Number(userData.deductions.hraExemption || "0") === 0 && Number(userData.basicSalary || "0") > 0) {
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

  // Update handlers to store string values
  type UserDataField = keyof UserData;
  type DeductionField = keyof DeductionsType;

  const handleIncomeChange = (field: keyof UserData) => (e: ChangeEvent<HTMLInputElement>) => {
    handleUpdateUserData({
      ...userData,
      [field]: Number(e.target.value)
    });
  };

  const handleDeductionChange = (field: keyof DeductionsType) => (e: ChangeEvent<HTMLInputElement>) => {
    handleUpdateUserData({
      ...userData,
      deductions: {
        ...userData.deductions,
        [field]: Number(e.target.value)
      }
    });
  };

  // Update renderTextField to use string values
  type RenderTextFieldProps = {
    label: string;
    field: UserDataField | DeductionField;
    tooltip: string;
    isDeduction?: boolean;
    maxLimit?: number;
  };

  const renderTextField = (
    label: string,
    field: UserDataField | DeductionField,
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
          ? userData.deductions[field as DeductionField].toString()
          : userData[field as UserDataField].toString()
        }
        onChange={isDeduction ? handleDeductionChange(field as DeductionField) : handleIncomeChange(field as UserDataField)}
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

  const TaxSummary: React.FC<{ 
    breakdown: TaxBreakdown;
    originalIncome: number;
    recommendations: TaxSavingsRecommendation[];
    onApplyRecommendation: (recommendation: TaxSavingsRecommendation) => void;
    isTie?: boolean;
  }> = ({ breakdown, originalIncome, recommendations, onApplyRecommendation, isTie }) => {
    const [selectedRegime, setSelectedRegime] = React.useState<TaxRegime>(
      breakdown.recommendedRegime
    );
    const totalIncome = originalIncome;
    const recommendedTax = breakdown[breakdown.recommendedRegime].totalTax;
    const selectedTax = breakdown[selectedRegime].totalTax;
    const savings = selectedTax - recommendedTax;
    // Move chartData definition here so it's in scope for BarChart
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
        {/* Engaging summary at the top */}
        <Box sx={{ mb: 3, p: 3, bgcolor: 'success.light', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
              {savings > 0 ? `You can save ₹${Math.abs(savings).toLocaleString()}!` : 'You are already on the best regime!'}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.primary' }}>
              {savings > 0
                ? `Switch to the ${breakdown.recommendedRegime.toUpperCase()} regime to minimize your tax liability.`
                : `Congratulations! The ${breakdown.recommendedRegime.toUpperCase()} regime is optimal for you.`}
            </Typography>
          </Box>
          {savings > 0 && (
            <Button
              variant="contained"
              color="success"
              size="large"
              sx={{ fontWeight: 700, fontSize: '1.1rem', borderRadius: 2 }}
              onClick={() => setSelectedRegime(breakdown.recommendedRegime)}
            >
              Switch to {breakdown.recommendedRegime.toUpperCase()} Regime
            </Button>
          )}
        </Box>

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
        <MuiTabs 
          value={selectedRegime}
          onChange={(_, newValue: TaxRegime) => setSelectedRegime(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <StyledTab 
            value="new" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                New regime
                {!isTie && breakdown.recommendedRegime === 'new' && (
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
                {!isTie && breakdown.recommendedRegime === 'old' && (
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
        </MuiTabs>

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
                    Total Deductions & Exemptions
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ₹{(selectedRegime === 'old'
                        ? (Number(userData.deductions.standardDeduction || 0) +
                           Number(userData.deductions.section80C || 0) +
                           Number(userData.deductions.section80D || 0) +
                           Number(userData.deductions.nps || 0) +
                           Number(userData.deductions.hraExemption || 0) +
                           Number(userData.deductions.lta || 0) +
                           Number(userData.deductions.otherDeductions || 0))
                        : Number(userData.deductions.standardDeduction || 0)
                      ).toLocaleString()}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Standard Deduction: ₹{userData.deductions.standardDeduction.toLocaleString()}
                    </Typography>
                    {selectedRegime === 'old' && (
                      <Typography variant="body2" color="text.secondary">
                        Other Deductions & Exemptions: ₹{(
                          Number(userData.deductions.section80C || 0) +
                          Number(userData.deductions.section80D || 0) +
                          Number(userData.deductions.nps || 0) +
                          Number(userData.deductions.hraExemption || 0) +
                          Number(userData.deductions.lta || 0) +
                          Number(userData.deductions.otherDeductions || 0)
                        ).toLocaleString()}
                      </Typography>
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
            {!isTie ? (
              breakdown.recommendedRegime !== selectedRegime && (
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
              )
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                Both regimes result in the same tax. You may choose either.
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

        <Box sx={{ mt: 6, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 700 }}>
            Guidance: Old vs New Tax Regime
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Old Regime:</strong> Allows most deductions and exemptions (like 80C, 80D, HRA, LTA, etc.). Suitable for those who claim significant deductions.
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>New Regime:</strong> Lower tax rates but <strong>no major deductions/exemptions</strong> (except standard deduction). Suitable for those with fewer deductions.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Old Regime Tax Slabs (FY 2024-25):</Typography>
          <ul style={{ marginTop: 0 }}>
            <li>Up to ₹2,50,000: <strong>0%</strong></li>
            <li>₹2,50,001 – ₹5,00,000: <strong>5%</strong></li>
            <li>₹5,00,001 – ₹10,00,000: <strong>20%</strong></li>
            <li>Above ₹10,00,000: <strong>30%</strong></li>
          </ul>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2 }}>New Regime Tax Slabs (FY 2024-25):</Typography>
          <ul style={{ marginTop: 0 }}>
            <li>Up to ₹3,00,000: <strong>0%</strong></li>
            <li>₹3,00,001 – ₹6,00,000: <strong>5%</strong></li>
            <li>₹6,00,001 – ₹9,00,000: <strong>10%</strong></li>
            <li>₹9,00,001 – ₹12,00,000: <strong>15%</strong></li>
            <li>₹12,00,001 – ₹15,00,000: <strong>20%</strong></li>
            <li>Above ₹15,00,000: <strong>30%</strong></li>
          </ul>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            <strong>Note:</strong> Both regimes add 4% health and education cess to the calculated tax. The best regime for you depends on your eligible deductions and exemptions. If you claim many deductions, the old regime may be better. If not, the new regime's lower rates may benefit you.
          </Typography>
        </Box>
      </Box>
    );
  };

  // Place this just before the return statement in TaxCalculator
  const isTie = (() => {
    if (!taxBreakdown) return false;
    const taxes = [taxBreakdown.old, taxBreakdown.new, taxBreakdown.revised];
    const minTax = Math.min(...taxes.map(t => t.totalTax));
    const regimesWithMinTax = taxes.filter(t => t.totalTax === minTax).map(t => t.regime);
    return regimesWithMinTax.length > 1;
  })();

  // New: handle form submit from IncomeForm
  const handleFormSubmit = (data: UserData) => {
    setUserData(data);
    // Calculate tax using the new data immediately
    const totalIncome =
      Number(data.basicSalary || 0) +
      Number(data.variableSalary || 0) +
      Number(data.otherIncome || 0) +
      Number(data.housePropertyIncome || 0) +
      Number(data.longTermCapitalGains || 0) +
      Number(data.shortTermCapitalGains || 0);
    // Generate tax savings recommendations
    const taxRecommendations = generateTaxSavingsRecommendations(totalIncome, data.deductions);
    setRecommendations(taxRecommendations);
    // Calculate tax for all regimes
    const breakdown: TaxBreakdown & { originalIncome: number } = {
      old: calculateTax(totalIncome, data.deductions, 'old'),
      new: calculateTax(totalIncome, data.deductions, 'new'),
      revised: calculateTax(totalIncome, data.deductions, 'revised'),
      recommendedRegime: 'old',
      originalIncome: totalIncome
    };
    // Determine recommended regime
    const taxes = [breakdown.old, breakdown.new, breakdown.revised];
    const minTax = Math.min(...taxes.map(t => t.totalTax));
    const regimesWithMinTax = taxes.filter(t => t.totalTax === minTax).map(t => t.regime);
    breakdown.recommendedRegime = regimesWithMinTax[0]; // still pick one for tab default
    setTaxBreakdown(breakdown);
    setOriginalIncome(totalIncome);
    setActiveStep(1);
  };

  return (
    <Box sx={{
      bgcolor: 'white',
      minHeight: '100vh',
      py: 0,
      px: 5,
      border: '2px solid transparent',
      backgroundImage: 'linear-gradient(white, white), radial-gradient(circle at top left,rgb(255, 255, 255),rgb(255, 255, 255))',
      backgroundOrigin: 'border-box',
      backgroundClip: 'content-box, border-box'
    }}>
      <Box sx={{ maxWidth: '100%', mx: 0, px: 0 }}>
        {/* Header and Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', pt: 4, pb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, flex: 0, textAlign: 'left', color: 'primary.main', letterSpacing: 1 }}>
            Financly
          </Typography>
        </Box>
        <MuiTabs
          value={menuTab}
          onChange={(_, v) => setMenuTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <MuiTab label="Income Tax Planner" sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'none' }} />
          <MuiTab label="Mutual Fund Calculator" sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'none' }} />
          <MuiTab label="Retirement Planning" sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'none' }} />
          <MuiTab label="Insurance Needs" sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'none' }} />
          <MuiTab label="Loan EMI" sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'none' }} />
          <MuiTab label="More" sx={{ fontWeight: 700, fontSize: '1rem', textTransform: 'none' }} />
        </MuiTabs>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{
              bgcolor: activeStep === 0 ? 'primary.main' : '#e0e0e0',
              color: activeStep === 0 ? 'white' : 'text.primary',
              px: 2, py: 0.5, borderRadius: 2, fontWeight: 700, fontSize: '1rem'
            }}>
              1 Income Details
            </Box>
            <Box sx={{
              bgcolor: activeStep === 1 ? 'primary.main' : '#e0e0e0',
              color: activeStep === 1 ? 'white' : 'text.primary',
              px: 2, py: 0.5, borderRadius: 2, fontWeight: 700, fontSize: '1rem'
            }}>
              2 Tax Analysis
            </Box>
          </Box>
        </Box>
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, width: '100%', maxWidth: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Alert/info box at the top */}
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, fontSize: '1rem', alignItems: 'center', width: '100%' }}>
              Please fill in your income details. Only total income must be greater than zero.
            </Alert>
            {(!taxBreakdown || activeStep === 0) && (
              <Grid container spacing={4} alignItems="flex-start" sx={{ width: '100%' }}>
                {/* Left: Main Form */}
                <Grid item xs={12} md={7}>
                  <IncomeForm
                    userData={userData}
                    errors={errors}
                    onUpdate={handleUpdateUserData}
                    onSubmit={handleFormSubmit}
                    max80C={150000}
                    max80D={100000}
                    maxNPS={50000}
                  />
                </Grid>
                {/* Right: Quick Tax Tips Card (inside main card) */}
                <Grid item xs={12} md={5}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'info.light', minHeight: 400 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                      Quick Tax Tips
                    </Typography>
                    <Divider sx={{ mb: 2, borderColor: 'primary.main' }} />
                    <Box component="ul" sx={{ pl: 2, m: 0, color: 'text.primary', fontSize: '1.05rem' }}>
                      <li style={{ marginBottom: 16 }}>
                        Standard deduction: ₹50,000 for all employees
                      </li>
                      <li style={{ marginBottom: 16 }}>
                        Section 80C limit: ₹1.5 lakh (EPF, PPF, ELSS, etc.)
                      </li>
                      <li>
                        NPS additional deduction: ₹50,000 under 80CCD(1B)
                      </li>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
            {taxBreakdown && activeStep === 1 && (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button variant="outlined" color="primary" onClick={() => setActiveStep(0)}>
                    Modify Inputs
                  </Button>
                </Box>
                <TaxSummary
                  breakdown={taxBreakdown}
                  originalIncome={originalIncome}
                  recommendations={recommendations}
                  onApplyRecommendation={handleApplyRecommendation}
                  isTie={isTie}
                />
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default TaxCalculator;