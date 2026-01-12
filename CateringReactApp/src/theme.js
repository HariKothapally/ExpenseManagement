import { createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      dark: '#1565c0',
      light: '#42a5f5',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#546e7a',
    }
  },
  typography: {
    h4: {
      color: '#2c3e50',
      fontWeight: 600
    },
    h5: {
      color: '#2c3e50',
      fontWeight: 500
    },
    h6: {
      color: '#2c3e50',
      fontWeight: 500
    },
    body1: {
      color: '#2c3e50'
    },
    body2: {
      color: '#546e7a'
    }
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: '#2c3e50'
        },
        head: {
          color: '#2c3e50',
          fontWeight: 600,
          backgroundColor: '#f8f9fa'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#2c3e50'
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#2c3e50'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: 'inherit'
        }
      }
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: 'inherit'
        }
      }
    }
  }
});

export default theme;