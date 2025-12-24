import {
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
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

        {/* Dynamic VA Select */}
        <FormControl fullWidth margin="normal">
          <InputLabel id="va-vo-select-label">Select VA/VO (Online Count)</InputLabel>
          <Select
            labelId="va-vo-select-label"
            name="vaVo"
            value={formData.vaVo}
            onChange={handleChange}
            label="Select VA/VO (Online Count)"
            MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }} // Limit height
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {vaOptions.map((va) => (
              <MenuItem key={va.name} value={va.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{va.name}</span>
                <Chip label={va.count} size="small" color="primary" variant="outlined" style={{ height: '20px' }} />
              </MenuItem>
            ))}
            
            {/* Fallback if list is empty or specific VA not online? 
                Maybe allow custom input or just show "Others..."? 
                For now, only showing currently online VAs as requested. 
            */}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
