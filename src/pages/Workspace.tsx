import React, { useState, useEffect, useRef } from 'react';
import { 
  googleSignIn, 
  logout, 
  initAuth, 
  getAccessToken,
  db
} from '../lib/firebase';
import { 
  Folder, File, Trash2, Plus, Search, Mail, Send, RefreshCw, 
  CloudUpload, CloudDownload, Briefcase, FileSpreadsheet, FileText, 
  Settings, User, Check, AlertTriangle, ChevronRight, Globe, Lock, Info, CheckSquare, Download
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

// In-Memory Database collections that we can backup/restore
const DB_COLLECTIONS = ['credentials', 'ai_agents', 'servers', 'links', 'huggingface', 'free_servers'];

export default function Workspace() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'drive' | 'sheets' | 'gmail' | 'docs' | 'forms' | 'firestore'>('drive');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  // Drive state
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadText, setUploadText] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sheets state
  const [sheetsList, setSheetsList] = useState<any[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState('');
  const [sheetRows, setSheetRows] = useState<any[][]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newRowValues, setNewRowValues] = useState<string>('');

  // Gmail state
  const [emails, setEmails] = useState<any[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [viewingEmail, setViewingEmail] = useState<any>(null);

  // Docs state
  const [docsList, setDocsList] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [appendText, setAppendText] = useState('');

  // Forms state
  const [formsList, setFormsList] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [formData, setFormData] = useState<any>(null);
  const [formResponses, setFormResponses] = useState<any[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  // Firestore backup state
  const [firestoreLoading, setFirestoreLoading] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<string>('');

  // Notification and Confirmation Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ label: string; action: () => Promise<void> } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Check language preferences from app
  useEffect(() => {
    const savedSettings = localStorage.getItem('vault_v17_5_5_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed[0]?.language === 'en') {
        setLang('en');
      }
    }

    // Connect auth listener
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        triggerInitialFetches(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const triggerInitialFetches = async (tok: string) => {
    fetchDriveFiles(tok);
    fetchSheets(tok);
    fetchEmails(tok);
    fetchDocs(tok);
    fetchForms(tok);
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showNotification('success', lang === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Successfully signed in!');
        triggerInitialFetches(res.accessToken);
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      showNotification('info', lang === 'ar' ? 'تم تسجيل الخروج' : 'Signed out successfully');
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const askConfirmation = (label: string, action: () => Promise<void>) => {
    setConfirmAction({ label, action });
    setShowConfirmModal(true);
  };

  const handleExecuteConfirm = async () => {
    if (confirmAction) {
      setShowConfirmModal(false);
      try {
        await confirmAction.action();
      } catch (err: any) {
        showNotification('error', err.message || 'Action failed');
      } finally {
        setConfirmAction(null);
      }
    }
  };

  // --- DRIVE ENDPOINTS ---
  const fetchDriveFiles = async (tok = token) => {
    if (!tok) return;
    setDriveLoading(true);
    try {
      const q = searchQuery ? `name contains '${searchQuery}'` : '';
      const url = `https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,webViewLink,iconLink)&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      const data = await res.json();
      if (data.files) {
        setDriveFiles(data.files);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setDriveLoading(false);
    }
  };

  const createFolder = async () => {
    if (!token || !newFolderName) return;
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName,
          mimeType: 'application/vnd.google-apps.folder'
        })
      });
      if (res.ok) {
        showNotification('success', lang === 'ar' ? 'تم إنشاء المجلد بنجاح!' : 'Folder created successfully!');
        setNewFolderName('');
        fetchDriveFiles();
      } else {
        const err = await res.json();
        throw new Error(err.error?.message);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const uploadTextFile = async () => {
    if (!token || !uploadTitle || !uploadText) return;
    try {
      const metadata = {
        name: uploadTitle.endsWith('.txt') ? uploadTitle : `${uploadTitle}.txt`,
        mimeType: 'text/plain'
      };
      const file = new Blob([uploadText], { type: 'text/plain' });
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      if (res.ok) {
        showNotification('success', lang === 'ar' ? 'تم رفع الملف بنجاح!' : 'File uploaded successfully!');
        setUploadText('');
        setUploadTitle('');
        fetchDriveFiles();
      } else {
        const err = await res.json();
        throw new Error(err.error?.message);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const deleteDriveFile = async (id: string, name: string) => {
    askConfirmation(
      lang === 'ar' ? `هل أنت متأكد من حذف الملف "${name}" نهائياً من Google Drive؟` : `Are you sure you want to delete "${name}" permanently from Google Drive?`,
      async () => {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          showNotification('success', lang === 'ar' ? 'تم حذف الملف!' : 'File deleted!');
          fetchDriveFiles();
        } else {
          const err = await res.json();
          throw new Error(err.error?.message);
        }
      }
    );
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadNativeFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadNativeFile(file);
    }
  };

  const uploadNativeFile = async (file: File) => {
    if (!token) return;
    try {
      const metadata = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream'
      };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      if (res.ok) {
        showNotification('success', lang === 'ar' ? `تم رفع الملف "${file.name}"!` : `File "${file.name}" uploaded successfully!`);
        fetchDriveFiles();
      } else {
        const err = await res.json();
        throw new Error(err.error?.message);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // --- SHEETS ENDPOINTS ---
  const fetchSheets = async (tok = token) => {
    if (!tok) return;
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&pageSize=20`, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      const data = await res.json();
      if (data.files) {
        setSheetsList(data.files);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const viewSheetData = async (id: string) => {
    if (!token || !id) return;
    setSheetLoading(true);
    setSelectedSheetId(id);
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Sheet1!A1:Z50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.ok ? await res.json() : null;
      if (data && data.values) {
        setSheetRows(data.values);
      } else {
        setSheetRows([]);
        showNotification('info', lang === 'ar' ? 'لم يتم العثور على بيانات في Sheet1' : 'No data found in Sheet1. Create some columns first.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSheetLoading(false);
    }
  };

  const createSpreadsheet = async () => {
    if (!token || !newSheetTitle) return;
    try {
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: { title: newSheetTitle }
        })
      });
      if (res.ok) {
        const data = await res.json();
        showNotification('success', lang === 'ar' ? 'تم إنشاء الجدول الإلكتروني!' : 'Spreadsheet created!');
        setNewSheetTitle('');
        fetchSheets();
        viewSheetData(data.spreadsheetId);
      } else {
        const err = await res.json();
        throw new Error(err.error?.message);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const addRowToSheet = async () => {
    if (!token || !selectedSheetId || !newRowValues) return;
    try {
      const vals = newRowValues.split(',').map(v => v.trim());
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectedSheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [vals]
        })
      });
      if (res.ok) {
        showNotification('success', lang === 'ar' ? 'تمت إضافة السطر!' : 'Row appended successfully!');
        setNewRowValues('');
        viewSheetData(selectedSheetId);
      } else {
        const err = await res.json();
        throw new Error(err.error?.message);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // --- GMAIL ENDPOINTS ---
  const fetchEmails = async (tok = token) => {
    if (!tok) return;
    setGmailLoading(true);
    try {
      const listRes = await fetch('https://gmail.googleapis.com/v1/users/me/messages?maxResults=10', {
        headers: { Authorization: `Bearer ${tok}` }
      });
      const listData = await listRes.json();
      if (listData.messages) {
        const detailedEmails = await Promise.all(
          listData.messages.map(async (msg: any) => {
            const detailRes = await fetch(`https://gmail.googleapis.com/v1/users/me/messages/${msg.id}`, {
              headers: { Authorization: `Bearer ${tok}` }
            });
            const detail = await detailRes.json();
            const headers = detail.payload?.headers || [];
            const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(بدون عنوان)';
            const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'غير معروف';
            const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';
            return {
              id: msg.id,
              subject,
              from,
              date: new Date(date).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US'),
              snippet: detail.snippet
            };
          })
        );
        setEmails(detailedEmails);
      } else {
        setEmails([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGmailLoading(false);
    }
  };

  const sendGmail = async () => {
    if (!token || !emailTo || !emailSubject || !emailBody) return;
    askConfirmation(
      lang === 'ar' ? `هل أنت متأكد من إرسال هذا البريد الإلكتروني إلى: ${emailTo}؟` : `Are you sure you want to send this email to: ${emailTo}?`,
      async () => {
        const emailContent = [
          `To: ${emailTo}`,
          `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(emailSubject)))}?=`,
          'MIME-Version: 1.0',
          'Content-Type: text/plain; charset=utf-8',
          'Content-Transfer-Encoding: 7bit',
          '',
          emailBody
        ].join('\r\n');

        const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const res = await fetch('https://gmail.googleapis.com/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: encodedEmail })
        });

        if (res.ok) {
          showNotification('success', lang === 'ar' ? 'تم إرسال البريد الإلكتروني!' : 'Email sent successfully!');
          setEmailTo('');
          setEmailSubject('');
          setEmailBody('');
          fetchEmails();
        } else {
          const err = await res.json();
          throw new Error(err.error?.message);
        }
      }
    );
  };

  // --- DOCS ENDPOINTS ---
  const fetchDocs = async (tok = token) => {
    if (!tok) return;
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.document'&pageSize=20`, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      const data = await res.json();
      if (data.files) {
        setDocsList(data.files);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const viewDocContent = async (id: string) => {
    if (!token || !id) return;
    setDocLoading(true);
    setSelectedDocId(id);
    try {
      const res = await fetch(`https://docs.googleapis.com/v1/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      let text = '';
      if (data.body && data.body.content) {
        data.body.content.forEach((item: any) => {
          if (item.paragraph && item.paragraph.elements) {
            item.paragraph.elements.forEach((el: any) => {
              if (el.textRun && el.textRun.content) {
                text += el.textRun.content;
              }
            });
          }
        });
      }
      setDocContent(text);
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setDocLoading(false);
    }
  };

  const createGoogleDoc = async () => {
    if (!token || !newDocTitle) return;
    try {
      const res = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newDocTitle })
      });
      if (res.ok) {
        const data = await res.json();
        showNotification('success', lang === 'ar' ? 'تم إنشاء المستند!' : 'Google Document created!');
        setNewDocTitle('');
        fetchDocs();
        viewDocContent(data.documentId);
      } else {
        const err = await res.json();
        throw new Error(err.error?.message);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const appendToDoc = async () => {
    if (!token || !selectedDocId || !appendText) return;
    askConfirmation(
      lang === 'ar' ? 'هل تود إضافة النص المدخل إلى نهاية هذا المستند؟' : 'Are you sure you want to append this text to the end of the document?',
      async () => {
        const res = await fetch(`https://docs.googleapis.com/v1/documents/${selectedDocId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  text: appendText,
                  endOfSegmentLocation: {}
                }
              }
            ]
          })
        });
        if (res.ok) {
          showNotification('success', lang === 'ar' ? 'تم تحديث المستند!' : 'Document updated successfully!');
          setAppendText('');
          viewDocContent(selectedDocId);
        } else {
          const err = await res.json();
          throw new Error(err.error?.message);
        }
      }
    );
  };

  // --- FORMS ENDPOINTS ---
  const fetchForms = async (tok = token) => {
    if (!tok) return;
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.form'&pageSize=20`, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      const data = await res.json();
      if (data.files) {
        setFormsList(data.files);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const viewFormDetails = async (id: string) => {
    if (!token || !id) return;
    setFormLoading(true);
    setSelectedFormId(id);
    try {
      // Get Form Meta
      const metaRes = await fetch(`https://forms.googleapis.com/v1/forms/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const meta = await metaRes.json();
      setFormData(meta);

      // Get Form Responses
      const respRes = await fetch(`https://forms.googleapis.com/v1/forms/${id}/responses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const respData = await respRes.ok ? await respRes.json() : null;
      if (respData && respData.responses) {
        setFormResponses(respData.responses);
      } else {
        setFormResponses([]);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // --- FIRESTORE BACKUP & SYNC CENTER ---
  const backupDataToFirestore = async () => {
    if (!user) return;
    setFirestoreLoading(true);
    setFirestoreStatus(lang === 'ar' ? 'بدء عملية النسخ الاحتياطي...' : 'Starting backup operation...');
    try {
      let backedUpCount = 0;
      for (const colName of DB_COLLECTIONS) {
        setFirestoreStatus(lang === 'ar' ? `نسخ مجموعة ${colName}...` : `Backing up collection ${colName}...`);
        const localData = localStorage.getItem(`vault_v17_5_5_${colName}`);
        if (localData) {
          const items = JSON.parse(localData);
          if (Array.isArray(items)) {
            for (const item of items) {
              if (item.id) {
                const docRef = doc(db, 'users', user.uid, colName, item.id);
                await setDoc(docRef, item);
                backedUpCount++;
              }
            }
          }
        }
      }
      showNotification('success', lang === 'ar' ? `تم نسخ ${backedUpCount} عنصراً إلى سحابة Firestore!` : `Backed up ${backedUpCount} items to Firestore!`);
      setFirestoreStatus(lang === 'ar' ? 'تم حفظ النسخة الاحتياطية السحابية بنجاح!' : 'Cloud backup completed successfully!');
    } catch (err: any) {
      showNotification('error', err.message || 'Backup failed');
      setFirestoreStatus('');
    } finally {
      setFirestoreLoading(false);
    }
  };

  const restoreDataFromFirestore = async () => {
    if (!user) return;
    askConfirmation(
      lang === 'ar' ? 'هل أنت متأكد من استعادة بياناتك من سحابة Firestore؟ هذا سيقوم بدمج البيانات السحابية مع المخزن المحلي.' : 'Are you sure you want to restore your vault data from Firestore Cloud? This will merge cloud-saved data into your local storage.',
      async () => {
        setFirestoreLoading(true);
        setFirestoreStatus(lang === 'ar' ? 'جاري استيراد البيانات من السحابة...' : 'Importing data from cloud...');
        try {
          let restoredCount = 0;
          for (const colName of DB_COLLECTIONS) {
            setFirestoreStatus(lang === 'ar' ? `استيراد مجموعة ${colName}...` : `Importing collection ${colName}...`);
            const colRef = collection(db, 'users', user.uid, colName);
            const querySnapshot = await getDocs(colRef);
            const items: any[] = [];
            querySnapshot.forEach((doc) => {
              items.push(doc.data());
            });

            if (items.length > 0) {
              // Retrieve existing local items to prevent simple overwrite
              const localKey = `vault_v17_5_5_${colName}`;
              const existingLocalStr = localStorage.getItem(localKey);
              let combinedItems = items;
              if (existingLocalStr) {
                const existingLocal = JSON.parse(existingLocalStr);
                if (Array.isArray(existingLocal)) {
                  // Merge local & cloud items by id
                  const localMap = new Map(existingLocal.map(x => [x.id, x]));
                  items.forEach(cloudItem => {
                    localMap.set(cloudItem.id, cloudItem);
                  });
                  combinedItems = Array.from(localMap.values());
                }
              }
              localStorage.setItem(localKey, JSON.stringify(combinedItems));
              restoredCount += items.length;
            }
          }
          showNotification('success', lang === 'ar' ? `تم استيراد ${restoredCount} عنصراً بنجاح!` : `Restored ${restoredCount} items successfully!`);
          setFirestoreStatus(lang === 'ar' ? 'تم استيراد النسخة الاحتياطية بنجاح!' : 'Data restored successfully!');
          // Refresh statistics by reloading or updating components
        } catch (err: any) {
          showNotification('error', err.message || 'Restore failed');
          setFirestoreStatus('');
        } finally {
          setFirestoreLoading(false);
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="text-[var(--color-neon-cyan)] animate-pulse" />
            <span>{lang === 'ar' ? 'بوابة Google Workspace والسحابة' : 'Google Workspace & Cloud Portal'}</span>
          </h2>
          <p className="text-gray-400 mt-1">
            {lang === 'ar' 
              ? 'بوابة آمنة لإدارة ملفات Google Drive، جداول البيانات، Gmail، المستندات، النماذج وحفظ نسخة مشفرة في Firestore' 
              : 'Secure hub to manage Google Drive files, sheets, Gmail inbox, documents, forms, and Firestore Cloud replication'}
          </p>
        </div>

        {/* Translation and Auth Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-xs text-gray-300 transition-all font-mono"
          >
            <Globe size={14} className="text-[var(--color-neon-blue)]" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 bg-dark-card border border-white/5 px-3 py-1.5 rounded-xl">
              {user.photoURL ? (
                <img referrerPolicy="no-referrer" src={user.photoURL} alt="Google Avatar" className="w-6 h-6 rounded-full border border-cyan-400" />
              ) : (
                <User size={14} className="text-cyan-400" />
              )}
              <span className="text-xs text-cyan-300 font-mono hidden md:inline">{user.email}</span>
              <button 
                onClick={handleLogout}
                className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2.5 py-1 rounded-lg border border-red-500/20 transition-all font-bold"
              >
                {lang === 'ar' ? 'قطع الاتصال' : 'Disconnect'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auth Gate Banner if not connected to Google */}
      {!user ? (
        <div className="glass border border-cyan-500/20 rounded-2xl p-8 text-center max-w-2xl mx-auto flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Lock size={32} className="text-cyan-400 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">{lang === 'ar' ? 'توصيل حساب Google Workspace' : 'Connect Google Workspace'}</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              {lang === 'ar'
                ? 'يتطلب استخدام مميزات Google Drive و Sheets و Gmail و Docs و Forms تسجيل دخول آمن ومصرح به عبر Google لحفظ وقراءة بياناتك المباشرة.'
                : 'Accessing Google Drive files, sheets, reading/sending emails, docs and forms requires secure OAuth Google sign-in.'}
            </p>
          </div>
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="gsi-material-button w-full sm:w-auto hover:scale-[1.02] transition-transform"
            style={{ width: 'auto', alignSelf: 'center' }}
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents">{lang === 'ar' ? 'تسجيل الدخول الآمن عبر Google' : 'Secure Sign in with Google'}</span>
            </div>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar Tabs */}
          <div className="glass border border-white/5 rounded-2xl p-4 flex flex-col space-y-2 h-fit">
            <button 
              onClick={() => setActiveTab('drive')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'drive' ? 'bg-cyan-500/10 border-r-2 border-cyan-400 text-cyan-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="flex items-center gap-3">
                <Folder size={18} />
                <span className="font-bold">{lang === 'ar' ? 'جوجل درايف (Drive)' : 'Google Drive'}</span>
              </span>
              <ChevronRight size={14} className="opacity-50" />
            </button>

            <button 
              onClick={() => setActiveTab('sheets')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'sheets' ? 'bg-green-500/10 border-r-2 border-green-400 text-green-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="flex items-center gap-3">
                <FileSpreadsheet size={18} />
                <span className="font-bold">{lang === 'ar' ? 'جداول قوقل (Sheets)' : 'Google Sheets'}</span>
              </span>
              <ChevronRight size={14} className="opacity-50" />
            </button>

            <button 
              onClick={() => setActiveTab('gmail')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'gmail' ? 'bg-red-500/10 border-r-2 border-red-400 text-red-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="flex items-center gap-3">
                <Mail size={18} />
                <span className="font-bold">{lang === 'ar' ? 'بريد قوقل (Gmail)' : 'Gmail inbox'}</span>
              </span>
              <ChevronRight size={14} className="opacity-50" />
            </button>

            <button 
              onClick={() => setActiveTab('docs')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'docs' ? 'bg-blue-500/10 border-r-2 border-blue-400 text-blue-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="flex items-center gap-3">
                <FileText size={18} />
                <span className="font-bold">{lang === 'ar' ? 'مستندات قوقل (Docs)' : 'Google Docs'}</span>
              </span>
              <ChevronRight size={14} className="opacity-50" />
            </button>

            <button 
              onClick={() => setActiveTab('forms')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'forms' ? 'bg-purple-500/10 border-r-2 border-purple-400 text-purple-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="flex items-center gap-3">
                <CheckSquare size={18} />
                <span className="font-bold">{lang === 'ar' ? 'نماذج قوقل (Forms)' : 'Google Forms'}</span>
              </span>
              <ChevronRight size={14} className="opacity-50" />
            </button>

            <div className="border-t border-white/10 my-4 pt-4"></div>

            <button 
              onClick={() => setActiveTab('firestore')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'firestore' ? 'bg-orange-500/10 border-r-2 border-orange-400 text-orange-300' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="flex items-center gap-3">
                <RefreshCw size={18} />
                <span className="font-bold">{lang === 'ar' ? 'سحابة الحفظ (Firestore)' : 'Firestore Sync Center'}</span>
              </span>
              <ChevronRight size={14} className="opacity-50" />
            </button>
          </div>

          {/* Tab Screen Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* 📁 TAB: GOOGLE DRIVE */}
            {activeTab === 'drive' && (
              <div className="space-y-6">
                <div className="glass border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400 mb-4">
                    <Folder size={20} />
                    <span>{lang === 'ar' ? 'مستودع ملفات Google Drive' : 'Google Drive Repository'}</span>
                  </h3>

                  {/* Search and upload actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="relative">
                      <Search className="absolute right-3 top-2.5 text-gray-500" size={18} />
                      <input 
                        type="text" 
                        placeholder={lang === 'ar' ? 'بحث عن ملفات...' : 'Search files...'}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetchDriveFiles()}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-sm focus:outline-none focus:border-cyan-400 text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder={lang === 'ar' ? 'اسم المجلد الجديد...' : 'New folder name...'}
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-cyan-400 text-white"
                      />
                      <button 
                        onClick={createFolder}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-all"
                      >
                        <Plus size={16} />
                        <span>{lang === 'ar' ? 'مجلد' : 'Folder'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Drag and Drop File Upload Container */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${dragActive ? 'border-cyan-400 bg-cyan-500/5' : 'border-white/10 hover:border-cyan-500/20 bg-white/[0.02]'}`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden" 
                    />
                    <CloudUpload className="mx-auto text-cyan-400 mb-2" size={32} />
                    <p className="text-sm font-bold">{lang === 'ar' ? 'اسحب وأفلت الملفات هنا أو انقر للتصفح' : 'Drag & Drop files here or click to browse'}</p>
                    <p className="text-xs text-gray-500 mt-1">{lang === 'ar' ? 'يدعم رفع كافة أنواع الملفات والمستندات بحد أقصى 50MB' : 'Supports uploading all file types up to 50MB'}</p>
                  </div>
                </div>

                {/* File list */}
                <div className="glass border border-white/5 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold">{lang === 'ar' ? 'الملفات والمجلدات الحالية' : 'Current Files & Folders'}</h4>
                    <button onClick={() => fetchDriveFiles()} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs">
                      <RefreshCw size={12} className={driveLoading ? 'animate-spin' : ''} />
                      <span>{lang === 'ar' ? 'تحديث' : 'Refresh'}</span>
                    </button>
                  </div>

                  {driveLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <p className="text-center text-gray-500 py-12 text-sm">{lang === 'ar' ? 'لا توجد ملفات حالياً في درايف' : 'No files found in your Drive'}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 text-xs">
                            <th className="py-2 px-4 text-right">{lang === 'ar' ? 'اسم الملف' : 'File Name'}</th>
                            <th className="py-2 px-4 text-right">{lang === 'ar' ? 'النوع' : 'Mime Type'}</th>
                            <th className="py-2 px-4 text-center">{lang === 'ar' ? 'خيارات' : 'Options'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {driveFiles.map(file => (
                            <tr key={file.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4 flex items-center gap-2">
                                {file.mimeType.includes('folder') ? (
                                  <Folder size={16} className="text-yellow-400" />
                                ) : (
                                  <File size={16} className="text-cyan-400" />
                                )}
                                <a href={file.webViewLink} target="_blank" rel="noreferrer" className="hover:underline font-mono text-xs max-w-xs truncate block">
                                  {file.name}
                                </a>
                              </td>
                              <td className="py-3 px-4 text-xs font-mono text-gray-400 max-w-[150px] truncate">{file.mimeType}</td>
                              <td className="py-3 px-4 text-center">
                                <button 
                                  onClick={() => deleteDriveFile(file.id, file.name)}
                                  className="text-red-400 hover:text-red-300 p-1 bg-red-500/15 border border-red-500/10 rounded-lg"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Upload text content block as txt */}
                <div className="glass border border-white/5 rounded-2xl p-6">
                  <h4 className="font-bold mb-4">{lang === 'ar' ? 'إنشاء ورفع ملف نصي سريع' : 'Create & Upload Quick Text File'}</h4>
                  <div className="space-y-4">
                    <div>
                      <input 
                        type="text" 
                        placeholder={lang === 'ar' ? 'عنوان الملف (مثال: ملاحظات_المخزن)...' : 'File title (e.g. vault_notes)...'}
                        value={uploadTitle}
                        onChange={e => setUploadTitle(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-cyan-400 text-white"
                      />
                    </div>
                    <div>
                      <textarea 
                        rows={4}
                        placeholder={lang === 'ar' ? 'أدخل محتوى الملف النصي لحفظه مباشرة في Google Drive...' : 'Enter text contents to save directly in Google Drive...'}
                        value={uploadText}
                        onChange={e => setUploadText(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-cyan-400 text-white font-mono"
                      />
                    </div>
                    <button 
                      onClick={uploadTextFile}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <CloudUpload size={18} />
                      <span>{lang === 'ar' ? 'حفظ ورفع المستند النصي' : 'Save & Upload Text Document'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 📊 TAB: GOOGLE SHEETS */}
            {activeTab === 'sheets' && (
              <div className="space-y-6">
                <div className="glass border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-green-400 mb-4">
                    <FileSpreadsheet size={20} />
                    <span>{lang === 'ar' ? 'جداول جداول Google (Sheets)' : 'Google Sheets Manager'}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Create sheets Form */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-300">{lang === 'ar' ? 'إنشاء جدول إلكتروني جديد' : 'Create New Spreadsheet'}</h4>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder={lang === 'ar' ? 'اسم الملف الجديد...' : 'Spreadsheet title...'}
                          value={newSheetTitle}
                          onChange={e => setNewSheetTitle(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-400 text-white"
                        />
                        <button 
                          onClick={createSpreadsheet}
                          className="bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-all"
                        >
                          <Plus size={16} />
                          <span>{lang === 'ar' ? 'إنشاء' : 'Create'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Choose Spreadsheet Dropdown */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-300">{lang === 'ar' ? 'اختر جدول بيانات لعرضه وتعديله' : 'Select Spreadsheet to Edit'}</h4>
                      <select 
                        value={selectedSheetId}
                        onChange={e => viewSheetData(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white text-sm focus:outline-none focus:border-green-400"
                      >
                        <option value="">{lang === 'ar' ? '-- اختر جدول بيانات --' : '-- Choose Spreadsheet --'}</option>
                        {sheetsList.map(sheet => (
                          <option key={sheet.id} value={sheet.id}>{sheet.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Spreadsheet Editor grid */}
                {selectedSheetId && (
                  <div className="glass border border-white/5 rounded-2xl p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-bold flex items-center gap-2 text-green-300">
                          <FileSpreadsheet size={18} />
                          <span>{sheetsList.find(s => s.id === selectedSheetId)?.name}</span>
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">{lang === 'ar' ? 'عرض أول 50 سطراً وعاموداً (ورقة Sheet1)' : 'Viewing first 50 rows in sheet: Sheet1'}</p>
                      </div>
                      <button onClick={() => viewSheetData(selectedSheetId)} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                        <RefreshCw size={12} className={sheetLoading ? 'animate-spin' : ''} />
                        <span>{lang === 'ar' ? 'تحديث البيانات' : 'Refresh Values'}</span>
                      </button>
                    </div>

                    {/* Table display */}
                    {sheetLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : sheetRows.length === 0 ? (
                      <p className="text-center text-gray-500 py-12 text-sm">
                        {lang === 'ar' ? 'الجدول فارغ أو لا توجد ورقة عمل باسم Sheet1' : 'No data in Sheet1. Try adding rows below.'}
                      </p>
                    ) : (
                      <div className="overflow-x-auto border border-white/10 rounded-xl max-h-96">
                        <table className="w-full text-right text-xs font-mono">
                          <thead className="bg-white/5 text-gray-300 sticky top-0">
                            <tr>
                              {sheetRows[0]?.map((col, index) => (
                                <th key={index} className="py-2.5 px-4 border-b border-white/10">{col || `Col ${index + 1}`}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sheetRows.slice(1).map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                {sheetRows[0]?.map((_, colIndex) => (
                                  <td key={colIndex} className="py-2.5 px-4 text-gray-300">{row[colIndex] || '-'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Add row Form */}
                    <div className="border-t border-white/10 pt-6 space-y-4">
                      <h4 className="text-sm font-bold">{lang === 'ar' ? 'إضافة سجل جديد (صف)' : 'Append New Row (Values)'}</h4>
                      <p className="text-xs text-gray-400">{lang === 'ar' ? 'أدخل القيم مفصولة بفاصلة انجليزية (، أو ,) لتتم إضافتها مباشرة كصف جديد' : 'Enter values separated by commas to append as a new spreadsheet row.'}</p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder={lang === 'ar' ? 'مثال: أحمد، مبرمج، 5000، نشط' : 'e.g. John, Developer, 5000, Active'}
                          value={newRowValues}
                          onChange={e => setNewRowValues(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 text-white font-mono"
                        />
                        <button 
                          onClick={addRowToSheet}
                          className="bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-1.5 transition-all"
                        >
                          <Plus size={16} />
                          <span>{lang === 'ar' ? 'إضافة صف' : 'Add Row'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ✉️ TAB: GMAIL INBOX & COMPOSE */}
            {activeTab === 'gmail' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gmail Inbox List */}
                  <div className="glass border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-red-400">
                        <Mail size={20} />
                        <span>{lang === 'ar' ? 'علبة الوارد الأخيرة' : 'Gmail Inbox'}</span>
                      </h3>
                      <button onClick={() => fetchEmails()} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs">
                        <RefreshCw size={12} className={gmailLoading ? 'animate-spin' : ''} />
                        <span>{lang === 'ar' ? 'تحديث' : 'Refresh'}</span>
                      </button>
                    </div>

                    {gmailLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : emails.length === 0 ? (
                      <p className="text-center text-gray-500 py-12 text-sm">{lang === 'ar' ? 'لم يتم العثور على رسائل واردة' : 'No messages found in inbox'}</p>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {emails.map(email => (
                          <div 
                            key={email.id}
                            onClick={() => setViewingEmail(email)}
                            className="p-3 rounded-xl border border-white/5 hover:border-red-500/30 bg-white/[0.01] hover:bg-red-500/[0.02] cursor-pointer transition-all space-y-1.5"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-red-300 max-w-[120px] truncate">{email.from}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{email.date}</span>
                            </div>
                            <h4 className="font-bold text-xs truncate text-gray-200">{email.subject}</h4>
                            <p className="text-[11px] text-gray-400 line-clamp-2">{email.snippet}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Gmail Compose Form */}
                  <div className="glass border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-red-400 border-b border-white/10 pb-3">
                      <Send size={18} />
                      <span>{lang === 'ar' ? 'إنشاء رسالة بريد إلكتروني' : 'Compose Email'}</span>
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">{lang === 'ar' ? 'المرسل إليه (بريد إلكتروني)' : 'To (Recipient Email)'}</label>
                        <input 
                          type="email" 
                          placeholder="recipient@example.com"
                          value={emailTo}
                          onChange={e => setEmailTo(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-400 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">{lang === 'ar' ? 'الموضوع' : 'Subject'}</label>
                        <input 
                          type="text" 
                          placeholder={lang === 'ar' ? 'عنوان الرسالة...' : 'Email Subject...'}
                          value={emailSubject}
                          onChange={e => setEmailSubject(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-400 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">{lang === 'ar' ? 'محتوى الرسالة' : 'Message Body'}</label>
                        <textarea 
                          rows={6}
                          placeholder={lang === 'ar' ? 'أدخل تفاصيل الرسالة...' : 'Enter email content...'}
                          value={emailBody}
                          onChange={e => setEmailBody(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-400 text-white"
                        />
                      </div>
                      <button 
                        onClick={sendGmail}
                        className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                      >
                        <Send size={18} />
                        <span>{lang === 'ar' ? 'إرسال البريد الإلكتروني' : 'Send Email'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Read Email modal body details */}
                {viewingEmail && (
                  <div className="glass border border-red-500/20 rounded-2xl p-6 relative">
                    <button 
                      onClick={() => setViewingEmail(null)}
                      className="absolute top-4 left-4 text-xs bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg text-gray-400"
                    >
                      {lang === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                    <div className="space-y-4">
                      <div className="border-b border-white/10 pb-3">
                        <span className="text-xs text-red-300 font-mono">{viewingEmail.from}</span>
                        <h4 className="text-lg font-bold mt-1">{viewingEmail.subject}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">{viewingEmail.date}</p>
                      </div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono bg-black/20 p-4 rounded-xl border border-white/5">{viewingEmail.snippet}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 📝 TAB: GOOGLE DOCS */}
            {activeTab === 'docs' && (
              <div className="space-y-6">
                <div className="glass border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-blue-400 mb-4">
                    <FileText size={20} />
                    <span>{lang === 'ar' ? 'محرر مستندات Google Docs' : 'Google Docs Editor'}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Create doc Form */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-300">{lang === 'ar' ? 'إنشاء مستند مستندات جديد' : 'Create New Google Doc'}</h4>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder={lang === 'ar' ? 'اسم المستند الجديد...' : 'Document title...'}
                          value={newDocTitle}
                          onChange={e => setNewDocTitle(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 text-white"
                        />
                        <button 
                          onClick={createGoogleDoc}
                          className="bg-blue-500 hover:bg-blue-400 text-black font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-all"
                        >
                          <Plus size={16} />
                          <span>{lang === 'ar' ? 'إنشاء' : 'Create'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Choose doc dropdown */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-300">{lang === 'ar' ? 'اختر مستنداً لعرضه وتحريره' : 'Select Google Doc to Edit'}</h4>
                      <select 
                        value={selectedDocId}
                        onChange={e => viewDocContent(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white text-sm focus:outline-none focus:border-blue-400"
                      >
                        <option value="">{lang === 'ar' ? '-- اختر مستنداً --' : '-- Choose Document --'}</option>
                        {docsList.map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {selectedDocId && (
                  <div className="glass border border-white/5 rounded-2xl p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <div>
                        <h4 className="font-bold flex items-center gap-2 text-blue-300">
                          <FileText size={18} />
                          <span>{docsList.find(d => d.id === selectedDocId)?.name}</span>
                        </h4>
                      </div>
                      <button onClick={() => viewDocContent(selectedDocId)} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                        <RefreshCw size={12} className={docLoading ? 'animate-spin' : ''} />
                        <span>{lang === 'ar' ? 'تحديث المستند' : 'Refresh Content'}</span>
                      </button>
                    </div>

                    {/* Text content viewer */}
                    {docLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="bg-black/40 p-5 rounded-xl border border-white/5 min-h-[200px] whitespace-pre-wrap text-sm leading-relaxed font-mono">
                        {docContent || (lang === 'ar' ? '(المستند فارغ)' : '(Document is empty)')}
                      </div>
                    )}

                    {/* Append content Form */}
                    <div className="space-y-3 border-t border-white/10 pt-4">
                      <h4 className="text-sm font-bold text-gray-300">{lang === 'ar' ? 'إضافة نص جديد للمستند' : 'Append Text to Document'}</h4>
                      <textarea 
                        rows={3}
                        placeholder={lang === 'ar' ? 'أدخل النص لإضافته مباشرة إلى نهاية هذا المستند...' : 'Enter text to add to the end of this document...'}
                        value={appendText}
                        onChange={e => setAppendText(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 text-white font-mono"
                      />
                      <button 
                        onClick={appendToDoc}
                        className="bg-blue-500 hover:bg-blue-400 text-black font-bold px-6 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-all"
                      >
                        <Plus size={16} />
                        <span>{lang === 'ar' ? 'تعديل وحفظ المستند' : 'Append & Save Document'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 📋 TAB: GOOGLE FORMS */}
            {activeTab === 'forms' && (
              <div className="space-y-6">
                <div className="glass border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-purple-400 mb-4">
                    <CheckSquare size={20} />
                    <span>{lang === 'ar' ? 'بوابة نماذج قوقل (Forms)' : 'Google Forms Manager'}</span>
                  </h3>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-300">{lang === 'ar' ? 'اختر نموذج قوقل لاستعراض بياناته واستجاباته' : 'Select Google Form'}</label>
                    <select 
                      value={selectedFormId}
                      onChange={e => viewFormDetails(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white text-sm focus:outline-none focus:border-purple-400"
                    >
                      <option value="">{lang === 'ar' ? '-- اختر نموذجاً من حسابك --' : '-- Select Form --'}</option>
                      {formsList.map(form => (
                        <option key={form.id} value={form.id}>{form.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedFormId && (
                  <div className="glass border border-white/5 rounded-2xl p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <div>
                        <h4 className="font-bold flex items-center gap-2 text-purple-300">
                          <CheckSquare size={18} />
                          <span>{formsList.find(f => f.id === selectedFormId)?.name}</span>
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">{lang === 'ar' ? 'استعراض الأسئلة والردود الإحصائية' : 'Review form questions and responses'}</p>
                      </div>
                      <button onClick={() => viewFormDetails(selectedFormId)} className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                        <RefreshCw size={12} className={formLoading ? 'animate-spin' : ''} />
                        <span>{lang === 'ar' ? 'تحديث الردود' : 'Refresh Responses'}</span>
                      </button>
                    </div>

                    {formLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-center">
                            <h5 className="text-xs text-gray-400 mb-1">{lang === 'ar' ? 'إجمالي الردود' : 'Total Responses'}</h5>
                            <span className="text-3xl font-bold text-purple-400 font-mono">{formResponses.length}</span>
                          </div>
                          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-center">
                            <h5 className="text-xs text-gray-400 mb-1">{lang === 'ar' ? 'إجمالي الأسئلة' : 'Total Questions'}</h5>
                            <span className="text-3xl font-bold text-purple-400 font-mono">{formData?.items?.length || 0}</span>
                          </div>
                        </div>

                        {/* Form Questions Layout */}
                        {formData?.items && (
                          <div className="space-y-3">
                            <h4 className="font-bold text-sm text-gray-300">{lang === 'ar' ? 'أسئلة وعناصر النموذج الحالي' : 'Form Elements & Questions'}</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {formData.items.map((item: any, idx: number) => (
                                <div key={item.itemId || idx} className="p-3 rounded-xl border border-white/5 bg-black/20 text-xs flex justify-between items-center">
                                  <span className="font-bold text-gray-300">{item.title || `Element ${idx + 1}`}</span>
                                  <span className="text-gray-500 font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded">{item.questionItem?.question?.required ? 'مطلوب / Required' : 'اختياري'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Submissions List */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-gray-300">{lang === 'ar' ? 'الردود الأخيرة المستلمة' : 'Recent Form Submissions'}</h4>
                          {formResponses.length === 0 ? (
                            <p className="text-xs text-gray-500 py-4 text-center">{lang === 'ar' ? 'لا توجد ردود حالياً على هذا النموذج' : 'No responses collected yet for this form'}</p>
                          ) : (
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 font-mono text-xs">
                              {formResponses.map((resp: any) => (
                                <div key={resp.responseId} className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] space-y-2">
                                  <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>ID: {resp.responseId}</span>
                                    <span>{new Date(resp.lastSubmittedTime).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                                  </div>
                                  <div className="space-y-1 bg-black/40 p-2 rounded-lg text-gray-400">
                                    {Object.keys(resp.answers || {}).map(ansKey => {
                                      const answer = resp.answers[ansKey];
                                      return (
                                        <div key={ansKey} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                                          <span className="text-purple-300 font-bold">Answer ID: {ansKey}</span>
                                          <span>{answer.textAnswers?.answers?.map((a: any) => a.value).join(', ') || '-'}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 🔥 TAB: FIRESTORE CLOUD REPLICATION */}
            {activeTab === 'firestore' && (
              <div className="space-y-6">
                <div className="glass card-glow border border-orange-500/10 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                      <RefreshCw className="text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-orange-400">{lang === 'ar' ? 'مركز النسخ الاحتياطي والمزامنة السحابية (Firestore)' : 'Firestore Sync & Backup Hub'}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{lang === 'ar' ? 'احتفظ ببياناتك ومفاتيحك آمنة في سحابة قوقل وتزامن مع أي جهاز' : 'Keep your vault keys secure in Google Cloud and synchronize across devices'}</p>
                    </div>
                  </div>

                  {/* Backup and Restore Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Backup Section */}
                    <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] flex flex-col justify-between h-56 transition-all">
                      <div className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-orange-300">
                          <CloudUpload size={18} />
                          <span>{lang === 'ar' ? 'رفع نسخة احتياطية سحابية' : 'Cloud Backup (Upload)'}</span>
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {lang === 'ar'
                            ? 'سيقوم هذا الإجراء بنسخ وتحديث كافة المفاتيح، الوكلاء الذكيين، بيانات الخوادم، والروابط المحلية بشكل آمن في قاعدة بيانات Firestore السحابية الخاصة بك.'
                            : 'Synchronize and safely upload all locally saved credentials, AI agents, servers, and links into your persistent Firestore database in Google Cloud.'}
                        </p>
                      </div>
                      <button 
                        onClick={backupDataToFirestore}
                        disabled={firestoreLoading}
                        className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                      >
                        {firestoreLoading ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <CloudUpload size={16} />
                        )}
                        <span>{lang === 'ar' ? 'النسخ الاحتياطي إلى السحابة' : 'Backup to Cloud'}</span>
                      </button>
                    </div>

                    {/* Restore Section */}
                    <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] flex flex-col justify-between h-56 transition-all">
                      <div className="space-y-2">
                        <h4 className="font-bold flex items-center gap-2 text-orange-300">
                          <CloudDownload size={18} />
                          <span>{lang === 'ar' ? 'استعادة وتنزيل البيانات' : 'Cloud Restore (Download)'}</span>
                        </h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {lang === 'ar'
                            ? 'استرجع كافة مفاتيحك وبياناتك المخزنة سحابياً وادمجها مباشرة مع مخزنك المحلي الحالي. مثالي في حال قمت بفتح المنصة من جهاز جديد.'
                            : 'Download your saved cloud backup data and merge with your current local database. Ideal when logging in from a new machine.'}
                        </p>
                      </div>
                      <button 
                        onClick={restoreDataFromFirestore}
                        disabled={firestoreLoading}
                        className="w-full border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                      >
                        {firestoreLoading ? (
                          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <CloudDownload size={16} />
                        )}
                        <span>{lang === 'ar' ? 'استعادة من السحابة' : 'Restore from Cloud'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Live sync logs status */}
                  {firestoreStatus && (
                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
                      <Info className="text-orange-400 mt-0.5" size={16} />
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-orange-300">{lang === 'ar' ? 'حالة المزامنة السحابية' : 'Cloud Sync Status'}</h5>
                        <p className="text-xs text-gray-400 font-mono">{firestoreStatus}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass border border-red-500/20 rounded-2xl max-w-md w-full p-6 text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-lg">{lang === 'ar' ? 'تأكيد العملية الحساسة' : 'Confirm Action'}</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{confirmAction.label}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2 rounded-xl text-sm"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                onClick={handleExecuteConfirm}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-2 rounded-xl text-sm"
              >
                {lang === 'ar' ? 'تأكيد الحفظ والتعديل' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications floating block */}
      {notification && (
        <div className="fixed bottom-6 left-6 z-50 p-4 rounded-2xl border flex items-center gap-3 shadow-2xl animate-bounce glass min-w-[280px]" style={{
          borderColor: notification.type === 'success' ? 'rgba(57,255,20,0.3)' : notification.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'
        }}>
          {notification.type === 'success' && <Check className="text-green-400" size={18} />}
          {notification.type === 'error' && <AlertTriangle className="text-red-400" size={18} />}
          {notification.type === 'info' && <Info className="text-blue-400" size={18} />}
          <p className="text-xs font-bold text-gray-200">{notification.message}</p>
        </div>
      )}
    </div>
  );
}
