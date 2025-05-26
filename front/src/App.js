import React, { useState } from 'react';
import axios from 'axios';
import {
  TextField,
  Button,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  Typography,
  Container,
  Grid,
  FormHelperText,
} from '@mui/material';
import { CloudUpload, People, Folder, Delete } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

function App() {
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [deleteKey, setDeleteKey] = useState('');

  const formik = useFormik({
    initialValues: { email: '', username: '', age: '', file: null },
    validationSchema: Yup.object({
      email: Yup.string().email('Email invalide').required('Champ requis'),
      username: Yup.string().required('Champ requis'),
      age: Yup.number().min(0, 'Âge minimum: 0').required('Champ requis'),
      file: Yup.mixed().required('Fichier requis')
    }),
    onSubmit: async vals => {
      const data = new FormData();
      Object.entries(vals).forEach(([k, v]) => data.append(k, v));
      await axios.post('http://localhost:4000/api/users', data);
      alert('Envoyé !');
      formik.resetForm();
    }
  });

  const fetchUsers = async () => {
    const res = await axios.get('http://localhost:4000/api/users');
    setUsers(res.data);
  };

  const fetchFiles = async () => {
    const res = await axios.get('http://localhost:4000/api/files');
    setFiles(res.data);
  };

  const delFile = async (key) => {
    try {
      await axios.delete(`http://localhost:4000/api/files/${encodeURIComponent(key)}`);
      fetchFiles();
      setDeleteKey('');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };



  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>User Manager</Typography>

      <form onSubmit={formik.handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Email"
            name="email"
            fullWidth
            error={!!formik.errors.email}
            {...formik.getFieldProps('email')}
          />
          <FormHelperText error>{formik.errors.email}</FormHelperText>

          <TextField
            label="Username"
            name="username"
            fullWidth
            error={!!formik.errors.username}
            {...formik.getFieldProps('username')}
          />
          <FormHelperText error>{formik.errors.username}</FormHelperText>

          <TextField
            label="Age"
            name="age"
            type="number"
            fullWidth
            error={!!formik.errors.age}
            {...formik.getFieldProps('age')}
          />
          <FormHelperText error>{formik.errors.age}</FormHelperText>

          <Button component="label" variant="outlined" startIcon={<CloudUpload />}>
            Upload File
            <input
              type="file"
              name="file"
              hidden
              onChange={e => formik.setFieldValue('file', e.currentTarget.files[0])}
            />
          </Button>
          {formik.values.file && (
            <Typography variant="caption" color="text.secondary">
              Fichier sélectionné : {formik.values.file.name}
            </Typography>
          )}
          <FormHelperText error>{formik.errors.file}</FormHelperText>

          <Button type="submit" variant="contained" color="primary" fullWidth size="large">
            Envoyer
          </Button>
        </Stack>
      </form>

      <Divider sx={{ my: 4 }} />

      {/* Liste des utilisateurs */}
      <Button onClick={fetchUsers} variant="outlined" startIcon={<People />} fullWidth sx={{ mb: 2 }}>
        Lister les utilisateurs
      </Button>
      <List sx={{ bgcolor: 'background.paper', mb: 4 }}>
        {users.map(u => (
          <ListItem key={u.id}>
            <ListItemAvatar>
              <Avatar>{u.username.charAt(0)}</Avatar>
            </ListItemAvatar>
            <ListItemText primary={u.username} secondary={`${u.email} — ${u.age} ans`} />
          </ListItem>
        ))}
      </List>

      {/* Suppression manuelle */}
      <Typography variant="h6" gutterBottom>Supprimer un fichier du bucket</Typography>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={8}>
          <TextField
            label="Clé du fichier"
            value={deleteKey}
            onChange={e => setDeleteKey(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="contained"
            color="error"
            startIcon={<Delete />}
            fullWidth
            onClick={() => delFile(deleteKey)}
          >
            Supprimer
          </Button>
        </Grid>
      </Grid>

      {/* Liste des fichiers */}
      <Button onClick={fetchFiles} variant="outlined" startIcon={<Folder />} fullWidth sx={{ mb: 2 }}>
        Lister les fichiers
      </Button>
<List>
  {files.map(f => (
    <ListItem
      key={f.Key}
      secondaryAction={
        <IconButton
          edge="end"
          color="error"
          onClick={() => delFile(f.Key)}
        >
          <Delete />
        </IconButton>
      }
    >
      <ListItemAvatar>
        <Avatar><Folder /></Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={f.Key.split('/').pop()}
        secondary={new Date(f.LastModified).toLocaleDateString()}
      />
    </ListItem>
  ))}
</List>
    </Container>
  );
}

export default App;
