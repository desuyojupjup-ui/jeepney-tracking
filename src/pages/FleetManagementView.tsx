import React, { useState, useMemo } from 'react';
import { Jeepney, Driver } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTransit } from '../context/TransitContext';
import { 
  Bus, 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  X,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Smartphone,
  RefreshCw,
  Ban,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Activity,
  CheckCircle
} from 'lucide-react';

interface FleetManagementViewProps {
  jeepneys?: Jeepney[];
  drivers?: Driver[];
  initialTab?: 'jeepneys' | 'drivers';
}

export const FleetManagementView: React.FC<FleetManagementViewProps> = ({
  initialTab = 'drivers',
}) => {
  const { 
    drivers, 
    createDriverAccount, 
    deleteDriver, 
    resetDriverPassword, 
    updateDriver,
    currentOperator 
  } = useAuth();

  const {
    jeepneys,
    addJeepney,
    updateJeepney,
    deleteJeepney: removeJeepneyUnit,
  } = useTransit();

  const [activeTab, setActiveTab] = useState<'jeepneys' | 'drivers'>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Checkbox selections
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [selectedJeepneyIds, setSelectedJeepneyIds] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Sync tab if initialTab changes from parent
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setCurrentPage(1);
      setSelectedDriverIds([]);
      setSelectedJeepneyIds([]);
    }
  }, [initialTab]);

  // Detail View Modals
  const [viewingDriver, setViewingDriver] = useState<Driver | null>(null);
  const [viewingJeepney, setViewingJeepney] = useState<Jeepney | null>(null);

  // Jeepney Modal State
  const [showAddJeepneyModal, setShowAddJeepneyModal] = useState<boolean>(false);
  const [newCode, setNewCode] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newCapacity, setNewCapacity] = useState(20);
  const [newType, setNewType] = useState<'modern_electric' | 'modern_euro4' | 'traditional_puj'>('modern_euro4');

  // Jeepney Edit Modal State
  const [editingJeepney, setEditingJeepney] = useState<Jeepney | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editPlate, setEditPlate] = useState('');
  const [editCapacity, setEditCapacity] = useState(20);
  const [editType, setEditType] = useState<'modern_electric' | 'modern_euro4' | 'traditional_puj'>('modern_euro4');
  const [editDriverId, setEditDriverId] = useState('');
  const [editStatus, setEditStatus] = useState<Jeepney['status']>('at_terminal');

  // Driver Provisioning Modal State
  const [showAddDriverModal, setShowAddDriverModal] = useState<boolean>(false);
  const [driverName, setDriverName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('09');
  const [assignedJeepneyId, setAssignedJeepneyId] = useState('');
  const [driverUsername, setDriverUsername] = useState('');
  const [driverPassword, setDriverPassword] = useState('driver123');
  const [initialDutyStatus, setInitialDutyStatus] = useState<'on_duty' | 'off_duty' | 'on_break'>('on_duty');
  const [driverFormError, setDriverFormError] = useState<string | null>(null);

  // Success Receipt Modal
  const [issuedDriverSlip, setIssuedDriverSlip] = useState<Driver | null>(null);
  const [copiedSlip, setCopiedSlip] = useState(false);

  // Password Reset Modal State
  const [driverToReset, setDriverToReset] = useState<Driver | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  // Toggle reveal password for driver rows
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered Drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = d.fullName.toLowerCase().includes(q) ||
                            d.username.toLowerCase().includes(q) ||
                            d.licenseNumber.toLowerCase().includes(q) ||
                            d.contactNumber.includes(q);
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'suspended' ? d.accountStatus === 'suspended' : d.status === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchQuery, statusFilter]);

  // Filtered Jeepneys
  const filteredJeepneys = useMemo(() => {
    return jeepneys.filter((j) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = j.jeepneyCode.toLowerCase().includes(q) ||
                            j.plateNumber.toLowerCase().includes(q) ||
                            (j.driverName && j.driverName.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jeepneys, searchQuery, statusFilter]);

  // KPI Calculations
  const totalDrivers = drivers.length;
  const onDutyDrivers = drivers.filter(d => d.status === 'on_duty' && d.accountStatus !== 'suspended').length;
  const onBreakDrivers = drivers.filter(d => d.status === 'on_break').length;
  const offDutyDrivers = drivers.filter(d => d.status === 'off_duty' || d.accountStatus === 'suspended').length;

  const totalJeeps = jeepneys.length;
  const enRouteJeeps = jeepneys.filter(j => j.status === 'en_route').length;
  const terminalJeeps = jeepneys.filter(j => j.status === 'at_terminal').length;
  const standbyJeeps = jeepneys.filter(j => j.status === 'idle').length;

  // Pagination Calculations
  const currentTotal = activeTab === 'drivers' ? filteredDrivers.length : filteredJeepneys.length;
  const totalPages = Math.max(1, Math.ceil(currentTotal / rowsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedDrivers = useMemo(() => {
    const start = (validCurrentPage - 1) * rowsPerPage;
    return filteredDrivers.slice(start, start + rowsPerPage);
  }, [filteredDrivers, validCurrentPage, rowsPerPage]);

  const paginatedJeepneys = useMemo(() => {
    const start = (validCurrentPage - 1) * rowsPerPage;
    return filteredJeepneys.slice(start, start + rowsPerPage);
  }, [filteredJeepneys, validCurrentPage, rowsPerPage]);

  // Checkbox Selection Logic
  const allDriversSelected = paginatedDrivers.length > 0 && paginatedDrivers.every(d => selectedDriverIds.includes(d.id));
  const toggleSelectAllDrivers = () => {
    if (allDriversSelected) {
      setSelectedDriverIds(prev => prev.filter(id => !paginatedDrivers.some(d => d.id === id)));
    } else {
      const toAdd = paginatedDrivers.map(d => d.id).filter(id => !selectedDriverIds.includes(id));
      setSelectedDriverIds(prev => [...prev, ...toAdd]);
    }
  };

  const toggleSelectDriver = (id: string) => {
    setSelectedDriverIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const allJeepneysSelected = paginatedJeepneys.length > 0 && paginatedJeepneys.every(j => selectedJeepneyIds.includes(j.id));
  const toggleSelectAllJeepneys = () => {
    if (allJeepneysSelected) {
      setSelectedJeepneyIds(prev => prev.filter(id => !paginatedJeepneys.some(j => j.id === id)));
    } else {
      const toAdd = paginatedJeepneys.map(j => j.id).filter(id => !selectedJeepneyIds.includes(id));
      setSelectedJeepneyIds(prev => [...prev, ...toAdd]);
    }
  };

  const toggleSelectJeepney = (id: string) => {
    setSelectedJeepneyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (activeTab === 'drivers') {
      const headers = ['Full Name', 'License Number', 'Contact Number', 'Assigned Jeepney', 'Username', 'Status', 'Account Status', 'Last Login'];
      const rows = filteredDrivers.map(d => {
        const assigned = jeepneys.find(j => j.id === d.assignedJeepneyId);
        return [
          `"${d.fullName}"`,
          `"${d.licenseNumber}"`,
          `"${d.contactNumber}"`,
          `"${assigned ? assigned.jeepneyCode : 'Unassigned'}"`,
          `"${d.username}"`,
          `"${d.status}"`,
          `"${d.accountStatus || 'active'}"`,
          `"${d.lastLoginAt || 'Never'}"`
        ].join(',');
      });
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `drivers_directory_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Fleet Code', 'Plate Number', 'Classification', 'Capacity', 'Status', 'Assigned Driver', 'Current Destination'];
      const rows = filteredJeepneys.map(j => [
        `"${j.jeepneyCode}"`,
        `"${j.plateNumber}"`,
        `"${j.modelType}"`,
        `"${j.capacity}"`,
        `"${j.status}"`,
        `"${j.driverName || 'No Assigned Driver'}"`,
        `"${j.destinationName || 'Corridor'}"`
      ].join(','));
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `jeepney_fleet_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle Jeepney Addition
  const handleAddJeepney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newPlate) return;

    const newUnit: Jeepney = {
      id: `puj-${Date.now()}`,
      jeepneyCode: newCode.toUpperCase(),
      plateNumber: newPlate.toUpperCase(),
      modelType: newType,
      capacity: newCapacity,
      currentPassengers: 0,
      status: 'at_terminal',
      currentLat: 14.3854,
      currentLng: 121.0422,
      heading: 18,
      speedKmh: 0,
      accuracyMeters: 4.0,
      lastGpsUpdate: 'Just now',
      direction: 'PLMun_to_Alabang',
      destinationName: 'Alabang South Station',
      nextStopName: 'PLMun Terminal (Poblacion)',
    };

    addJeepney(newUnit);
    setNewCode('');
    setNewPlate('');
    setShowAddJeepneyModal(false);
  };

  // Open Edit Jeepney Modal
  const handleOpenEditJeepney = (puj: Jeepney) => {
    setEditingJeepney(puj);
    setEditCode(puj.jeepneyCode);
    setEditPlate(puj.plateNumber);
    setEditCapacity(puj.capacity);
    setEditType(puj.modelType);
    setEditDriverId(puj.assignedDriverId || '');
    setEditStatus(puj.status);
  };

  // Save Edit Jeepney
  const handleSaveEditJeepney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJeepney || !editCode || !editPlate) return;

    const assignedDriver = drivers.find(d => d.id === editDriverId);

    updateJeepney(editingJeepney.id, {
      jeepneyCode: editCode.toUpperCase(),
      plateNumber: editPlate.toUpperCase(),
      modelType: editType,
      capacity: editCapacity,
      status: editStatus,
      assignedDriverId: editDriverId || undefined,
      driverName: assignedDriver ? assignedDriver.fullName : (editDriverId ? editingJeepney.driverName : undefined),
    });

    if (editDriverId && assignedDriver) {
      updateDriver(assignedDriver.id, { assignedJeepneyId: editingJeepney.id });
    }

    setEditingJeepney(null);
  };

  // Delete Jeepney Unit
  const handleDeleteJeepney = (puj: Jeepney) => {
    if (window.confirm(`Permanently remove PUJ Unit "${puj.jeepneyCode}" (${puj.plateNumber}) from the accredited fleet?`)) {
      removeJeepneyUnit(puj.id);
    }
  };

  // Auto-suggest username when typing driver name
  const handleNameChange = (val: string) => {
    setDriverName(val);
    if (!driverUsername || driverUsername.startsWith('driver')) {
      const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      const suffix = String(drivers.length + 1).padStart(2, '0');
      setDriverUsername(slug ? `driver.${slug.slice(0, 8)}` : `driver${suffix}`);
    }
  };

  // Open Provision Driver Modal
  const handleOpenAddDriver = () => {
    setDriverName('');
    setLicenseNumber(`N02-${Math.floor(10 + Math.random() * 89)}-${Math.floor(100000 + Math.random() * 900000)}`);
    setContactNumber('0917-');
    setAssignedJeepneyId(jeepneys[0]?.id || '');
    const suffix = String(drivers.length + 1).padStart(2, '0');
    setDriverUsername(`driver${suffix}`);
    setDriverPassword(`drv${Math.floor(1000 + Math.random() * 9000)}`);
    setInitialDutyStatus('on_duty');
    setDriverFormError(null);
    setShowAddDriverModal(true);
  };

  // Handle Driver Provisioning
  const handleProvisionDriver = (e: React.FormEvent) => {
    e.preventDefault();
    setDriverFormError(null);

    const res = createDriverAccount({
      fullName: driverName,
      licenseNumber,
      contactNumber,
      assignedJeepneyId: assignedJeepneyId || undefined,
      username: driverUsername,
      password: driverPassword,
      status: initialDutyStatus,
    });

    if (res.success && res.driver) {
      if (assignedJeepneyId) {
        updateJeepney(assignedJeepneyId, {
          assignedDriverId: res.driver.id,
          driverName: res.driver.fullName,
        });
      }
      setShowAddDriverModal(false);
      setIssuedDriverSlip(res.driver);
    } else {
      setDriverFormError(res.error || 'Failed to provision driver account.');
    }
  };

  // Handle Copy Slip
  const handleCopyCredentials = () => {
    if (!issuedDriverSlip) return;
    const assignedJeep = jeepneys.find(j => j.id === issuedDriverSlip.assignedJeepneyId);
    const text = `=== JEEPTRACK MUNTINLUPA DRIVER CONSOLE CREDENTIALS ===\nDriver: ${issuedDriverSlip.fullName}\nLicense: ${issuedDriverSlip.licenseNumber}\nAssigned Unit: ${assignedJeep ? assignedJeep.jeepneyCode : 'Standby / Unassigned'}\n----------------------------------------\nDriver Username: ${issuedDriverSlip.username}\nSecurity PIN: ${issuedDriverSlip.password}\n----------------------------------------\nLogin URL: Driver In-Cab Console`;
    navigator.clipboard.writeText(text);
    setCopiedSlip(true);
    setTimeout(() => setCopiedSlip(false), 2000);
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverToReset) return;
    setResetError(null);

    const res = resetDriverPassword(driverToReset.id, newPasswordValue);
    if (res.success) {
      setDriverToReset(null);
      setNewPasswordValue('');
    } else {
      setResetError(res.error || 'Failed to update PIN.');
    }
  };

  // Toggle Driver Active / Suspended
  const handleToggleSuspend = (driver: Driver) => {
    const nextStatus = driver.accountStatus === 'suspended' ? 'active' : 'suspended';
    const confirmMsg = nextStatus === 'suspended'
      ? `Suspend driver account "${driver.fullName}"? They will be locked out of the Driver Console.`
      : `Reactivate driver account "${driver.fullName}"?`;
    
    if (window.confirm(confirmMsg)) {
      updateDriver(driver.id, { accountStatus: nextStatus });
    }
  };

  // Delete Driver
  const handleDeleteDriver = (driver: Driver) => {
    if (window.confirm(`Permanently revoke credentials and delete driver account "${driver.fullName}"?`)) {
      deleteDriver(driver.id);
    }
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-5 py-4 space-y-4 font-sans text-slate-900 dark:text-slate-100">
      
      {/* =========================================================================
          1. TOP KPI CARDS (Matching Reference Design: Icon Left, Metric Right)
          ========================================================================= */}
      {activeTab === 'drivers' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Drivers */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Total Drivers</span>
                <span className="text-[11px] text-slate-400">Roster total</span>
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalDrivers.toLocaleString()}
            </div>
          </div>

          {/* Card 2: On Duty */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">On Duty</span>
                <span className="text-[11px] text-emerald-500 font-medium">Active behind wheel</span>
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {onDutyDrivers.toLocaleString()}
            </div>
          </div>

          {/* Card 3: On Break */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">On Break</span>
                <span className="text-[11px] text-amber-500 font-medium">Meal & staging rest</span>
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              {onBreakDrivers.toLocaleString()}
            </div>
          </div>

          {/* Card 4: Off Duty */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Off Duty</span>
                <span className="text-[11px] text-slate-400">Inactive or suspended</span>
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-600 dark:text-slate-400">
              {offDutyDrivers.toLocaleString()}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Fleet */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Bus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Total Fleet</span>
                <span className="text-[11px] text-slate-400">Accredited PUJs</span>
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalJeeps.toLocaleString()}
            </div>
          </div>

          {/* Card 2: In Transit */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">In Transit</span>
                <span className="text-[11px] text-emerald-500 font-medium">On corridor route</span>
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {enRouteJeeps.toLocaleString()}
            </div>
          </div>

          {/* Card 3: At Terminal */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Bus className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">At Terminal</span>
                <span className="text-[11px] text-slate-400">Docked & staging</span>
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {terminalJeeps.toLocaleString()}
            </div>
          </div>

          {/* Card 4: Standby */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Standby / Idle</span>
                <span className="text-[11px] text-slate-400">Depot maintenance</span>
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-600 dark:text-slate-400">
              {standbyJeeps.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. DATA TABLE CONTAINER (With Integrated Action Buttons, Searchbar & Filters Inside)
          ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        
        {/* Integrated Action Toolbar & Search / Filter Row Inside Datatable */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          
          {/* Left Tools */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset filters and refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>

            {/* Switch Tab Pill Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setActiveTab('drivers');
                  setCurrentPage(1);
                  setStatusFilter('all');
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'drivers'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Drivers ({drivers.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('jeepneys');
                  setCurrentPage(1);
                  setStatusFilter('all');
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'jeepneys'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                PUJ Fleet ({jeepneys.length})
              </button>
            </div>

            {/* Primary Action Button */}
            {activeTab === 'drivers' ? (
              <button
                onClick={handleOpenAddDriver}
                className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ml-auto sm:ml-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Provision Driver</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAddJeepneyModal(true)}
                className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ml-auto sm:ml-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add PUJ Unit</span>
              </button>
            )}

          </div>

          {/* Right Tools: Search & Filter Inside Datatable */}
          <div className="flex items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={activeTab === 'drivers' ? "Search by driver, username, license..." : "Search by code, plate, driver..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {activeTab === 'drivers' ? (
                <>
                  <option value="on_duty">On Duty</option>
                  <option value="on_break">On Break</option>
                  <option value="off_duty">Off Duty</option>
                  <option value="suspended">Suspended</option>
                </>
              ) : (
                <>
                  <option value="en_route">In Transit</option>
                  <option value="at_terminal">At Terminal</option>
                  <option value="idle">Standby / Idle</option>
                </>
              )}
            </select>

          </div>

        </div>

        <div className="overflow-x-auto">
          {activeTab === 'drivers' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-600 dark:text-slate-400 select-none">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allDriversSelected}
                      onChange={toggleSelectAllDrivers}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">Driver Name</th>
                  <th className="py-3 px-3">License No.</th>
                  <th className="py-3 px-3">Assigned PUJ Unit</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Console Login</th>
                  <th className="py-3 px-3">Shift Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No drivers match your current filter or search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedDrivers.map((driver) => {
                    const isSelected = selectedDriverIds.includes(driver.id);
                    const assignedJeep = jeepneys.find(j => j.id === driver.assignedJeepneyId);
                    const isPwVisible = revealedPasswords[driver.id];

                    return (
                      <tr 
                        key={driver.id} 
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                          isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectDriver(driver.id)}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => setViewingDriver(driver)}
                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left block"
                          >
                            {driver.fullName}
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono">{driver.id}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 font-bold">
                          {driver.licenseNumber}
                        </td>
                        <td className="py-3 px-3">
                          {assignedJeep ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                              <Bus className="w-3 h-3 text-emerald-600" />
                              {assignedJeep.jeepneyCode} ({assignedJeep.plateNumber})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Standby / Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {driver.contactNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{driver.username}</span>
                            <span className="text-slate-400">&bull;</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {isPwVisible ? driver.password : '••••••'}
                            </span>
                            <button
                              onClick={() => toggleRevealPassword(driver.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                              title={isPwVisible ? "Hide PIN" : "Reveal PIN"}
                            >
                              {isPwVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {driver.accountStatus === 'suspended' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Suspended
                            </span>
                          ) : driver.status === 'on_duty' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              On Duty
                            </span>
                          ) : driver.status === 'on_break' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              On Break
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Off Duty
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingDriver(driver)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDriverToReset(driver);
                                setNewPasswordValue(driver.password || 'driver123');
                              }}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                              title="Reset PIN"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleSuspend(driver)}
                              className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                                driver.accountStatus === 'suspended' ? 'text-emerald-600' : 'text-slate-500 hover:text-amber-600'
                              }`}
                              title={driver.accountStatus === 'suspended' ? "Reactivate Driver" : "Suspend Driver"}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDriver(driver)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Driver"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-600 dark:text-slate-400 select-none">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allJeepneysSelected}
                      onChange={toggleSelectAllJeepneys}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">PUJ Fleet Code</th>
                  <th className="py-3 px-3">Plate Number</th>
                  <th className="py-3 px-3">Classification</th>
                  <th className="py-3 px-3">Assigned Driver</th>
                  <th className="py-3 px-3">Capacity & Live Load</th>
                  <th className="py-3 px-3">Fleet Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedJeepneys.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No PUJ units match your current filter or search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedJeepneys.map((puj) => {
                    const isSelected = selectedJeepneyIds.includes(puj.id);

                    return (
                      <tr 
                        key={puj.id} 
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                          isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectJeepney(puj.id)}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => setViewingJeepney(puj)}
                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left block font-mono"
                          >
                            {puj.jeepneyCode}
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono">{puj.id}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-800 dark:text-slate-200 font-bold">
                          {puj.plateNumber}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            puj.modelType === 'modern_electric'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : puj.modelType === 'modern_euro4'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {puj.modelType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {puj.driverName ? (
                            <span className="font-bold text-slate-800 dark:text-slate-200">{puj.driverName}</span>
                          ) : (
                            <span className="text-slate-400 italic">No assigned driver</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{puj.currentPassengers || 0}</span>
                          <span className="text-slate-400">/{puj.capacity} seats</span>
                        </td>
                        <td className="py-3 px-3">
                          {puj.status === 'en_route' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              In Transit
                            </span>
                          ) : puj.status === 'at_terminal' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              At Terminal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Standby
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingJeepney(puj)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                              title="View Unit Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditJeepney(puj)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Edit PUJ Unit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteJeepney(puj)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Remove PUJ Unit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* =========================================================================
            4. PAGINATION BAR (Matching Image 5: Showing [ X v ] out of Y records)
            ========================================================================= */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          
          {/* Left: Rows Per Page Selector */}
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
            <span>out of <strong className="text-slate-900 dark:text-white font-mono">{currentTotal}</strong> records</span>
          </div>

          {/* Right: Previous / Page Numbers / Next */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={validCurrentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              &larr; Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = p === validCurrentPage;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              Next &rarr;
            </button>
          </div>

        </div>

      </div>

      {/* =========================================================================
          MODALS: PROVISION DRIVER, EDIT JEEPNEY, CREDENTIALS SLIP, RESET PIN, DETAILS
          ========================================================================= */}

      {/* VIEW DRIVER DETAILS MODAL */}
      {viewingDriver && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 font-bold">
                  {viewingDriver.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{viewingDriver.fullName}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{viewingDriver.licenseNumber}</span>
                </div>
              </div>
              <button 
                onClick={() => setViewingDriver(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Contact:</span>
                <span className="font-bold text-slate-900 dark:text-white">{viewingDriver.contactNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Username:</span>
                <span className="font-bold text-slate-900 dark:text-white">{viewingDriver.username}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Security PIN:</span>
                <span className="font-bold text-emerald-600">{viewingDriver.password}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Duty Status:</span>
                <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{viewingDriver.status}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-sans">Account:</span>
                <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{viewingDriver.accountStatus || 'ACTIVE'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingDriver(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW JEEPNEY DETAILS MODAL */}
      {viewingJeepney && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 font-bold">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{viewingJeepney.jeepneyCode}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{viewingJeepney.plateNumber}</span>
                </div>
              </div>
              <button 
                onClick={() => setViewingJeepney(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Classification:</span>
                <span className="font-bold text-slate-900 dark:text-white">{viewingJeepney.modelType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Capacity:</span>
                <span className="font-bold text-slate-900 dark:text-white">{viewingJeepney.capacity} seats</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Assigned Driver:</span>
                <span className="font-bold text-slate-900 dark:text-white">{viewingJeepney.driverName || 'None'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Destination:</span>
                <span className="font-bold text-slate-900 dark:text-white">{viewingJeepney.destinationName || 'Alabang'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-sans">Fleet Status:</span>
                <span className="font-bold uppercase text-emerald-600">{viewingJeepney.status}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingJeepney(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROVISION DRIVER MODAL */}
      {showAddDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Provision Driver Account</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Issue secure credentials for the Driver In-Cab Console.
                </p>
              </div>
              <button
                onClick={() => setShowAddDriverModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {driverFormError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
                {driverFormError}
              </div>
            )}

            <form onSubmit={handleProvisionDriver} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    Driver Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rodrigo Cruz Santos"
                    value={driverName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    LTO Driver's License No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="N02-XX-XXXXXX"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono uppercase focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    Mobile Contact Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="09XX-XXX-XXXX"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    Assigned PUJ Unit (Route: PLMun ⇄ Alabang)
                  </label>
                  <select
                    value={assignedJeepneyId}
                    onChange={(e) => setAssignedJeepneyId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Standby / Relief Driver (Unassigned) --</option>
                    {jeepneys.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.jeepneyCode} &bull; Plate: {j.plateNumber} ({j.modelType.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/60 dark:bg-slate-950 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-3">
                <div className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>In-Cab Console Access Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold block mb-1">
                      Login Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. driver06"
                      value={driverUsername}
                      onChange={(e) => setDriverUsername(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold block mb-1">
                      Console Security PIN *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. driver123"
                      value={driverPassword}
                      onChange={(e) => setDriverPassword(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDriverModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Provision Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS ISSUED SLIP MODAL */}
      {issuedDriverSlip && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center mb-2 border border-emerald-300">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Driver Account Provisioned</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                The driver can now sign in to the Driver In-Cab Console.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-sans">Driver:</span>
                <span className="font-bold text-slate-900 dark:text-white font-sans">{issuedDriverSlip.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-sans">License:</span>
                <span className="text-slate-800 dark:text-slate-300">{issuedDriverSlip.licenseNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-sans">Username:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{issuedDriverSlip.username}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-500 font-sans">PIN:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{issuedDriverSlip.password}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                {copiedSlip ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSlip ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIssuedDriverSlip(null)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {driverToReset && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Reset Security PIN</h3>
              <button
                onClick={() => setDriverToReset(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  Driver: {driverToReset.fullName}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter new 6-digit PIN"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 font-mono font-bold focus:border-blue-500"
                />
              </div>

              {resetError && <p className="text-rose-600 text-xs">{resetError}</p>}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDriverToReset(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-md"
                >
                  Save New PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD JEEPNEY UNIT MODAL */}
      {showAddJeepneyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Register New PUJ Unit</h3>
              <button
                onClick={() => setShowAddJeepneyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddJeepney} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Body / Fleet Code</label>
                <input
                  type="text"
                  placeholder="e.g. PLM-09"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 font-mono focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. NAA-9921"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 font-mono uppercase focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Classification</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-blue-500"
                >
                  <option value="modern_electric">Modern Electric PUJ (Solar/EV)</option>
                  <option value="modern_euro4">Modern Euro-4 Diesel PUJ</option>
                  <option value="traditional_puj">Traditional Stainless PUJ</option>
                </select>
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Passenger Seating Capacity</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(parseInt(e.target.value) || 20)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 font-mono focus:border-blue-500"
                  min={12}
                  max={30}
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddJeepneyModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-md"
                >
                  Save & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT JEEPNEY UNIT MODAL */}
      {editingJeepney && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Edit PUJ Unit Details</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Unit ID: {editingJeepney.id}</p>
              </div>
              <button
                onClick={() => setEditingJeepney(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditJeepney} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Body / Fleet Code</label>
                <input
                  type="text"
                  placeholder="e.g. PLM-01"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 font-mono font-bold focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. NCS-4182"
                  value={editPlate}
                  onChange={(e) => setEditPlate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 font-mono uppercase font-bold focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Classification</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-blue-500 font-medium"
                >
                  <option value="modern_electric">Modern Electric PUJ (Solar/EV)</option>
                  <option value="modern_euro4">Modern Euro-4 Diesel PUJ</option>
                  <option value="traditional_puj">Traditional Stainless PUJ</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(parseInt(e.target.value) || 20)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 font-mono focus:border-blue-500"
                    min={12}
                    max={32}
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Fleet Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-blue-500 font-medium"
                  >
                    <option value="at_terminal">At Terminal (Docked)</option>
                    <option value="en_route">En Route (In Transit)</option>
                    <option value="idle">Standby / Idle</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Assigned Driver</label>
                <select
                  value={editDriverId}
                  onChange={(e) => setEditDriverId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-blue-500 font-medium"
                >
                  <option value="">-- No Assigned Driver (Standby Unit) --</option>
                  {drivers.map((drv) => (
                    <option key={drv.id} value={drv.id}>
                      {drv.fullName} ({drv.licenseNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingJeepney(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
