import React, { useState, ChangeEvent, FormEvent } from 'react';
import {
  TextField,
  Button,
  Box,
  Grid,
  Typography,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  IconButton,
  InputAdornment,
  Paper,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { DeductionsType, UserData } from '../types/tax';

interface IncomeFormProps {
  userData: UserData;
  errors: Record<string, string>;
  onUpdate: (userData: UserData) => void; // Modified onUpdate prop
  onSubmit: (userData: UserData) => void; // New prop for submit
  max80C: number;
  max80D: number;
  maxNPS: number;
}

const IncomeForm: React.FC<IncomeFormProps> = ({
  userData: initialUserData, // Renamed to initialUserData
  errors,
  onUpdate,
  onSubmit,
  max80C,
  max80D,
  maxNPS
}) => {
  const [localFormData, setLocalFormData] = useState<
    Omit<UserData, 'basicSalary' | 'variableSalary' | 'otherIncome' | 'housePropertyIncome' | 'longTermCapitalGains' | 'shortTermCapitalGains'> & {
      basicSalary: string;
      variableSalary: string;
      otherIncome: string;
      housePropertyIncome: string;
      longTermCapitalGains: string;
      shortTermCapitalGains: string;
    }
  >({
    ...initialUserData,
    basicSalary: initialUserData.basicSalary.toString(),
    variableSalary: initialUserData.variableSalary.toString(),
    otherIncome: initialUserData.otherIncome.toString(),
    housePropertyIncome: initialUserData.housePropertyIncome.toString(),
    longTermCapitalGains: initialUserData.longTermCapitalGains.toString(),
    shortTermCapitalGains: initialUserData.shortTermCapitalGains.toString(),
  });

  // Local error for total income
  const [localTotalIncomeError, setLocalTotalIncomeError] = useState<string | null>(null);

  const handleDeductionChange = (field: keyof DeductionsType) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const value = Math.min(Number(e.target.value), getMaxLimit(field));
    setLocalFormData(prev => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        [field]: value,
      },
    }));
  };

  const handleIncomeChange = (field: keyof UserData) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setLocalFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Calculate total income from updated localFormData
      const totalIncome =
        (Number(updated.basicSalary) || 0) +
        (Number(updated.variableSalary) || 0) +
        (Number(updated.otherIncome) || 0) +
        (Number(updated.housePropertyIncome) || 0) +
        (Number(updated.longTermCapitalGains) || 0) +
        (Number(updated.shortTermCapitalGains) || 0);
      setLocalTotalIncomeError(totalIncome > 0 ? null : 'Total income must be greater than zero');
      return updated;
    });
  };

  const getMaxLimit = (field: keyof DeductionsType): number => {
    switch (field) {
      case 'section80C': return max80C;
      case 'section80D': return max80D;
      case 'standardDeduction': return 50000;
      case 'nps': return maxNPS;
      default: return 999999999;
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const totalIncome =
      (Number(localFormData.basicSalary) || 0) +
      (Number(localFormData.variableSalary) || 0) +
      (Number(localFormData.otherIncome) || 0) +
      (Number(localFormData.housePropertyIncome) || 0) +
      (Number(localFormData.longTermCapitalGains) || 0) +
      (Number(localFormData.shortTermCapitalGains) || 0);
    if (totalIncome <= 0) {
      setLocalTotalIncomeError('Total income must be greater than zero');
      return;
    }
    setLocalTotalIncomeError(null);
    const updatedData = {
      ...localFormData,
      basicSalary: Number(localFormData.basicSalary) || 0,
      variableSalary: Number(localFormData.variableSalary) || 0,
      otherIncome: Number(localFormData.otherIncome) || 0,
      housePropertyIncome: Number(localFormData.housePropertyIncome) || 0,
      longTermCapitalGains: Number(localFormData.longTermCapitalGains) || 0,
      shortTermCapitalGains: Number(localFormData.shortTermCapitalGains) || 0,
    };
    onSubmit(updatedData); // Only call onSubmit
  };

  const getDeductionTooltip = (field: keyof DeductionsType): string => {
    switch (field) {
      case 'section80C':
        return `Investments in PPF, ELSS, LIC, etc. (Max: ₹${max80C.toLocaleString('en-IN')})`;
      case 'section80D':
        return `Health Insurance Premium (Max: ₹${max80D.toLocaleString('en-IN')})`;
      case 'standardDeduction':
        return 'Standard deduction of ₹50,000 is automatically applied in Old Regime';
      case 'hraExemption':
        return 'House Rent Allowance Exemption based on your HRA receipt and rent paid';
      case 'lta':
        return 'Leave Travel Allowance exemption for travel expenses';
      case 'nps':
        return `Additional NPS Contribution under Section 80CCD(1B) (Max: ₹${maxNPS.toLocaleString('en-IN')})`;
      case 'otherDeductions':
        return 'Other deductions under various sections';
      default:
        return '';
    }
  };

  // Handler to block non-numeric input (and allow negative for capital gains)
  const getKeyDownHandler = (allowNegative = false) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    if (allowed.includes(e.key)) return;
    if (allowNegative && e.key === '-' && (e.currentTarget.selectionStart === 0 && !e.currentTarget.value.includes('-'))) return;
    if (!/\d/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Basic Income Details
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Basic Salary (₹)"
            type="text"
            value={localFormData.basicSalary}
            onChange={handleIncomeChange('basicSalary')}
            error={!!errors.basicSalary}
            helperText={errors.basicSalary}
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            onKeyDown={getKeyDownHandler(false)}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Variable Salary (₹)"
            type="text"
            value={localFormData.variableSalary}
            onChange={handleIncomeChange('variableSalary')}
            error={!!errors.variableSalary}
            helperText={errors.variableSalary}
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            onKeyDown={getKeyDownHandler(false)}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Other Allowance (₹)"
            type="text"
            value={localFormData.otherIncome}
            onChange={handleIncomeChange('otherIncome')}
            error={!!errors.otherIncome}
            helperText={errors.otherIncome}
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            onKeyDown={getKeyDownHandler(false)}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />
        </Grid>
      </Grid>
      <Accordion sx={{ borderRadius: 2, boxShadow: 1, mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Other types of Incomes</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="House Property Income (₹)"
                type="text"
                value={localFormData.housePropertyIncome}
                onChange={handleIncomeChange('housePropertyIncome')}
                error={!!errors.housePropertyIncome}
                helperText={errors.housePropertyIncome}
                fullWidth
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                onKeyDown={getKeyDownHandler(false)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Profit/Loss on Sale of Shares (Held > 1 year) (₹)"
                type="text"
                value={localFormData.longTermCapitalGains}
                onChange={handleIncomeChange('longTermCapitalGains')}
                error={!!errors.longTermCapitalGains}
                helperText={errors.longTermCapitalGains}
                fullWidth
                inputProps={{ inputMode: 'numeric', pattern: '-?[0-9]*' }}
                onKeyDown={getKeyDownHandler(true)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Profit/Loss on Sale of Shares (Held ≤ 1 year) (₹)"
                type="text"
                value={localFormData.shortTermCapitalGains}
                onChange={handleIncomeChange('shortTermCapitalGains')}
                error={!!errors.shortTermCapitalGains}
                helperText={errors.shortTermCapitalGains}
                fullWidth
                inputProps={{ inputMode: 'numeric', pattern: '-?[0-9]*' }}
                onKeyDown={getKeyDownHandler(true)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 3 }}>
        Deductions & Exemptions
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Section 80C (₹)"
            type="text"
            value={localFormData.deductions.section80C}
            onChange={handleDeductionChange('section80C')}
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', max: max80C }}
            helperText={Number(localFormData.deductions.section80C) > max80C ? `Maximum limit: ₹${max80C.toLocaleString()}` : undefined}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            onKeyDown={getKeyDownHandler(false)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Section 80D (₹)"
            type="text"
            value={localFormData.deductions.section80D}
            onChange={handleDeductionChange('section80D')}
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', max: max80D }}
            helperText={Number(localFormData.deductions.section80D) > max80D ? `Maximum limit: ₹${max80D.toLocaleString()}` : undefined}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            onKeyDown={getKeyDownHandler(false)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="HRA Exemption (₹)"
            type="text"
            value={localFormData.deductions.hraExemption}
            onChange={handleDeductionChange('hraExemption')}
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            onKeyDown={getKeyDownHandler(false)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="LTA (₹)"
            type="text"
            value={localFormData.deductions.lta}
            onChange={handleDeductionChange('lta')}
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            onKeyDown={getKeyDownHandler(false)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="NPS (80CCD 1B) (₹)"
            type="text"
            value={localFormData.deductions.nps}
            onChange={handleDeductionChange('nps')}
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', max: maxNPS }}
            helperText={Number(localFormData.deductions.nps) > maxNPS ? `Maximum limit: ₹${maxNPS.toLocaleString()}` : undefined}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            onKeyDown={getKeyDownHandler(false)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Other Deductions (₹)"
            type="text"
            value={localFormData.deductions.otherDeductions}
            onChange={handleDeductionChange('otherDeductions')}
            fullWidth
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            onKeyDown={getKeyDownHandler(false)}
          />
        </Grid>
      </Grid>
      <Button
        variant="contained"
        type="submit"
        size="large"
        sx={{ mt: 2, borderRadius: 1, fontWeight: 700, fontSize: '1.1rem', bgcolor: 'primary.main' }}
        fullWidth
      >
        Calculate Tax
      </Button>
      {localTotalIncomeError && (
        <Alert severity="warning" sx={{ mt: 3, borderRadius: 2, fontSize: '1rem', alignItems: 'center' }}>
          {localTotalIncomeError}
        </Alert>
      )}
    </form>
  );
};

export default IncomeForm;