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
import { DEFAULT_COLORS } from "../utils/iconTemplates";

const SettingsDialog = ({ open, onClose, flightsData }) => {
  // Estado para os dados do formulário
  const [formData, setFormData] = useState({
    formUsername: "",
    vaVo: "",
    ...DEFAULT_COLORS // Initialize from shared defaults
  });

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem("userFormData");
    if (savedData) {
        // Merge with defaults to ensure new fields (if any) are present
        setFormData(prev => ({ ...prev, ...JSON.parse(savedData) }));
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

  const handleResetColors = () => {
      setFormData(prev => ({
          ...prev,
          ...DEFAULT_COLORS
      }));
  };

  const handleSubmit = () => {
    // Save to local storage
    localStorage.setItem("userFormData", JSON.stringify(formData));
    localStorage.setItem("formUsername", formData.formUsername);
    localStorage.setItem("vaName", formData.vaVo);
    localStorage.setItem("userColors", JSON.stringify({
        myColor: formData.myColor,
        militaryColor: formData.militaryColor,
        staffColor: formData.staffColor,
        vaColor: formData.vaColor,
        streamerColor: formData.streamerColor
    }));
    
    onClose();
    window.location.reload(); // Reload to apply changes
  };

  return (
    <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
            style: {
                backgroundColor: '#1E1E1E',
                color: '#fff',
                borderRadius: '12px',
                padding: '10px'
            }
        }}
    >
      <DialogTitle style={{ borderBottom: '1px solid #333', paddingBottom: '15px' }}>
          Settings
      </DialogTitle>
      <DialogContent style={{ marginTop: '20px' }}>
        {/* Username Field */}
        <TextField
          label="IFC Username"
          name="formUsername"
          value={formData.formUsername}
          onChange={handleChange}
          fullWidth
          margin="normal"
          variant="outlined"
          InputLabelProps={{ style: { color: '#aaa' } }}
          InputProps={{ style: { color: '#fff', backgroundColor: '#2C2C2C', borderRadius: '8px' } }}
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
                 setFormData(prev => ({ ...prev, vaVo: newInputValue }));
            }}
            renderOption={(props, option) => (
                <li {...props} style={{ display: 'flex', justifyContent: 'space-between', color: '#000' }}>
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
                    InputLabelProps={{ style: { color: '#aaa' } }}
                    InputProps={{ 
                        ...params.InputProps,
                        style: { color: '#fff', backgroundColor: '#2C2C2C', borderRadius: '8px' } 
                    }}
                    FormHelperTextProps={{ style: { color: '#777' } }}
                />
            )}
        />
        
        {/* Color Settings */}
        <div style={{ marginTop: '30px' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                margin: '0 0 15px 0', 
                borderBottom: '1px solid #333',
                paddingBottom: '10px'
            }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 600 }}>
                    User Interface Colors
                </h4>
                <Button 
                    size="small" 
                    onClick={handleResetColors}
                    style={{ color: '#00a1f9', textTransform: 'none', fontSize: '13px' }}
                >
                    Reset Defaults
                </Button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <ColorInput label="My Color" name="myColor" value={formData.myColor} onChange={handleChange} />
                <ColorInput label="VA/VO Color" name="vaColor" value={formData.vaColor} onChange={handleChange} />
                <ColorInput label="Military Icon Color" name="militaryColor" value={formData.militaryColor} onChange={handleChange} />
                <ColorInput label="Creators Icon Color" name="streamerColor" value={formData.streamerColor} onChange={handleChange} />
                <ColorInput label="Staff Icon Color" name="staffColor" value={formData.staffColor} onChange={handleChange} />
            </div>
        </div>
      </DialogContent>
      <DialogActions style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '10px' }}>
        <Button onClick={onClose} style={{ color: '#aaa' }}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" style={{ backgroundColor: '#00a1f9', color: '#fff' }}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
};

// Helper Component for Color Input - Professional Dark Theme Layout
const ColorInput = ({ label, name, value, onChange }) => (
    <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '10px 15px', 
        backgroundColor: '#2C2C2C', 
        borderRadius: '8px',
        transition: 'all 0.2s ease'
    }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#ddd' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
                fontFamily: 'monospace', 
                fontSize: '13px', 
                color: '#aaa', 
                textTransform: 'uppercase' 
            }}>
                {value}
            </span>
            <div style={{ 
                position: 'relative', 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                overflow: 'hidden',
                border: '2px solid #444'
            }}>
                <input 
                    type="color" 
                    name={name}
                    value={value || "#ffffff"} 
                    onChange={onChange}
                    style={{ 
                        position: 'absolute',
                        top: '-50%',
                        left: '-50%',
                        width: '200%', 
                        height: '200%', 
                        border: 'none', 
                        padding: 0, 
                        margin: 0,
                        cursor: 'pointer'
                    }} 
                />
            </div>
        </div>
    </div>
);

export default SettingsDialog;
