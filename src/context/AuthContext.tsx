import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Driver, OperatorAccount, CommuterUser } from '../types';
import { MOCK_DRIVERS, MOCK_OPERATORS, MOCK_COMMUTERS } from '../data/mockData';

// Accepts official PLMun school emails (including subdomains like @student.plmun.edu.ph, @cit.plmun.edu.ph, and common @plumn.edu.ph spelling)
// Strictly rejects personal emails like @gmail.com, @yahoo.com, @outlook.com, @hotmail.com, @icloud.com
export const PLMUN_EMAIL_REGEX = /^[^\s@]+@([a-z0-9-]+\.)*(plmun|plumn)\.edu(\.ph)?$/i;

// Removes invisible characters / stray spaces and repairs accidental double-@ prefixes
export function normalizeEmail(email: string): string {
  let raw = (email || '')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .trim()
    .toLowerCase();

  // If an old auto-fill prepended e.g. "2@plmun.edu.ph" before the user's real email, keep the user's real email
  const plmunPrefixMatch = raw.match(/^[a-z0-9._-]+@(plmun|plumn)\.edu(\.ph)?([a-z0-9._%+-]+@.+)$/i);
  if (plmunPrefixMatch && plmunPrefixMatch[3]) {
    raw = plmunPrefixMatch[3];
  }

  // Convert any accidental spaces inside the local part (before @) into dots and strip spaces after @
  if (raw.includes('@')) {
    const atIndex = raw.lastIndexOf('@');
    const localPart = raw
      .slice(0, atIndex)
      .trim()
      .replace(/\s+/g, '.')
      .replace(/\.+/g, '.');
    const domainPart = raw
      .slice(atIndex + 1)
      .replace(/\s+/g, '')
      .replace(/\.+$/, '');
    raw = `${localPart}@${domainPart}`;
  } else {
    raw = raw.replace(/\s+/g, '');
  }

  return raw;
}

export function isValidPlmunEmail(email: string): boolean {
  const cleaned = normalizeEmail(email);
  return PLMUN_EMAIL_REGEX.test(cleaned);
}

interface AuthContextType {
  currentOperator: OperatorAccount | null;
  currentDriver: Driver | null;
  currentCommuter: CommuterUser | null;
  drivers: Driver[];
  commuters: CommuterUser[];
  isOperatorAuthenticated: boolean;
  isDriverAuthenticated: boolean;
  isCommuterAuthenticated: boolean;
  loginOperator: (usernameOrEmail: string, password: string) => { success: boolean; error?: string };
  logoutOperator: () => void;
  loginDriver: (username: string, password: string) => { success: boolean; error?: string };
  logoutDriver: (options?: { keepOnDuty?: boolean }) => void;
  loginCommuter: (idOrEmail: string, password: string) => { success: boolean; error?: string; commuter?: CommuterUser };
  registerCommuter: (data: {
    fullName: string;
    idNumber: string;
    email: string;
    password: string;
    commuterType: 'student' | 'faculty';
    collegeOrDepartment: string;
    yearLevel?: string;
    courseOrProgram?: string;
    contactNumber: string;
  }, options?: { autoLogin?: boolean }) => { success: boolean; error?: string; commuter?: CommuterUser };
  logoutCommuter: () => void;
  updateCommuterProfile: (updates: Partial<CommuterUser>) => void;
  deleteCommuter: (commuterId: string) => void;
  toggleCommuterDiscount: (commuterId: string) => void;
  createDriverAccount: (data: {
    fullName: string;
    licenseNumber: string;
    contactNumber: string;
    assignedJeepneyId?: string;
    username: string;
    password: string;
    status?: 'on_duty' | 'off_duty' | 'on_break';
  }) => { success: boolean; error?: string; driver?: Driver };
  updateDriver: (driverId: string, updates: Partial<Driver>) => void;
  deleteDriver: (driverId: string) => { success: boolean; error?: string };
  resetDriverPassword: (driverId: string, newPassword: string) => { success: boolean; error?: string };
  resetCommuterPassword: (commuterId: string, newPassword: string) => { success: boolean; error?: string };
  refreshCommuters: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OPERATOR_SESSION_KEY = 'jeeptrack_operator_session';
const DRIVER_SESSION_KEY = 'jeeptrack_driver_session';
const DRIVERS_STORAGE_KEY = 'jeeptrack_provisioned_drivers_v1';
const COMMUTER_SESSION_KEY = 'jeeptrack_commuter_session';
const COMMUTERS_STORAGE_KEY = 'jeeptrack_registered_commuters_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load persisted commuters or fallback to initial mock commuters (Student & Faculty only)
  const [commuters, setCommuters] = useState<CommuterUser[]>(() => {
    try {
      const saved = localStorage.getItem(COMMUTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((c: any) => c.commuterType !== 'employee');
          return filtered.length > 0 ? filtered : MOCK_COMMUTERS;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved commuters:', e);
    }
    return MOCK_COMMUTERS;
  });

  // Current Commuter Session
  const [currentCommuter, setCurrentCommuter] = useState<CommuterUser | null>(() => {
    try {
      const saved = localStorage.getItem(COMMUTER_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse commuter session:', e);
    }
    return null;
  });
  // Load persisted drivers or fallback to initial mock drivers
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    try {
      const saved = localStorage.getItem(DRIVERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved drivers:', e);
    }
    return MOCK_DRIVERS;
  });

  // Current Operator Session
  const [currentOperator, setCurrentOperator] = useState<OperatorAccount | null>(() => {
    try {
      const saved = localStorage.getItem(OPERATOR_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse operator session:', e);
    }
    return null;
  });

  // Current Driver Session
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(() => {
    try {
      const saved = localStorage.getItem(DRIVER_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse driver session:', e);
    }
    return null;
  });

  // Save drivers to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(drivers));
    } catch (e) {
      console.error('Failed to save drivers:', e);
    }
  }, [drivers]);

