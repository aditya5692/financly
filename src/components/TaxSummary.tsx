import React from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { TaxBreakdown } from '../types/tax';

interface TaxSummaryProps {
  breakdown: TaxBreakdown;
}

const TaxSummary: React.FC<TaxSummaryProps> = ({ breakdown }) => {
  const formatCurrency = (amount: number) => 
    `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case 'old': return 'primary';
      case 'new': return 'secondary';
      case 'revised': return 'success';
      default: return 'default';
    }
  };

  const getRegimeLabel = (regime: string) => {
    switch (regime) {
      case 'old': return 'Old Tax Regime';
      case 'new': return 'New Tax Regime (u/s 115BAC)';
      case 'revised': return 'Revised New Tax Regime';
      default: return regime;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary">
        Tax Calculation Summary
      </Typography>

      <Alert 
        severity="success" 
        sx={{ mb: 3 }}
        action={
          <Chip 
            label={getRegimeLabel(breakdown.recommendedRegime)}
            color={getRegimeColor(breakdown.recommendedRegime)}
            size="small"
          />
        }
      >
        Recommended Tax Regime
      </Alert>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Details</TableCell>
              <TableCell align="right">Old Regime</TableCell>
              <TableCell align="right">New Regime</TableCell>
              <TableCell align="right">Revised New Regime</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Taxable Income</TableCell>
              <TableCell align="right">{formatCurrency(breakdown.old.taxableIncome)}</TableCell>
              <TableCell align="right">{formatCurrency(breakdown.new.taxableIncome)}</TableCell>
              <TableCell align="right">{formatCurrency(breakdown.revised.taxableIncome)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Total Tax</TableCell>
              <TableCell align="right">{formatCurrency(breakdown.old.totalTax)}</TableCell>
              <TableCell align="right">{formatCurrency(breakdown.new.totalTax)}</TableCell>
              <TableCell align="right">{formatCurrency(breakdown.revised.totalTax)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Effective Tax Rate</TableCell>
              <TableCell align="right">{breakdown.old.effectiveTaxRate.toFixed(2)}%</TableCell>
              <TableCell align="right">{breakdown.new.effectiveTaxRate.toFixed(2)}%</TableCell>
              <TableCell align="right">{breakdown.revised.effectiveTaxRate.toFixed(2)}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {breakdown.old.totalDeductions && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Total Deductions (Old Regime): {formatCurrency(breakdown.old.totalDeductions)}
          </Typography>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Important Notes:</strong>
              <ul>
                <li>Tax calculations include 4% health and education cess</li>
                <li>Basic exemption limit: ₹2,50,000 (Old Regime) / ₹3,00,000 (New Regimes)</li>
                <li>Standard deduction of ₹50,000 is automatically applied in Old Regime</li>
                <li>This is an estimate and may vary based on your specific circumstances</li>
              </ul>
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaxSummary; 