import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

const PopupForm = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    console.log("Form Data:", formData);
    handleClose(); // Fecha o popup após o envio
  };

  return (
    <div>
      {/* Botão que abre o popup */}
      <Button variant="contained" onClick={handleOpen}>
        Abrir Formulário
      </Button>

      {/* Popup (Dialog) */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Preencha o Formulário</DialogTitle>
        <DialogContent>
          {/* Formulário */}
          <TextField
            label="Nome"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="E-mail"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          {/* Botões no rodapé do popup */}
          <Button onClick={handleClose} color="error">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PopupForm;
