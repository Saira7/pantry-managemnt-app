'use client'
import axios from 'axios';
import * as dotenv from 'dotenv';
import { useCallback, useState, useEffect } from 'react';
import { Box, Stack, Typography, Button, Modal, TextField, IconButton } from '@mui/material';
import { firestore, auth } from '@/Firebase';
import { collection, doc, getDocs, query, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

dotenv.config();

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState('');
  const [user] = useAuthState(auth);
  const provider = new GoogleAuthProvider();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [recognizedItem, setRecognizedItem] = useState('');
  const [recipes, setRecipes] = useState('');

  const updateInventory = useCallback(async () => {
    if (user) {
      const snapshot = query(collection(firestore, `users/${user.uid}/inventory`));
      const docs = await getDocs(snapshot);
      const inventoryList = [];
      docs.forEach((doc) => {
        inventoryList.push({ name: doc.id, ...doc.data() });
      });
      setInventory(inventoryList);
    }
  }, [user]);

  useEffect(() => {
    updateInventory();
  }, [user, updateInventory]);

  const addItem = async (item) => {
    if (!user) return;
    try {
      const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        await setDoc(docRef, { quantity: quantity + 1 });
      } else {
        await setDoc(docRef, { quantity: 1 });
      }
      await updateInventory();
    } catch (error) {
      console.error("Error adding item:", error);
      if (error.message.includes("offline")) {
        setTimeout(() => addItem(item), 3000); // Retry after 3 seconds
      }
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item.name);
    setItemQuantity(item.quantity);
    setEditMode(true);
    setOpen(true);
  };

  const removeItem = async (item) => {
    if (!user) return;
    try {
      const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await deleteDoc(docRef);
      }
      await updateInventory();
    } catch (error) {
      console.error("Error removing item:", error);
      if (error.message.includes("offline")) {
        setTimeout(() => removeItem(item), 3000); // Retry after 3 seconds
      }
    }
  };

  const updateItemQuantity = async (item, newQuantity) => {
    if (!user) return;
    try {
      const docRef = doc(collection(firestore, `users/${user.uid}/inventory`), item);
      await setDoc(docRef, { quantity: newQuantity });
      await updateInventory();
    } catch (error) {
      console.error("Error updating item quantity:", error);
      if (error.message.includes("offline")) {
        setTimeout(() => updateItemQuantity(item, newQuantity), 3000); // Retry after 3 seconds
      }
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setItemName('');
    setItemQuantity(0);
    setImage(null);
    setImagePreview(null);
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const recognizeImage = async () => {
    if (!image) return;
    try {
      const formData = new FormData();
      formData.append('file', image);
      formData.append('pantryItems', JSON.stringify(inventory.map(item => item.name)));

      const response = await axios.post('/api/recognize-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { recognizedItem, recipes } = response.data;
      if (recognizedItem) {
        await addItem(recognizedItem);
      }
      setRecognizedItem(recognizedItem);
      setRecipes(recipes);
    } catch (error) {
      console.error('Error recognizing image:', error);
    }
  };

  const handleAddItem = async () => {
    if (image) {
      await recognizeImage();
    } else {
      await addItem(itemName);
    }
    handleClose();
  };
 
  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      justifyContent={'center'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
      bgcolor="#f5f5f5"
    >
      {user ? (
        <>
          <Button variant="contained" color="secondary" onClick={handleSignOut}>
            Sign Out
          </Button>
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={style}>
              <Typography id="modal-modal-title" variant="h6" component="h2">
                {editMode ? 'Edit Item' : 'Add Item'}
              </Typography>
              <Stack width="100%" direction={'row'} spacing={2}>
                <TextField
                  id="outlined-basic"
                  label="Item"
                  variant="outlined"
                  fullWidth
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  disabled={editMode}
                />
                <TextField
                  id="outlined-basic"
                  label="Quantity"
                  variant="outlined"
                  fullWidth
                  type="number"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value))}
                />
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    if (editMode) {
                      updateItemQuantity(selectedItem, itemQuantity);
                    } else {
                      handleAddItem();
                    }
                    handleClose();
                  }}
                >
                  {editMode ? 'Update' : 'Add'}
                </Button>
              </Stack>
              {!editMode && (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<PhotoCamera />}
                    color="primary"
                  >
                    Upload Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                    />
                  </Button>
                </Stack>
              )}
              {recognizedItem && (
                <Typography variant="body1" color="textSecondary">
                  Recognized Item: {recognizedItem}
                </Typography>
              )}
            </Box>
          </Modal>
          <Button variant="contained" color="primary" onClick={handleOpen}>
            Add New Item
          </Button>
          <TextField
            label="Search Items"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ margin: '20px 0' }}
          />
          <Box border={'1px solid #333'}>
            <Box
              width="800px"
              height="100px"
              bgcolor={'#4caf50'}
              display={'flex'}
              justifyContent={'center'}
              alignItems={'center'}
            >
              <Typography variant={'h2'} color={'#fff'} textAlign={'center'}>
                Inventory Items
              </Typography>
            </Box>
            <Stack width="800px" height="300px" spacing={2} overflow={'auto'}>
              {filteredInventory.map(({ name, quantity }) => (
                <Box
                  key={name}
                  width="100%"
                  minHeight="70px"
                  display={'flex'}
                  justifyContent={'space-between'}
                  alignItems={'center'}
                  bgcolor={'#e0e0e0'}
                  paddingX={5}
                >
                  <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  {editingItem === name ? (
                    <TextField
                      type="number"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value))}
                      inputProps={{ min: 0 }}
                    />
                  ) : (
                    <Typography variant={'h6'}>{quantity}</Typography>
                  )}
                  {editingItem === name ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        updateItemQuantity(name, itemQuantity);
                        setEditingItem(null);
                      }}
                    >
                      Save
                    </Button>
                  ) : (
                    <Button variant="contained" color="primary" onClick={() => {
                      setEditingItem(name);
                      setItemQuantity(quantity);
                    }}>
                      Edit
                    </Button>
                  )}
                  <Button variant="contained" color="secondary" onClick={() => removeItem(name)}>
                    Remove
                  </Button>
                </Box>
              ))}
            </Stack>
          </Box>
        </>
      ) : (
        <Button variant="contained" color="primary" onClick={handleSignIn}>
          Sign In with Google
        </Button>
      )}
    </Box>
  );
}