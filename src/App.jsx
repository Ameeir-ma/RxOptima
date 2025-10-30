import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut,
  signInAnonymously,
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  writeBatch,
  Timestamp,
  where
} from 'firebase/firestore';
import { 
  Plus, 
  Boxes, 
  ShoppingCart, 
  ClipboardList,
  LayoutDashboard, 
  X, 
  Trash2, 
  Edit,
  AlertTriangle,
  CheckCircle,
  PackageMinus,
  PackagePlus,
  ArrowRight
} from 'lucide-react';

//  Firebase Configuration 
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

//  Initialize Firebase 
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

//  Helper Functions 
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return timestamp.toDate().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

//  Custom Modal Component 
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

//  Custom Alert Component 
const CustomAlert = ({ message, type, onClose }) => {
  if (!message) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';
  const Icon = isSuccess ? CheckCircle : AlertTriangle;

  return (
    <div className={`fixed top-5 right-5 z-50 max-w-sm rounded-lg shadow-lg p-4 ${bgColor}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${iconColor}`}>
          <Icon size={20} />
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
            {message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${isSuccess ? 'bg-green-50 text-green-500 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'} focus:outline-none focus:ring-2 ${isSuccess ? 'focus:ring-green-600' : 'focus:ring-red-600'}`}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

//  Loading Spinner 
const Spinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

//  Header/Navigation Component 
const Header = ({ currentView, setView, onLogout}) => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
    { name: 'Inventory', icon: Boxes, view: 'inventory' },
    { name: 'Point of Sale', icon: ShoppingCart, view: 'pos' },
    { name: 'Prescriptions', icon: ClipboardList, view: 'prescriptions' }, // Changed from ClipboardText
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-indigo-600">RxOptima</span>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  currentView === item.view
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <item.icon size={18} className="mr-2" />
                {item.name}
              </button>
            ))}
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <button
              onClick={onLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div> 
          <div className="flex items-center sm:hidden">
          </div>
        </div>
      </div>
       <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white shadow-t-lg border-t border-gray-200">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center justify-center w-full py-2 ${
                currentView === item.view
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs mt-1">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

//  Dashboard Component 
const Dashboard = ({ inventory, sales, prescriptions }) => {
  const now = new Date();
  
  const lowStockItems = useMemo(
    () => inventory.filter(item => item.quantityInStock < 20).length,
    [inventory]
  );
  
  const expiredItems = useMemo(
    () => inventory.filter(item => item.expiryDate && item.expiryDate.toDate() < now).length,
    [inventory]
  );
  
  const totalStockValue = useMemo(
    () => inventory.reduce((acc, item) => acc + (item.quantityInStock * item.unitPrice), 0),
    [inventory]
  );
  
  const pendingPrescriptions = useMemo(
    () => prescriptions.filter(p => !p.isFilled).length,
    [prescriptions]
  );

  const stats = [
    { name: 'Total Drug Types', value: inventory.length, icon: Boxes, color: 'text-blue-500' },
    { name: 'Low Stock Items', value: lowStockItems, icon: AlertTriangle, color: 'text-yellow-500' },
    { name: 'Expired Items', value: expiredItems, icon: PackageMinus, color: 'text-red-500' },
    { name: 'Total Stock Value', value: formatCurrency(totalStockValue), icon: CheckCircle, color: 'text-green-500' },
    { name: 'Pending Prescriptions', value: pendingPrescriptions, icon: ClipboardList, color: 'text-indigo-500' }, // Changed from ClipboardText
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-5 rounded-xl shadow-lg flex items-center space-x-4">
            <div className={`p-3 rounded-full bg-opacity-10 ${stat.color.replace('text-', 'bg-')}`}>
              <stat.icon size={28} className={stat.color} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales (Placeholder) */}
        <div className="bg-white p-5 rounded-xl shadow-lg">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
           {sales.slice(0, 5).map(sale => (
             <div key={sale.id} className="border-b last:border-b-0 py-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Sale #{sale.id.substring(0, 6)}...</span>
                  <span className="text-lg font-semibold text-green-600">{formatCurrency(sale.totalAmount)}</span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(sale.timestamp)}</span>
             </div>
           ))}
           {sales.length === 0 && <p className="text-gray-500">No sales recorded yet.</p>}
        </div>
        
        {/* Expiring Soon (Placeholder) */}
        <div className="bg-white p-5 rounded-xl shadow-lg">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">Expiring Soon (Next 30 Days)</h3>
            {inventory.filter(item => {
              const expiry = item.expiryDate?.toDate();
              if (!expiry) return false;
              const thirtyDaysFromNow = new Date();
              thirtyDaysFromNow.setDate(now.getDate() + 30);
              return expiry > now && expiry <= thirtyDaysFromNow;
            }).slice(0, 5).map(item => (
              <div key={item.id} className="border-b last:border-b-0 py-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{item.name} ({item.batchNumber})</span>
                  <span className="text-sm font-semibold text-red-600">Expires: {formatDate(item.expiryDate)}</span>
                </div>
                <span className="text-xs text-gray-500">Only {item.quantityInStock} left</span>
             </div>
            ))}
             {inventory.length === 0 && <p className="text-gray-500">No items expiring soon.</p>}
        </div>
      </div>
    </div>
  );
};

//  Inventory Form Component 
const InventoryForm = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  setAlert,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    quantityInStock: 0,
    unitPrice: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Format Timestamp for date input
        expiryDate: initialData.expiryDate ? formatDate(initialData.expiryDate).split('/').reverse().join('-') : '',
      });
    } else {
      setFormData({
        name: '',
        genericName: '',
        manufacturer: '',
        batchNumber: '',
        expiryDate: '',
        quantityInStock: 0,
        unitPrice: 0,
      });
    }
  }, [initialData, isOpen]);


  const handleChange = (e) => {
  const { name, value, type } = e.target;
  
  if (name === 'batchNumber') {
   // This rule is only for the batchNumber
   const numericValue = value.replace(/[^0-9]/g, ''); // Remove any non-digit characters
   if (numericValue.length <= 5) {
     setFormData((prev) => ({
     ...prev,
     [name]: numericValue, 
     }));
    }
  } else {
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  }
};

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.quantityInStock < 0 || formData.unitPrice < 0) {
      setAlert({ message: 'Quantity and Price cannot be negative.', type: 'error' });
      return;
    }
    if (!formData.name || !formData.batchNumber || !formData.expiryDate) {
      setAlert({ message: 'Name, Batch Number, and Expiry Date are required.', type: 'error' });
      return;
    }

    const dataToSubmit = {
      ...formData,
      expiryDate: Timestamp.fromDate(new Date(formData.expiryDate)),
    };
    
    onSubmit(dataToSubmit);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Drug' : 'Add New Drug'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Drug Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Generic Name</label>
          <input
            type="text"
            name="genericName"
            value={formData.genericName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
          <input
            type="text"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Batch Number</label>
          <input
            type="text"
            name="batchNumber"
            value={formData.batchNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity in Stock</label>
            <input
              type="number"
              name="quantityInStock"
              min="0"
              value={formData.quantityInStock}
              onChange={handleChange}
              onFocus={(e) => e.target.select()}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit Price</label>
            <input
              type="number"
              name="unitPrice"
              min="0"
              step="0.01"
              value={formData.unitPrice}
              onChange={handleChange}
              onFocus={(e) => e.target.select()}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {initialData ? 'Update Drug' : 'Add Drug'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

//  Inventory Component 
const Inventory = ({ userId, inventory, setAlert }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddDrug = async (formData) => {
    if (!userId) {
      setAlert({ message: 'Authentication error. Please refresh.', type: 'error' });
      return;
    }
    try {
      const collectionPath = `artifacts/${appId}/users/${userId}/inventory`;
      await addDoc(collection(db, collectionPath), formData);
      setAlert({ message: 'Drug added successfully!', type: 'success' });
    } catch (error) {
      console.error('Error adding drug: ', error);
      setAlert({ message: `Error adding drug: ${error.message}`, type: 'error' });
    }
  };

  const handleUpdateDrug = async (formData) => {
    if (!userId || !editingDrug) {
      setAlert({ message: 'Authentication error. Please refresh.', type: 'error' });
      return;
    }
    try {
      const docPath = `artifacts/${appId}/users/${userId}/inventory/${editingDrug.id}`;
      // Remove id from formData if it exists
      const { id, ...dataToUpdate } = formData;
      await setDoc(doc(db, docPath), dataToUpdate);
      setAlert({ message: 'Drug updated successfully!', type: 'success' });
      setEditingDrug(null);
    } catch (error) {
      console.error('Error updating drug: ', error);
      setAlert({ message: `Error updating drug: ${error.message}`, type: 'error' });
    }
  };

  const handleDeleteDrug = async (drugId) => {
    // NOTE: In a real app, use a custom modal confirmation, not window.confirm
    // For this environment, we'll proceed with deletion directly.
    // We can add a simple state-based confirmation later.
    if (!userId) {
      setAlert({ message: 'Authentication error. Please refresh.', type: 'error' });
      return;
    }
    try {
      const docPath = `artifacts/${appId}/users/${userId}/inventory/${drugId}`;
      await deleteDoc(doc(db, docPath));
      setAlert({ message: 'Drug deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('Error deleting drug: ', error);
      setAlert({ message: `Error deleting drug: ${error.message}`, type: 'error' });
    }
  };

  const openEditForm = (drug) => {
    setEditingDrug(drug);
    setIsFormOpen(true);
  };

  const openAddForm = () => {
    setEditingDrug(null);
    setIsFormOpen(true);
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(drug => 
      drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">Inventory Management</h2>
        <button
          onClick={openAddForm}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
        >
          <Plus size={18} className="mr-2" />
          Add New Drug
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, generic name, or batch..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((drug) => {
                  const isExpired = drug.expiryDate && drug.expiryDate.toDate() < new Date();
                  const isLowStock = drug.quantityInStock < 10;
                  return (
                    <tr key={drug.id} className={`${isExpired ? 'bg-red-50' : ''} ${isLowStock && !isExpired ? 'bg-yellow-50' : ''} hover:bg-gray-50`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{drug.name}</div>
                        <div className="text-sm text-gray-500">{drug.genericName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{drug.batchNumber}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isExpired ? 'font-bold text-red-600' : 'text-gray-500'}`}>
                        {formatDate(drug.expiryDate)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isLowStock ? 'font-bold text-yellow-600' : 'text-gray-500'}`}>
                        {drug.quantityInStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(drug.unitPrice)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button onClick={() => openEditForm(drug)} className="p-2 text-indigo-600 hover:text-indigo-900 rounded-full hover:bg-indigo-100">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteDrug(drug.id)} className="p-2 text-red-600 hover:text-red-900 rounded-full hover:bg-red-100">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No drugs found in inventory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InventoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={editingDrug ? handleUpdateDrug : handleAddDrug}
        initialData={editingDrug}
        setAlert={setAlert}
      />
    </div>
  );
};

//  Point of Sale (POS) Component 
const POS = ({ userId, inventory, setAlert }) => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const [lastSale, setLastSale] = useState(null); 
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return [];
    return inventory.filter(drug => 
      (drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       drug.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
      drug.quantityInStock > 0 &&
      (!drug.expiryDate || drug.expiryDate.toDate() > new Date()) // Exclude expired
    ).slice(0, 10); // Limit results
  }, [inventory, searchTerm]);

  const addToCart = (drug) => {
    if (drug.quantityInStock <= 0) {
      setAlert({ message: 'Item is out of stock.', type: 'error' });
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === drug.id);
      if (existingItem) {
        if (existingItem.quantity + 1 > drug.quantityInStock) {
          setAlert({ message: `Only ${drug.quantityInStock} in stock.`, type: 'error' });
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === drug.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...drug, quantity: 1 }];
      }
    });
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const updateCartQuantity = (drugId, newQuantity) => {
    const drugInInventory = inventory.find(d => d.id === drugId);
    if (newQuantity <= 0) {
      // Remove item
      setCart(prevCart => prevCart.filter(item => item.id !== drugId));
    } else if (newQuantity > drugInInventory.quantityInStock) {
      setAlert({ message: `Only ${drugInInventory.quantityInStock} in stock.`, type: 'error' });
      setCart(prevCart => prevCart.map(item =>
        item.id === drugId ? { ...item, quantity: drugInInventory.quantityInStock } : item
      ));
    } else {
      setCart(prevCart => prevCart.map(item =>
        item.id === drugId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };
  
  const totalAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  }, [cart]);

  const processSale = async () => {
    if (!userId) {
      setAlert({ message: 'Authentication error. Please refresh.', type: 'error' });
      return;
    }
    if (cart.length === 0) {
      setAlert({ message: 'Cart is empty.', type: 'error' });
      return;
    }

    try {
      const batch = writeBatch(db);

      // 1. Create Sale Record
      const saleData = {
        timestamp: Timestamp.now(),
        items: cart.map(item => ({
          drugId: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
        totalAmount: totalAmount,
      };
      const salesCollectionPath = `artifacts/${appId}/users/${userId}/sales`;
      const saleRef = doc(collection(db, salesCollectionPath)); // Auto-generate ID
      batch.set(saleRef, saleData);

      // 2. Update Inventory
      for (const item of cart) {
        const drugRef = doc(db, `artifacts/${appId}/users/${userId}/inventory`, item.id);
        const newQuantity = item.quantityInStock - item.quantity;
        batch.update(drugRef, { quantityInStock: newQuantity });
      }
      
      await batch.commit();

      const saleDataWithId = {
        ...saleData,
        id: saleRef.id 
      };

      setAlert({ message: 'Sale processed successfully!', type: 'success' });
      setCart([]);
      setLastSale(saleDataWithId); 
      setIsReceiptOpen(true);
      
    } catch (error) {
      console.error('Error processing sale: ', error);
      setAlert({ message: `Error processing sale: ${error.message}`, type: 'error' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Side: Search & Cart */}
      <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Point of Sale</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for drugs by name or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pr-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
          {/* Search Results */}
          {filteredInventory.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredInventory.map(drug => (
                <div
                  key={drug.id}
                  onClick={() => addToCart(drug)}
                  className="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800">{drug.name}</p>
                    <p className="text-sm text-gray-500">
                      Batch: {drug.batchNumber} | Stock: {drug.quantityInStock} | Price: {formatCurrency(drug.unitPrice)}
                    </p>
                  </div>
                  <PackagePlus size={18} className="text-green-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Cart</h3>
        <div className="overflow-x-auto max-h-[calc(100vh-350px)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cart.length > 0 ? cart.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="1"
                      max={item.quantityInStock}
                      value={item.quantity}
                      onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value))}
                      className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{formatCurrency(item.unitPrice * item.quantity)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button onClick={() => updateCartQuantity(item.id, 0)} className="p-2 text-red-600 hover:text-red-900 rounded-full hover:bg-red-100">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Cart is empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Side: Total & Checkout */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-lg sticky top-24">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3 mb-6">
             <div className="flex justify-between text-lg">
               <span className="text-gray-600">Subtotal</span>
               <span className="font-medium text-gray-800">{formatCurrency(totalAmount)}</span>
             </div>
             <div className="flex justify-between text-lg">
               <span className="text-gray-600">Tax</span>
               <span className="font-medium text-gray-800">{formatCurrency(0)}</span>
             </div>
             <div className="border-t border-gray-200 my-3"></div>
             <div className="flex justify-between text-2xl font-bold">
               <span className="text-gray-900">Total</span>
               <span className="text-indigo-600">{formatCurrency(totalAmount)}</span>
             </div>
          </div>
          <button
            onClick={processSale}
            disabled={cart.length === 0}
            className="w-full py-3 px-4 inline-flex justify-center items-center rounded-lg shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Process Sale
            <ArrowRight size={20} className="ml-2" />
          </button>
        </div>
      </div>
      <ReceiptModal 
        isOpen={isReceiptOpen} 
       onClose={() => setIsReceiptOpen(false)} 
        saleData={lastSale} 
      />
    </div>
  );
};

//  Receipt Modal Component 
const ReceiptModal = ({ isOpen, onClose, saleData }) => {
  if (!isOpen || !saleData) return null;

  const handlePrint = () => {
    window.print();
  };
  
  const pharmacyDetails = {
    name: "RxOptima", 
    address: "123 Health Way, Kaduna, Nigeria",
    phone: "+234 707-227-5442",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sale Receipt">
      {/* This 'printable-area' is what will be printed */}
      <div id="printable-area" className="printable-area p-4 text-gray-800">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">{pharmacyDetails.name}</h2>
          <p className="text-sm">{pharmacyDetails.address}</p>
          <p className="text-sm">{pharmacyDetails.phone}</p>
        </div>
        
        <div className="mb-4 border-b pb-2">
          <p><strong>Receipt #:</strong> {saleData.id.substring(0, 8)}...</p>
          <p><strong>Date:</strong> {formatDate(saleData.timestamp)}</p>
        </div>
        
        <table className="w-full mb-4">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left text-sm font-semibold">Item</th>
              <th className="py-2 text-center text-sm font-semibold">Qty</th>
              <th className="py-2 text-right text-sm font-semibold">Unit</th>
              <th className="py-2 text-right text-sm font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {saleData.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-2 text-left text-sm">{item.name}</td>
                <td className="py-2 text-center text-sm">{item.quantity}</td>
                <td className="py-2 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 text-right text-sm">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="flex justify-end mb-4">
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(saleData.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (0%):</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className="border-t my-2"></div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(saleData.totalAmount)}</span>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-600 mt-6">
          <p>Thank you for your patronage!</p>
          <p>Please consult your pharmacist for medication guidance.</p>
        </div>
      </div>
      
      {/* These buttons are in a 'no-print' div so they don't show up on the receipt */}
      <div className="no-print flex justify-end space-x-3 p-4 border-t bg-gray-50 rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
        >
          Close
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700"
        >
          Print Receipt
        </button>
      </div>
    </Modal>
  );
};

//  Prescription Form Component 
const PrescriptionForm = ({
  isOpen,
  onClose,
  onSubmit,
  inventory,
  setAlert,
}) => {
  const [patientId, setPatientId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [items, setItems] = useState([{ drugId: '', dosage: '', quantity: 1 }]);
  
  const resetForm = () => {
    setPatientId('');
    setDoctorName('');
    setItems([{ drugId: '', dosage: '', quantity: 1 }]);
  };
  
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const drug = inventory.find(d => d.id === newItems[index].drugId);
    
    if (field === 'quantity') {
      const newQuantity = parseInt(value) || 1;
      if (drug && newQuantity > drug.quantityInStock) {
        setAlert({ message: `Only ${drug.quantityInStock} of ${drug.name} in stock.`, type: 'error' });
        newItems[index][field] = drug.quantityInStock;
      } else {
         newItems[index][field] = newQuantity < 1 ? 1 : newQuantity;
      }
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };
  
  const addItem = () => {
    setItems([...items, { drugId: '', dosage: '', quantity: 1 }]);
  };
  
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientId || !doctorName || items.some(item => !item.drugId)) {
      setAlert({ message: 'Please fill all required fields.', type: 'error' });
      return;
    }
    
    const prescriptionData = {
      patientIdentifier: patientId,
      doctorName: doctorName,
      dateIssued: Timestamp.now(),
      isFilled: false,
      items: items.map(item => ({
        ...item,
        drugName: inventory.find(d => d.id === item.drugId)?.name || 'Unknown'
      }))
    };
    
    onSubmit(prescriptionData);
    resetForm();
    onClose();
  };
  
  const availableInventory = inventory.filter(d => 
    d.quantityInStock > 0 && 
    (!d.expiryDate || d.expiryDate.toDate() > new Date())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Prescription">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Patient Identifier</label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
            placeholder="e.g., P-12345"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Doctor's Name</label>
          <input
            type="text"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        
        <h4 className="text-md font-medium text-gray-800 pt-2 border-t">Prescribed Items</h4>
        
        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
          {items.map((item, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-3 relative">
              {items.length > 1 && (
                 <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full"
                >
                  <Trash2 size={14} />
                 </button>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Drug</label>
                <select
                  value={item.drugId}
                  onChange={(e) => handleItemChange(index, 'drugId', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a drug...</option>
                  {availableInventory.map(drug => (
                    <option key={drug.id} value={drug.id}>
                      {drug.name} (Batch: {drug.batchNumber}) - Stock: {drug.quantityInStock}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dosage</label>
                <input
                  type="text"
                  value={item.dosage}
                  onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., 1 tablet, 2 times a day"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity to Dispense</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          ))}
        </div>
        
        <button
          type="button"
          onClick={addItem}
          className="w-full py-2 px-3 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
        >
          Add Another Item
        </button>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Add Prescription
          </button>
        </div>
      </form>
    </Modal>
  );
};

//  Prescriptions Component 
const Prescriptions = ({ userId, prescriptions, inventory, setAlert }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAddPrescription = async (formData) => {
    if (!userId) {
      setAlert({ message: 'Authentication error. Please refresh.', type: 'error' });
      return;
    }
    try {
      const collectionPath = `artifacts/${appId}/users/${userId}/prescriptions`;
      await addDoc(collection(db, collectionPath), formData);
      setAlert({ message: 'Prescription added successfully!', type: 'success' });
    } catch (error) {
      console.error('Error adding prescription: ', error);
      setAlert({ message: `Error adding prescription: ${error.message}`, type: 'error' });
    }
  };

  const fillPrescription = async (prescription) => {
    if (!userId) {
      setAlert({ message: 'Authentication error. Please refresh.', type: 'error' });
      return;
    }
    
    // Check stock for all items
    for (const item of prescription.items) {
      const drug = inventory.find(d => d.id === item.drugId);
      if (!drug) {
         setAlert({ message: `Item ${item.drugName} (ID: ${item.drugId}) not found in inventory.`, type: 'error' });
         return;
      }
      if (drug.quantityInStock < item.quantity) {
         setAlert({ message: `Not enough stock for ${drug.name}. Required: ${item.quantity}, In Stock: ${drug.quantityInStock}`, type: 'error' });
         return;
      }
    }
    
    // All items in stock, proceed with batch write
    try {
      const batch = writeBatch(db);
      
      // 1. Update inventory
      for (const item of prescription.items) {
        const drugRef = doc(db, `artifacts/${appId}/users/${userId}/inventory`, item.drugId);
        const drug = inventory.find(d => d.id === item.drugId); // We know it exists
        const newQuantity = drug.quantityInStock - item.quantity;
        batch.update(drugRef, { quantityInStock: newQuantity });
      }
      
      // 2. Mark prescription as filled
      const presRef = doc(db, `artifacts/${appId}/users/${userId}/prescriptions`, prescription.id);
      batch.update(presRef, { isFilled: true, dateFilled: Timestamp.now() });
      
      await batch.commit();
      setAlert({ message: 'Prescription filled successfully!', type: 'success' });

    } catch (error) {
       console.error('Error filling prescription: ', error);
       setAlert({ message: `Error filling prescription: ${error.message}`, type: 'error' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Prescriptions</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Plus size={18} className="mr-2" />
          Log Prescription
        </button>
      </div>

      <div className="space-y-4">
        {prescriptions.length > 0 ? (
          prescriptions.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-xl shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Patient ID: {p.patientIdentifier}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Dr. {p.doctorName} | Issued: {formatDate(p.dateIssued)}
                  </p>
                </div>
                {p.isFilled ? (
                   <span className="mt-2 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                     <CheckCircle size={16} className="mr-1" />
                     Filled on {formatDate(p.dateFilled)}
                   </span>
                ) : (
                   <button
                    onClick={() => fillPrescription(p)}
                    className="mt-2 sm:mt-0 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700"
                   >
                     Fill Prescription
                   </button>
                )}
              </div>
              <div className="border-t border-gray-200 pt-3">
                 <h4 className="text-sm font-medium text-gray-600 mb-2">Items:</h4>
                 <ul className="list-disc list-inside space-y-1">
                   {p.items.map((item, index) => (
                     <li key={index} className="text-sm text-gray-700">
                       <span className="font-medium">{item.drugName}</span> - Qty: {item.quantity} (Dosage: {item.dosage || 'N/A'})
                     </li>
                   ))}
                 </ul>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-12">
            No prescriptions logged yet.
          </div>
        )}
      </div>
      
      <PrescriptionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddPrescription}
        inventory={inventory}
        setAlert={setAlert}
      />
    </div>
  );
};

//  Login Page Component 
const LoginPage = ({ onLogin, setAlert }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setAlert({ message: 'Please enter both email and password.', type: 'error' });
      return;
    }
    setIsLoading(true);
    try {
      // Firebase sign in function
      await onLogin(email, password);
      // setAlert is handled by the main App component on success
    } catch (error) {
      console.error("Login Error: ", error.code);
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      setAlert({ message: errorMessage, type: 'error' });
    }
    setIsLoading(false);
  };

  return ( 
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-indigo-600">
            RxOptima
          </h2>
          <p className="mt-2 text-gray-600">Administrator Login</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Confirmation Modal Component ---
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-2">
            {message}
          </p>
        </div>
        <div className="flex justify-stretch items-center bg-gray-50 rounded-b-xl border-t">
          <button
            onClick={onClose}
            className="w-1/2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-bl-xl focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-1/2 px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-br-xl focus:outline-none"
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
};
//  Main App Component 
export default function App() {
  const appId = "rxoptima-app";
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentView, setView] = useState('dashboard');
  
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const handleLogin = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    setAlert({ message: 'Login successful! Welcome.', type: 'success' });
  };
  const handleLogout = async () => {
    await signOut(auth);
    setAlert({ message: 'You have been logged out.', type: 'success' });
  };
  const requestLogout = () => {
    setIsLogoutModalOpen(true)
  }
  const confirmLogout = async () => {
    await handleLogout();
    setIsLogoutModalOpen(false);
  }
  // Authentication Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Data Subscription Effect 
  useEffect(() => {
    if (!isAuthReady || !userId) {
      // Don't fetch data until auth is ready and we have a user ID
      return;
    }

    const collections = ['inventory', 'sales', 'prescriptions'];
    const setters = [setInventory, setSales, setPrescriptions];
    const unsubscribers = [];
    
    let loadingCounter = collections.length;
    const checkLoading = () => {
      loadingCounter--;
      if (loadingCounter === 0) {
        setIsLoading(false);
      }
    };

    collections.forEach((colName, index) => {
      const collectionPath = `artifacts/${appId}/users/${userId}/${colName}`;
      const q = query(collection(db, collectionPath));
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const dataList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          
          // Simple sort: new items first
          if (dataList.length > 0 && dataList[0].timestamp) {
             dataList.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
          } else if (dataList.length > 0 && dataList[0].dateIssued) {
             dataList.sort((a, b) => b.dateIssued.toMillis() - a.dateIssued.toMillis());
          }
          
          setters[index](dataList);
          checkLoading();
        },
        (error) => {
          console.error(`Error fetching ${colName}: `, error);
          setAlert({ message: `Failed to load ${colName}.`, type: 'error' });
          checkLoading();
        }
      );
      unsubscribers.push(unsubscribe);
    });
    
    // Cleanup subscriptions on unmount or user change
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };

  }, [isAuthReady, userId, appId]);

  //  Alert Timer 
  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => {
        setAlert({ message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  //  Render Logic 
  const renderView = () => {
    if (!isAuthReady || isLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      );
    }
    
    if (isAuthReady && !userId) {
       return (
        <div className="p-8 text-center text-red-600">
          Authentication failed. Please check your connection or refresh the page.
        </div>
       );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard inventory={inventory} sales={sales} prescriptions={prescriptions} />;
      case 'inventory':
        return <Inventory userId={userId} inventory={inventory} setAlert={setAlert} />;
      case 'pos':
        return <POS userId={userId} inventory={inventory} setAlert={setAlert} />;
      case 'prescriptions':
        return <Prescriptions userId={userId} prescriptions={prescriptions} inventory={inventory} setAlert={setAlert} />;
      default:
        return <Dashboard inventory={inventory} sales={sales} prescriptions={prescriptions} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-inter pb-16 sm:pb-0">
      <CustomAlert 
        message={alert.message} 
        type={alert.type} 
        onClose={() => setAlert({ message: '', type: '' })} 
      />
      <ConfirmationModal
      isOpen={isLogoutModalOpen}
      onClose={() => setIsLogoutModalOpen(false)} 
      onConfirm={confirmLogout} 
      title="Confirm Logout"
      message="Are you sure you want to log out of your session?"
      />
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .printable-area, .printable-area * { visibility: visible; }
            .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none; }
          }
        `}
      </style>

      {!isAuthReady && (
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      )}
      {isAuthReady && !userId && (
        <LoginPage 
          onLogin={handleLogin} 
          setAlert={setAlert} 
        />
      )}
      
      {isAuthReady && userId && (
        <>
          <Header 
            currentView={currentView} 
            setView={setView} 
            onLogout={requestLogout} 
          />
          <main>
            {renderView()}
          </main>
        </>
      )}
    </div>
  );
}

