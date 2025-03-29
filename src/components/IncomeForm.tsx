import React, { ChangeEvent, FormEvent } from 'react';
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
  InputAdornment
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { DeductionsType } from '../types/tax';

interface UserData {
  basicSalary: number;
  variableSalary: number;
  otherIncome: number;
  deductions: DeductionsType;
}

interface IncomeFormProps {
  userData: UserData;
  errors: Record<string, string>;
  onUpdate: (field: keyof UserData | keyof DeductionsType, value: number) => void;
  onCalculate: () => void;
  max80C: number;
  max80D: number;
  maxNPS: number;
}

const IncomeForm: React.FC<IncomeFormProps> = ({
  userData,
  errors,
  onUpdate,
  onCalculate,
  max80C,
  max80D,
  maxNPS
}) => {
  const handleDeductionChange = (field: keyof DeductionsType) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const value = Math.min(Number(e.target.value), getMaxLimit(field));
    onUpdate(field, value);
  };

  const handleIncomeChange = (field: keyof UserData) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number(e.target.value);
    if (value >= 0) {
      onUpdate(field, value);
    }
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
    onCalculate();
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

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Please fill in all your income details to get accurate tax calculations
        </Alert>

        <TextField
          label="Basic Salary (₹)"
          type="number"
          value={userData.basicSalary}
          onChange={handleIncomeChange('basicSalary')}
          error={!!errors.basicSalary}
          helperText={errors.basicSalary}
          required
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
        />

        <TextField
          label="Variable Salary (₹)"
          type="number"
          value={userData.variableSalary}
          onChange={handleIncomeChange('variableSalary')}
          error={!!errors.variableSalary}
          helperText={errors.variableSalary}
          required
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
        />

        <TextField
          label="Other Income (₹)"
          type="number"
          value={userData.otherIncome}
          onChange={handleIncomeChange('otherIncome')}
          error={!!errors.otherIncome}
          helperText={errors.otherIncome}
          required
          fullWidth
          InputProps={{
            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
          }}
        />

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Deductions & Exemptions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    label="Section 80C"
                    type="number"
                    value={userData.deductions.section80C}
                    onChange={handleDeductionChange('section80C')}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                  <Tooltip title={getDeductionTooltip('section80C')}>
                    <IconButton size="small">
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    label="Section 80D"
                    type="number"
                    value={userData.deductions.section80D}
                    onChange={handleDeductionChange('section80D')}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                  <Tooltip title={getDeductionTooltip('section80D')}>
                    <IconButton size="small">
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    label="HRA Exemption"
                    type="number"
                    value={userData.deductions.hraExemption}
                    onChange={handleDeductionChange('hraExemption')}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                  <Tooltip title={getDeductionTooltip('hraExemption')}>
                    <IconButton size="small">
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    label="LTA"
                    type="number"
                    value={userData.deductions.lta}
                    onChange={handleDeductionChange('lta')}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                  <Tooltip title={getDeductionTooltip('lta')}>
                    <IconButton size="small">
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    label="NPS (80CCD 1B)"
                    type="number"
                    value={userData.deductions.nps}
                    onChange={handleDeductionChange('nps')}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                  <Tooltip title={getDeductionTooltip('nps')}>
                    <IconButton size="small">
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Button 
          variant="contained" 
          type="submit"
          size="large"
          sx={{ mt: 2 }}
          disabled={!userData.basicSalary || !userData.variableSalary || !userData.otherIncome}
        >
          Calculate Tax
        </Button>
      </Box>
    </form>
  );
};

export default IncomeForm; 
