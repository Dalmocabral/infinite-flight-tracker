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
  // Estado para controlar a abertura do popup
  // State to control the popup's open state
  const [isOpen, setIsOpen] = useState(false);

  // Estado para armazenar os dados do formulário
  // State to store form data
  const [formData, setFormData] = useState({
    name: "", // Nome do usuário / User's name
    email: "", // Email do usuário / User's email
  });

  // Função para abrir o popup
  // Function to open the popup
  const handleOpen = () => setIsOpen(true);

  // Função para fechar o popup
  // Function to close the popup
  const handleClose = () => setIsOpen(false);

  // Função para lidar com mudanças nos campos do formulário
  // Function to handle form field changes
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Função para enviar os dados do formulário
  // Function to submit the form data
  const handleSubmit = () => {
    console.log("Dados do Formulário:", formData); // Exibe os dados no console / Logs form data
    handleClose(); // Fecha o popup após o envio / Closes the popup after submission
  };

  return (
    <div>
      {/* Botão para abrir o popup */}
      {/* Button to open the popup */}
      <Button variant="contained" onClick={handleOpen}>
        Abrir Formulário
      </Button>

      {/* Popup (Dialog) */}
      <Dialog open={isOpen} onClose={handleClose}>
        {/* Título do popup / Popup title */}
        <DialogTitle>Preencha o Formulário</DialogTitle>
        <DialogContent>
          {/* Campo para o nome / Field for the name */}
          <TextField
            label="Nome"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          {/* Campo para o e-mail / Field for the email */}
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
          {/* Botão para cancelar / Cancel button */}
          <Button onClick={handleClose} color="error">
            Cancelar
          </Button>
          {/* Botão para enviar / Submit button */}
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Enviar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PopupForm;
