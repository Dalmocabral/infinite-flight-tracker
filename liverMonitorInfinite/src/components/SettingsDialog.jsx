import {
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";

const SettingsDialog = ({ open, onClose, flightsData }) => {
  // Estado para os dados do formulário
  const [formData, setFormData] = useState({
    formUsername: "",
    vaVo: "",
  });

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem("userFormData");
    if (savedData) {
        setFormData(JSON.parse(savedData));
    }
  }, []);

  // Dynamic VA List Logic
  const vaOptions = useMemo(() => {
    if (!flightsData) return [];

    const counts = {};
    flightsData.forEach(flight => {
        // Assume field is 'virtualOrganization' or fallback
        const vaName = flight.virtualOrganization; 
        if (vaName) {
            counts[vaName] = (counts[vaName] || 0) + 1;
        }
    });

    // Convert to array and sort by count (descending)
    return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
  }, [flightsData]);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((prev) => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = () => {
    // Save to local storage
    localStorage.setItem("userFormData", JSON.stringify(formData));
    localStorage.setItem("formUsername", formData.formUsername);
    localStorage.setItem("vaName", formData.vaVo);
    
    onClose();
    window.location.reload(); // Reload to apply changes (as per original logic)
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        {/* Username Field */}
        <TextField
          label="IFC Username"
          name="formUsername"
          value={formData.formUsername}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        {/* Dynamic VA Autocomplete */}
        <Autocomplete
            freeSolo
            options={vaOptions}
            getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.name;
            }}
            value={
                // Tenta encontrar o objeto correspondente ou usa a string direta
                vaOptions.find(v => v.name === formData.vaVo) || formData.vaVo
            }
            onChange={(event, newValue) => {
                const value = (typeof newValue === 'string') ? newValue : (newValue?.name || "");
                setFormData(prev => ({ ...prev, vaVo: value }));
            }}
            onInputChange={(event, newInputValue) => {
                 // Sincroniza também ao digitar (freeSolo)
                 // Nota: onChange lida com seleção e 'enter', onInputChange lida com digitação direta se não selecionar
                 setFormData(prev => ({ ...prev, vaVo: newInputValue }));
            }}
            renderOption={(props, option) => (
                <li {...props} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{option.name}</span>
                    <Chip label={option.count} size="small" color="primary" variant="outlined" style={{ height: '20px' }} />
                </li>
            )}
            renderInput={(params) => (
                <TextField 
                    {...params} 
                    label="Select or Type VA/VO" 
                    margin="normal"
                    helperText="Select from list or type your own"
                />
            )}
        />
        {/* Removed FormControl/Select wrapper */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