  // Keep currentDriver in sync if driver was updated
  useEffect(() => {
    if (currentDriver) {
      const matching = drivers.find((d) => d.id === currentDriver.id);
      if (matching) {
        setCurrentDriver(matching);
        localStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(matching));
      }
    }
  }, [drivers]);

  // Save commuters to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem(COMMUTERS_STORAGE_KEY, JSON.stringify(commuters));
    } catch (e) {
      console.error('Failed to save commuters:', e);
    }
  }, [commuters]);

  const authChannelRef = useRef<BroadcastChannel | null>(null);

  const refreshCommuters = useCallback(() => {
    try {
      const savedCommuters = localStorage.getItem(COMMUTERS_STORAGE_KEY);
      if (savedCommuters) {
        const parsed = JSON.parse(savedCommuters);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((c: any) => c.commuterType !== 'employee');
          setCommuters(valid);
        }
      }
      const savedDrivers = localStorage.getItem(DRIVERS_STORAGE_KEY);
      if (savedDrivers) {
        const parsedD = JSON.parse(savedDrivers);
        if (Array.isArray(parsedD) && parsedD.length > 0) {
          setDrivers(parsedD);
        }
      }
    } catch (err) {
      console.error('Failed to refresh accounts from storage:', err);
    }
  }, []);

  // Cross-tab & focus sync via BroadcastChannel + StorageEvent + Window Focus
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('jeeptrack_auth_sync');
      authChannelRef.current = channel;
      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'SYNC_COMMUTERS' && Array.isArray(payload)) {
          setCommuters(payload);
        } else if (type === 'SYNC_DRIVERS' && Array.isArray(payload)) {
          setDrivers(payload);
        }
      };
    } catch (e) {}

    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === COMMUTERS_STORAGE_KEY) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setCommuters(parsed);
        } else if (e.key === DRIVERS_STORAGE_KEY) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setDrivers(parsed);
        }
      } catch (err) {
        console.error('Failed to sync accounts across tabs:', err);
      }
    };

    const handleFocus = () => {
      refreshCommuters();
    };

    const syncInterval = setInterval(() => {
      try {
        const savedDrivers = localStorage.getItem(DRIVERS_STORAGE_KEY);
        if (savedDrivers) {
          const parsedD = JSON.parse(savedDrivers);
          if (Array.isArray(parsedD) && parsedD.length > 0) {
            setDrivers((prev) =>
              JSON.stringify(prev) !== savedDrivers ? parsedD : prev
            );
          }
        }
      } catch (e) {}
    }, 1500);

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      authChannelRef.current?.close();
    };
  }, [refreshCommuters]);

  // Keep currentCommuter in sync if commuter was updated
  useEffect(() => {
    if (currentCommuter) {
      const matching = commuters.find((c) => c.id === currentCommuter.id);
      if (matching) {
        setCurrentCommuter(matching);
        localStorage.setItem(COMMUTER_SESSION_KEY, JSON.stringify(matching));
      }
    }
  }, [commuters]);

  // Operator Login
  const loginOperator = (usernameOrEmail: string, password: string) => {
    const trimmedUser = usernameOrEmail.trim().toLowerCase();
    const trimmedPass = password.trim();

    const operator = MOCK_OPERATORS.find(
      (op) =>
        (op.username.toLowerCase() === trimmedUser || op.email.toLowerCase() === trimmedUser) &&
        op.password === trimmedPass
    );

    if (!operator) {
      return {
        success: false,
        error: 'Invalid Control Center credentials. Please verify your username/email and password.',
      };
    }

    setCurrentOperator(operator);
    localStorage.setItem(OPERATOR_SESSION_KEY, JSON.stringify(operator));
    return { success: true };
  };

  // Operator Logout
  const logoutOperator = () => {
    setCurrentOperator(null);
    localStorage.removeItem(OPERATOR_SESSION_KEY);
  };

  // Driver Login
  const loginDriver = (username: string, password: string) => {
    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    const driver = drivers.find(
      (d) => d.username.toLowerCase() === trimmedUser && d.password === trimmedPass
    );

    if (!driver) {
      return {
        success: false,
        error: 'Invalid Driver ID or PIN. Driver accounts are issued exclusively by the Control Center.',
      };
    }

    if (driver.accountStatus === 'suspended') {
      return {
        success: false,
        error: 'This driver account has been suspended by the Control Center. Please contact your dispatcher.',
      };
    }

    const updatedDriver: Driver = {
      ...driver,
      status: 'on_duty',
      lastLoginAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) + ' Today',
    };

    const nextDrivers = drivers.map((d) => (d.id === driver.id ? updatedDriver : d));
    setDrivers(nextDrivers);
    try {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(nextDrivers));
      authChannelRef.current?.postMessage({ type: 'SYNC_DRIVERS', payload: nextDrivers });

      // Immediately bring the driver's assigned jeepney online in fleet storage & broadcast across tabs
      const fleetRaw = localStorage.getItem('jeeptrack_fleet_units_v4');
      if (fleetRaw) {
        const fleet = JSON.parse(fleetRaw);
        if (Array.isArray(fleet) && fleet.length > 0) {
          const targetIdx = fleet.findIndex(
            (j: any) =>
              (updatedDriver.assignedJeepneyId && j.id === updatedDriver.assignedJeepneyId) ||
              j.assignedDriverId === updatedDriver.id ||
              (j.driverName && j.driverName.toLowerCase() === updatedDriver.fullName.toLowerCase())
          );
          const idxToUpdate = targetIdx >= 0 ? targetIdx : 0;
          const nextFleet = fleet.map((j: any, i: number) =>
            i === idxToUpdate
              ? {
                  ...j,
                  status: j.status === 'offline' ? 'at_terminal' : j.status,
                  driverName: updatedDriver.fullName,
                  assignedDriverId: updatedDriver.id,
                  lastGpsUpdate: 'Just now',
                }
              : j
          );
          localStorage.setItem('jeeptrack_fleet_units_v4', JSON.stringify(nextFleet));
          try {
            const transitChannel = new BroadcastChannel('jeeptrack_transit_sync');
            transitChannel.postMessage({ type: 'SYNC_FLEET', payload: nextFleet });
            transitChannel.close();
          } catch (err) {}
        }
      }
    } catch (e) {}
    setCurrentDriver(updatedDriver);
    localStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(updatedDriver));
    return { success: true };
  };

  // Driver Logout (Marks the driver off_duty unless an active trip is in progress, and broadcasts across tabs)
  const logoutDriver = (options?: { keepOnDuty?: boolean }) => {
    if (!options?.keepOnDuty) {
      setDrivers((prev) => {
        const next = prev.map((d) =>
          !currentDriver || d.id === currentDriver.id ? { ...d, status: 'off_duty' as const } : d
        );
        try {
          localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(next));
          authChannelRef.current?.postMessage({ type: 'SYNC_DRIVERS', payload: next });
        } catch (e) {}
        return next;
      });
    }
    setCurrentDriver(null);
    localStorage.removeItem(DRIVER_SESSION_KEY);
  };

  // Control Center Exclusive: Create Driver Account
  const createDriverAccount = (data: {
    fullName: string;
    licenseNumber: string;
    contactNumber: string;
    assignedJeepneyId?: string;
    username: string;
    password: string;
    status?: 'on_duty' | 'off_duty' | 'on_break';
  }) => {
    const cleanUser = data.username.trim().toLowerCase();
    const cleanLicense = data.licenseNumber.trim().toUpperCase();

    if (!cleanUser || !data.password) {
      return { success: false, error: 'Username and password are required for driver console access.' };
    }

    // Check duplicate username
    const existingUser = drivers.find((d) => d.username.toLowerCase() === cleanUser);
    if (existingUser) {
      return { success: false, error: `The driver username "${data.username}" is already in use.` };
    }

    // Check duplicate license
    const existingLicense = drivers.find((d) => d.licenseNumber.toUpperCase() === cleanLicense);
    if (existingLicense) {
      return { success: false, error: `A driver with license number "${data.licenseNumber}" is already registered.` };
    }

    const newDriver: Driver = {
      id: `drv-${Date.now()}`,
      userId: `usr-drv-${Date.now()}`,
      fullName: data.fullName.trim(),
      licenseNumber: cleanLicense,
      contactNumber: data.contactNumber.trim(),
      status: data.status || 'off_duty',
      assignedJeepneyId: data.assignedJeepneyId,
      rating: 5.0,
      totalTripsCompleted: 0,
      username: data.username.trim(),
      password: data.password.trim(),
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      createdBy: currentOperator ? currentOperator.name : 'Control Center Dispatcher',
      lastLoginAt: 'Never logged in yet',
    };

    const nextDrivers = [newDriver, ...drivers];
    setDrivers(nextDrivers);
    try {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(nextDrivers));
      authChannelRef.current?.postMessage({ type: 'SYNC_DRIVERS', payload: nextDrivers });
    } catch (e) {}
    return { success: true, driver: newDriver };
  };

  // Update Driver Profile
  const updateDriver = (driverId: string, updates: Partial<Driver>) => {
    setDrivers((prev) => {
      const next = prev.map((d) => (d.id === driverId ? { ...d, ...updates } : d));
      try {
        localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(next));
        authChannelRef.current?.postMessage({ type: 'SYNC_DRIVERS', payload: next });
      } catch (e) {}
      return next;
    });
  };

  // Delete Driver Account
  const deleteDriver = (driverId: string) => {
    setDrivers((prev) => {
      const next = prev.filter((d) => d.id !== driverId);
      try {
        localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(next));
        authChannelRef.current?.postMessage({ type: 'SYNC_DRIVERS', payload: next });
      } catch (e) {}
      return next;
    });
    if (currentDriver && currentDriver.id === driverId) {
      logoutDriver();
    }
    return { success: true };
  };

  // Reset Driver Password
  const resetDriverPassword = (driverId: string, newPassword: string) => {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'Password/PIN must be at least 4 characters.' };
    }
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, password: newPassword.trim() } : d))
    );
    return { success: true };
  };

  // Reset Commuter Password (for Admin Management & Recovery)
  const resetCommuterPassword = (commuterId: string, newPassword: string) => {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }
    const cleanPass = newPassword.trim();
    let updatedCommuters: CommuterUser[] = [];
    setCommuters((prev) => {
      updatedCommuters = prev.map((c) => (c.id === commuterId ? { ...c, password: cleanPass } : c));
      try {
        localStorage.setItem(COMMUTERS_STORAGE_KEY, JSON.stringify(updatedCommuters));
        authChannelRef.current?.postMessage({ type: 'SYNC_COMMUTERS', payload: updatedCommuters });
      } catch (e) {}
      return updatedCommuters;
    });

    if (currentCommuter && currentCommuter.id === commuterId) {
      const updated = { ...currentCommuter, password: cleanPass };
      setCurrentCommuter(updated);
      try {
        localStorage.setItem(COMMUTER_SESSION_KEY, JSON.stringify(updated));
      } catch (e) {}
    }

    return { success: true };
  };

  // Commuter (Student / Faculty / Employee) Login
  const loginCommuter = (idOrEmail: string, password: string) => {
    const rawInput = (idOrEmail || '').trim();
    const cleanEmailInput = normalizeEmail(rawInput);
    const cleanIdInput = rawInput.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const cleanNameInput = rawInput.toLowerCase().replace(/\s+/g, ' ');
    const trimmedPass = (password || '').trim();

    if (!rawInput || !trimmedPass) {
      return { success: false, error: 'Please enter your PLMun ID or Email and password.' };
    }

    let latestCommuters: CommuterUser[] = commuters;
    try {
      const saved = localStorage.getItem(COMMUTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) latestCommuters = parsed;
      }
    } catch (e) {}

    // Find commuter by Email, ID number, Username, or Full Name
    const matchedAccount = latestCommuters.find((c) => {
      const cEmail = normalizeEmail(c.email);
      const cEmailUser = cEmail.split('@')[0];
      const cIdClean = c.idNumber.replace(/[^a-z0-9]/gi, '').toLowerCase();
      const cIdExact = c.idNumber.trim().toLowerCase();
      const cName = c.fullName.trim().toLowerCase().replace(/\s+/g, ' ');

      return (
        cEmail === cleanEmailInput ||
        cEmail.replace('plumn.edu.ph', 'plmun.edu.ph') === cleanEmailInput.replace('plumn.edu.ph', 'plmun.edu.ph') ||
        cEmailUser === rawInput.toLowerCase() ||
        cIdExact === rawInput.toLowerCase() ||
        (cleanIdInput.length >= 4 && cIdClean === cleanIdInput) ||
        cName === cleanNameInput
      );
    });

    if (!matchedAccount) {
      return {
        success: false,
        error: `No PLMun account found matching "${rawInput}". Please check your Student/Employee ID or email, or create an account first.`,
      };
    }

    // Check password
    if (matchedAccount.password !== trimmedPass) {
      return {
        success: false,
        error: 'Incorrect password for this PLMun account. Please check your password or contact your administrator.',
      };
    }

    const updatedCommuter: CommuterUser = {
      ...matchedAccount,
      lastLoginAt: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) + ' Today',
    };

    // Update commuters list in memory and localStorage
    const nextCommuters = latestCommuters.map((c) => (c.id === matchedAccount.id ? updatedCommuter : c));
    setCommuters(nextCommuters);
    try {
      localStorage.setItem(COMMUTERS_STORAGE_KEY, JSON.stringify(nextCommuters));
      authChannelRef.current?.postMessage({ type: 'SYNC_COMMUTERS', payload: nextCommuters });
    } catch (e) {}

    // Set active commuter session and clear any conflicting operator or driver session on this client
    setCurrentCommuter(updatedCommuter);
    localStorage.setItem(COMMUTER_SESSION_KEY, JSON.stringify(updatedCommuter));
    setCurrentOperator(null);
    localStorage.removeItem(OPERATOR_SESSION_KEY);
    setCurrentDriver(null);
    localStorage.removeItem(DRIVER_SESSION_KEY);

    return { success: true, commuter: updatedCommuter };
  };

  // Commuter Registration (Exclusive for PLMun community)
  const registerCommuter = (data: {
    fullName: string;
    idNumber: string;
    email: string;
    password: string;
    commuterType: 'student' | 'faculty';
    collegeOrDepartment: string;
    yearLevel?: string;
    courseOrProgram?: string;
    contactNumber: string;
  }, options?: { autoLogin?: boolean }) => {
    const autoLogin = options?.autoLogin !== false;
    const cleanName = data.fullName.trim();
    const cleanId = data.idNumber.trim().toUpperCase();
    const cleanEmail = normalizeEmail(data.email);
    const cleanPass = data.password.trim();

    // Always validate against the freshest saved list (another tab may have added accounts)
    let latestCommuters: CommuterUser[] = commuters;
    try {
      const saved = localStorage.getItem(COMMUTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) latestCommuters = parsed;
      }
    } catch (e) {}

    if (!cleanName) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!cleanId) {
      return { success: false, error: 'PLMun Student / Employee ID Number is required.' };
    }
    if (!cleanEmail) {
      return { success: false, error: 'Your official PLMun school email address (@plmun.edu.ph) is required.' };
    }
    if (!isValidPlmunEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Personal email addresses are not accepted. Please use your official PLMun school email (@plmun.edu.ph).',
      };
    }
    if (cleanPass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Check duplicate ID number
    const duplicateId = latestCommuters.find((c) => c.idNumber.trim().toUpperCase() === cleanId);
    if (duplicateId) {
      return { success: false, error: `An account with ID number "${data.idNumber}" already exists.` };
    }

    // Check duplicate email
    const duplicateEmail = latestCommuters.find((c) => normalizeEmail(c.email) === cleanEmail);
    if (duplicateEmail) {
      return { success: false, error: `An account with email "${data.email}" is already registered.` };
    }

    const newCommuter: CommuterUser = {
      id: `commuter-${Date.now()}`,
      fullName: cleanName,
      idNumber: cleanId,
      email: cleanEmail,
      password: cleanPass,
      commuterType: data.commuterType,
      collegeOrDepartment: data.collegeOrDepartment,
      yearLevel: data.yearLevel,
      courseOrProgram: data.courseOrProgram,
      contactNumber: data.contactNumber.trim(),
      isVerifiedPlmun: true,
      transitDiscountEligible: data.commuterType === 'student',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=00B14F,006837`,
      createdAt: new Date().toISOString(),
      lastLoginAt: 'Just now',
    };

    const nextCommuters = [newCommuter, ...latestCommuters];
    setCommuters(nextCommuters);
    // Persist & broadcast immediately so the Admin portal receives it right away
    try {
      localStorage.setItem(COMMUTERS_STORAGE_KEY, JSON.stringify(nextCommuters));
      authChannelRef.current?.postMessage({ type: 'SYNC_COMMUTERS', payload: nextCommuters });
    } catch (e) {}

    // Admin-created accounts must NOT log the admin in as that commuter
    if (autoLogin) {
      setCurrentCommuter(newCommuter);
      localStorage.setItem(COMMUTER_SESSION_KEY, JSON.stringify(newCommuter));
    }
    return { success: true, commuter: newCommuter };
  };

  // Commuter Logout
  const logoutCommuter = () => {
    setCurrentCommuter(null);
    localStorage.removeItem(COMMUTER_SESSION_KEY);
  };

  // Update Commuter Profile
  const updateCommuterProfile = (updates: Partial<CommuterUser>) => {
    if (!currentCommuter) return;
    const updated = { ...currentCommuter, ...updates };
    setCurrentCommuter(updated);
    setCommuters((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      try {
        localStorage.setItem(COMMUTERS_STORAGE_KEY, JSON.stringify(next));
        authChannelRef.current?.postMessage({ type: 'SYNC_COMMUTERS', payload: next });
      } catch (e) {}
      return next;
    });
    localStorage.setItem(COMMUTER_SESSION_KEY, JSON.stringify(updated));
  };

  // Delete Commuter Account
  const deleteCommuter = (commuterId: string) => {
    setCommuters((prev) => {
      const next = prev.filter((c) => c.id !== commuterId);
      try {
        localStorage.setItem(COMMUTERS_STORAGE_KEY, JSON.stringify(next));
        authChannelRef.current?.postMessage({ type: 'SYNC_COMMUTERS', payload: next });
      } catch (e) {}
      return next;
    });
    if (currentCommuter && currentCommuter.id === commuterId) {
      logoutCommuter();
    }
  };

  // Toggle Commuter Discount Status
  const toggleCommuterDiscount = (commuterId: string) => {
    setCommuters((prev) => {
      const next = prev.map((c) =>
        c.id === commuterId ? { ...c, transitDiscountEligible: !c.transitDiscountEligible } : c
      );
      try {
        localStorage.setItem(COMMUTERS_STORAGE_KEY, JSON.stringify(next));
        authChannelRef.current?.postMessage({ type: 'SYNC_COMMUTERS', payload: next });
      } catch (e) {}
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentOperator,
        currentDriver,
        currentCommuter,
        drivers,
        commuters,
        isOperatorAuthenticated: !!currentOperator,
        isDriverAuthenticated: !!currentDriver,
        isCommuterAuthenticated: !!currentCommuter,
        loginOperator,
        logoutOperator,
        loginDriver,
        logoutDriver,
        loginCommuter,
        registerCommuter,
        logoutCommuter,
        updateCommuterProfile,
        deleteCommuter,
        toggleCommuterDiscount,
        createDriverAccount,
        updateDriver,
        deleteDriver,
        resetDriverPassword,
        resetCommuterPassword,
        refreshCommuters,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
